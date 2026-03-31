import React, { useEffect, useState } from "react";
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
  CreateUpdateProductUnitConversionDto,
} from "../../../services/productService";
import { UnitDto, unitService } from "../../../services/masterDataService";
import { PRODUCT_TYPE_OPTIONS } from "../constants";
import AttachmentSection from "./AttachmentSection";
import UnitConversionSection from "./UnitConversionSection";
import "../Products.css";

const { Text, Title } = Typography;

interface ProductModalProps {
  open: boolean;
  loading: boolean;
  editingProduct: ProductDto | null;
  onOk: (data: CreateUpdateProductDto) => void;
  onCancel: () => void;
}

const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  [ProductType.Chemical]: "#1677ff",
  [ProductType.Biological]: "#52c41a",
  [ProductType.Supply]: "#fa8c16",
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
  const [conversions, setConversions] = useState<
    CreateUpdateProductUnitConversionDto[]
  >([]);
  const [storageTagInput, setStorageTagInput] = useState("");
  const [categoryTagInput, setCategoryTagInput] = useState("");

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
      productType: ProductType.Chemical,
      baseUnitId: "",
      packagingSpec: "",
      casNumber: "",
      manufacturer: "",
      origin: "",
      concentration: "",
      storageConditions: "",
      categories: "",
      minStockLevel: undefined,
      maxStockLevel: undefined,
      isActive: true,
    },
  });

  const watchedName = watch("name");
  const watchedType = watch("productType");
  const watchedBaseUnitId = watch("baseUnitId");
  const watchedPackaging = watch("packagingSpec");
  const watchedStorage = watch("storageConditions");
  const watchedCategories = watch("categories");

  useEffect(() => {
    if (open) {
      unitService.getActive().then((items) => {
        const unitList = Array.isArray(items)
          ? items
          : (items as any)?.items || [];
        setUnits(unitList);
      });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        reset({
          name: editingProduct.name,
          productType: editingProduct.productType,
          baseUnitId: editingProduct.baseUnitId,
          packagingSpec: editingProduct.packagingSpec || "",
          casNumber: editingProduct.casNumber || "",
          manufacturer: editingProduct.manufacturer || "",
          origin: editingProduct.origin || "",
          concentration: editingProduct.concentration || "",
          storageConditions: editingProduct.storageConditions || "",
          categories: editingProduct.categories || "",
          minStockLevel: editingProduct.minStockLevel ?? undefined,
          maxStockLevel: editingProduct.maxStockLevel ?? undefined,
          isActive: editingProduct.isActive,
        });
        setExistingAttachments(editingProduct.attachments || []);
        setConversions(
          (editingProduct.unitConversions || []).map((c) => ({
            id: c.id,
            quantity: c.quantity,
            baseUnitId: c.baseUnitId,
            convertedQuantity: c.convertedQuantity,
            convertedUnitId: c.convertedUnitId,
          })),
        );
      } else {
        reset({
          name: "",
          productType: ProductType.Chemical,
          baseUnitId: "",
          packagingSpec: "",
          casNumber: "",
          manufacturer: "",
          origin: "",
          concentration: "",
          storageConditions: "",
          categories: "",
          minStockLevel: undefined,
          maxStockLevel: undefined,
          isActive: true,
        });
        setExistingAttachments([]);
        setConversions([]);
      }
      setNewAttachments([]);
      setRemovedAttachmentIds([]);
      setStorageTagInput("");
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
    field: "storageConditions" | "categories",
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
    field: "storageConditions" | "categories",
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
    name: data.name,
    productType: data.productType as ProductType,
    baseUnitId: data.baseUnitId!,
    packagingSpec: data.packagingSpec || undefined,
    casNumber: data.casNumber || undefined,
    manufacturer: data.manufacturer || undefined,
    origin: data.origin || undefined,
    concentration: data.concentration || undefined,
    storageConditions: data.storageConditions || undefined,
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
    unitConversions: conversions.filter(
      (c) => c.baseUnitId && c.convertedUnitId,
    ),
  });

  const onSaveDraft = (data: ProductFormData) => {
    onOk(buildPayload(data, true));
  };

  const onSaveAndClose = (data: ProductFormData) => {
    onOk(buildPayload(data, false));
  };

  const selectedUnitName = units.find((u) => u.id === watchedBaseUnitId)?.name;
  const storageTags = parseTags(watchedStorage as string);
  const categoryTags = parseTags(watchedCategories as string);

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
              <Col xs={24} md={14}>
                <Form.Item
                  label={
                    <Text strong>
                      Tên vật tư/hóa chất <Text type="danger">*</Text>
                    </Text>
                  }
                  validateStatus={errors.name ? "error" : ""}
                  help={errors.name?.message}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Nhập tên vật tư/hóa chất"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={10}>
                <Form.Item
                  label={
                    <Text strong>
                      Loại sản phẩm <Text type="danger">*</Text>
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

            {/* Row 2: Đơn vị + Quy cách + CAS */}
            <Row gutter={16} className="product-form-row">
              <Col xs={12} md={8}>
                <Form.Item
                  label={
                    <Text strong>
                      Đơn vị tính cơ bản <Text type="danger">*</Text>
                    </Text>
                  }
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
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label as string)
                            ?.toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={units.map((u) => ({
                          value: u.id,
                          label: u.name,
                        }))}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={8}>
                <Form.Item
                  label={<Text strong>Quy cách đóng gói (Size)</Text>}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="packagingSpec"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="VD: 500ml"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={8}>
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
            </Row>

            {/* Row 3: Nhà SX + Xuất xứ */}
            <Row gutter={16} className="product-form-row">
              <Col xs={12} md={12}>
                <Form.Item
                  label={<Text strong>Nhà sản xuất/Thương hiệu</Text>}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="manufacturer"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Nhập nhà SX"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={12}>
                <Form.Item
                  label={<Text strong>Xuất xứ</Text>}
                  style={{ marginBottom: 16 }}
                >
                  <Controller
                    name="origin"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Nhập xuất xứ"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Row 4: Nhóm/phân loại + Nồng độ */}
            <Row gutter={16} className="product-form-row">
              <Col xs={24} md={12}>
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
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<Text strong>Nồng độ/ Hàm lượng</Text>}
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

            {/* Row 5: Điều kiện bảo quản */}
            <Form.Item
              label={<Text strong>Điều kiện bảo quản</Text>}
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
                {storageTags.map((tag) => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleRemoveTag("storageConditions", tag)}
                    color="orange"
                  >
                    {tag}
                  </Tag>
                ))}
                <Input
                  variant="borderless"
                  size="small"
                  value={storageTagInput}
                  onChange={(e) => setStorageTagInput(e.target.value)}
                  onPressEnter={() =>
                    handleAddTag(
                      "storageConditions",
                      storageTagInput,
                      setStorageTagInput,
                    )
                  }
                  placeholder="Thêm phân loại..."
                  style={{ flex: 1, minWidth: 100 }}
                />
              </div>
            </Form.Item>

            {/* Row 6: Tồn kho */}
            <Row gutter={16} className="product-form-row">
              <Col xs={12} md={12}>
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
              <Col xs={12} md={12}>
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

            {/* Đơn vị quy đổi */}
            <div style={{ marginTop: 20 }}>
              <UnitConversionSection
                conversions={conversions}
                units={units}
                onChange={setConversions}
              />
            </div>
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
            {(watchedPackaging ||
              selectedUnitName ||
              storageTags.length > 0) && (
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px 12px",
                }}
              >
                {watchedPackaging && selectedUnitName && (
                  <div>
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, display: "block" }}
                    >
                      Đóng gói
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>
                      {watchedPackaging}/{selectedUnitName}
                    </Text>
                  </div>
                )}
                {storageTags.length > 0 && (
                  <div>
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, display: "block" }}
                    >
                      Bảo quản
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>
                      {storageTags.join(", ")}
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
