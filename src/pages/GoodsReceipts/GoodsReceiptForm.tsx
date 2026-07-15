import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import {
  Card, Form, Input, Select, DatePicker, InputNumber, Button, Space, Row, Col,
  Table, message, Spin, Divider, Tag,
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
} from "../../services/goodsReceiptService";
import { manufacturerService, ManufacturerDto } from "../../services/manufacturerService";
import { supplierService, SupplierDto } from "../../services/supplierService";
import { employeeService, EmployeeDto } from "../../services/employeeService";
import {
  productService,
  ProductDto,
  ProductType,
  CreateUpdateProductDto,
} from "../../services/productService";
import { unitService, UnitDto, warehouseService, WarehouseDto } from "../../services/masterDataService";
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
  { value: String(ProductType.Supply), label: "Vật tư tiêu hao" },
  { value: String(ProductType.Standard), label: "Chất chuẩn" },
  { value: String(ProductType.Solvent), label: "Dung môi" },
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
  receivedDate?: string;
  expiryDate?: string;
  warehouseId?: string;
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
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [manufacturers, setManufacturers] = useState<ManufacturerDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [newManufacturerInput, setNewManufacturerInput] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);

  const [previewCode, setPreviewCode] = useState<string>("");
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string | undefined>();

  // Inline creation modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalLoading, setProductModalLoading] = useState(false);

  const canPay = authService.hasPermission(PERMISSIONS.GoodsReceipts.AddPayment);

  const isReadonly = receipt
    ? receipt.warehouseStatus === GoodsReceiptWarehouseStatus.Imported
    : false;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {},
  } = useForm<GoodsReceiptFormData>({
    resolver: yupResolver(goodsReceiptSchema) as any,
    defaultValues: {
      supplierId: undefined,
      supplierAddress: "",
      supplierPhone: "",
      purchaserId: undefined,
      purchaserName: "",
      deliveryNoteNumber: "",
      documentDate: "",
      documentExpiryDate: "",
      expectedDeliveryDate: "",
      supplierRepresentativePhone: "",
      supplierRepresentativeName: "",
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
        const [unitsRes, suppliersRes, employeesList] = await Promise.all([
          unitService.getList({ maxResultCount: 1000 }),
          supplierService.getList({ limit: 1000 }),
          employeeService.getList({ maxResultCount: 1000 }),
        ]);
        setUnits(unitsRes.items || []);
        setSuppliers(suppliersRes.items || []);
        setEmployees(employeesList.items || []);

        const [activeProducts, manufacturerList, warehouseList, defaultWh] = await Promise.all([
          productService.getActive(),
          manufacturerService.getActive(),
          warehouseService.getActive(),
          warehouseService.getDefault().catch(() => null),
        ]);
        setProducts(activeProducts || []);
        setManufacturers(manufacturerList || []);
        setWarehouses(warehouseList || []);
        if (defaultWh) setDefaultWarehouseId(defaultWh.id);

        if (id) {
          const receiptData = await goodsReceiptService.get(id);
          if (receiptData.receiptType === GoodsReceiptType.Equipment) {
            navigate(`/goods-receipts/edit-equipment/${id}`, { replace: true });
            return;
          }
          setReceipt(receiptData);
          reset({
            supplierId: receiptData.supplierId || undefined,
            supplierAddress: receiptData.supplierAddress || "",
            supplierPhone: receiptData.supplierPhone || "",
            purchaserId: receiptData.purchaserId || undefined,
            purchaserName: receiptData.purchaserName || "",
            deliveryNoteNumber: receiptData.deliveryNoteNumber || "",
            documentDate: receiptData.documentDate || "",
            documentExpiryDate: receiptData.documentExpiryDate || "",
            expectedDeliveryDate: receiptData.expectedDeliveryDate || "",
            supplierRepresentativePhone: receiptData.supplierRepresentativePhone || "",
            supplierRepresentativeName: receiptData.supplierRepresentativeName || "",
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
                const addUnit = (unitId?: string | null) => {
                  if (!unitId) return;
                  const unit = loadedUnits.find((u) => u.id === unitId);
                  if (unit && !itemUnits.find((r) => r.value === unit.id)) {
                    itemUnits.push({ value: unit.id, label: unit.name });
                  }
                };
                addUnit(product.packagingUnitId);
                addUnit(product.baseUnitId);
                addUnit(product.volumeUnitId);
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
                receivedDate: item.receivedDate,
                expiryDate: item.expiryDate,
                warehouseId: item.warehouseId,
              };
            })
          );

        } else {
          // Auto-fill purchaser from current user for new receipts
          const userInfo = authService.getUserInfo();
          if (userInfo) {
            const currentEmployee = employeesList.items?.find(
              (e) => e.username === userInfo.userName || e.email === userInfo.email
            );
            if (currentEmployee) {
              reset((prev) => ({ ...prev, purchaserId: currentEmployee.id }));
            }
          }
          // Preview next code
          goodsReceiptService.getNextCode().then(setPreviewCode).catch(() => {});
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
    const addUnit = (unitId?: string | null) => {
      if (!unitId) return;
      const unit = units.find((u) => u.id === unitId);
      if (unit && !result.find((r) => r.value === unit.id)) {
        result.push({ value: unit.id, label: unit.name });
      }
    };

    addUnit(product.packagingUnitId);
    addUnit(product.baseUnitId);
    addUnit(product.volumeUnitId);

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
    const defaultUnitId = product.baseUnitId || product.packagingUnitId || product.volumeUnitId;
    const defaultUnit = units.find((u) => u.id === defaultUnitId);

    const newItem: LineItem = {
      key: `new-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      unitId: defaultUnitId || "",
      unitName: defaultUnit?.name || "",
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
      warehouseId: defaultWarehouseId,
    };

    setLineItems((prev) => [...prev, recalculateLine(newItem)]);
  };

  const manufacturerSelectOptions = manufacturers.map((m) => ({
    value: m.id,
    label: m.name,
  }));

  const handleAddManufacturer = (recordKey: string) => {
    const name = newManufacturerInput.trim();
    if (!name) return;
    if (manufacturers.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      const existing = manufacturers.find((m) => m.name.toLowerCase() === name.toLowerCase())!;
      handleLineChange(recordKey, "manufacturerId", existing.id);
      handleLineChange(recordKey, "manufacturer", existing.name);
      setNewManufacturerInput("");
      return;
    }
    const tempId = `temp-${Date.now()}`;
    setManufacturers((prev) => [...prev, { id: tempId, name, isActive: true } as ManufacturerDto]);
    handleLineChange(recordKey, "manufacturer", name);
    handleLineChange(recordKey, "manufacturerId", tempId);
    setNewManufacturerInput("");
  };

  const handleRemoveLine = (key: string) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleLineChange = (key: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };

        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.productName = product.name;
            updated.availableUnits = getUnitsForProduct(product.id);
            const defUnitId = product.baseUnitId || product.packagingUnitId || product.volumeUnitId;
            updated.unitId = defUnitId || "";
            const defUnit = units.find((u) => u.id === defUnitId);
            updated.unitName = defUnit?.name || "";
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

  const handleSupplierChange = useCallback(async (supplierId: string | null) => {
    if (!supplierId) {
      setValue("supplierAddress", "");
      setValue("supplierPhone", "");
      setValue("supplierRepresentativePhone", "");
      setValue("supplierRepresentativeName", "");
      return;
    }
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setValue("supplierAddress", supplier.address || "");
      setValue("supplierPhone", supplier.phone || "");
    }
    try {
      const info = await goodsReceiptService.getLatestSupplierInfo(supplierId);
      if (info.supplierRepresentativePhone) {
        setValue("supplierRepresentativePhone", info.supplierRepresentativePhone);
      }
      if (info.supplierRepresentativeName) {
        setValue("supplierRepresentativeName", info.supplierRepresentativeName);
      }
    } catch {
      // No previous receipt for this supplier, leave fields empty
    }
  }, [suppliers, setValue]);

  const totalBeforeVat = lineItems.reduce((sum, item) => sum + item.amountBeforeVat, 0);

  const filteredProductOptions = products
    .filter((p) => productTypeFilter === "all" || p.productType === Number(productTypeFilter))
    .map((p) => ({
      value: p.id,
      label: p.identificationCode
        ? `${p.identificationCode} - ${p.name} (Tồn: ${p.availableQuantity ?? 0})`
        : `${p.name} (Tồn: ${p.availableQuantity ?? 0})`,
    }));

  const buildPayload = (data: GoodsReceiptFormData): CreateUpdateGoodsReceiptDto => ({
    receiptType: GoodsReceiptType.Goods,
    supplierId: data.supplierId || undefined,
    supplierAddress: data.supplierAddress || undefined,
    supplierPhone: data.supplierPhone || undefined,
    purchaserName: data.purchaserName || undefined,
    purchaserId: data.purchaserId || undefined,
    deliveryNoteNumber: data.deliveryNoteNumber || undefined,
    documentDate: data.documentDate || undefined,
    documentExpiryDate: data.documentExpiryDate || undefined,
    expectedDeliveryDate: data.expectedDeliveryDate || undefined,
    supplierRepresentativePhone: data.supplierRepresentativePhone || undefined,
    supplierRepresentativeName: data.supplierRepresentativeName || undefined,
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
        manufacturerId: item.manufacturerId?.startsWith("temp-") ? undefined : item.manufacturerId || undefined,
        receivedDate: item.receivedDate || undefined,
        expiryDate: item.expiryDate || undefined,
        warehouseId: item.warehouseId || undefined,
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

  const handleSaveDraft = handleSubmit(async (data: GoodsReceiptFormData) => {
    if (!validateItems()) return;
    setSaving(true);
    try {
      const payload = buildPayload(data);
      if (isEdit && id) {
        await goodsReceiptService.update(id, payload);
        message.success("Đã cập nhật phiếu nhập hàng");
      } else {
        const result = await goodsReceiptService.create(payload);
        if (previewCode && result.code !== previewCode) {
          message.success(`Đã tạo phiếu nhập hàng — Mã phiếu: ${result.code} (đã cập nhật do có phiếu khác được tạo trước)`);
        } else {
          message.success("Đã tạo phiếu nhập hàng");
        }
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

  const productItems = lineItems;

  const actionColumn = !isReadonly
    ? [
        {
          title: "",
          key: "action",
          width: 40,
          fixed: "right" as const,
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
      title: "Mã nhận dạng",
      key: "identificationCode",
      width: 120,
      render: (_: any, record: LineItem) => {
        const product = products.find((p) => p.id === record.productId);
        return product?.identificationCode || "-";
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
      width: 180,
      render: (_: any, record: LineItem) => {
        if (isReadonly) return record.manufacturer || "-";
        const selectedValue = record.manufacturerId && manufacturers.some((m) => m.id === record.manufacturerId)
          ? record.manufacturerId
          : undefined;
        return (
          <Select
            value={selectedValue}
            placeholder="Chọn hãng SX"
            options={manufacturerSelectOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onChange={(value) => {
              const m = manufacturers.find((x) => x.id === value);
              if (m) {
                handleLineChange(record.key, "manufacturer", m.name);
                handleLineChange(record.key, "manufacturerId", m.id);
              }
            }}
            allowClear
            onClear={() => {
              handleLineChange(record.key, "manufacturer", undefined);
              handleLineChange(record.key, "manufacturerId", undefined);
            }}
            style={{ width: "100%" }}
            size="small"
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "4px 0" }} />
                <div style={{ padding: "0 4px 4px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Input
                      size="small"
                      placeholder="Thêm hãng SX mới"
                      value={newManufacturerInput}
                      onChange={(e) => setNewManufacturerInput(e.target.value)}
                      onPressEnter={() => handleAddManufacturer(record.key)}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddManufacturer(record.key)}
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
      title: "Ngày nhận",
      key: "receivedDate",
      width: 130,
      render: (_: any, record: LineItem) =>
        isReadonly ? (record.receivedDate ? dayjs(record.receivedDate).format("DD/MM/YYYY") : "-") : (
          <DatePicker
            value={record.receivedDate ? dayjs(record.receivedDate) : null}
            onChange={(d) => handleLineChange(record.key, "receivedDate", d?.toISOString() || undefined)}
            format="DD/MM/YYYY"
            size="small"
            style={{ width: "100%" }}
            allowClear
          />
        ),
    },
    {
      title: "Hạn sử dụng",
      key: "expiryDate",
      width: 130,
      render: (_: any, record: LineItem) =>
        isReadonly ? (record.expiryDate ? dayjs(record.expiryDate).format("DD/MM/YYYY") : "-") : (
          <DatePicker
            value={record.expiryDate ? dayjs(record.expiryDate) : null}
            onChange={(d) => handleLineChange(record.key, "expiryDate", d?.toISOString() || undefined)}
            format="DD/MM/YYYY"
            size="small"
            style={{ width: "100%" }}
            allowClear
            disabledDate={(current) => current && current.isBefore(dayjs().startOf("day"))}
          />
        ),
    },
    {
      title: "Kho bảo quản",
      key: "warehouseId",
      width: 150,
      render: (_: any, record: LineItem) => {
        if (isReadonly) {
          const wh = warehouses.find((w) => w.id === record.warehouseId);
          return wh?.name || "-";
        }
        return (
          <Select
            value={record.warehouseId || undefined}
            onChange={(v) => handleLineChange(record.key, "warehouseId", v || undefined)}
            placeholder="Chọn kho"
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            showSearch
            optionFilterProp="label"
            allowClear
            size="small"
            style={{ width: "100%" }}
          />
        );
      },
    },
    {
      title: "Đơn giá dự kiến",
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
      title: "Thành tiền dự kiến",
      key: "amountBeforeVat",
      width: 150,
      align: "right" as const,
      render: (_: any, record: LineItem) => `${formatCurrency(record.amountBeforeVat)} VNĐ`,
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
            {isEdit ? "Sửa yêu cầu mua sắm" : "Tạo yêu cầu mua sắm"}
            {receipt?.code && <Tag>{receipt.code}</Tag>}
          </Space>
        }
      >
        <Form layout="vertical" size="middle" style={{ padding: "0 16px" }}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Controller
                name="supplierId"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Nhà cung cấp"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <Select
                      {...field}
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn nhà cung cấp"
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                      allowClear
                      onChange={(value) => {
                        field.onChange(value || null);
                        handleSupplierChange(value || null);
                      }}
                      options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Controller
                name="purchaserId"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Nhân viên mua hàng"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <Select
                      {...field}
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn nhân viên"
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                      allowClear
                      onChange={(value) => field.onChange(value || null)}
                      options={employees.map(e => ({ value: e.id, label: e.fullName }))}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Thời gian tạo phiếu">
                <Input value={receipt ? dayjs(receipt.creationTime).format("HH:mm DD/MM/YYYY") : dayjs().format("HH:mm DD/MM/YYYY")} disabled style={{ backgroundColor: "#f5f5f5" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Số phiếu giao hàng">
                <Input value={receipt?.code || previewCode || ""} placeholder="Tự động sinh khi lưu" disabled style={{ backgroundColor: "#f5f5f5" }} />
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
                    <Input {...field} value={field.value || ""} disabled />
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
                    <Input {...field} value={field.value || ""} disabled />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Controller
                name="supplierRepresentativeName"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Tên người đại diện NCC"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Tên người đại diện"
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Controller
                name="supplierRepresentativePhone"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="SĐT người đại diện NCC"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="SĐT người đại diện"
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Ngày cần hàng dự kiến">
                <Controller
                  name="expectedDeliveryDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") || "")}
                      disabled={isReadonly}
                      disabledDate={(current) => current && current.isBefore(dayjs(), "day")}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={18}>
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
            scroll={{ x: 2200 }}
            size="small"
            bordered
            locale={{ emptyText: "Chưa có hàng hóa" }}
          />

          <Row justify="end" style={{ padding: "12px 0" }}>
            <Col>
              <span>Tổng dự toán: <strong style={{ color: "#1677ff", fontSize: 16 }}>{formatCurrency(totalBeforeVat)} VNĐ</strong></span>
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
          {/* Hủy phiếu / Quay lại */}
          {!isReadonly && (
            <Button onClick={() => navigate("/goods-receipts")}>
              {isEdit ? "Quay lại" : "Hủy phiếu"}
            </Button>
          )}
          {/* Lưu */}
          {!isReadonly && (!isEdit || receipt?.orderStatus === GoodsReceiptOrderStatus.PendingApproval) && (
            <Button type="primary" onClick={handleSaveDraft} loading={saving}>
              Lưu
            </Button>
          )}

          {/* Cập nhật — for Approved receipts not yet imported */}
          {!isReadonly && isEdit && (receipt?.orderStatus === GoodsReceiptOrderStatus.Ordering || receipt?.orderStatus === GoodsReceiptOrderStatus.WaitingReceipt) && (
            <Button type="primary" onClick={handleSaveDraft} loading={saving}>
              Cập nhật
            </Button>
          )}

          {/* Approved state: Thanh toán + Nhập kho */}
          {isEdit && receipt && canPay && (receipt.orderStatus === GoodsReceiptOrderStatus.Ordering || receipt.orderStatus === GoodsReceiptOrderStatus.WaitingReceipt) && receipt.paymentStatus !== GoodsReceiptPaymentStatus.Paid && (receipt.totalAmountAfterVat - receipt.totalPaid) > 0 && (
            <Button onClick={() => setPaymentModalOpen(true)} style={{ borderColor: "#52c41a", color: "#52c41a" }}>
              Thanh toán
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
