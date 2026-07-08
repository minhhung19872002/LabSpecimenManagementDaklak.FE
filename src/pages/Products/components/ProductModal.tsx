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
  Tag,
  Divider,
  Button,
  Space,
  Tooltip,
  AutoComplete,
  Popconfirm,
} from "antd";
import { InfoCircleOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { productSchema, ProductFormData } from "../schemas";
import {
  ProductDto,
  CreateUpdateProductDto,
  ProductType,
  CreateProductAttachmentDto,
  productService,
} from "../../../services/productService";
import { UnitDto, UnitCategory, unitService } from "../../../services/masterDataService";
import { ManufacturerDto, manufacturerService } from "../../../services/manufacturerService";
import { RichTextEditor } from "../../../components/common";
import AttachmentSection from "./AttachmentSection";
import { clearableSelectProps } from "../../../utils/formHelpers";
import "../Products.css";

const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.Chemical, label: "Hóa chất" },
  { value: ProductType.Biological, label: "Sinh phẩm" },
  { value: ProductType.Supply, label: "Vật tư tiêu hao" },
  { value: ProductType.Standard, label: "Chất chuẩn" },
  { value: ProductType.Solvent, label: "Dung môi" },
  { value: ProductType.Equipment, label: "Thiết bị phòng Lab" },
];

const isChemicalType = (type: number) => type === ProductType.Chemical;

