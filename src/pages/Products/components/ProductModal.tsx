import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Row,
  Col,
  Card,
  Tag,
  Divider,
  Typography,
  Button,
  Space,
  Tooltip,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { productSchema, ProductFormData } from "../schemas";
import {
  ProductDto,
  CreateUpdateProductDto,
  ProductType,
  ProductTypeLabels,
  CreateProductAttachmentDto,
} from "../../../services/productService";
import { UnitDto, UnitCategory, unitService } from "../../../services/masterDataService";
import { PRODUCT_TYPE_OPTIONS } from "../constants";
import { RichTextEditor } from "../../../components/common";
import AttachmentSection from "./AttachmentSection";
import "../Products.css";

const { Text, Title } = Typography;

interface ProductModalProps {
  open: boolean;
  loading: boolean;
  editingProduct: ProductDto | null;
  onOk: (data: CreateUpdateProductDto, removedAttachmentIds?: string[]) => void;
  onCancel: () => void;
}

const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  [ProductType.Chemical]: "#1677ff",
  [ProductType.Biological]: "#52c41a",
  [ProductType.Supply]: "#fa8c16",
  [ProductType.Standard]: "#722ed1",
  [ProductType.Solvent]: "#13c2c2",
};

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  loading,
  editingProduct,
  onOk,
  onCancel,
}) => {
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [newAttachments, setNewAttachments] = useState<
    CreateProductAttachmentDto[]
  >([]);
  const [existingAttachments, setExistingAttachments] = useState(
    editingProduct?.attachments || [],
  );
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>(
    [],
  );
  const [categoryTagInput, setCategoryTagInput] = useState("");

  const loadUnits = (signal?: AbortSignal) => {
    const includeIds = editingProduct
      ? [editingProduct.baseUnitId, editingProduct.packagingUnitId, editingProduct.volumeUnitId].filter(Boolean) as string[]
      : undefined;
    unitService.getActive(includeIds?.length ? includeIds : undefined).then((items) => {
      if (signal?.aborted) return;
      const unitList = Array.isArray(items) ? items : (items as any)?.items || [];
      setUnits(unitList);
    }).catch(() => {});
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: yupResolver(productSchema) as any,
    defaultValues: {
      name: "",
      formattedName: "",
      identificationCode: "",
      productType: ProductType.Chemical,
      baseUnitId: "",
      packagingQuantity: undefined,
      packagingUnitId: "",
      volumePerUnit: undefined,
      volumeUnitId: "",
      packagingSpec: "",
      casNumber: "",
      manufacturer: "",
      origin: "",
      concentration: "",
      storageConditions: "",
      formattedStorageConditions: "",
      categories: "",
      minStockLevel: undefined,
      maxStockLevel: undefined,
      isActive: true,
    },
  });

  const watched = watch();
  const watchedName = watched.name;
  const watchedType = watched.productType;
  const watchedBaseUnitId = watched.baseUnitId;
  const watchedPackagingQuantity = watched.packagingQuantity;
  const watchedPackagingUnitId = watched.packagingUnitId;
  const watchedVolumePerUnit = watched.volumePerUnit;
  const watchedVolumeUnitId = watched.volumeUnitId;
  const watchedStorage = watched.storageConditions;
  const watchedCategories = watched.categories;
  const watchedIdentificationCode = watched.identificationCode;

  const toOptions = (list: UnitDto[]) =>
    list.map((u) => ({
      value: u.id,
      label: u.isActive ? u.name : (
        <span style={{ color: "#ff4d4f", textDecoration: "line-through" }}>{u.name}</span>
      ),
      title: u.name,
    }));

  const purchaseUnitOptions = useMemo(
    () => toOptions(units.filter((u) => u.category === UnitCategory.PurchaseUnit)),
    [units],
  );
  const storageUnitOptions = useMemo(
    () => toOptions(units.filter((u) => u.category === UnitCategory.StorageUnit)),
    [units],
  );
  const consumableUnitOptions = useMemo(
    () => toOptions(units.filter((u) => u.category === UnitCategory.ConsumableUnit)),
    [units],
  );

  useEffect(() => {
    if (open) {
      const controller = new AbortController();
      loadUnits(controller.signal);
      return () => controller.abort();
    }
  }, [open]);

  const migrateOldStorageConditions = (jsonStr?: string): string => {
    if (!jsonStr) return "";
    try {
      const tags: string[] = JSON.parse(jsonStr);
      if (Array.isArray(tags)) return tags.join(", ");
    } catch {}
    return jsonStr;
  };

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        const storageText = editingProduct.formattedStorageConditions
          ? ""
          : migrateOldStorageConditions(editingProduct.storageConditions);
        reset({
          name: editingProduct.name,
          formattedName: editingProduct.formattedName || "",
          identificationCode: editingProduct.identificationCode || "",
          productType: editingProduct.productType,
          baseUnitId: editingProduct.baseUnitId,
          packagingQuantity: editingProduct.packagingQuantity ?? undefined,
          packagingUnitId: editingProduct.packagingUnitId || "",
          volumePerUnit: editingProduct.volumePerUnit ?? undefined,
          volumeUnitId: editingProduct.volumeUnitId || "",
          packagingSpec: editingProduct.packagingSpec || "",
          casNumber: editingProduct.casNumber || "",
          manufacturer: editingProduct.manufacturer || "",
          origin: editingProduct.origin || "",
          concentration: editingProduct.concentration || "",
          storageConditions: editingProduct.storageConditions || "",
          formattedStorageConditions: editingProduct.formattedStorageConditions || storageText,
          categories: editingProduct.categories || "",
          minStockLevel: editingProduct.minStockLevel ?? undefined,
          maxStockLevel: editingProduct.maxStockLevel ?? undefined,
          isActive: editingProduct.isActive,
        });
        setExistingAttachments(editingProduct.attachments || []);
      } else {
        reset({
          name: "",
          formattedName: "",
          identificationCode: "",
          productType: ProductType.Chemical,
          baseUnitId: "",
          packagingQuantity: undefined,
          packagingUnitId: "",
          volumePerUnit: undefined,
          volumeUnitId: "",
          packagingSpec: "",
          casNumber: "",
          manufacturer: "",
          origin: "",
          concentration: "",
          storageConditions: "",
          formattedStorageConditions: "",
          categories: "",
          minStockLevel: undefined,
          maxStockLevel: undefined,
          isActive: true,
        });
        setExistingAttachments([]);
      }
      setNewAttachments([]);
      setRemovedAttachmentIds([]);
      setCategoryTagInput("");
    }
  }, [open, editingProduct, reset]);

  const parseTags = (jsonStr?: string): string[] => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const handleAddTag = (
    field: "categories",
    value: string,
    setInput: (v: string) => void,
  ) => {
    if (!value.trim()) return;
    const current = parseTags(watch(field) as string);
    if (!current.includes(value.trim())) {
      const updated = [...current, value.trim()];
      setValue(field, JSON.stringify(updated));
    }
    setInput("");
  };

  const handleRemoveTag = (
    field: "categories",
    tag: string,
  ) => {
    const current = parseTags(watch(field) as string);
    const updated = current.filter((t) => t !== tag);
    setValue(field, updated.length > 0 ? JSON.stringify(updated) : "");
  };

  const buildPayload = (
    data: ProductFormData,
    isDraft: boolean,
  ): CreateUpdateProductDto => ({
    name: data.name || undefined,
    formattedName: data.formattedName || undefined,
    identificationCode: data.identificationCode || undefined,
    productType: data.productType as ProductType,
    baseUnitId: data.baseUnitId || null,
    packagingQuantity: data.packagingQuantity ?? null,
    packagingUnitId: data.packagingUnitId || null,
    volumePerUnit: data.volumePerUnit ?? null,
    volumeUnitId: data.volumeUnitId || null,
    packagingSpec: data.packagingSpec || undefined,
    casNumber: data.casNumber || undefined,
    manufacturer: data.manufacturer || undefined,
    origin: data.origin || undefined,
    concentration: data.concentration || undefined,
    storageConditions: data.storageConditions || undefined,
    formattedStorageConditions: data.formattedStorageConditions || undefined,
    categories: data.categories || undefined,
    minStockLevel: data.minStockLevel ?? undefined,
    maxStockLevel: data.maxStockLevel ?? undefined,
    isActive: data.isActive ?? true,
    isDraft,
    attachments: [
      ...existingAttachments.map((a) => ({
        fileId: a.fileId,
        fileName: a.fileName,
        fileSize: a.fileSize,
        fileType: a.fileType,
      })),
      ...newAttachments,
    ],
    unitConversions: [],
  });

  const onSaveDraft = (data: ProductFormData) => {
    onOk(buildPayload(data, true), removedAttachmentIds);
  };

  const onSaveAndClose = (data: ProductFormData) => {
    onOk(buildPayload(data, false), removedAttachmentIds);
  };

  const selectedPurchaseUnit = units.find((u) => u.id === watchedBaseUnitId)?.name;
  const selectedPackagingUnit = units.find((u) => u.id === watchedPackagingUnitId)?.name;
  const selectedVolumeUnit = units.find((u) => u.id === watchedVolumeUnitId)?.name;
  const categoryTags = parseTags(watchedCategories as string);

  const packagingLine1 =
    selectedPurchaseUnit && watchedPackagingQuantity && selectedPackagingUnit
      ? `1 ${selectedPurchaseUnit} / ${watchedPackagingQuantity} ${selectedPackagingUnit}`
      : "";
  const packagingLine2 =
    selectedPackagingUnit && watchedVolumePerUnit && selectedVolumeUnit
      ? `1 ${selectedPackagingUnit} / ${watchedVolumePerUnit} ${selectedVolumeUnit}`
      : "";

  const typeColor =
    PRODUCT_TYPE_COLORS[watchedType as ProductType] || "#1677ff";

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      width="90vw"
      style={{ maxWidth: 960 }}
      centered
      destroyOnClose
      className="product-modal"
      styles={{
        body: { maxHeight: "78vh", overflowY: "auto", padding: "0 0px 0px" },
        header: {
          padding: "20px 24px 0",
          marginBottom: 0,
          borderBottom: "none",
        },
      }}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 0",
          }}
        >
          <Button onClick={onCancel}>Hủy bỏ</Button>
          <Button onClick={handleSubmit(onSaveDraft)} loading={loading}>
            Lưu nháp
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit(onSaveAndClose)}
            loading={loading}
          >
            Lưu &amp; Đóng
          </Button>
        </div>
      }
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>
          {editingProduct ? "Sửa vật tư/hóa chất" : "Tạo mới vật tư/hóa chất"}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Điền thông tin chi tiết để thêm mục mới
        </Text>
      </div>

      <div
        className="product-modal-layout"
        style={{ display: "flex", gap: 24 }}
      >
        {/* Left: Form */}
        <div className="product-modal-form" style={{ flex: 1, minWidth: 0 }}>
          <Form layout="vertical" size="middle">
            {/* Row 1: Tên + Loại */}
            <Row gutter={16} className="product-form-row">
              <Col xs={24} sm={14} md={14}>
                <Form.Item
                  label={
                    <Text strong>
                      Tên vật tư/hóa chất
                    </Text>
                  }
                  validateStatus={errors.name ? "error" : ""}
                  help={errors.name?.message}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="formattedName"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={(html, plainText) => {
                          field.onChange(html);
                          setValue("name", plainText);
                        }}
                        placeholder="Nhập tên vật tư/hóa chất"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10} md={10}>
                <Form.Item
                  label={
                    <Text strong>
                      Loại sản phẩm
                    </Text>
                  }
                  validateStatus={errors.productType ? "error" : ""}
                  help={errors.productType?.message}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="productType"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={PRODUCT_TYPE_OPTIONS} />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Row 1b: Mã nhận dạng */}
            <Row gutter={16} className="product-form-row">
              <Col xs={24} md={24}>
                <Form.Item
                  label={
                    <Text strong>
                      Mã nhận dạng
                    </Text>
                  }
                  validateStatus={errors.identificationCode ? "error" : ""}
                  help={errors.identificationCode?.message}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="identificationCode"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Nhập mã nhận dạng"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Row 2: Đơn vị mua hàng + Quy cách đóng gói + Dung tích mỗi đơn vị */}
            <Row gutter={16} className="product-form-row">
              <Col xs={24} sm={8} md={8}>
                <Form.Item
                  label={<Text strong>Đơn vị mua hàng</Text>}
                  validateStatus={errors.baseUnitId ? "error" : ""}
                  help={errors.baseUnitId?.message}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="baseUnitId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Chọn đơn vị"
                        allowClear
                        showSearch
                        optionFilterProp="title"
                        options={purchaseUnitOptions}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Form.Item
                  label={<Text strong>Quy cách đóng gói</Text>}
                  required
                  validateStatus={errors.packagingQuantity || errors.packagingUnitId ? "error" : ""}
                  help={errors.packagingQuantity?.message || errors.packagingUnitId?.message}
                  style={{ marginBottom: 16 }}
                >
                  <div style={{ display: "flex", gap: 4 }}>
                    <Controller
                      name="packagingQuantity"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          style={{ width: 80, flexShrink: 0 }}
                          min={1}
                          precision={0}
                          placeholder="Số lượng"
                        />
                      )}
                    />
                    <Controller
                      name="packagingUnitId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          style={{ flex: 1, minWidth: 0 }}
                          placeholder="Đơn vị"
                          allowClear
                          showSearch
                          optionFilterProp="title"
                          options={storageUnitOptions}
                        />
                      )}
                    />
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Form.Item
                  label={<Text strong>Dung tích mỗi đơn vị</Text>}
                  required
                  validateStatus={errors.volumePerUnit || errors.volumeUnitId ? "error" : ""}
                  help={errors.volumePerUnit?.message || errors.volumeUnitId?.message}
                  style={{ marginBottom: 16 }}
                >
                  <div style={{ display: "flex", gap: 4 }}>
                    <Controller
                      name="volumePerUnit"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          style={{ width: 80, flexShrink: 0 }}
                          min={1}
                          precision={0}
                          placeholder="Số lượng"
                        />
                      )}
                    />
                    <Controller
                      name="volumeUnitId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          style={{ flex: 1, minWidth: 0 }}
                          placeholder="Đơn vị"
                          allowClear
                          showSearch
                          optionFilterProp="title"
                          options={consumableUnitOptions}
                        />
                      )}
                    />
                  </div>
                </Form.Item>
              </Col>
            </Row>

            {/* Row 3: Số CAS + Nhóm/phân loại + Nồng độ */}
            <Row gutter={16} className="product-form-row">
              <Col xs={24} sm={8} md={8}>
                <Form.Item
                  label={
                    <Space size={4}>
                      <Text strong>Số CAS</Text>
                      <Tooltip title="Mã định danh quốc tế cho hóa chất">
                        <InfoCircleOutlined style={{ color: "#999" }} />
                      </Tooltip>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="casNumber"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="VD: 64-17-5"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Form.Item
                  label={<Text strong>Nồng độ/Hàm lượng</Text>}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="concentration"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="VD: ≥ 99.5%"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Nhóm/phân loại */}
            <Form.Item
              label={<Text strong>Nhóm/Phân loại (Tags)</Text>}
              style={{ marginBottom: 16 }}
            >
              <div
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 6,
                  padding: "4px 8px",
                  minHeight: 36,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {categoryTags.map((tag) => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleRemoveTag("categories", tag)}
                    color="blue"
                  >
                    {tag}
                  </Tag>
                ))}
                <Input
                  variant="borderless"
                  size="small"
                  value={categoryTagInput}
                  onChange={(e) => setCategoryTagInput(e.target.value)}
                  onPressEnter={() =>
                    handleAddTag(
                      "categories",
                      categoryTagInput,
                      setCategoryTagInput,
                    )
                  }
                  placeholder="Thêm phân loại..."
                  style={{ flex: 1, minWidth: 100 }}
                />
              </div>
            </Form.Item>

            {/* Row 5: Điều kiện bảo quản */}
            <Form.Item
              label={<Text strong>Điều kiện bảo quản</Text>}
              style={{ marginBottom: 16 }}
            >
              <Controller
                name="formattedStorageConditions"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={(html, plainText) => {
                      field.onChange(html);
                      setValue("storageConditions", plainText);
                    }}
                    placeholder="Nhập điều kiện bảo quản"
                  />
                )}
              />
            </Form.Item>

            {/* Row 6: Tồn kho */}
            <Row gutter={16} className="product-form-row">
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  label={<Text strong>Tồn kho tối thiểu</Text>}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="minStockLevel"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        min={0}
                        placeholder="0"
                        controls={false}
                        style={{ width: "100%" }}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  label={<Text strong>Tồn kho tối đa</Text>}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="maxStockLevel"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        min={0}
                        placeholder="0"
                        controls={false}
                        style={{ width: "100%" }}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Tài liệu đính kèm */}
            <Text strong style={{ display: "block", marginBottom: 12 }}>
              Tài liệu đính kèm (SDS/MSDS)
            </Text>
            <AttachmentSection
              existingAttachments={existingAttachments}
              newAttachments={newAttachments}
              onAddAttachment={(att) =>
                setNewAttachments((prev) => [...prev, att])
              }
              onRemoveExisting={(id) => {
                setExistingAttachments((prev) =>
                  prev.filter((a) => a.id !== id),
                );
                setRemovedAttachmentIds((prev) => [...prev, id]);
              }}
              onRemoveNew={(fileId) =>
                setNewAttachments((prev) =>
                  prev.filter((a) => a.fileId !== fileId),
                )
              }
            />

          </Form>
        </div>

        {/* Right: Summary card */}
        <div
          className="product-modal-summary"
          style={{ width: 260, flexShrink: 0 }}
        >
          <Card
            size="small"
            style={{
              position: "sticky",
              top: 0,
              borderRadius: 8,
              border: "1px solid #f0f0f0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
            styles={{
              header: {
                borderBottom: "1px solid #f0f0f0",
                padding: "10px 16px",
              },
              body: { padding: 16 },
            }}
            title={
              <Text
                strong
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "#666",
                }}
              >
                Tóm tắt thiết lập
              </Text>
            }
          >
            {/* Type badge */}
            {watchedType !== undefined && (
              <Tag
                style={{
                  borderRadius: 12,
                  padding: "2px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  border: `1px solid ${typeColor}`,
                  color: typeColor,
                  background: `${typeColor}10`,
                }}
              >
                {ProductTypeLabels[watchedType as ProductType]}
              </Tag>
            )}

            {/* Product name */}
            <p
              style={{
                fontWeight: 600,
                fontSize: 15,
                margin: "10px 0 2px",
                lineHeight: 1.3,
              }}
            >
              {watchedName || (
                <Text type="secondary" italic>
                  Chưa nhập tên
                </Text>
              )}
            </p>

            {/* Code preview */}
            {editingProduct?.code && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {editingProduct.code}
              </Text>
            )}

            {/* Info grid */}
            {(packagingLine1 || packagingLine2 ||
              watchedIdentificationCode ||
              watchedStorage) && (
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "8px",
                }}
              >
                {watchedIdentificationCode && (
                  <div>
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, display: "block" }}
                    >
                      Mã nhận dạng
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>
                      {watchedIdentificationCode}
                    </Text>
                  </div>
                )}
                {(packagingLine1 || packagingLine2) && (
                  <div>
                    {packagingLine1 && (
                      <>
                        <Text
                          type="secondary"
                          style={{ fontSize: 11, display: "block" }}
                        >
                          Quy cách đóng gói
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: 500, display: "block" }}>
                          {packagingLine1}
                        </Text>
                      </>
                    )}
                    {packagingLine2 && (
                      <Text style={{ fontSize: 13, fontWeight: 500, display: "block" }}>
                        {packagingLine2}
                      </Text>
                    )}
                  </div>
                )}
                {watchedStorage && (
                  <div>
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, display: "block" }}
                    >
                      Bảo quản
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>
                      {watchedStorage}
                    </Text>
                  </div>
                )}
              </div>
            )}

            <Divider style={{ margin: "16px 0 12px" }} />

            {/* Status toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text strong style={{ fontSize: 13 }}>
                Trạng thái
              </Text>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    checkedChildren="Hoạt động"
                    unCheckedChildren="Ngừng"
                  />
                )}
              />
            </div>
          </Card>
        </div>
      </div>

    </Modal>
  );
};

export default ProductModal;
