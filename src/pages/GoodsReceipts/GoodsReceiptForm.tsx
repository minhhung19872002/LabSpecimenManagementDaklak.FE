import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import {
  Card, Form, Input, Select, DatePicker, InputNumber, Button, Space, Row, Col,
  Table, message, Spin, Divider, Tag, Modal, AutoComplete,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import { goodsReceiptSchema, GoodsReceiptFormData } from "./schemas";
import {
  goodsReceiptService,
  GoodsReceiptDto,
  CreateUpdateGoodsReceiptDto,
  CreateUpdateGoodsReceiptItemDto,
  GoodsReceiptWarehouseStatus,
  GoodsReceiptOrderStatus,
  GoodsReceiptPaymentStatus,
  GoodsReceiptType,
  RecentLotDto,
} from "../../services/goodsReceiptService";
import { manufacturerService, ManufacturerDto } from "../../services/manufacturerService";
import {
  productService,
  ProductDto,
  ProductType,
  CreateUpdateProductDto,
} from "../../services/productService";
import { unitService, UnitDto } from "../../services/masterDataService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { PaymentModal } from "./components";
import { PaymentFormData } from "./schemas";
import "../../styles/ListCard.css";

const ProductModal = lazy(
  () => import("../Products/components/ProductModal")
);

const PRODUCT_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: String(ProductType.Chemical), label: "Hóa chất" },
  { value: String(ProductType.Biological), label: "Sinh phẩm" },
  { value: String(ProductType.Supply), label: "Vật tư" },
];

interface LineItem {
  key: string;
  id?: string;
  productId: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  vatPercent: number;
  amountBeforeVat: number;
  vatAmount: number;
  amountAfterVat: number;
  lotNumber?: string;
  lotExpiryDate?: string;
  availableUnits: { value: string; label: string }[];
  isEquipment: boolean;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  manufacturerId?: string;
  supplierId?: string;
  supplierName?: string;
}

const GoodsReceiptForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<GoodsReceiptDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [lotSuggestions, setLotSuggestions] = useState<Record<string, RecentLotDto[]>>({});
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [isCustomVat, setIsCustomVat] = useState(false);
  const [newLotInput, setNewLotInput] = useState<Record<string, string>>({});
  const [manufacturers, setManufacturers] = useState<ManufacturerDto[]>([]);

  // Inline creation modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalLoading, setProductModalLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [importing, setImporting] = useState(false);

  const canApprove = authService.hasPermission(PERMISSIONS.GoodsReceipts.Approve);
  const canImport = authService.hasPermission(PERMISSIONS.GoodsReceipts.ImportToWarehouse);
  const canPay = authService.hasPermission(PERMISSIONS.GoodsReceipts.AddPayment);

  const isReadonly = receipt
    ? receipt.orderStatus === GoodsReceiptOrderStatus.Approved ||
      receipt.warehouseStatus === GoodsReceiptWarehouseStatus.Imported
    : false;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: {},
  } = useForm<GoodsReceiptFormData>({
    resolver: yupResolver(goodsReceiptSchema) as any,
    defaultValues: {
      supplierId: null,
      supplierAddress: "",
      supplierPhone: "",
      purchaserName: "",
      deliveryNoteNumber: "",
      documentDate: "",
      documentExpiryDate: "",
      supplierRepresentativePhone: "",
      vatPercent: 8,
      notes: "",
    },
  });

  const defaultVat = watch("vatPercent") || 8;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        const [unitsRes] = await Promise.all([
          unitService.getList({ limit: 1000 }),
        ]);
        setUnits(unitsRes.items || []);

        const [activeProducts, manufacturerList] = await Promise.all([
          productService.getActive(),
          manufacturerService.getActive(),
        ]);
        setProducts(activeProducts || []);
        setManufacturers(manufacturerList || []);

        if (id) {
          const receiptData = await goodsReceiptService.get(id);
          if (receiptData.receiptType === GoodsReceiptType.Equipment) {
            navigate(`/goods-receipts/edit-equipment/${id}`, { replace: true });
            return;
          }
          setReceipt(receiptData);
          reset({
            supplierId: null,
            supplierAddress: receiptData.supplierAddress || "",
            supplierPhone: receiptData.supplierPhone || "",
            purchaserName: receiptData.purchaserName || "",
            deliveryNoteNumber: receiptData.deliveryNoteNumber || "",
            documentDate: receiptData.documentDate || "",
            documentExpiryDate: receiptData.documentExpiryDate || "",
            supplierRepresentativePhone: receiptData.supplierRepresentativePhone || "",
            vatPercent: receiptData.vatPercent,
            notes: receiptData.notes || "",
          });

          const loadedProducts = activeProducts || [];
          const loadedUnits = unitsRes.items || [];
          setLineItems(
            receiptData.items.map((item, idx) => {
              const product = loadedProducts.find((p) => p.id === item.productId);
              const itemUnits: { value: string; label: string }[] = [];
              if (product) {
                const baseUnit = loadedUnits.find((u) => u.id === product.baseUnitId);
                if (baseUnit) itemUnits.push({ value: baseUnit.id, label: baseUnit.name });
                if (product.unitConversions) {
                  for (const conv of product.unitConversions) {
                    if (conv.convertedUnitId && !itemUnits.find((r) => r.value === conv.convertedUnitId)) {
                      itemUnits.push({ value: conv.convertedUnitId, label: conv.convertedUnitName || conv.convertedUnitId });
                    }
                  }
                }
              }
              return {
                key: `existing-${idx}`,
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                unitId: item.unitId,
                unitName: item.unitName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                vatPercent: item.vatPercent,
                amountBeforeVat: item.amountBeforeVat,
                vatAmount: item.vatAmount,
                amountAfterVat: item.amountAfterVat,
                lotNumber: item.lotNumber,
                lotExpiryDate: item.lotExpiryDate,
                availableUnits: itemUnits,
                isEquipment: item.isEquipment || false,
                serialNumber: item.serialNumber,
                model: item.model,
                manufacturer: item.manufacturer,
                manufacturerId: item.manufacturerId,
              };
            })
          );

          const vatValues = receiptData.items.map(i => i.vatPercent);
          const allSameVat = vatValues.length > 0 && vatValues.every(v => v === vatValues[0]);
          setIsCustomVat(!allSameVat);
        } else {
          // Auto-fill purchaser from current user for new receipts
          const userInfo = authService.getUserInfo();
          if (userInfo?.fullName) {
            reset((prev) => ({ ...prev, purchaserName: userInfo.fullName }));
          }
        }
      } catch {
        message.error("Không thể tải dữ liệu");
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, [id, reset]);

  const getUnitsForProduct = useCallback((productId: string): { value: string; label: string }[] => {
    const product = products.find((p) => p.id === productId);
    if (!product) return [];

    const result: { value: string; label: string }[] = [];
    const baseUnit = units.find((u) => u.id === product.baseUnitId);
    if (baseUnit) {
      result.push({ value: baseUnit.id, label: baseUnit.name });
    }

    if (product.unitConversions) {
      for (const conv of product.unitConversions) {
        if (conv.convertedUnitId && !result.find((r) => r.value === conv.convertedUnitId)) {
          result.push({ value: conv.convertedUnitId, label: conv.convertedUnitName || conv.convertedUnitId });
        }
      }
    }

    return result;
  }, [products, units]);

  const recalculateLine = (item: LineItem): LineItem => {
    const amountBeforeVat = item.quantity * item.unitPrice;
    const vatAmount = amountBeforeVat * item.vatPercent / 100;
    return {
      ...item,
      amountBeforeVat,
      vatAmount,
      amountAfterVat: amountBeforeVat + vatAmount,
    };
  };

  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const availUnits = getUnitsForProduct(product.id);
    const baseUnit = units.find((u) => u.id === product.baseUnitId);

    const newItem: LineItem = {
      key: `new-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      unitId: product.baseUnitId,
      unitName: baseUnit?.name || "",
      quantity: 1,
      unitPrice: 0,
      vatPercent: defaultVat,
      amountBeforeVat: 0,
      vatAmount: 0,
      amountAfterVat: 0,
      lotNumber: "",
      lotExpiryDate: undefined,
      availableUnits: availUnits,
      isEquipment: false,
    };

    setLineItems((prev) => [...prev, recalculateLine(newItem)]);

    goodsReceiptService.getRecentLots(product.id).then((lots) => {
      setLotSuggestions((prev) => ({ ...prev, [product.id]: lots }));
    }).catch(() => {});
  };

  const manufacturerOptions = manufacturers.map((m) => ({
    value: m.name,
    label: m.name,
  }));

  const handleRemoveLine = (key: string) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleLineChange = (key: string, field: keyof LineItem, value: any) => {
    if (field === "vatPercent") {
      setIsCustomVat(true);
    }

    setLineItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };

        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.productName = product.name;
            updated.availableUnits = getUnitsForProduct(product.id);
            updated.unitId = product.baseUnitId;
            const baseUnit = units.find((u) => u.id === product.baseUnitId);
            updated.unitName = baseUnit?.name || "";

            goodsReceiptService.getRecentLots(product.id).then((lots) => {
              setLotSuggestions((prev) => ({ ...prev, [product.id]: lots }));
            }).catch(() => {});
          }
        }

        if (field === "unitId") {
          const unit = units.find((u) => u.id === value);
          if (unit) updated.unitName = unit.name;
        }

        return recalculateLine(updated);
      })
    );
  };

  const handleHeaderVatChange = (value: number | null) => {
    const vat = value || 0;
    setValue("vatPercent", vat);
    setLineItems(prev => prev.map(item => recalculateLine({ ...item, vatPercent: vat })));
  };

  const handleResetUniformVat = () => {
    setIsCustomVat(false);
    const currentVat = getValues("vatPercent") || 8;
    setLineItems(prev => prev.map(item => recalculateLine({ ...item, vatPercent: currentVat })));
  };

  const totalBeforeVat = lineItems.reduce((sum, item) => sum + item.amountBeforeVat, 0);
  const totalVat = lineItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalAfterVat = totalBeforeVat + totalVat;

  const filteredProductOptions = products
    .filter((p) => productTypeFilter === "all" || p.productType === Number(productTypeFilter))
    .map((p) => ({
      value: p.id,
      label: `${p.code} - ${p.name} (Tồn: ${p.availableQuantity ?? 0})`,
    }));

  const buildPayload = (data: GoodsReceiptFormData): CreateUpdateGoodsReceiptDto => ({
    receiptType: GoodsReceiptType.Goods,
    supplierId: undefined,
    supplierAddress: data.supplierAddress || undefined,
    supplierPhone: data.supplierPhone || undefined,
    purchaserName: data.purchaserName || undefined,
    deliveryNoteNumber: data.deliveryNoteNumber || undefined,
    documentDate: data.documentDate || undefined,
    documentExpiryDate: data.documentExpiryDate || undefined,
    supplierRepresentativePhone: data.supplierRepresentativePhone || undefined,
    vatPercent: data.vatPercent ?? 8,
    notes: data.notes || undefined,
    items: lineItems
      .filter((item) => item.productId)
      .map((item): CreateUpdateGoodsReceiptItemDto => ({
        id: item.id,
        productId: item.productId || undefined,
        unitId: item.unitId || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatPercent: item.vatPercent,
        lotNumber: item.lotNumber || undefined,
        lotExpiryDate: item.lotExpiryDate || undefined,
        isEquipment: false,
        manufacturer: item.manufacturer || undefined,
        manufacturerName: item.manufacturer || undefined,
        manufacturerId: item.manufacturerId || undefined,
      })),
  });

  const validateItems = (): boolean => {
    const validItems = lineItems.filter((item) => item.productId);
    if (validItems.length === 0) {
      message.warning("Vui lòng thêm ít nhất một hàng hóa.");
      return false;
    }
    return true;
  };

  const handleSaveDraft = handleSubmit(async (data) => {
    if (!validateItems()) return;
    setSaving(true);
    try {
      const payload = buildPayload(data);
      if (isEdit && id) {
        await goodsReceiptService.update(id, payload);
        message.success("Đã cập nhật phiếu nhập hàng");
      } else {
        const result = await goodsReceiptService.create(payload);
        message.success("Đã tạo phiếu nhập hàng");
        navigate(`/goods-receipts/${result.id}`);
        return;
      }
      navigate(`/goods-receipts/${id}`);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể lưu phiếu."));
    } finally {
      setSaving(false);
    }
  });

  const handleApprove = handleSubmit(async (data) => {
    if (!validateItems()) return;
    setApproving(true);
    try {
      const payload = buildPayload(data);
      let receiptId = id;
      if (isEdit && id) {
        await goodsReceiptService.update(id, payload);
      } else {
        const result = await goodsReceiptService.create(payload);
        receiptId = result.id;
      }
      await goodsReceiptService.approve(receiptId!);
      message.success("Đã duyệt đơn");
      navigate(`/goods-receipts/${receiptId}`);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể duyệt đơn."));
    } finally {
      setApproving(false);
    }
  });

  const handleImportToWarehouse = async () => {
    if (!id) return;
    setImporting(true);
    try {
      await goodsReceiptService.importToWarehouse(id);
      message.success("Đã nhập kho thành công");
      const updated = await goodsReceiptService.get(id);
      setReceipt(updated);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể nhập kho."));
    } finally {
      setImporting(false);
    }
  };

  const handlePaymentOk = async (data: PaymentFormData) => {
    if (!id) return;
    setPaymentLoading(true);
    try {
      await goodsReceiptService.addPayment(id, {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        phone: data.phone || undefined,
        representativeName: data.representativeName || undefined,
        notes: data.notes || undefined,
      });
      message.success("Thanh toán thành công");
      setPaymentModalOpen(false);
      const updated = await goodsReceiptService.get(id);
      setReceipt(updated);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể thanh toán."));
    } finally {
      setPaymentLoading(false);
    }
  };

  // Inline Product creation
  const handleCreateProduct = async (data: CreateUpdateProductDto) => {
    setProductModalLoading(true);
    try {
      const newProduct = await productService.create(data);
      setProducts((prev) => [...prev, newProduct]);
      message.success("Đã tạo vật phẩm mới");
      setProductModalOpen(false);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể tạo vật phẩm."));
    } finally {
      setProductModalLoading(false);
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString("vi-VN");

  const handleAddLot = (recordKey: string, productId: string) => {
    const val = (newLotInput[recordKey] || "").trim();
    if (!val) return;
    setLotSuggestions((prev) => {
      const existing = prev[productId] || [];
      if (existing.some((l) => l.lotNumber === val)) return prev;
      return { ...prev, [productId]: [{ lotNumber: val, lotExpiryDate: undefined }, ...existing] };
    });
    handleLineChange(recordKey, "lotNumber", val);
    setNewLotInput((prev) => ({ ...prev, [recordKey]: "" }));
  };

  const productItems = lineItems;

  const actionColumn = !isReadonly
    ? [
        {
          title: "",
          key: "action",
          width: 40,
          render: (_: any, record: LineItem) => (
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={() => handleRemoveLine(record.key)}
            />
          ),
        },
      ]
    : [];

  const productColumns = [
    {
      title: "STT",
      key: "index",
      width: 50,
      align: "center" as const,
      render: (_: any, __: LineItem, index: number) => index + 1,
    },
    {
      title: "ID hàng hóa",
      key: "productCode",
      width: 120,
      render: (_: any, record: LineItem) => {
        const product = products.find((p) => p.id === record.productId);
        return product?.code || "-";
      },
    },
    {
      title: "Tên hàng hóa",
      key: "productName",
      width: 180,
      ellipsis: true,
      render: (_: any, record: LineItem) => record.productName || "-",
    },
    {
      title: "Hãng sản xuất",
      key: "manufacturer",
      width: 160,
      render: (_: any, record: LineItem) => {
        if (isReadonly) return record.manufacturer || "-";
        return (
          <AutoComplete
            value={record.manufacturer || ""}
            options={manufacturerOptions.filter((o) =>
              o.value.toLowerCase().includes((record.manufacturer || "").toLowerCase())
            )}
            onSelect={(value) => {
              const m = manufacturers.find((x) => x.name === value);
              handleLineChange(record.key, "manufacturer", value);
              if (m) handleLineChange(record.key, "manufacturerId", m.id);
            }}
            onChange={(value) => {
              handleLineChange(record.key, "manufacturer", value);
              handleLineChange(record.key, "manufacturerId", undefined);
            }}
            placeholder="Nhập hãng SX"
            style={{ width: "100%" }}
            size="small"
          />
        );
      },
    },
    {
      title: "Đơn vị",
      key: "unitId",
      width: 110,
      render: (_: any, record: LineItem) => {
        const availUnits = record.availableUnits.length > 0
          ? record.availableUnits
          : getUnitsForProduct(record.productId);
        return isReadonly ? record.unitName : (
          <Select
            value={record.unitId || undefined}
            placeholder="Đơn vị"
            options={availUnits}
            onChange={(v) => handleLineChange(record.key, "unitId", v)}
            style={{ width: "100%" }}
            size="small"
          />
        );
      },
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 90,
      render: (_: any, record: LineItem) =>
        isReadonly ? record.quantity : (
          <InputNumber
            value={record.quantity}
            min={0.01}
            onChange={(v) => handleLineChange(record.key, "quantity", v || 0)}
            style={{ width: "100%" }}
            size="small"
          />
        ),
    },
    {
      title: "Giá nhập",
      key: "unitPrice",
      width: 160,
      render: (_: any, record: LineItem) =>
        isReadonly ? `${formatCurrency(record.unitPrice)} VNĐ` : (
          <InputNumber
            value={record.unitPrice}
            min={0}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => Number(v?.replace(/,/g, "") || 0)}
            onChange={(v) => handleLineChange(record.key, "unitPrice", v || 0)}
            style={{ width: "100%" }}
            size="small"
            addonAfter="VNĐ"
          />
        ),
    },
    {
      title: "Thành tiền chưa VAT",
      key: "amountBeforeVat",
      width: 150,
      align: "right" as const,
      render: (_: any, record: LineItem) => `${formatCurrency(record.amountBeforeVat)} VNĐ`,
    },
    {
      title: "VAT",
      key: "vatPercent",
      width: 65,
      align: "center" as const,
      render: (_: any, record: LineItem) =>
        isReadonly ? `${record.vatPercent}%` : (
          <InputNumber
            value={record.vatPercent}
            min={0}
            max={100}
            onChange={(v) => handleLineChange(record.key, "vatPercent", v || 0)}
            style={{ width: "100%" }}
            size="small"
          />
        ),
    },
    {
      title: "Thành tiền sau VAT",
      key: "amountAfterVat",
      width: 150,
      align: "right" as const,
      render: (_: any, record: LineItem) => `${formatCurrency(record.amountAfterVat)} VNĐ`,
    },
    {
      title: "Số lô",
      key: "lotNumber",
      width: 150,
      render: (_: any, record: LineItem) => {
        const lots = (lotSuggestions[record.productId] || []).map((l) => ({
          value: l.lotNumber,
          label: l.lotExpiryDate
            ? `${l.lotNumber} (HSD: ${dayjs(l.lotExpiryDate).format("DD/MM/YYYY")})`
            : l.lotNumber,
        }));
        if (isReadonly) return record.lotNumber || "-";
        return (
          <Select
            value={record.lotNumber || undefined}
            placeholder="Chọn lô"
            options={lots}
            onChange={(v) => {
              handleLineChange(record.key, "lotNumber", v);
              const lot = (lotSuggestions[record.productId] || []).find((l) => l.lotNumber === v);
              if (lot?.lotExpiryDate) {
                handleLineChange(record.key, "lotExpiryDate", lot.lotExpiryDate);
              }
            }}
            allowClear
            onClear={() => handleLineChange(record.key, "lotNumber", "")}
            style={{ width: "100%" }}
            size="small"
            notFoundContent={<span style={{ color: "#999", fontSize: 12 }}>Chưa có lô nào</span>}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "4px 0" }} />
                <div style={{ padding: "0 4px 4px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Input
                      size="small"
                      placeholder="Nhập số lô mới"
                      value={newLotInput[record.key] || ""}
                      onChange={(e) => setNewLotInput((prev) => ({ ...prev, [record.key]: e.target.value }))}
                      onPressEnter={() => handleAddLot(record.key, record.productId)}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddLot(record.key, record.productId)}
                    />
                  </div>
                </div>
              </>
            )}
          />
        );
      },
    },
    {
      title: "Hạn lô",
      key: "lotExpiryDate",
      width: 130,
      render: (_: any, record: LineItem) => {
        if (isReadonly) return record.lotExpiryDate ? dayjs(record.lotExpiryDate).format("DD/MM/YYYY") : "-";
        const existingLot = (lotSuggestions[record.productId] || []).find(
          (l) => l.lotNumber === record.lotNumber && l.lotExpiryDate
        );
        return (
          <DatePicker
            value={record.lotExpiryDate ? dayjs(record.lotExpiryDate) : null}
            format="DD/MM/YYYY"
            onChange={(date) =>
              handleLineChange(record.key, "lotExpiryDate", date?.format("YYYY-MM-DD") || undefined)
            }
            disabledDate={(current) => current && current.isBefore(dayjs(), "day")}
            style={{ width: "100%" }}
            size="small"
            disabled={!!existingLot}
          />
        );
      },
    },
    ...actionColumn,
  ];

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
            {isEdit ? "Sửa phiếu nhập vật tư" : "Tạo phiếu nhập vật tư"}
            {receipt?.code && <Tag>{receipt.code}</Tag>}
          </Space>
        }
      >
        <Form layout="vertical" size="middle" style={{ padding: "0 16px" }}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Nhân viên mua hàng">
                <Controller
                  name="purchaserName"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="Nhân viên mua hàng" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Số phiếu giao hàng từ NCC">
                <Controller
                  name="deliveryNoteNumber"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="Số phiếu giao hàng" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Người lập phiếu">
                <Input value={receipt?.preparedByName || authService.getUserInfo()?.fullName || ""} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Thời gian tạo phiếu">
                <Input value={receipt ? dayjs(receipt.creationTime).format("HH:mm DD/MM/YYYY") : dayjs().format("HH:mm DD/MM/YYYY")} disabled style={{ backgroundColor: "#f5f5f5" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Địa chỉ NCC">
                <Controller
                  name="supplierAddress"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="Địa chỉ nhà cung cấp" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="SĐT NCC">
                <Controller
                  name="supplierPhone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="Số điện thoại NCC" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="SĐT đại diện NCC">
                <Controller
                  name="supplierRepresentativePhone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="SĐT đại diện" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="VAT (%)">
                {isCustomVat ? (
                  <Space.Compact style={{ width: "100%" }}>
                    <Input
                      value="Tùy chọn theo sản phẩm"
                      disabled
                      style={{ flex: 1 }}
                    />
                    {!isReadonly && (
                      <Button onClick={handleResetUniformVat}>
                        Đặt lại
                      </Button>
                    )}
                  </Space.Compact>
                ) : (
                  <Controller
                    name="vatPercent"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        onChange={(v) => handleHeaderVatChange(v as number)}
                        style={{ width: "100%" }}
                        min={0} max={100} suffix="%"
                        disabled={isReadonly}
                      />
                    )}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Ngày cấp chứng từ">
                <Controller
                  name="documentDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") || "")}
                      disabled={isReadonly}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Ngày hết hạn chứng từ">
                <Controller
                  name="documentExpiryDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") || "")}
                      disabled={isReadonly}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Ghi chú">
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="Ghi chú" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider style={{ margin: "8px 0 16px" }} />

        {/* Product items */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>THÔNG TIN VẬT TƯ</strong>
            {!isReadonly && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Select
                  value={productTypeFilter}
                  onChange={setProductTypeFilter}
                  options={PRODUCT_TYPE_OPTIONS}
                  style={{ width: 200 }}
                  placeholder="Chọn hàng hóa theo danh mục"
                />
                <Space.Compact style={{ flex: 1, maxWidth: 420 }}>
                  <Select
                    key={`product-select-${lineItems.length}`}
                    placeholder="Tìm hàng hóa theo mã hoặc theo tên"
                    options={filteredProductOptions}
                    onSelect={(v) => handleAddProduct(v)}
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setProductModalOpen(true)}
                    title="Tạo hàng hóa mới"
                  />
                </Space.Compact>
              </div>
            )}
          </div>

          <Table
            columns={productColumns}
            dataSource={productItems}
            rowKey="key"
            pagination={false}
            scroll={{ x: 1800 }}
            size="small"
            bordered
            locale={{ emptyText: "Chưa có hàng hóa" }}
          />

          <Row justify="end" style={{ padding: "12px 0" }}>
            <Col>
              <Space size={24}>
                <span>Tổng chưa VAT: <strong>{formatCurrency(totalBeforeVat)} VNĐ</strong></span>
                <span>Tổng thuế VAT: <strong>{formatCurrency(totalVat)} VNĐ</strong></span>
                <span>Tổng tiền: <strong style={{ color: "#1677ff", fontSize: 16 }}>{formatCurrency(totalAfterVat)} VNĐ</strong></span>
              </Space>
            </Col>
          </Row>
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
          {/* Draft state: Lưu tạm + Duyệt */}
          {!isReadonly && (
            <Button onClick={handleSaveDraft} loading={saving}>
              {isEdit ? "Cập nhật" : "Lưu tạm"}
            </Button>
          )}
          {!isReadonly && canApprove && (!isEdit || receipt?.orderStatus === GoodsReceiptOrderStatus.Draft) && (
            <Button
              type="primary"
              onClick={handleApprove}
              loading={approving}
              style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", borderColor: "transparent" }}
            >
              Duyệt
            </Button>
          )}

          {/* Approved state: Thanh toán + Nhập kho */}
          {isEdit && receipt && canPay && receipt.orderStatus === GoodsReceiptOrderStatus.Approved && receipt.paymentStatus !== GoodsReceiptPaymentStatus.Paid && (receipt.totalAmountAfterVat - receipt.totalPaid) > 0 && (
            <Button onClick={() => setPaymentModalOpen(true)} style={{ borderColor: "#52c41a", color: "#52c41a" }}>
              Thanh toán
            </Button>
          )}
          {isEdit && receipt && canImport && receipt.orderStatus === GoodsReceiptOrderStatus.Approved && receipt.warehouseStatus === GoodsReceiptWarehouseStatus.NotImported && (
            <Button
              type="primary"
              loading={importing}
              onClick={() => {
                Modal.confirm({
                  title: "Xác nhận nhập kho",
                  content: "Bạn có chắc chắn muốn nhập kho phiếu này? Sau khi nhập kho sẽ không thể chỉnh sửa.",
                  okText: "Nhập kho",
                  cancelText: "Hủy",
                  centered: true,
                  onOk: handleImportToWarehouse,
                });
              }}
            >
              Nhập kho
            </Button>
          )}

          {/* Imported state: disabled indicator */}
          {isEdit && receipt && receipt.warehouseStatus === GoodsReceiptWarehouseStatus.Imported && (
            <Button disabled>Đã nhập kho</Button>
          )}
        </Space>
      </Card>

      {receipt && (
        <PaymentModal
          open={paymentModalOpen}
          loading={paymentLoading}
          totalAmount={receipt.totalAmountAfterVat}
          totalPaid={receipt.totalPaid}
          onOk={handlePaymentOk}
          onCancel={() => setPaymentModalOpen(false)}
        />
      )}

      {/* Inline Product Creation Modal */}
      <Suspense fallback={null}>
        <ProductModal
          open={productModalOpen}
          loading={productModalLoading}
          editingProduct={null}
          onOk={handleCreateProduct}
          onCancel={() => setProductModalOpen(false)}
        />
      </Suspense>
    </div>
  );
};

export default GoodsReceiptForm;
