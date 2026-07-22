import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import {
  Card, Form, Input, Select, DatePicker, InputNumber, Button, Space, Row, Col,
  Table, message, Spin, Divider, Tag,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
} from "../../services/goodsReceiptService";
import { manufacturerService, ManufacturerDto } from "../../services/manufacturerService";
import {
  productService,
  ProductDto,
  ProductType,
  CreateUpdateProductDto,
} from "../../services/productService";
import { unitService, UnitDto, UnitCategory } from "../../services/masterDataService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import "../../styles/ListCard.css";
import "./GoodsReceiptList.css";

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
  { value: String(ProductType.Equipment), label: "Thiết bị phòng Lab" },
];

interface LineItem {
  key: string;
  id?: string;
  productId: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantity: number;
  availableUnits: { value: string; label: string }[];
  isEquipment: boolean;
  manufacturer?: string;
  manufacturerId?: string;
  model?: string;
}

const GoodsReceiptForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<GoodsReceiptDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<LineItem[]>([]);
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [manufacturers, setManufacturers] = useState<ManufacturerDto[]>([]);

  const [previewCode, setPreviewCode] = useState<string>("");

  // Inline creation modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalLoading, setProductModalLoading] = useState(false);

  const isReadonly = receipt
    ? receipt.warehouseStatus === GoodsReceiptWarehouseStatus.Imported
    : false;

  const {
    control,
    handleSubmit,
    reset,
    formState: {},
  } = useForm<GoodsReceiptFormData>({
    resolver: yupResolver(goodsReceiptSchema) as any,
    defaultValues: {
      deliveryNoteNumber: "",
      expectedDeliveryDate: "",
      notes: "",
    },
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        const [unitsRes, activeProducts, manufacturerList] = await Promise.all([
          unitService.getList({ maxResultCount: 1000 }),
          productService.getActive(),
          manufacturerService.getActive(),
        ]);
        setUnits(unitsRes.items || []);
        setProducts(activeProducts || []);
        setManufacturers(manufacturerList || []);

        if (id) {
          const receiptData = await goodsReceiptService.get(id);
          setReceipt(receiptData);
          reset({
            deliveryNoteNumber: receiptData.deliveryNoteNumber || "",
            expectedDeliveryDate: receiptData.expectedDeliveryDate || "",
            notes: receiptData.notes || "",
          });
          const allItems = receiptData.items.map((item, idx) => ({
            key: `existing-${idx}`,
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            unitId: item.unitId,
            unitName: item.unitName,
            quantity: item.quantity,
            availableUnits: [] as { value: string; label: string }[],
            isEquipment: item.isEquipment || false,
            manufacturer: item.manufacturer,
            manufacturerId: item.manufacturerId,
            model: item.model,
          }));
          setLineItems(allItems.filter((i) => !i.isEquipment));
          setEquipmentItems(allItems.filter((i) => i.isEquipment));
        } else {
          goodsReceiptService.getNextCode().then(setPreviewCode).catch(() => {});
          const preselectedIds = (location.state as { preselectedProductIds?: string[] } | null)?.preselectedProductIds;
          if (preselectedIds?.length) {
            const preItems: LineItem[] = preselectedIds.flatMap((pid) => {
              const product = activeProducts.find((p) => p.id === pid);
              if (!product) return [];
              const allUnits: { value: string; label: string }[] = [];
              const addUnit = (unitId?: string | null, unitName?: string | null) => {
                if (!unitId || allUnits.find((u) => u.value === unitId)) return;
                const unit = (unitsRes.items || []).find((u) => u.id === unitId);
                allUnits.push({ value: unitId, label: unit?.name || unitName || unitId });
              };
              for (const sku of product.skus || []) {
                addUnit(sku.packagingUnitId, sku.packagingUnitName);
                addUnit(sku.baseUnitId, sku.baseUnitName);
                addUnit(sku.volumeUnitId, sku.volumeUnitName);
              }
              const firstUnit = allUnits[0];
              return [{
                key: `pre-${pid}`,
                productId: product.id,
                productName: product.name,
                unitId: firstUnit?.value || "",
                unitName: firstUnit?.label || "",
                quantity: 1,
                availableUnits: allUnits,
                isEquipment: false,
              }];
            });
            setLineItems(preItems);
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

  const getUnitsForProduct = useCallback((productId: string, manufacturerId?: string): { value: string; label: string }[] => {
    const product = products.find((p) => p.id === productId);
    if (!product) return [];

    const result: { value: string; label: string }[] = [];
    const addUnit = (unitId?: string | null, unitName?: string | null, roleLabel?: string) => {
      if (!unitId || result.find((r) => r.value === unitId)) return;
      const unit = units.find((u) => u.id === unitId);
      const name = unit?.name || unitName || unitId;
      result.push({ value: unitId, label: roleLabel ? `${name} (${roleLabel})` : name });
    };

    if (manufacturerId && product.skus?.length) {
      const sku = product.skus.find((s) => s.manufacturerId === manufacturerId);
      if (sku) {
        addUnit(sku.baseUnitId, sku.baseUnitName, "mua hàng");
        addUnit(sku.packagingUnitId, sku.packagingUnitName, "lưu kho");
        addUnit(sku.volumeUnitId, sku.volumeUnitName, "tiêu hao");
        return result;
      }
    }

    for (const sku of product.skus || []) {
      addUnit(sku.baseUnitId, sku.baseUnitName, "mua hàng");
      addUnit(sku.packagingUnitId, sku.packagingUnitName, "lưu kho");
      addUnit(sku.volumeUnitId, sku.volumeUnitName, "tiêu hao");
    }

    return result;
  }, [products, units]);

  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (product.productType === ProductType.Equipment) {
      const newItem: LineItem = {
        key: `eq-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        unitId: "",
        unitName: "",
        quantity: 1,
        availableUnits: [],
        isEquipment: true,
        model: product.equipmentModel || "",
      };
      setEquipmentItems((prev) => [...prev, newItem]);
      return;
    }

    const availUnits = getUnitsForProduct(product.id);
    const firstUnit = availUnits[0];

    const newItem: LineItem = {
      key: `new-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      unitId: firstUnit?.value || "",
      unitName: firstUnit?.label || "",
      quantity: 1,
      availableUnits: availUnits,
      isEquipment: false,
    };

    setLineItems((prev) => [...prev, newItem]);
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
            updated.manufacturerId = undefined;
            updated.manufacturer = undefined;
            updated.availableUnits = getUnitsForProduct(product.id);
            const firstUnit = updated.availableUnits[0];
            updated.unitId = firstUnit?.value || "";
            updated.unitName = firstUnit?.label || "";
          }
        }

        if (field === "manufacturerId") {
          const newUnits = getUnitsForProduct(item.productId, value || undefined);
          updated.availableUnits = newUnits;
          const firstUnit = newUnits[0];
          updated.unitId = firstUnit?.value || "";
          updated.unitName = firstUnit?.label || "";
        }

        if (field === "unitId") {
          const unit = units.find((u) => u.id === value);
          if (unit) updated.unitName = unit.name;
        }

        return updated;
      })
    );
  };

  const handleRemoveEquipment = (key: string) => {
    setEquipmentItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleEquipmentChange = (key: string, field: keyof LineItem, value: any) => {
    setEquipmentItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };

        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.productName = product.name;
            updated.model = product.equipmentModel || "";
            updated.manufacturerId = undefined;
            updated.manufacturer = undefined;
            updated.unitId = "";
            updated.unitName = "";
            updated.availableUnits = [];
          }
        }

        if (field === "manufacturerId") {
          const m = manufacturers.find((x) => x.id === value);
          updated.manufacturer = m?.name;
          const newUnits = getUnitsForProduct(item.productId, value || undefined);
          updated.availableUnits = newUnits;
          const firstUnit = newUnits[0];
          updated.unitId = firstUnit?.value || "";
          updated.unitName = firstUnit?.label || "";
        }

        if (field === "unitId") {
          const unit = units.find((u) => u.id === value);
          if (unit) updated.unitName = unit.name;
        }

        return updated;
      })
    );
  };

  const filteredProductOptions = products
    .filter((p) => productTypeFilter === "all" || p.productType === Number(productTypeFilter))
    .map((p) => ({
      value: p.id,
      label: p.identificationCode
        ? `${p.identificationCode} - ${p.name} (Tồn: ${p.availableQuantity ?? 0})`
        : `${p.name} (Tồn: ${p.availableQuantity ?? 0})`,
    }));

  const buildPayload = (data: GoodsReceiptFormData): CreateUpdateGoodsReceiptDto => ({
    vatPercent: 0,
    deliveryNoteNumber: data.deliveryNoteNumber || undefined,
    expectedDeliveryDate: data.expectedDeliveryDate || undefined,
    notes: data.notes || undefined,
    items: [
      ...lineItems
        .filter((item) => item.productId)
        .map((item): CreateUpdateGoodsReceiptItemDto => ({
          id: item.id,
          productId: item.productId || undefined,
          unitId: item.unitId || undefined,
          quantity: item.quantity,
          unitPrice: 0,
          vatPercent: 0,
          isEquipment: false,
          manufacturer: item.manufacturer || undefined,
          manufacturerName: item.manufacturer || undefined,
          manufacturerId: item.manufacturerId || undefined,
        })),
      ...equipmentItems
        .filter((item) => item.productId)
        .map((item): CreateUpdateGoodsReceiptItemDto => ({
          id: item.id,
          productId: item.productId || undefined,
          unitId: item.unitId || undefined,
          quantity: item.quantity,
          unitPrice: 0,
          vatPercent: 0,
          isEquipment: true,
          model: item.model || undefined,
          manufacturer: item.manufacturer || undefined,
          manufacturerName: item.manufacturer || undefined,
          manufacturerId: item.manufacturerId || undefined,
        })),
    ],
  });

  const validateItems = (): boolean => {
    const validProducts = lineItems.filter((item) => item.productId);
    const validEquipment = equipmentItems.filter((item) => item.productId);
    if (validProducts.length === 0 && validEquipment.length === 0) {
      message.warning("Vui lòng thêm ít nhất một hàng hóa hoặc thiết bị.");
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
        const product = products.find((p) => p.id === record.productId);
        const skuMfIds = new Set((product?.skus || []).map((s) => s.manufacturerId).filter(Boolean));
        const mfOptions = manufacturers
          .filter((m) => skuMfIds.has(m.id))
          .map((m) => ({ value: m.id, label: m.name }));
        const selectedValue = record.manufacturerId && manufacturers.some((m) => m.id === record.manufacturerId)
          ? record.manufacturerId
          : undefined;
        return (
          <Select
            value={selectedValue}
            placeholder="Chọn hãng SX"
            options={mfOptions}
            showSearch
            optionFilterProp="label"
            onChange={(value) => {
              const m = manufacturers.find((x) => x.id === value);
              handleLineChange(record.key, "manufacturer", m?.name);
              handleLineChange(record.key, "manufacturerId", value);
            }}
            allowClear
            onClear={() => {
              handleLineChange(record.key, "manufacturer", undefined);
              handleLineChange(record.key, "manufacturerId", undefined);
            }}
            style={{ width: "100%" }}
            size="small"
          />
        );
      },
    },
    {
      title: "Cấu hình kỹ thuật",
      key: "concentration",
      width: 160,
      render: (_: any, record: LineItem) => {
        const product = products.find((p) => p.id === record.productId);
        if (product?.formattedConcentration) {
          return <div className="gr-concentration-cell" style={{ color: "#555", fontSize: 13 }} dangerouslySetInnerHTML={{ __html: product.formattedConcentration }} />;
        }
        return <span style={{ color: "#555" }}>{product?.concentration || "-"}</span>;
      },
    },
    {
      title: "CAS",
      key: "casNumber",
      width: 120,
      render: (_: any, record: LineItem) => {
        const product = products.find((p) => p.id === record.productId);
        return <span style={{ color: "#555" }}>{product?.casNumber || "-"}</span>;
      },
    },
    {
      title: "Đơn vị",
      key: "unitId",
      width: 110,
      render: (_: any, record: LineItem) => {
        const availUnits = record.availableUnits.length > 0
          ? record.availableUnits
          : getUnitsForProduct(record.productId, record.manufacturerId);
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
    ...actionColumn,
  ];

  const equipmentActionColumn = !isReadonly
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
              onClick={() => handleRemoveEquipment(record.key)}
            />
          ),
        },
      ]
    : [];

  const equipmentColumns = [
    {
      title: "STT",
      key: "index",
      width: 50,
      align: "center" as const,
      render: (_: any, __: LineItem, index: number) => index + 1,
    },
    {
      title: "Tên thiết bị",
      key: "productName",
      width: 220,
      ellipsis: true,
      render: (_: any, record: LineItem) => record.productName || "-",
    },
    {
      title: "Hãng sản xuất",
      key: "manufacturer",
      width: 180,
      render: (_: any, record: LineItem) => {
        if (isReadonly) return record.manufacturer || "-";
        const allMfOptions = manufacturers.map((m) => ({ value: m.id, label: m.name }));
        return (
          <Select
            value={record.manufacturerId || undefined}
            placeholder="Chọn hãng SX"
            options={allMfOptions}
            showSearch
            optionFilterProp="label"
            onChange={(v) => handleEquipmentChange(record.key, "manufacturerId", v)}
            allowClear
            onClear={() => {
              handleEquipmentChange(record.key, "manufacturerId", undefined);
            }}
            style={{ width: "100%" }}
            size="small"
          />
        );
      },
    },
    {
      title: "Model",
      key: "model",
      width: 140,
      render: (_: any, record: LineItem) => record.model || "-",
    },
    {
      title: "Đơn vị tính",
      key: "unitId",
      width: 130,
      render: (_: any, record: LineItem) => {
        if (isReadonly) return record.unitName || "-";
        const storageUnits = units
          .filter((u) => u.category === UnitCategory.StorageUnit && u.isActive)
          .map((u) => ({ value: u.id, label: u.name }));
        return (
          <Select
            value={record.unitId || undefined}
            placeholder="Đơn vị"
            options={storageUnits}
            showSearch
            optionFilterProp="label"
            onChange={(v) => handleEquipmentChange(record.key, "unitId", v)}
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
            min={1}
            precision={0}
            onChange={(v) => handleEquipmentChange(record.key, "quantity", v || 1)}
            style={{ width: "100%" }}
            size="small"
          />
        ),
    },
    ...equipmentActionColumn,
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
            <Col xs={24} sm={8}>
              <Form.Item label="Số phiếu mua hàng">
                <Input value={receipt?.code || previewCode || ""} placeholder="Tự động sinh khi lưu" disabled style={{ backgroundColor: "#f5f5f5" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
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
            <Col xs={24} sm={8}>
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
            scroll={{ x: 900 }}
            size="small"
            bordered
            locale={{ emptyText: "Chưa có hàng hóa" }}
          />
        </div>

        {equipmentItems.length > 0 && (
          <>
            <Divider style={{ margin: "8px 0 16px" }} />
            <div style={{ padding: "0 16px 16px" }}>
              <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>THÔNG TIN THIẾT BỊ</strong>
              </div>
              <Table
                columns={equipmentColumns}
                dataSource={equipmentItems}
                rowKey="key"
                pagination={false}
                scroll={{ x: 800 }}
                size="small"
                bordered
                locale={{ emptyText: "Chưa có thiết bị" }}
              />
            </div>
          </>
        )}
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
            <Button onClick={() => navigate("/goods-receipts")}>
              {isEdit ? "Quay lại" : "Hủy phiếu"}
            </Button>
          )}
          {!isReadonly && (
            <Button type="primary" onClick={handleSaveDraft} loading={saving}>
              {isEdit ? "Cập nhật" : "Lưu"}
            </Button>
          )}
        </Space>
      </Card>

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
