import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Card, Form, Input, Select, DatePicker, InputNumber, Button, Space, Row, Col,
  Table, message, Spin, Divider, Tag, Modal, Badge, Popover, AutoComplete,
} from "antd";
import { BranchesOutlined, WarningOutlined, EditOutlined, FileTextOutlined, DeleteOutlined } from "@ant-design/icons";
import { NumericFormat } from "react-number-format";
import { DeliveryDocumentFileDto } from "../../services/warehouseImportReceiptService";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import { warehouseImportReceiptSchema, WarehouseImportReceiptFormData } from "./schemas";
import {
  warehouseImportReceiptService,
  WarehouseImportReceiptDto,
  CreateUpdateWarehouseImportReceiptDto,
  CreateUpdateWarehouseImportReceiptItemDto,
  EligibleGoodsReceiptForImportDto,
  GoodsReceiptItemForImportDto,
  DefectiveHistoryItemDto,
  WarehouseImportReceiptStatus,
  WarehouseImportLineStatus,
  WarehouseImportLineStatusOptions,
  ProductSkuForImportDto,
} from "../../services/warehouseImportReceiptService";
import { warehouseService, WarehouseDto } from "../../services/masterDataService";
import { employeeService } from "../../services/employeeService";
import { supplierService } from "../../services/supplierService";
import { authService } from "../../services/authService";
import { clearableSelectProps } from "../../utils/formHelpers";
import { getApiErrorMessage } from "../../utils/errorHandler";
import SingleFileUpload, { SingleFileValue } from "./components/SingleFileUpload";
import MultiFileUpload from "./components/MultiFileUpload";
import "../../styles/ListCard.css";
import "./WarehouseImportForm.css";

const MAX_DELIVERY_FILES = 5;

interface LineItem {
  key: string;
  id?: string;
  goodsReceiptItemId: string;
  productName: string;
  unitName?: string;
  orderedQuantity: number;
  baseUnitName?: string;
  baseOrderedQuantity?: number;
  remainingOrderableQuantity: number;
  actualReceivedQuantity: number;
  lotNumber?: string;
  lotExpiryDate?: string;
  status: WarehouseImportLineStatus;
  qualityDocument?: SingleFileValue;
  notes?: string;
  /** Dòng đã nhập ở phiếu nhập kho Hoàn thành khác (trước đó) — chỉ xem, không cho chỉnh sửa. */
  isHistorical?: boolean;
  skuId?: string;
  selectedUnitId?: string;
  selectedUnitName?: string;
  availableSkus?: ProductSkuForImportDto[];
  casNumber?: string;
  packagingSpec?: string;
  storageWarehouseId?: string;
  storageWarehouseName?: string;
}

const WarehouseImportForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [receipt, setReceipt] = useState<WarehouseImportReceiptDto | null>(null);
  const [eligibleReceipts, setEligibleReceipts] = useState<EligibleGoodsReceiptForImportDto[]>([]);
  const [importableItems, setImportableItems] = useState<GoodsReceiptItemForImportDto[]>([]);
  const [defectiveHistory, setDefectiveHistory] = useState<DefectiveHistoryItemDto[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [previewCode, setPreviewCode] = useState<string>("");
  const [deliveryFiles, setDeliveryFiles] = useState<DeliveryDocumentFileDto[]>([]);
  const [deliveryFilesError, setDeliveryFilesError] = useState<string>();
  const [itemsLoading, setItemsLoading] = useState(false);

  // Supplier autocomplete state
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [supplierOptions, setSupplierOptions] = useState<{ value: string; label: string; id: string }[]>([]);
  const supplierDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lineItemErrors, setLineItemErrors] = useState<
    Record<string, { actualReceivedQuantity?: string; lotNumber?: string; lotExpiryDate?: string; qualityDocument?: string; skuId?: string; selectedUnitId?: string }>
  >({});
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);

  const isReadonly = receipt ? receipt.status === WarehouseImportReceiptStatus.Completed : false;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<WarehouseImportReceiptFormData>({
    resolver: yupResolver(warehouseImportReceiptSchema) as any,
    defaultValues: {
      goodsReceiptId: undefined,
      actualImportDate: dayjs().format("YYYY-MM-DD"),
      warehouseKeeperId: undefined,
      warehouseKeeperName: "",
      warehouseId: undefined,
      notes: "",
      supplierId: undefined,
      supplierName: "",
      totalAmount: undefined,
    },
  });

  const selectedGoodsReceiptId = watch("goodsReceiptId");

  const buildLineItems = useCallback(
    (items: GoodsReceiptItemForImportDto[], existing: WarehouseImportReceiptDto["items"]): LineItem[] => {
      const rows: LineItem[] = [];
      items.forEach((imp) => {
        const matches = existing.filter((e) => e.goodsReceiptItemId === imp.goodsReceiptItemId);

        if (imp.remainingOrderableQuantity <= 0 && matches.length === 0) {
          return;
        }

        const base = {
          goodsReceiptItemId: imp.goodsReceiptItemId,
          productName: imp.productName,
          unitName: imp.unitName,
          orderedQuantity: imp.orderedQuantity,
          baseUnitName: imp.baseUnitName,
          baseOrderedQuantity: imp.baseOrderedQuantity,
          remainingOrderableQuantity: imp.remainingOrderableQuantity,
          availableSkus: imp.skus || [],
          casNumber: imp.casNumber,
          packagingSpec: imp.packagingSpec,
        };

        (imp.previousLots || [])
          .filter((lot) => lot.status === WarehouseImportLineStatus.Checked)
          .forEach((lot, idx) => {
            rows.push({
              ...base,
              key: `${imp.goodsReceiptItemId}-history-${idx}`,
              actualReceivedQuantity: lot.actualReceivedQuantity,
              lotNumber: lot.lotNumber,
              lotExpiryDate: lot.lotExpiryDate,
              status: lot.status,
              qualityDocument: lot.qualityDocumentFileId
                ? { fileId: lot.qualityDocumentFileId, fileName: lot.qualityDocumentFileName || "", fileSize: lot.qualityDocumentFileSize }
                : undefined,
              isHistorical: true,
            });
          });

        if (matches.length > 0) {
          matches.forEach((m, idx) => {
            const matchedSku = m.skuId ? (imp.skus || []).find(s => s.skuId === m.skuId) : undefined;
            rows.push({
              ...base,
              key: `${imp.goodsReceiptItemId}-${idx}-${m.id}`,
              id: m.id,
              actualReceivedQuantity: m.actualReceivedQuantity,
              lotNumber: m.lotNumber,
              lotExpiryDate: m.lotExpiryDate,
              status: m.status,
              qualityDocument: m.qualityDocumentFileId
                ? { fileId: m.qualityDocumentFileId, fileName: m.qualityDocumentFileName || "", fileSize: m.qualityDocumentFileSize }
                : undefined,
              notes: m.notes,
              skuId: m.skuId,
              selectedUnitId: m.unitId,
              selectedUnitName: matchedSku
                ? (m.unitId === matchedSku.purchaseUnitId ? matchedSku.purchaseUnitName
                  : m.unitId === matchedSku.storageUnitId ? matchedSku.storageUnitName
                  : matchedSku.consumableUnitName) ?? m.unitName
                : m.unitName,
              storageWarehouseId: m.storageWarehouseId,
              storageWarehouseName: m.storageWarehouseName,
            });
          });
        } else {
          rows.push({
            ...base,
            key: `${imp.goodsReceiptItemId}-default`,
            actualReceivedQuantity: 0,
            status: WarehouseImportLineStatus.Checked,
          });
        }
      });
      return rows;
    },
    []
  );

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        const [employeesList, warehouseList] = await Promise.all([
          employeeService.getList({ maxResultCount: 1000 }),
          warehouseService.getList({ maxResultCount: 1000 }),
        ]);
        setWarehouses(warehouseList.items || []);

        if (id) {
          const data = await warehouseImportReceiptService.get(id);
          setReceipt(data);
          const items = await warehouseImportReceiptService.getImportableItems(data.goodsReceiptId);
          setImportableItems(items);
          setLineItems(buildLineItems(items, data.items));
          warehouseImportReceiptService.getDefectiveHistory(data.goodsReceiptId).then(setDefectiveHistory).catch(() => {});
          setDeliveryFiles(
            data.deliveryDocumentFiles && data.deliveryDocumentFiles.length > 0
              ? data.deliveryDocumentFiles
              : data.deliveryDocumentFileId
                ? [{ fileId: data.deliveryDocumentFileId, fileName: data.deliveryDocumentFileName || "", fileSize: data.deliveryDocumentFileSize }]
                : []
          );
          reset({
            goodsReceiptId: data.goodsReceiptId,
            actualImportDate: data.actualImportDate ? dayjs(data.actualImportDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
            warehouseKeeperId: data.warehouseKeeperId || undefined,
            warehouseKeeperName: data.warehouseKeeperName || "",
            notes: data.notes || "",
            supplierId: data.supplierId || undefined,
            supplierName: data.supplierName || "",
            totalAmount: data.totalAmount ?? undefined,
          });
          setSupplierId(data.supplierId || undefined);
          const eligible = await warehouseImportReceiptService.getEligibleGoodsReceipts();
          setEligibleReceipts(eligible);
        } else {
          const eligible = await warehouseImportReceiptService.getEligibleGoodsReceipts();
          setEligibleReceipts(eligible);

          const userInfo = authService.getUserInfo();
          if (userInfo) {
            const currentEmployee = employeesList.items?.find(
              (e) => e.username === userInfo.userName || e.email === userInfo.email
            );
            if (currentEmployee) {
              setValue("warehouseKeeperId", currentEmployee.id);
              setValue("warehouseKeeperName", currentEmployee.fullName);
            }
          }
          warehouseImportReceiptService.getNextCode().then(setPreviewCode).catch(() => {});
        }
      } catch {
        message.error("Không thể tải dữ liệu");
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSupplierSearch = useCallback((text: string) => {
    if (supplierDebounceRef.current) clearTimeout(supplierDebounceRef.current);
    supplierDebounceRef.current = setTimeout(async () => {
      if (!text.trim()) {
        setSupplierOptions([]);
        return;
      }
      try {
        const res = await supplierService.getList({ search: text, limit: 10 });
        setSupplierOptions(
          (res.items || []).map((s) => ({ value: s.name, label: s.name, id: s.id }))
        );
      } catch {
        setSupplierOptions([]);
      }
    }, 350);
  }, []);

  const handleSupplierSelect = useCallback((selectedName: string, option: any) => {
    if (option?.id) {
      setSupplierId(option.id);
      setValue("supplierId" as any, option.id);
    }
    setValue("supplierName", selectedName);
  }, [setValue]);

  const handleGoodsReceiptChange = async (goodsReceiptId: string | null) => {
    setValue("goodsReceiptId", goodsReceiptId as any);
    if (!goodsReceiptId) {
      setImportableItems([]);
      setLineItems([]);
      setDefectiveHistory([]);
      return;
    }
    // Auto-fill supplier from selected GoodsReceipt
    const selected = eligibleReceipts.find((r) => r.id === goodsReceiptId);
    if (selected?.supplierName) {
      setValue("supplierName", selected.supplierName);
      setValue("supplierId", selected.supplierId || undefined);
      setSupplierId(selected.supplierId || undefined);
    }
    setItemsLoading(true);
    try {
      const items = await warehouseImportReceiptService.getImportableItems(goodsReceiptId);
      setImportableItems(items);
      setLineItems(buildLineItems(items, []));
      warehouseImportReceiptService.getDefectiveHistory(goodsReceiptId).then(setDefectiveHistory).catch(() => {});
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể tải danh sách hàng hóa của phiếu mua hàng."));
    } finally {
      setItemsLoading(false);
    }
  };

  const getRemainingForRow = (record: LineItem): number => {
    const siblingCheckedSum = lineItems
      .filter(
        (it) =>
          it.goodsReceiptItemId === record.goodsReceiptItemId &&
          it.key !== record.key &&
          !it.isHistorical &&
          it.status === WarehouseImportLineStatus.Checked
      )
      .reduce((sum, it) => sum + (it.actualReceivedQuantity || 0), 0);
    return Math.max(0, record.remainingOrderableQuantity - siblingCheckedSum);
  };

  const handleLineChange = (key: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
    setLineItemErrors((prev) => {
      const itemErrors = prev[key] as Record<string, string> | undefined;
      if (!itemErrors?.[field as string]) return prev;
      const { [field as string]: _omit, ...rest } = itemErrors;
      return { ...prev, [key]: rest };
    });
  };

  const groupRowSpans = useMemo(() => {
    const spans: Record<string, number> = {};
    let i = 0;
    while (i < lineItems.length) {
      const groupId = lineItems[i].goodsReceiptItemId;
      let j = i;
      while (j < lineItems.length && lineItems[j].goodsReceiptItemId === groupId) j++;
      for (let k = i; k < j; k++) {
        spans[lineItems[k].key] = k === i ? j - i : 0;
      }
      i = j;
    }
    return spans;
  }, [lineItems]);

  const getGroupInfo = (record: LineItem) => {
    const groupItems = lineItems.filter((it) => it.goodsReceiptItemId === record.goodsReceiptItemId);
    const unitFactor =
      record.baseOrderedQuantity && record.orderedQuantity ? record.baseOrderedQuantity / record.orderedQuantity : 1;
    const totalCheckedBase = groupItems
      .filter((it) => it.status === WarehouseImportLineStatus.Checked)
      .reduce((sum, it) => sum + (it.actualReceivedQuantity || 0) * unitFactor, 0);
    const targetBase = record.baseOrderedQuantity ?? record.orderedQuantity;
    const targetUnit = record.baseUnitName ?? record.unitName;
    return {
      groupSize: groupItems.length,
      totalCheckedBase: Number(totalCheckedBase.toFixed(2)),
      targetBase,
      targetUnit,
    };
  };

  const handleDeleteLine = (key: string) => {
    setLineItems((prev) => prev.filter((it) => it.key !== key));
    setLineItemErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSplitLine = (record: LineItem) => {
    const newRow: LineItem = {
      key: `${record.goodsReceiptItemId}-split-${Date.now()}`,
      goodsReceiptItemId: record.goodsReceiptItemId,
      productName: record.productName,
      unitName: record.unitName,
      orderedQuantity: record.orderedQuantity,
      baseUnitName: record.baseUnitName,
      baseOrderedQuantity: record.baseOrderedQuantity,
      remainingOrderableQuantity: record.remainingOrderableQuantity,
      actualReceivedQuantity: 0,
      status: WarehouseImportLineStatus.Checked,
      availableSkus: record.availableSkus,
      casNumber: record.casNumber,
      packagingSpec: record.packagingSpec,
      skuId: record.skuId,
      selectedUnitId: record.selectedUnitId,
      selectedUnitName: record.selectedUnitName,
      storageWarehouseId: record.storageWarehouseId,
      storageWarehouseName: record.storageWarehouseName,
    };
    setLineItems((prev) => {
      const idx = prev.findIndex((it) => it.key === record.key);
      const copy = [...prev];
      copy.splice(idx + 1, 0, newRow);
      return copy;
    });
  };


  const validateHeader = (): boolean => {
    setDeliveryFilesError(undefined);
    return true;
  };

  const validateItems = (): boolean => {
    const editableItems = lineItems.filter(item => !item.isHistorical);

    const errors: typeof lineItemErrors = {};
    let hasError = false;
    editableItems.forEach((item) => {
      const itemErr: Record<string, string> = {};
      if (!item.actualReceivedQuantity || item.actualReceivedQuantity <= 0) {
        itemErr.actualReceivedQuantity = "Vui lòng nhập số lượng thực nhận";
      }
      if ((item.availableSkus || []).length > 0 && !item.skuId) {
        itemErr.skuId = "Vui lòng chọn hãng sản xuất";
      }
      if ((item.availableSkus || []).length > 0 && item.skuId && !item.selectedUnitId) {
        itemErr.selectedUnitId = "Vui lòng chọn đơn vị tính";
      }
      if (!item.lotNumber) {
        itemErr.lotNumber = "Số lô không được trống";
      }
      if (!item.lotExpiryDate) {
        itemErr.lotExpiryDate = "Hạn sử dụng không được trống";
      }
      if (!item.qualityDocument) {
        itemErr.qualityDocument = "Hồ sơ chất lượng là bắt buộc";
      }
      if (Object.keys(itemErr).length > 0) {
        errors[item.key] = itemErr;
        hasError = true;
      }
    });
    setLineItemErrors(errors);
    if (hasError) {
      message.warning("Vui lòng điền đầy đủ thông tin bắt buộc cho các dòng đã nhập.");
      return false;
    }

    const byLine = new Map<string, number>();
    for (const item of editableItems) {
      if (item.status !== WarehouseImportLineStatus.Checked || !item.actualReceivedQuantity) continue;
      byLine.set(item.goodsReceiptItemId, (byLine.get(item.goodsReceiptItemId) || 0) + item.actualReceivedQuantity);
    }
    for (const [goodsReceiptItemId, sum] of byLine) {
      const imp = importableItems.find((i) => i.goodsReceiptItemId === goodsReceiptItemId);
      if (imp && sum > imp.remainingOrderableQuantity) {
        message.warning(`Số lượng "Đã kiểm tra" của ${imp.productName} vượt quá số lượng còn lại có thể nhận.`);
        return false;
      }
    }
    return true;
  };

  const buildPayload = (data: WarehouseImportReceiptFormData): CreateUpdateWarehouseImportReceiptDto => ({
    goodsReceiptId: data.goodsReceiptId as string,
    actualImportDate: data.actualImportDate as string,
    warehouseKeeperId: data.warehouseKeeperId || undefined,
    warehouseKeeperName: data.warehouseKeeperName || undefined,
    notes: data.notes || undefined,
    supplierId: data.supplierId || supplierId || undefined,
    supplierName: data.supplierName || undefined,
    totalAmount: data.totalAmount ?? undefined,
    deliveryDocumentFiles: deliveryFiles,
    items: lineItems
      .filter((item) => !item.isHistorical && item.actualReceivedQuantity > 0)
      .map((item): CreateUpdateWarehouseImportReceiptItemDto => ({
        id: item.id,
        goodsReceiptItemId: item.goodsReceiptItemId,
        actualReceivedQuantity: item.actualReceivedQuantity,
        lotNumber: item.lotNumber || undefined,
        lotExpiryDate: item.lotExpiryDate || undefined,
        status: item.status,
        qualityDocumentFileId: item.qualityDocument?.fileId,
        qualityDocumentFileName: item.qualityDocument?.fileName,
        qualityDocumentFileSize: item.qualityDocument?.fileSize,
        notes: item.notes || undefined,
        skuId: item.skuId || undefined,
        selectedUnitId: item.selectedUnitId || undefined,
        selectedUnitName: item.selectedUnitName || undefined,
        storageWarehouseId: item.storageWarehouseId || undefined,
        storageWarehouseName: item.storageWarehouseName || undefined,
      })),
  });

  const handleSaveDraft = handleSubmit(async (data: WarehouseImportReceiptFormData) => {
    if (!validateHeader()) return;
    if (!validateItems()) return;
    setSaving(true);
    try {
      const payload = buildPayload(data);
      if (isEdit && id) {
        await warehouseImportReceiptService.update(id, payload);
        message.success("Đã lưu nháp phiếu nhập kho");
        navigate(`/warehouse-imports/${id}`, { replace: true });
      } else {
        const result = await warehouseImportReceiptService.create(payload);
        message.success("Đã tạo phiếu nhập kho");
        navigate(`/warehouse-imports/${result.id}`, { replace: true });
      }
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể lưu phiếu."));
    } finally {
      setSaving(false);
    }
  });

  const handleConfirm = handleSubmit(async (data: WarehouseImportReceiptFormData) => {
    if (!validateHeader()) return;
    if (!validateItems()) return;
    setConfirming(true);
    try {
      const payload = buildPayload(data);
      let receiptId = id;
      if (isEdit && id) {
        await warehouseImportReceiptService.update(id, payload);
      } else {
        const created = await warehouseImportReceiptService.create(payload);
        receiptId = created.id;
      }
      const confirmed = await warehouseImportReceiptService.confirm(receiptId as string);
      setReceipt(confirmed);
      message.success("Đã xác nhận và nhập kho thành công");
      navigate(`/warehouse-imports/${receiptId}`, { replace: true });
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể xác nhận nhập kho."));
    } finally {
      setConfirming(false);
    }
  });

  const columns = [
    {
      title: "Tên vật tư",
      key: "productName",
      width: 180,
      onCell: (record: LineItem) => ({ rowSpan: groupRowSpans[record.key] }),
      render: (_: any, record: LineItem) => record.productName,
    },
    {
      title: "SL Đặt",
      key: "orderedQuantity",
      width: 100,
      align: "right" as const,
      onCell: (record: LineItem) => ({ rowSpan: groupRowSpans[record.key] }),
      render: (_: any, record: LineItem) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {record.orderedQuantity} {record.unitName || ""}
          </div>
          {record.baseUnitName && (
            <div style={{ color: "#8c8c8c", fontSize: 12 }}>
              {record.baseOrderedQuantity} {record.baseUnitName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: <span>Thực nhận <span style={{ color: "#ff4d4f" }}>*</span></span>,
      key: "actualReceivedQuantity",
      width: 120,
      render: (_: any, record: LineItem) =>
        isReadonly || record.isHistorical ? record.actualReceivedQuantity : (
          <>
            <InputNumber
              value={record.actualReceivedQuantity}
              min={0}
              precision={0}
              step={1}
              max={record.status === WarehouseImportLineStatus.Checked ? getRemainingForRow(record) : undefined}
              onChange={(v) => {
                  handleLineChange(record.key, "actualReceivedQuantity", v || 0);
                  if (!v || v <= 0) {
                    setLineItemErrors(prev => { const { [record.key]: _, ...rest } = prev; return rest; });
                  }
                }}
              status={lineItemErrors[record.key]?.actualReceivedQuantity ? "error" : undefined}
              style={{ width: "100%" }}
              size="small"
            />
            {lineItemErrors[record.key]?.actualReceivedQuantity && (
              <div style={{ color: "#ff4d4f", fontSize: 11 }}>{lineItemErrors[record.key]?.actualReceivedQuantity}</div>
            )}
          </>
        ),
    },
    {
      title: <span>Hãng sản xuất <span style={{ color: "#ff4d4f" }}>*</span></span>,
      key: "manufacturer",
      width: 140,
      render: (_: any, record: LineItem) => {
        if (isReadonly || record.isHistorical) {
          const sku = (record.availableSkus || []).find(s => s.skuId === record.skuId);
          return sku?.manufacturerName || "-";
        }
        const hasSkus = (record.availableSkus || []).length > 0;
        const err = lineItemErrors[record.key]?.skuId;
        return (
          <>
            <Select
              size="small"
              style={{ width: "100%" }}
              placeholder={hasSkus ? "Chọn hãng" : "-"}
              value={record.skuId || undefined}
              options={(record.availableSkus || []).map(s => ({ value: s.skuId, label: s.manufacturerName }))}
              onChange={(skuId) => {
                setLineItems(prev => prev.map(it =>
                  it.key === record.key
                    ? { ...it, skuId, selectedUnitId: undefined, selectedUnitName: undefined }
                    : it
                ));
                setLineItemErrors(prev => {
                  const { skuId: _s, ...rest } = prev[record.key] || {};
                  return { ...prev, [record.key]: rest };
                });
              }}
              disabled={!hasSkus}
              status={err ? "error" : undefined}
              allowClear
            />
            {err && <div style={{ color: "#ff4d4f", fontSize: 11 }}>{err}</div>}
          </>
        );
      },
    },
    {
      title: <span>Đơn vị tính <span style={{ color: "#ff4d4f" }}>*</span></span>,
      key: "selectedUnit",
      width: 140,
      render: (_: any, record: LineItem) => {
        if (isReadonly || record.isHistorical) return record.selectedUnitName || record.unitName || "-";
        const selectedSku = (record.availableSkus || []).find(s => s.skuId === record.skuId);
        const unitOptions = selectedSku
          ? [
              ...(selectedSku.purchaseUnitId ? [{ value: selectedSku.purchaseUnitId, label: `${selectedSku.purchaseUnitName} (mua hàng)` }] : []),
              ...(selectedSku.storageUnitId && selectedSku.storageUnitId !== selectedSku.purchaseUnitId
                ? [{ value: selectedSku.storageUnitId, label: `${selectedSku.storageUnitName} (lưu kho)` }] : []),
              ...(selectedSku.consumableUnitId ? [{ value: selectedSku.consumableUnitId, label: `${selectedSku.consumableUnitName} (tiêu hao)` }] : []),
            ]
          : [];
        const err = lineItemErrors[record.key]?.selectedUnitId;
        return (
          <>
            <Select
              size="small"
              style={{ width: "100%" }}
              placeholder="Chọn đơn vị"
              value={record.selectedUnitId || undefined}
              options={unitOptions}
              disabled={!record.skuId}
              onChange={(unitId) => {
                const opt = unitOptions.find(o => o.value === unitId);
                handleLineChange(record.key, "selectedUnitId", unitId);
                handleLineChange(record.key, "selectedUnitName", opt?.label);
                setLineItemErrors(prev => {
                  const { selectedUnitId: _u, ...rest } = prev[record.key] || {};
                  return { ...prev, [record.key]: rest };
                });
              }}
              status={err ? "error" : undefined}
              allowClear
            />
            {err && <div style={{ color: "#ff4d4f", fontSize: 11 }}>{err}</div>}
          </>
        );
      },
    },
    {
      title: <span>Trạng thái <span style={{ color: "#ff4d4f" }}>*</span></span>,
      key: "status",
      width: 170,
      render: (_: any, record: LineItem) =>
        isReadonly || record.isHistorical ? (
          <Tag color={record.status === WarehouseImportLineStatus.Defective ? "red" : "green"}>
            {record.status === WarehouseImportLineStatus.Defective ? "Hàng lỗi" : "Đã kiểm tra"}
          </Tag>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Select
              value={record.status}
              options={WarehouseImportLineStatusOptions}
              onChange={(v) => handleLineChange(record.key, "status", v)}
              style={{ flex: 1, minWidth: 0 }}
              size="small"
            />
            {record.status === WarehouseImportLineStatus.Defective && (
              <Popover
                trigger="click"
                placement="bottom"
                title="Lý do hàng lỗi"
                content={
                  <Input.TextArea
                    autoFocus
                    rows={3}
                    style={{ width: 260 }}
                    placeholder="Nhập lý do hàng lỗi..."
                    value={record.notes || ""}
                    onChange={(e) => handleLineChange(record.key, "notes", e.target.value)}
                  />
                }
              >
                <a
                  title={record.notes ? "Đã ghi chú" : "Nhập ghi chú"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    color: record.notes ? "#1677ff" : "#ff4d4f",
                    background: record.notes ? "#e6f4ff" : "#fff1f0",
                  }}
                >
                  {record.notes ? <EditOutlined /> : <FileTextOutlined />}
                </a>
              </Popover>
            )}
          </div>
        ),
    },
    {
      title: <span>Số lô <span style={{ color: "#ff4d4f" }}>*</span></span>,
      key: "lotNumber",
      width: 140,
      render: (_: any, record: LineItem) =>
        isReadonly || record.isHistorical ? (record.lotNumber || "-") : (
          <>
            <Input
              value={record.lotNumber || ""}
              placeholder="Nhập số lô"
              onChange={(e) => handleLineChange(record.key, "lotNumber", e.target.value)}
              status={lineItemErrors[record.key]?.lotNumber ? "error" : undefined}
              size="small"
              allowClear
            />
            {lineItemErrors[record.key]?.lotNumber && (
              <div style={{ color: "#ff4d4f", fontSize: 11 }}>{lineItemErrors[record.key]?.lotNumber}</div>
            )}
          </>
        ),
    },
    {
      title: <span>Hạn sử dụng <span style={{ color: "#ff4d4f" }}>*</span></span>,
      key: "lotExpiryDate",
      width: 140,
      render: (_: any, record: LineItem) => {
        if (isReadonly || record.isHistorical) return record.lotExpiryDate ? dayjs(record.lotExpiryDate).format("DD/MM/YYYY") : "-";
        return (
          <>
            <DatePicker
              value={record.lotExpiryDate ? dayjs(record.lotExpiryDate) : null}
              format="DD/MM/YYYY"
              onChange={(date) => handleLineChange(record.key, "lotExpiryDate", date?.format("YYYY-MM-DD") || undefined)}
              status={lineItemErrors[record.key]?.lotExpiryDate ? "error" : undefined}
              style={{ width: "100%" }}
              size="small"
            />
            {lineItemErrors[record.key]?.lotExpiryDate && (
              <div style={{ color: "#ff4d4f", fontSize: 11 }}>{lineItemErrors[record.key]?.lotExpiryDate}</div>
            )}
          </>
        );
      },
    },
    {
      title: "Kho lưu trữ",
      key: "storageWarehouse",
      width: 160,
      render: (_: any, record: LineItem) => {
        if (isReadonly || record.isHistorical) return record.storageWarehouseName || "-";
        return (
          <Select
            size="small"
            style={{ width: "100%" }}
            placeholder="Chọn kho"
            value={record.storageWarehouseId || undefined}
            showSearch
            optionFilterProp="label"
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            onChange={(warehouseId) => {
              const wh = warehouses.find(w => w.id === warehouseId);
              setLineItems(prev => prev.map(it =>
                it.key === record.key
                  ? { ...it, storageWarehouseId: warehouseId, storageWarehouseName: wh?.name }
                  : it
              ));
            }}
            allowClear
          />
        );
      },
    },
    {
      title: "Cấu hình kỹ thuật",
      key: "packagingSpec",
      width: 150,
      render: (_: any, record: LineItem) =>
        record.packagingSpec
          ? <div style={{ fontSize: 12, color: "#595959" }} dangerouslySetInnerHTML={{ __html: record.packagingSpec }} />
          : <span style={{ fontSize: 12, color: "#595959" }}>-</span>,
    },
    {
      title: "CAS",
      key: "casNumber",
      width: 110,
      render: (_: any, record: LineItem) => (
        <span style={{ fontSize: 12, color: "#595959" }}>{record.casNumber || "-"}</span>
      ),
    },
    {
      title: <span>Hồ sơ chất lượng (COA) <span style={{ color: "#ff4d4f" }}>*</span></span>,
      key: "qualityDocument",
      width: 190,
      render: (_: any, record: LineItem) => (
        <>
          <SingleFileUpload
            value={record.qualityDocument}
            onChange={(v) => handleLineChange(record.key, "qualityDocument", v)}
            disabled={isReadonly || record.isHistorical}
            compact
          />
          {lineItemErrors[record.key]?.qualityDocument && (
            <div style={{ color: "#ff4d4f", fontSize: 11 }}>{lineItemErrors[record.key]?.qualityDocument}</div>
          )}
        </>
      ),
    },
    ...(!isReadonly
      ? [
          {
            title: "",
            key: "delete",
            width: 50,
            fixed: "right" as const,
            render: (_: any, record: LineItem) => {
              if (record.isHistorical) return null;
              const nonHistGroupItems = lineItems.filter(
                (it) => it.goodsReceiptItemId === record.goodsReceiptItemId && !it.isHistorical
              );
              if (nonHistGroupItems.length < 2) return null;
              return (
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteLine(record.key)}
                />
              );
            },
          },
          {
            title: "",
            key: "action",
            width: 90,
            fixed: "right" as const,
            onCell: (record: LineItem) => ({ rowSpan: groupRowSpans[record.key] }),
            render: (_: any, record: LineItem) => {
              const { groupSize, totalCheckedBase, targetBase, targetUnit } = getGroupInfo(record);
              const groupItems = lineItems.filter((it) => it.goodsReceiptItemId === record.goodsReceiptItemId);
              const lastItem = groupItems[groupItems.length - 1];
              return (
                <div>
                  <Button size="small" icon={<BranchesOutlined />} onClick={() => handleSplitLine(lastItem)}>
                    Tách Lô
                  </Button>
                  {groupSize > 1 && (
                    <div style={{ fontSize: 11, color: "#52c41a", marginTop: 2 }}>
                      Tổng: {totalCheckedBase}/{targetBase} {targetUnit}
                    </div>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const confirmButtonLabel = defectiveHistory.length > 0 ? "Xác nhận Hàng Giao Bù" : "Xác nhận và nhập kho";

  if (pageLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card
        className="list-card"
        title={
          <Space>
            {isEdit ? "Sửa phiếu nhập kho" : "Tạo phiếu nhập kho"}
            {receipt?.code && <Tag>{receipt.code}</Tag>}
            {receipt && (
              <Tag color={receipt.status === WarehouseImportReceiptStatus.Completed ? (receipt.hasDefectiveItem ? "red" : "green") : "orange"}>
                {receipt.status === WarehouseImportReceiptStatus.Completed
                  ? (receipt.hasDefectiveItem ? "Hàng lỗi" : "Hoàn thành")
                  : "Đang thực hiện"}
              </Tag>
            )}
          </Space>
        }
      >
        <Form layout="vertical" size="middle" style={{ padding: "0 16px" }}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Controller
                name="goodsReceiptId"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Phiếu mua hàng"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <Select
                      {...clearableSelectProps(field)}
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn phiếu mua hàng"
                      disabled={isReadonly || isEdit}
                      status={fieldState.error ? "error" : undefined}
                      allowClear
                      onChange={(value) => handleGoodsReceiptChange(value || null)}
                      options={eligibleReceipts.map((r) => ({
                        value: r.id,
                        label: r.supplierName ? `${r.code} - ${r.supplierName}` : r.code,
                      }))}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Controller
                name="warehouseKeeperName"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Thủ kho thực hiện">
                    <Input {...field} value={field.value || ""} disabled style={{ backgroundColor: "#f5f5f5" }} />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Controller
                name="actualImportDate"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Ngày nhập kho thực tế"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") || "")}
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Controller
                name="supplierName"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Nhà cung cấp"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <AutoComplete
                      value={field.value || ""}
                      options={supplierOptions}
                      disabled={isReadonly}
                      placeholder="Nhập tên nhà cung cấp"
                      onSearch={(text) => {
                        field.onChange(text);
                        setSupplierId(undefined);
                        setValue("supplierId" as any, undefined as any);
                        handleSupplierSearch(text);
                      }}
                      onSelect={(val: string, option: any) => handleSupplierSelect(val, option)}
                      filterOption={false}
                      status={fieldState.error ? "error" : undefined}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Controller
                name="totalAmount"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Tổng giá trị đơn hàng"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <NumericFormat
                      value={field.value ?? ""}
                      onValueChange={(values) => field.onChange(values.floatValue ?? null)}
                      allowNegative={false}
                      decimalScale={2}
                      thousandSeparator="."
                      decimalSeparator=","
                      customInput={Input}
                      addonAfter="đ"
                      style={{ width: "100%" }}
                      placeholder="Nhập tổng giá trị"
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Mã phiếu nhập kho">
                <Input value={receipt?.code || previewCode || ""} placeholder="Tự động sinh khi lưu" disabled style={{ backgroundColor: "#f5f5f5" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Chứng từ giao hàng"
                validateStatus={deliveryFilesError ? "error" : undefined}
                help={deliveryFilesError}
              >
                <MultiFileUpload
                  value={deliveryFiles}
                  onChange={(files) => {
                    setDeliveryFiles(files);
                    if (files.length > 0) setDeliveryFilesError(undefined);
                  }}
                  disabled={isReadonly}
                  maxFiles={MAX_DELIVERY_FILES}
                />
              </Form.Item>
            </Col>
          </Row>

        </Form>

        {defectiveHistory.length > 0 && (
          <div style={{ padding: "0 16px 16px" }}>
            <div
              style={{
                background: "#FFF1F0",
                border: "1px solid #FFA39E",
                borderRadius: 8,
                padding: "12px 16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ color: "#CF1322", fontWeight: 600, fontSize: 14 }}>
                  <WarningOutlined style={{ marginRight: 6 }} />
                  CẢNH BÁO ĐỐI SOÁT: LỊCH SỬ HÀNG LỖI TỪ CÁC ĐỢT GIAO TRƯỚC (ISO 7.10)
                </span>
                <Badge count="Cần kiểm tra kỹ khi nhận bù" style={{ backgroundColor: "#CF1322" }} />
              </div>
              <Table
                size="small"
                pagination={false}
                dataSource={defectiveHistory}
                rowKey={(r) => `${r.receiptId}-${r.productCode || r.productName}-${r.receiptCreationTime}`}
                columns={[
                  {
                    title: "Phiếu phát hiện",
                    dataIndex: "receiptCode",
                    render: (_: any, r: DefectiveHistoryItemDto) => (
                      <a
                        href={`/warehouse-imports/edit/${r.receiptId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {r.receiptCode}
                      </a>
                    ),
                  },
                  {
                    title: "Sản phẩm bị lỗi",
                    dataIndex: "productName",
                    render: (_: any, r: DefectiveHistoryItemDto) => (
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.casNumber}</div>
                        <div style={{ color: "#8c8c8c", fontSize: 12 }}>{r.productName}</div>
                      </div>
                    ),
                  },
                  {
                    title: "Hãng sản xuất",
                    dataIndex: "manufacturer",
                    render: (v: string) => v || "-",
                  },
                  {
                    title: "SL Lỗi",
                    dataIndex: "actualReceivedQuantity",
                    render: (_: any, r: DefectiveHistoryItemDto) => (
                      <span style={{ color: "#CF1322", fontWeight: 600 }}>
                        {r.actualReceivedQuantity}{r.unitName ? ` ${r.unitName}` : ""}
                      </span>
                    ),
                  },
                  {
                    title: "Ghi chú nguyên nhân (Cần đối soát)",
                    dataIndex: "notes",
                    render: (v: string) => <span style={{ color: "#CF1322", fontStyle: "italic" }}>{v || "-"}</span>,
                  },
                  {
                    title: "Người ghi nhận",
                    dataIndex: "creatorName",
                    render: (_: any, r: DefectiveHistoryItemDto) => (
                      <div>
                        <div>{r.creatorName || "-"}</div>
                        <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                          {r.receiptCreationTime ? dayjs(r.receiptCreationTime).format("DD/MM/YYYY HH:mm") : ""}
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}

        <Divider style={{ margin: "8px 0 16px" }} />

        <div style={{ padding: "0 16px 16px" }}>
          <strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>Chi tiết vật tư</strong>
          <Table
            columns={columns}
            dataSource={lineItems}
            rowKey="key"
            pagination={false}
            scroll={{ x: 2020 }}
            size="small"
            bordered
            loading={itemsLoading}
            rowClassName={(record) =>
              record.status === WarehouseImportLineStatus.Defective ? "wir-row-defective" : "wir-row-checked"
            }
            locale={{ emptyText: selectedGoodsReceiptId ? "Không có hàng hóa cần nhập" : "Vui lòng chọn phiếu mua hàng" }}
          />

          <Form.Item label="Đánh giá nhập hàng" style={{ marginTop: 16 }}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  value={field.value || ""}
                  placeholder="Đánh giá nhập hàng"
                  rows={2}
                  disabled={isReadonly}
                />
              )}
            />
          </Form.Item>
        </div>
      </Card>

      <Card
        style={{
          marginTop: 16,
          textAlign: "right",
          boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Space>
          {!isReadonly && (
            <Button onClick={() => navigate("/warehouse-imports")}>
              {isEdit ? "Quay lại" : "Hủy"}
            </Button>
          )}
          {!isReadonly && (
            <Button onClick={handleSaveDraft} loading={saving}>
              Lưu nháp
            </Button>
          )}
          {!isReadonly && (
            <Button
              type="primary"
              loading={confirming}
              onClick={handleSubmit(() => {
                if (!validateItems()) return;
                Modal.confirm({
                  title: "Xác nhận nhập kho",
                  content: "Sau khi xác nhận, phiếu sẽ chuyển sang trạng thái Hoàn thành và không thể chỉnh sửa. Bạn có chắc chắn muốn tiếp tục?",
                  okText: confirmButtonLabel,
                  cancelText: "Hủy",
                  centered: true,
                  onOk: handleConfirm,
                });
              })}
            >
              {confirmButtonLabel}
            </Button>
          )}
          {isReadonly && <Button disabled>Đã hoàn thành</Button>}
        </Space>
      </Card>
    </div>
  );
};

export default WarehouseImportForm;
