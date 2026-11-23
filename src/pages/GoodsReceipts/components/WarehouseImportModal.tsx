import React, { useState, useEffect, useCallback, useRef } from "react";
import { Modal, Collapse, Button, Space, Spin, message, Empty, Tag } from "antd";
import dayjs from "dayjs";
import "../../Products/ProductDetail.css";
import JsBarcode from "jsbarcode";
import removeAccents from "remove-accents";
import {
  GoodsReceiptDto,
  GoodsReceiptItemDto,
} from "../../../services/goodsReceiptService";
import { productService, ProductDto, ProductSkuDto } from "../../../services/productService";
import { WarehouseImportReceiptDto, EquipmentReceiveStatus, WarehouseImportLineStatus } from "../../../services/warehouseImportReceiptService";
import { getApiErrorMessage } from "../../../utils/errorHandler";

interface WarehouseImportModalProps {
  open: boolean;
  onClose: () => void;
  receipt: GoodsReceiptDto;
  importReceipt?: WarehouseImportReceiptDto;
  printOnly?: boolean;
}

interface BarcodeItem {
  item: GoodsReceiptItemDto;
  product?: ProductDto;
  isEquipment?: boolean;
  barcodeCount: number;
  barcodeContents: string[];
  lotNumber?: string;
  lotExpiryDate?: string;
}

const stripAllHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

const formatDateForBarcode = (date?: string): string => {
  if (!date) return "";
  return dayjs(date).format("DDMMYYYY");
};

const generateBarcodeContent = (
  item: GoodsReceiptItemDto,
  sequence: number,
  fallbackDate?: string,
  opts?: { lotNumber?: string; importDate?: string }
): string => {
  const parts: string[] = [];
  if (item.identificationCode) parts.push(item.identificationCode);
  const dateStr = formatDateForBarcode(opts?.importDate || item.receivedDate || fallbackDate);
  if (dateStr) parts.push(dateStr);
  const lot = opts?.lotNumber || item.lotNumber;
  if (lot) parts.push(lot);
  parts.push(String(sequence).padStart(4, "0"));
  const raw = removeAccents(parts.join(""));
  return raw.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7E]/g, "");
};

// fallback khi không có importReceipt: dùng ordered qty từ GoodsReceipt
const calculateBarcodeCount = (
  item: GoodsReceiptItemDto,
  product: ProductDto,
  qty: number
): number => {
  const factor = product.packagingQuantity && product.packagingQuantity > 0
    ? product.packagingQuantity
    : 1;
  if (!product.baseUnitId) return Math.max(1, Math.ceil(qty));
  if (item.unitId === product.baseUnitId && product.baseUnitId !== product.packagingUnitId)
    return Math.max(1, Math.ceil(qty * factor));
  if (item.unitId === product.packagingUnitId) return Math.max(1, Math.ceil(qty));
  if (item.unitId === product.volumeUnitId && product.volumePerUnit && product.volumePerUnit > 0)
    return Math.max(1, Math.ceil(qty / product.volumePerUnit));
  return Math.max(1, Math.ceil(qty));
};

// Tính số barcode từ đơn vị thực nhận (importItem.unitId), dùng SKU-level data nếu có
const calcBarcodeCountFromImportUnit = (
  unitId: string | undefined,
  product: ProductDto,
  qty: number,
  sku?: ProductSkuDto
): number => {
  if (sku) {
    // Đơn vị mua hàng → nhân packagingQuantity ra đơn vị lưu kho
    if (unitId === sku.baseUnitId && sku.baseUnitId !== sku.packagingUnitId) {
      const factor = sku.packagingQuantity && sku.packagingQuantity > 0 ? sku.packagingQuantity : 1;
      return Math.max(1, Math.ceil(qty * factor));
    }
    // Đơn vị tiêu hao → chia volumePerUnit, làm tròn lên
    if (unitId === sku.volumeUnitId && sku.volumePerUnit && sku.volumePerUnit > 0)
      return Math.max(1, Math.ceil(qty / sku.volumePerUnit));
    // Đơn vị lưu kho → dùng thẳng
    if (unitId === sku.packagingUnitId)
      return Math.max(1, Math.ceil(qty));
  }
  // Fallback: dùng product-level
  const factor = product.packagingQuantity && product.packagingQuantity > 0
    ? product.packagingQuantity : 1;
  if (unitId === product.baseUnitId && product.baseUnitId !== product.packagingUnitId)
    return Math.max(1, Math.ceil(qty * factor));
  if (unitId === product.volumeUnitId && product.volumePerUnit && product.volumePerUnit > 0)
    return Math.max(1, Math.ceil(qty / product.volumePerUnit));
  return Math.max(1, Math.ceil(qty));
};

const BARCODE_SCREEN_OPTIONS = {
  format: "CODE128" as const,
  width: 2,
  height: 60,
  displayValue: true,
  fontSize: 14,
  margin: 4,
};

const BARCODE_PRINT_OPTIONS = {
  format: "CODE128" as const,
  width: 1.5,
  height: 50,
  displayValue: true,
  fontSize: 12,
  margin: 5,
};