interface ProductModalProps {
  open: boolean;
  loading: boolean;
  editingProduct: ProductDto | null;
  onOk: (data: CreateUpdateProductDto, removedAttachmentIds?: string[]) => void;
  onCancel: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  loading,
  editingProduct,
  onOk,
  onCancel,
}) => {
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerDto[]>([]);
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]);
  const [newAttachments, setNewAttachments] = useState<CreateProductAttachmentDto[]>([]);
  const [existingAttachments, setExistingAttachments] = useState(
    editingProduct?.attachments || [],
  );
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [categoryTagInput, setCategoryTagInput] = useState("");

  const loadUnits = (signal?: AbortSignal) => {
    const includeIds = editingProduct
      ? [
          editingProduct.baseUnitId,
          editingProduct.packagingUnitId,
          editingProduct.volumeUnitId,
          ...(editingProduct.skus || []).flatMap((s) => [
            s.baseUnitId,
            s.packagingUnitId,
            s.volumeUnitId,
          ]),
        ].filter(Boolean) as string[]
      : undefined;
    unitService
      .getActive(includeIds?.length ? includeIds : undefined)
      .then((items) => {
        if (signal?.aborted) return;
        setUnits(items);
      })
      .catch(() => {});
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
      chemicalFormula: "",
      minStockLevel: undefined,
      storageConditions: "",
      formattedStorageConditions: "",
      categories: "",
      isActive: true,
      skus: [],
    },
  });

  const { fields: skuFields, append: appendSku, remove: removeSku } = useFieldArray({
    control,
    name: "skus",
  });

  const watched = watch();
  const watchedType = watched.productType;
  const watchedCategories = watched.categories;
  const watchedSkus = watched.skus || [];

  const toOptions = (list: UnitDto[]) =>
    list.map((u) => ({
      value: u.id,
      label: u.isActive ? (
        u.name
      ) : (
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

  const manufacturerOptions = useMemo(
    () => manufacturers.map((m) => ({ value: m.id, label: m.name, title: m.name })),
    [manufacturers],
  );

  const watchedIdentificationCode = watched.identificationCode;
  const identificationCodeOptions = useMemo(() => {
    const search = (watchedIdentificationCode || "").trim().toLowerCase();
    if (!search) return [];
    return allProducts
      .filter((p) => p.identificationCode && p.identificationCode.toLowerCase().includes(search))
      .slice(0, 20)
      .map((p) => {
        const label = p.casNumber
          ? `${p.identificationCode} - ${p.name} - ${p.casNumber}`
          : `${p.identificationCode} - ${p.name}`;
        return { value: label, label, disabled: true };
      });
  }, [watchedIdentificationCode, allProducts]);

  useEffect(() => {
    if (open) {
      const controller = new AbortController();
      loadUnits(controller.signal);
      manufacturerService
        .getActive()
        .then((items) => {
          if (controller.signal.aborted) return;
          setManufacturers(items);
        })
        .catch(() => {});
      productService
        .getActive()
        .then((items) => {
          if (controller.signal.aborted) return;
          setAllProducts(items.filter((p) => p.id !== editingProduct?.id));
        })
        .catch(() => {});
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
          chemicalFormula: editingProduct.chemicalFormula || "",
          minStockLevel: editingProduct.minStockLevel ?? undefined,
          storageConditions: editingProduct.storageConditions || "",
          formattedStorageConditions:
            editingProduct.formattedStorageConditions || storageText,
          categories: editingProduct.categories || "",
          isActive: editingProduct.isActive,
          skus: (editingProduct.skus || []).map((s) => ({
            id: s.id,
            manufacturerId: s.manufacturerId,
            baseUnitId: s.baseUnitId || undefined,
            packagingQuantity: s.packagingQuantity ?? undefined,
            packagingUnitId: s.packagingUnitId || undefined,
            volumePerUnit: s.volumePerUnit ?? undefined,
            volumeUnitId: s.volumeUnitId || undefined,
          })),
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
          chemicalFormula: "",
          minStockLevel: undefined,
          storageConditions: "",
          formattedStorageConditions: "",
          categories: "",
          isActive: true,
          skus: [],
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

  const handleRemoveTag = (field: "categories", tag: string) => {
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
    volumePerUnit: isChemicalType(data.productType) ? data.volumePerUnit ?? null : null,
    volumeUnitId: isChemicalType(data.productType) ? data.volumeUnitId || null : null,
    packagingSpec: data.packagingSpec || undefined,
    casNumber: isChemicalType(data.productType) ? data.casNumber || undefined : undefined,
    manufacturer: data.manufacturer || undefined,
    origin: data.origin || undefined,
    concentration: isChemicalType(data.productType) ? data.concentration || undefined : undefined,
    chemicalFormula: isChemicalType(data.productType) ? data.chemicalFormula || undefined : undefined,
    minStockLevel: isChemicalType(data.productType) ? data.minStockLevel ?? null : null,
    storageConditions: data.storageConditions || undefined,
    formattedStorageConditions: data.formattedStorageConditions || undefined,
    categories: data.categories || undefined,
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
    skus: (data.skus || []).map((s) => ({
      id: s.id || undefined,
      manufacturerId: s.manufacturerId!,
      baseUnitId: s.baseUnitId || null,
      packagingQuantity: s.packagingQuantity ?? null,
      packagingUnitId: s.packagingUnitId || null,
      volumePerUnit: s.volumePerUnit ?? null,
      volumeUnitId: s.volumeUnitId || null,
    })),
  });

  const onSaveDraft = (data: ProductFormData) => {
    onOk(buildPayload(data, true), removedAttachmentIds);
  };

  const onSaveAndClose = (data: ProductFormData) => {
    onOk(buildPayload(data, false), removedAttachmentIds);
  };

  const categoryTags = parseTags(watchedCategories as string);
  const showChemicalFields = isChemicalType(watchedType);

  const getUsedManufacturerIds = (excludeIndex: number) =>
    watchedSkus
      .filter((_, i) => i !== excludeIndex)
      .map((s) => s?.manufacturerId)
      .filter(Boolean) as string[];

  const addEmptySku = () =>
    appendSku({
      manufacturerId: "",
      baseUnitId: undefined,
      packagingQuantity: undefined as any,
      packagingUnitId: undefined as any,
      volumePerUnit: undefined as any,
      volumeUnitId: undefined as any,
    });

  return (
    <Modal
      title={editingProduct ? "Sửa vật tư/hóa chất" : "Thêm mới vật tư/hóa chất"}
      open={open}
      onCancel={onCancel}
      width={960}
      centered
      destroyOnClose
      className="product-modal"
      styles={{ body: { maxHeight: "75vh", overflowY: "auto", overflowX: "hidden" } }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onCancel}>Hủy bỏ</Button>
          <Button onClick={handleSubmit(onSaveDraft)} loading={loading}>
            Lưu nháp
          </Button>
          <Button type="primary" onClick={handleSubmit(onSaveAndClose)} loading={loading}>
            Lưu &amp; Đóng
          </Button>
        </div>
      }
    >
      <Form layout="vertical">
        {/* Section 1 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#1677ff", color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>1</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Chọn nhóm ngành phân loại vật tư</span>
        </div>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item label="Phân loại vật tư">
              <Controller
                name="productType"
                control={control}
                render={({ field }) => (
                  <Select {...field} options={PRODUCT_TYPE_OPTIONS} style={{ width: "100%" }} />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Trạng thái">
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
            </Form.Item>
          </Col>
        </Row>

        {/* Section 2 */}
        <Divider style={{ margin: "4px 0 16px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#1677ff", color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>2</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{showChemicalFields ? "Thông tin hóa chất" : "Thông tin vật tư"}</span>
        </div>

        {/* Tên + Dung tích mỗi đơn vị */}
        <Row gutter={16}>
          <Col xs={24} sm={showChemicalFields ? 14 : 24}>
            <Form.Item
              label="Tên vật tư/hóa chất"
              validateStatus={errors.name ? "error" : ""}
              help={errors.name?.message}
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
          {showChemicalFields && (
            <Col xs={24} sm={10}>
              <Form.Item label="Dung tích mỗi đơn vị">
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
                        {...clearableSelectProps(field)}
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
          )}
        </Row>

        {/* Mã nhận dạng + Công thức hóa học */}
        <Row gutter={16}>
          <Col xs={24} sm={showChemicalFields ? 14 : 24}>
            <Form.Item
              label="Mã nhận dạng"
              required
              validateStatus={errors.identificationCode ? "error" : ""}
              help={errors.identificationCode?.message}
            >
              <Controller
                name="identificationCode"
                control={control}
                render={({ field }) => (
                  <AutoComplete
                    {...field}
                    value={field.value || ""}
                    options={identificationCodeOptions}
                    placeholder="Nhập mã nhận dạng"
                    filterOption={false}
                    notFoundContent={null}
                  />
                )}
              />
            </Form.Item>
          </Col>
          {showChemicalFields && (
            <Col xs={24} sm={10}>
              <Form.Item label="Công thức hóa học">
                <Controller
                  name="chemicalFormula"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="VD: C₂H₅OH" />
                  )}
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        {/* Chemical: CAS + Concentration + MinStockLevel */}
        {showChemicalFields && (
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label={
                  <Space size={4}>
                    Số CAS
                    <Tooltip title="Mã định danh quốc tế cho hóa chất">
                      <InfoCircleOutlined style={{ color: "#999" }} />
                    </Tooltip>
                  </Space>
                }
              >
                <Controller
                  name="casNumber"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="VD: 64-17-5" />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Nồng độ/Hàm lượng">
                <Controller
                  name="concentration"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="VD: ≥ 99.5%" />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Tồn kho tối thiểu">
                <Controller
                  name="minStockLevel"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} style={{ width: "100%" }} min={0} placeholder="VD: 10" />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Nhóm/phân loại (Tags) */}
        <Form.Item label="Nhóm/Phân loại (Tags)">
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
              <Tag key={tag} closable onClose={() => handleRemoveTag("categories", tag)} color="blue">
                {tag}
              </Tag>
            ))}
            <Input
              variant="borderless"
              size="small"
              value={categoryTagInput}
              onChange={(e) => setCategoryTagInput(e.target.value)}
              onPressEnter={() => handleAddTag("categories", categoryTagInput, setCategoryTagInput)}
              onBlur={() => handleAddTag("categories", categoryTagInput, setCategoryTagInput)}
              placeholder="Thêm phân loại..."
              style={{ flex: 1, minWidth: 100 }}
            />
          </div>
        </Form.Item>

        {/* Điều kiện bảo quản */}
        <Form.Item label="Điều kiện bảo quản">
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

        {/* Tài liệu đính kèm */}
        <Form.Item label="Tài liệu đính kèm (SDS/MSDS)">
          <AttachmentSection
            existingAttachments={existingAttachments}
            newAttachments={newAttachments}
            onAddAttachment={(att) => setNewAttachments((prev) => [...prev, att])}
            onRemoveExisting={(id) => {
              setExistingAttachments((prev) => prev.filter((a) => a.id !== id));
              setRemovedAttachmentIds((prev) => [...prev, id]);
            }}
            onRemoveNew={(fileId) =>
              setNewAttachments((prev) => prev.filter((a) => a.fileId !== fileId))
            }
          />
        </Form.Item>

        {/* Section 3 */}
        <Divider style={{ margin: "4px 0 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#1677ff", color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>3</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Cấu hình hãng sản xuất &amp; Đơn vị quy đổi (SKUs)</span>
          </div>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addEmptySku}>
            Thêm Hãng &amp; Quy Cách
          </Button>
        </div>

        {/* SKU list */}
        {skuFields.map((field, index) => {
          const usedIds = getUsedManufacturerIds(index);
          const filteredManufacturerOptions = manufacturerOptions.map((opt) => ({
            ...opt,
            disabled: usedIds.includes(opt.value),
          }));
          const sku = watchedSkus[index];
          const purchaseUnit = sku ? units.find((u) => u.id === sku.baseUnitId)?.name : undefined;
          const storageUnit = sku ? units.find((u) => u.id === sku.packagingUnitId)?.name : undefined;
          const consumableUnit = sku ? units.find((u) => u.id === sku.volumeUnitId)?.name : undefined;
          const qty = sku?.packagingQuantity;
          const vol = sku?.volumePerUnit;

          type Seg = { text: string; color: string };
          let previewSegments: Seg[] = [];
          if (purchaseUnit && qty && storageUnit && vol && consumableUnit) {
            const total = (qty * vol).toLocaleString();
            previewSegments = [
              { text: purchaseUnit, color: "#1677ff" },
              { text: " → ", color: "#8c8c8c" },
              { text: `${qty} ${storageUnit}`, color: "#d4380d" },
              { text: " → ", color: "#8c8c8c" },
              { text: `${total} ${consumableUnit}`, color: "#389e0d" },
            ];
          } else if (purchaseUnit && qty && storageUnit) {
            previewSegments = [
              { text: purchaseUnit, color: "#1677ff" },
              { text: " → ", color: "#8c8c8c" },
              { text: `${qty} ${storageUnit}`, color: "#d4380d" },
            ];
          } else if (qty && storageUnit && vol && consumableUnit) {
            const total = (qty * vol).toLocaleString();
            previewSegments = [
              { text: `${qty} ${storageUnit}`, color: "#d4380d" },
              { text: " → ", color: "#8c8c8c" },
              { text: `${total} ${consumableUnit}`, color: "#389e0d" },
            ];
          }

          return (
            <div
              key={field.id}
              style={{ marginBottom: 16, padding: "12px 16px", border: "1px solid #f0f0f0", borderRadius: 8, background: "#fafafa", position: "relative" }}
            >
              <Popconfirm
                title="Xóa quy cách này?"
                onConfirm={() => removeSku(index)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
                />
              </Popconfirm>
              <Row gutter={[12, 0]}>
                <Col xs={24} md={5}>
                  <Form.Item
                    label="Hãng sản xuất"
                    required
                    validateStatus={errors.skus?.[index]?.manufacturerId ? "error" : ""}
                    help={errors.skus?.[index]?.manufacturerId?.message}
                    style={{ marginBottom: 8 }}
                  >
                    <Controller
                      name={`skus.${index}.manufacturerId`}
                      control={control}
                      render={({ field: f }) => (
                        <Select
                          {...f}
                          placeholder="Chọn hãng"
                          showSearch
                          optionFilterProp="title"
                          options={filteredManufacturerOptions}
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={4}>
                  <Form.Item label="Đơn vị mua hàng" style={{ marginBottom: 8 }}>
                    <Controller
                      name={`skus.${index}.baseUnitId`}
                      control={control}
                      render={({ field: f }) => (
                        <Select
                          {...clearableSelectProps(f)}
                          placeholder="Chọn"
                          allowClear
                          showSearch
                          optionFilterProp="title"
                          options={purchaseUnitOptions}
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Quy cách đóng gói / Đơn vị lưu kho"
                    required
                    validateStatus={errors.skus?.[index]?.packagingQuantity || errors.skus?.[index]?.packagingUnitId ? "error" : ""}
                    help={errors.skus?.[index]?.packagingQuantity?.message || errors.skus?.[index]?.packagingUnitId?.message}
                    style={{ marginBottom: 8 }}
                  >
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <span style={{ flexShrink: 0, color: "#8c8c8c" }}>=</span>
                      <Controller
                        name={`skus.${index}.packagingQuantity`}
                        control={control}
                        render={({ field: f }) => (
                          <InputNumber
                            {...f}
                            style={{ width: 70, flexShrink: 0 }}
                            min={1}
                            precision={0}
                            placeholder="SL"
                            status={errors.skus?.[index]?.packagingQuantity ? "error" : undefined}
                          />
                        )}
                      />
                      <Controller
                        name={`skus.${index}.packagingUnitId`}
                        control={control}
                        render={({ field: f }) => (
                          <Select
                            {...clearableSelectProps(f)}
                            style={{ flex: 1, minWidth: 0 }}
                            placeholder="ĐV lưu kho"
                            allowClear
                            showSearch
                            optionFilterProp="title"
                            options={storageUnitOptions}
                            status={errors.skus?.[index]?.packagingUnitId ? "error" : undefined}
                          />
                        )}
                      />
                    </div>
                  </Form.Item>
                </Col>
                <Col xs={24} md={7}>
                  <Form.Item
                    label="Dung tích mỗi đơn vị"
                    required
                    validateStatus={errors.skus?.[index]?.volumePerUnit || errors.skus?.[index]?.volumeUnitId ? "error" : ""}
                    help={errors.skus?.[index]?.volumePerUnit?.message || errors.skus?.[index]?.volumeUnitId?.message}
                    style={{ marginBottom: 8 }}
                  >
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <span style={{ flexShrink: 0, color: "#8c8c8c" }}>=</span>
                      <Controller
                        name={`skus.${index}.volumePerUnit`}
                        control={control}
                        render={({ field: f }) => (
                          <InputNumber
                            {...f}
                            style={{ width: 60, flexShrink: 0 }}
                            min={1}
                            precision={0}
                            placeholder="SL"
                            status={errors.skus?.[index]?.volumePerUnit ? "error" : undefined}
                          />
                        )}
                      />
                      <Controller
                        name={`skus.${index}.volumeUnitId`}
                        control={control}
                        render={({ field: f }) => (
                          <Select
                            {...clearableSelectProps(f)}
                            style={{ flex: 1, minWidth: 0 }}
                            placeholder="ĐV tiêu hao"
                            allowClear
                            showSearch
                            optionFilterProp="title"
                            options={consumableUnitOptions}
                            status={errors.skus?.[index]?.volumeUnitId ? "error" : undefined}
                          />
                        )}
                      />
                    </div>
                  </Form.Item>
                </Col>
              </Row>
              {previewSegments.length > 0 && (
                <>
                  <div style={{ borderTop: "1px dashed #e8e8e8", margin: "8px 0" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <span style={{ color: "#8c8c8c", flexShrink: 0 }}>Sơ đồ quy đổi trực quan:</span>
                    <span style={{ padding: "4px 14px", border: "1px solid #d9d9d9", borderRadius: 4, fontWeight: 600 }}>
                      {previewSegments.map((s, i) => (
                        <span key={i} style={{ color: s.color }}>{s.text}</span>
                      ))}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {skuFields.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#8c8c8c", border: "1px dashed #d9d9d9", borderRadius: 8 }}>
            Chưa có quy cách đóng gói nào. Bấm <b>+ Thêm Hãng &amp; Quy Cách</b> để thêm.
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default ProductModal;
