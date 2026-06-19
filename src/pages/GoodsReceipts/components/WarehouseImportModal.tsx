import React, { useState, useEffect, useCallback, useRef } from "react";
import { Modal, Collapse, Button, Space, Spin, message, Empty } from "antd";
import dayjs from "dayjs";
import JsBarcode from "jsbarcode";
import removeAccents from "remove-accents";
import {
  GoodsReceiptDto,
  GoodsReceiptItemDto,
  goodsReceiptService,
} from "../../../services/goodsReceiptService";
import { productService, ProductDto, ProductType } from "../../../services/productService";
import { getApiErrorMessage } from "../../../utils/errorHandler";

interface WarehouseImportModalProps {
  open: boolean;
  onClose: () => void;
  receipt: GoodsReceiptDto;
  onImportSuccess: () => void;
  printOnly?: boolean;
}

interface BarcodeItem {
  item: GoodsReceiptItemDto;
  product: ProductDto;
  barcodeCount: number;
  barcodeContents: string[];
}

const formatDateForBarcode = (date?: string): string => {
  if (!date) return "";
  return dayjs(date).format("DDMMYYYY");
};

const generateBarcodeContent = (
  item: GoodsReceiptItemDto,
  sequence: number,
  fallbackDate?: string
): string => {
  const parts: string[] = [];
  if (item.lotNumber) parts.push(item.lotNumber);
  if (item.identificationCode) parts.push(item.identificationCode);
  const dateStr = formatDateForBarcode(item.receivedDate || fallbackDate);
  if (dateStr) parts.push(dateStr);
  parts.push(String(sequence).padStart(3, "0"));
  const raw = removeAccents(parts.join("-"));
  return raw.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7E]/g, "");
};

const calculateBarcodeCount = (
  item: GoodsReceiptItemDto,
  product: ProductDto
): number => {
  if (!product.baseUnitId) {
    return Math.max(1, Math.floor(item.quantity));
  }
  if (item.unitId === product.baseUnitId) {
    const factor = product.packagingQuantity && product.packagingQuantity > 0
      ? product.packagingQuantity
      : 1;
    return Math.max(1, Math.floor(item.quantity * factor));
  }
  if (item.unitId === product.packagingUnitId) {
    return Math.max(1, Math.floor(item.quantity));
  }
  return Math.max(1, Math.floor(item.quantity));
};

const BARCODE_OPTIONS = {
  format: "CODE128" as const,
  width: 2,
  height: 60,
  displayValue: true,
  fontSize: 12,
  margin: 5,
};

const generateBarcodeSvgMarkup = (content: string): string => {
  try {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svgEl, content, BARCODE_OPTIONS);
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
        JsBarcode(svgRef.current, content, BARCODE_OPTIONS);
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
  onImportSuccess,
  printOnly = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [barcodeItems, setBarcodeItems] = useState<BarcodeItem[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const loadProducts = useCallback(async () => {
    if (!receipt?.items?.length) return;

    setLoading(true);
    try {
      const nonEquipmentItems = receipt.items.filter((i) => !i.isEquipment);
      const uniqueProductIds = [...new Set(nonEquipmentItems.map((i) => i.productId))];

      const products = await Promise.all(
        uniqueProductIds.map((pid) => productService.get(pid).catch(() => null))
      );

      const productMap = new Map<string, ProductDto>();
      products.forEach((p) => {
        if (p) productMap.set(p.id, p);
      });

      const items: BarcodeItem[] = [];
      for (const item of nonEquipmentItems) {
        const product = productMap.get(item.productId);
        if (!product || product.productType !== ProductType.Chemical) continue;

        const count = calculateBarcodeCount(item, product);
        const contents: string[] = [];
        for (let i = 1; i <= count; i++) {
          contents.push(generateBarcodeContent(item, i, receipt.documentDate));
        }
        items.push({ item, product, barcodeCount: count, barcodeContents: contents });
      }

      setBarcodeItems(items);
    } catch {
      message.error("Không thể tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [receipt]);

  useEffect(() => {
    if (open) loadProducts();
  }, [open, loadProducts]);

  useEffect(() => {
    setActiveKeys(barcodeItems.map((_, i) => `item-${i}`));
  }, [barcodeItems]);

  const getSectionHeader = (bi: BarcodeItem) => {
    const lot = bi.item.lotNumber;
    return lot ? `${lot} - ${bi.item.productName}` : bi.item.productName;
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
        const header = getSectionHeader(bi);
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

  const handleImport = async () => {
    setImporting(true);
    try {
      await goodsReceiptService.importToWarehouse(receipt.id);
      message.success("Đã nhập kho thành công");
      onImportSuccess();
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể nhập kho."));
    } finally {
      setImporting(false);
    }
  };

  const handlePrintAndImport = () => {
    handlePrint();
    handleImport();
  };

  const collapseItems = barcodeItems.map((bi, idx) => ({
    key: `item-${idx}`,
    label: <span style={{ fontWeight: 600 }}>{getSectionHeader(bi)}</span>,
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
  }));

  return (
    <Modal
      title={printOnly ? "In mã vật tư" : "In nhãn và nhập kho"}
      open={open}
      onCancel={onClose}
      width={650}
      centered
      styles={{ body: { maxHeight: "85vh", overflowY: "auto" } }}
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          {printOnly ? (
            <Button type="primary" onClick={() => { handlePrint(); onClose(); }} disabled={loading}>
              In mã vật tư
            </Button>
          ) : (
            <>
              <Button onClick={handlePrintAndImport} loading={importing} disabled={loading}>
                In và nhập kho
              </Button>
              <Button type="primary" onClick={handleImport} loading={importing} disabled={loading}>
                Xác nhận nhập kho
              </Button>
            </>
          )}
        </Space>
      }
      destroyOnClose
    >
      <Spin spinning={loading}>
        {!loading && barcodeItems.length === 0 ? (
          <Empty description="Không có hóa chất nào để tạo barcode" />
        ) : (
          <Collapse
            items={collapseItems}
            activeKey={activeKeys}
            onChange={(keys) => setActiveKeys(keys as string[])}
            expandIconPosition="end"
          />
        )}
      </Spin>
    </Modal>
  );
};

export default WarehouseImportModal;