const generateBarcodeSvgMarkup = (content: string): string => {
  try {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svgEl, content, BARCODE_PRINT_OPTIONS);
    return svgEl.outerHTML;
  } catch {
    return `<div style="color:red;font-size:12px">Không thể tạo barcode: ${content}</div>`;
  }
};

const BarcodeDisplay: React.FC<{ content: string }> = ({ content }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, content, BARCODE_SCREEN_OPTIONS);
        setError(false);
      } catch {
        setError(true);
      }
    }
  }, [content]);

  if (error) {
    return <div style={{ color: "#ff4d4f", fontSize: 12 }}>Không thể tạo barcode: {content}</div>;
  }

  return <svg ref={svgRef} style={{ maxWidth: "100%", height: "auto" }} />;
};

const WarehouseImportModal: React.FC<WarehouseImportModalProps> = ({
  open,
  onClose,
  receipt,
  importReceipt,
  printOnly = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [barcodeItems, setBarcodeItems] = useState<BarcodeItem[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const loadProducts = useCallback(async () => {
    if (!receipt?.items?.length) return;

    setLoading(true);
    try {
      const items: BarcodeItem[] = [];

      // Build map: goodsReceiptItemId → danh sách import items (khi có importReceipt)
      type ImportItem = WarehouseImportReceiptDto["items"][number];
      const importItemsMap = new Map<string, ImportItem[]>();
      if (importReceipt?.items?.length) {
        for (const importItem of importReceipt.items) {
          // Dòng "Hàng lỗi" không nhập kho → không sinh mã vạch.
          if (importItem.status === WarehouseImportLineStatus.Defective) continue;
          const existing = importItemsMap.get(importItem.goodsReceiptItemId) ?? [];
          existing.push(importItem);
          importItemsMap.set(importItem.goodsReceiptItemId, existing);
        }
      }

      // Equipment items — 1 barcode per received item, content = assetCode (mã tài sản)
      const toAscii = (html: string) =>
        removeAccents(stripAllHtml(html))
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^\x20-\x7E]/g, "")
          .trim();

      if (importReceipt?.items?.length) {
        const receivedEquipment = importReceipt.items.filter(
          (i) => i.isEquipment && i.equipmentReceiveStatus === EquipmentReceiveStatus.Received && i.assetCode
        );
        for (const imp of receivedEquipment) {
          const grItem = receipt.items.find((ri) => ri.id === imp.goodsReceiptItemId);
          const fakeItem: GoodsReceiptItemDto = grItem ?? {
            id: imp.goodsReceiptItemId,
            productId: imp.productId,
            productName: imp.productName,
          } as GoodsReceiptItemDto;
          const content = toAscii(imp.assetCode!);
          if (!content) continue;
          items.push({ item: fakeItem, isEquipment: true, barcodeCount: 1, barcodeContents: [content] });
        }
      }

      // Non-equipment items — barcode per lot/quantity, all product types
      const nonEquipmentItems = receipt.items.filter((i) =>
        !i.isEquipment && (!importReceipt || importItemsMap.has(i.id))
      );
      if (nonEquipmentItems.length > 0) {
        const uniqueProductIds = [...new Set(nonEquipmentItems.map((i) => i.productId))];
        const products = await Promise.all(
          uniqueProductIds.map((pid) => productService.get(pid).catch(() => null))
        );
        const productMap = new Map<string, ProductDto>();
        products.forEach((p) => { if (p) productMap.set(p.id, p); });

        for (const item of nonEquipmentItems) {
          const product = productMap.get(item.productId);
          const matchedImportItems = importItemsMap.get(item.id) ?? [];

          if (matchedImportItems.length > 0) {
            for (const imp of matchedImportItems) {
              const lotNumber = imp.lotNumber || item.lotNumber;
              const lotExpiryDate = imp.lotExpiryDate || item.lotExpiryDate;

              if (imp.barcodeValues?.length) {
                items.push({
                  item,
                  product,
                  barcodeCount: imp.barcodeValues.length,
                  barcodeContents: imp.barcodeValues,
                  lotNumber,
                  lotExpiryDate,
                });
                continue;
              }

              const sku = imp.skuId ? product?.skus?.find((s) => s.id === imp.skuId) : undefined;
              const count = product
                ? Math.max(1, calcBarcodeCountFromImportUnit(imp.unitId, product, imp.actualReceivedQuantity, sku))
                : Math.max(1, Math.floor(imp.actualReceivedQuantity));
              const contents: string[] = [];
              for (let i = 1; i <= count; i++) {
                contents.push(generateBarcodeContent(item, i, receipt.documentDate, { lotNumber: imp.lotNumber, importDate: importReceipt?.actualImportDate }));
              }
              items.push({ item, product, barcodeCount: count, barcodeContents: contents, lotNumber, lotExpiryDate });
            }
          } else {
            const count = product
              ? calculateBarcodeCount(item, product, item.quantity)
              : Math.max(1, Math.floor(item.quantity));
            const contents: string[] = [];
            for (let i = 1; i <= count; i++) {
              contents.push(generateBarcodeContent(item, i, receipt.documentDate));
            }
            items.push({
              item,
              product,
              barcodeCount: count,
              barcodeContents: contents,
              lotNumber: item.lotNumber,
              lotExpiryDate: item.lotExpiryDate,
            });
          }
        }
      }

      setBarcodeItems(items);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể tải thông tin sản phẩm"));
    } finally {
      setLoading(false);
    }
  }, [receipt, importReceipt]);

  useEffect(() => {
    if (open) loadProducts();
  }, [open, loadProducts]);

  useEffect(() => {
    if (barcodeItems.length === 1) setActiveKeys(["item-0"]);
    else setActiveKeys([]);
  }, [barcodeItems]);

  const getPrintSectionHeader = (bi: BarcodeItem) => {
    const name = stripAllHtml(bi.item.productName);
    if (bi.isEquipment) {
      const serial = bi.barcodeContents[0] || "";
      return serial ? `${serial} — ${name}` : name;
    }
    const lot = bi.lotNumber || bi.item.lotNumber;
    const expiry = bi.lotExpiryDate || bi.item.lotExpiryDate;
    const lotPart = lot
      ? `${lot} - ${expiry ? dayjs(expiry).format("DD/MM/YYYY") : "—"}`
      : name;
    return `${lotPart} (${bi.barcodeContents.length} barcode)`;
  };

  const handlePrint = () => {
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const printWindow = window.open(
      "",
      "barcode_print",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
    if (!printWindow) return;

    const barcodeHtml = barcodeItems
      .map((bi) => {
        const header = getPrintSectionHeader(bi);
        const barcodes = bi.barcodeContents
          .map((content) => {
            const svgMarkup = generateBarcodeSvgMarkup(content);
            return `<div class="barcode-item">${svgMarkup}</div>`;
          })
          .join("");
        return `
          <div class="section">
            <div class="section-header">${header}</div>
            ${barcodes}
          </div>`;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>In nhãn - ${receipt.code}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
          .actions { text-align: center; margin-bottom: 20px; }
          .btn { padding: 8px 20px; margin: 0 5px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
          .btn-print { background: #1890ff; color: white; }
          .btn-close { background: #fff; color: #666; border: 1px solid #d9d9d9; }
          .section { margin-bottom: 24px; page-break-inside: avoid; }
          .section-header { font-size: 16px; font-weight: bold; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #1890ff; }
          .barcode-item { text-align: center; margin: 16px 0; padding: 12px; border: 1px solid #eee; border-radius: 4px; }
          .barcode-item svg { max-width: 100%; }
          @media print { .actions { display: none; } }
        </style>
      </head>
      <body>
        <div class="actions">
          <button class="btn btn-print" onclick="window.print()">In</button>
          <button class="btn btn-close" onclick="window.close()">Đóng</button>
        </div>
        ${barcodeHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const collapseItems = barcodeItems.map((bi, idx) => {
    let headerLabel: React.ReactNode;
    if (bi.isEquipment) {
      const serial = bi.barcodeContents[0] || "";
      const name = stripAllHtml(bi.item.productName);
      headerLabel = <span>{serial ? `${serial} — ${name}` : name}</span>;
    } else {
      const lot = bi.lotNumber;
      const expiry = bi.lotExpiryDate;
      const titleText = lot
        ? `${lot} - ${expiry ? dayjs(expiry).format("DD/MM/YYYY") : "—"}`
        : stripAllHtml(bi.item.productName);
      headerLabel = (
        <Space>
          <span>{titleText}</span>
          <Tag style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.2)", borderRadius: 18, padding: "2px 8px" }}>
            {bi.barcodeContents.length} barcode
          </Tag>
        </Space>
      );
    }

    return {
      key: `item-${idx}`,
      label: headerLabel,
      children: (
        <div>
          {bi.barcodeContents.map((content, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                margin: "16px 0",
                padding: "12px",
                border: "1px solid #f0f0f0",
                borderRadius: 4,
              }}
            >
              <BarcodeDisplay content={content} />
            </div>
          ))}
        </div>
      ),
    };
  });

  return (
    <Modal
      title={printOnly ? "In barcode" : "In nhãn và nhập kho"}
      open={open}
      onCancel={onClose}
      width={900}
      centered
      styles={{ body: { maxHeight: "85vh", overflowY: "auto" } }}
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" onClick={() => { handlePrint(); onClose(); }} disabled={loading}>
            In barcode
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Spin spinning={loading}>
        {!loading && barcodeItems.length === 0 ? (
          <Empty description="Không có mục nào để tạo barcode" />
        ) : (
          <Collapse
            className="barcode-lot-collapse"
            items={collapseItems}
            activeKey={activeKeys}
            onChange={(keys) => setActiveKeys(keys as string[])}
          />
        )}
      </Spin>
    </Modal>
  );
};

export default WarehouseImportModal;
