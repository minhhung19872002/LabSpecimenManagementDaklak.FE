import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import dayjs, { Dayjs } from "dayjs";
import DatePicker from "antd/es/date-picker";
import { RichTextEditor } from "../../../components/common";
import { clearableSelectProps } from "../../../utils/formHelpers";
import {
  CreateUpdatePreparedSolutionBatchDto,
  PreparedSolutionBatchDto,
  PreparedSolutionWarehouseProductDto,
  preparedSolutionService,
} from "../../../services/preparedSolutionService";
import { productService, ProductType, ProductTypeLabels } from "../../../services/productService";
import type { ProductDto } from "../../../services/productService";
import { warehouseService, WarehouseDto } from "../../../services/masterDataService";
import { formatVolume } from "./utils";
import "./PreparedSolutionCreateModal.css";

export interface PreparedSolutionCreateModalProps {
  open: boolean;
  editingItem?: PreparedSolutionBatchDto;
  onClose: () => void;
  onSaved: () => void;
}

interface FormIngredient {
  productType?: number;
  productId?: string;
  quantityUsed?: number;
  _savedProductId?: string;
}

interface FormValues {
  solutionProductId?: string;
  lotCode: string;
  preparationDate?: Dayjs;
  expiryDate?: Dayjs;
  totalVolume?: number;
  storageWarehouseId?: string;
  sourceWarehouseId?: string;
  storageConditions?: string;
  preparationMethod?: string;
  ingredients: FormIngredient[];
}

type IngredientRow = { key: string; index: number };

const INGREDIENT_TYPE_OPTIONS = [
  { value: ProductType.Chemical, label: ProductTypeLabels[ProductType.Chemical] },
  { value: ProductType.Biological, label: ProductTypeLabels[ProductType.Biological] },
  { value: ProductType.Supply, label: ProductTypeLabels[ProductType.Supply] },
  { value: ProductType.Standard, label: ProductTypeLabels[ProductType.Standard] },
  { value: ProductType.Solvent, label: ProductTypeLabels[ProductType.Solvent] },
  { value: ProductType.Equipment, label: ProductTypeLabels[ProductType.Equipment] },
  { value: ProductType.PreparedSolution, label: ProductTypeLabels[ProductType.PreparedSolution] },
];

const BADGE_STYLE: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 18, height: 18, borderRadius: "50%",
  background: "#1677ff", color: "#fff",
  fontSize: 11, fontWeight: 600, flexShrink: 0,
};

const PreparedSolutionCreateModal: React.FC<PreparedSolutionCreateModalProps> = ({
  open,
  editingItem,
  onClose,
  onSaved,
}) => {
  const isEdit = !!editingItem;
  const [solutionProducts, setSolutionProducts] = useState<ProductDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [warehouseProducts, setWarehouseProducts] = useState<PreparedSolutionWarehouseProductDto[]>([]);
  const [loadingWarehouseProducts, setLoadingWarehouseProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProductCode, setSelectedProductCode] = useState<string | undefined>();
  const [selectedVolumeUnitName, setSelectedVolumeUnitName] = useState<string | undefined>();
  const [ingredientsError, setIngredientsError] = useState<string | undefined>();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { ingredients: [{}] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });
  const watchedSourceWarehouse = watch("sourceWarehouseId");
  const watchedIngredients = watch("ingredients");

  useEffect(() => {
    const hasValid = watchedIngredients.some((i) => i.productId && i.quantityUsed && i.quantityUsed > 0);
    if (hasValid) setIngredientsError(undefined);
  }, [watchedIngredients]);
  const watchedProductId = watch("solutionProductId");
  const watchedExpiryDate = watch("expiryDate");
  const watchedPreparationDate = watch("preparationDate");

  const selectedProduct = solutionProducts.find((p) => p.id === watchedProductId);
  const showExpiryWarning = Boolean(
    selectedProduct?.shelfLifeDays &&
      watchedExpiryDate &&
      watchedPreparationDate &&
      watchedExpiryDate.isAfter(watchedPreparationDate.add(selectedProduct.shelfLifeDays, "day"))
  );

  useEffect(() => {
    if (!open) return;
    Promise.all([productService.getActive(), warehouseService.getActive()]).then(
      ([products, whs]) => {
        setSolutionProducts(products.filter((p) => p.productType === ProductType.PreparedSolution));
        setWarehouses(whs);
      }
    );
  }, [open]);

  useEffect(() => {
    if (!watchedProductId) {
      setSelectedProductCode(undefined);
      setSelectedVolumeUnitName(undefined);
      return;
    }
    const product = solutionProducts.find((p) => p.id === watchedProductId);
    setSelectedProductCode(product?.identificationCode ?? undefined);
    setSelectedVolumeUnitName(product?.volumeUnitName ?? undefined);
    if (product?.shelfLifeDays) {
      const prepDate = getValues("preparationDate") || dayjs();
      setValue("expiryDate", prepDate.add(product.shelfLifeDays, "day"));
    }
  }, [watchedProductId, solutionProducts, getValues, setValue]);

  useEffect(() => {
    if (!watchedSourceWarehouse) {
      setWarehouseProducts([]);
      return;
    }
    setLoadingWarehouseProducts(true);
    preparedSolutionService
      .getWarehouseProducts(watchedSourceWarehouse)
      .then(setWarehouseProducts)
      .catch(() => setWarehouseProducts([]))
      .finally(() => setLoadingWarehouseProducts(false));
  }, [watchedSourceWarehouse]);

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setSelectedProductCode(editingItem.identificationCode ?? undefined);
      setSelectedVolumeUnitName(editingItem.volumeUnitName ?? undefined);
      reset({
        solutionProductId: editingItem.solutionProductId,
        lotCode: editingItem.lotCode,
        preparationDate: dayjs(editingItem.preparationDate),
        expiryDate: editingItem.expiryDate ? dayjs(editingItem.expiryDate) : undefined,
        totalVolume: editingItem.totalVolume,
        storageWarehouseId: editingItem.storageWarehouseId ?? undefined,
        sourceWarehouseId: editingItem.sourceWarehouseId ?? undefined,
        storageConditions: editingItem.storageConditions ?? undefined,
        preparationMethod: editingItem.preparationMethod ?? undefined,
        ingredients: editingItem.ingredients.map((i) => ({
          productType: i.productType,
          productId: i.productId,
          quantityUsed: i.quantityUsed,
          _savedProductId: i.productId,
        })),
      });
    } else {
      setSelectedProductCode(undefined);
      setSelectedVolumeUnitName(undefined);
      reset({ lotCode: "", preparationDate: dayjs(), ingredients: [{}] });
    }
  }, [open, editingItem, reset]);

  const handleSourceWarehouseChange = useCallback(
    (field: { onChange: (v: any) => void; value: any }, newValue: string | null | undefined) => {
      const hasIngredients = watchedIngredients.some((i) => i.productId);
      const normalizedNew = newValue ?? null;
      const normalizedCurrent = field.value || null;
      if (hasIngredients && normalizedNew !== normalizedCurrent) {
        Modal.confirm({
          title: "Thay đổi kho vật tư",
          content: "Nếu bạn đổi kho, tất cả vật tư tiêu hao sẽ được làm mới.",
          okText: "Đồng ý",
          cancelText: "Hủy",
          onOk: () => {
            field.onChange(normalizedNew);
            setValue("ingredients", [{}]);
            setIngredientsError(undefined);
          },
        });
      } else {
        field.onChange(normalizedNew);
      }
    },
    [watchedIngredients, setValue]
  );

  const getFilteredProducts = useCallback(
    (index: number): PreparedSolutionWarehouseProductDto[] => {
      const type = watchedIngredients?.[index]?.productType;
      if (type === undefined) return warehouseProducts;
      return warehouseProducts.filter((p) => p.productType === type);
    },
    [watchedIngredients, warehouseProducts]
  );

  const getProductInfo = useCallback(
    (productId?: string): PreparedSolutionWarehouseProductDto | undefined => {
      if (!productId) return undefined;
      return warehouseProducts.find((p) => p.productId === productId);
    },
    [warehouseProducts]
  );

  const onSubmit = async (values: FormValues) => {
    if (!values.solutionProductId || !values.preparationDate || !values.totalVolume) return;
    const validIngredients = values.ingredients.filter(
      (i) => i.productId && i.quantityUsed && i.quantityUsed > 0
    );
    if (validIngredients.length === 0) {
      setIngredientsError("Vui lòng chọn ít nhất 1 nguyên liệu và nhập số lượng tiêu hao");
      return;
    }
    setIngredientsError(undefined);

    const payload: CreateUpdatePreparedSolutionBatchDto = {
      solutionProductId: values.solutionProductId,
      lotCode: values.lotCode,
      preparationDate: values.preparationDate.toISOString(),
      expiryDate: values.expiryDate?.toISOString(),
      totalVolume: Math.ceil(values.totalVolume * 1e8) / 1e8,
      storageWarehouseId: values.storageWarehouseId || undefined,
      sourceWarehouseId: values.sourceWarehouseId || undefined,
      storageConditions: values.storageConditions || undefined,
      preparationMethod: values.preparationMethod || undefined,
      ingredients: validIngredients.map((i) => ({
        productType: i.productType!,
        productId: i.productId!,
        quantityUsed: Math.ceil(i.quantityUsed! * 1e8) / 1e8,
      })),
    };

    setSubmitting(true);
    try {
      if (isEdit && editingItem) {
        await preparedSolutionService.update(editingItem.id, payload);
      } else {
        await preparedSolutionService.create(payload);
      }
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const availableTypeOptions = INGREDIENT_TYPE_OPTIONS;

  const isKhoTongVatTu = (name: string) => name.toLowerCase().includes("kho tổng vật tư");

  // Lv1 only for storage
  const storageWarehouseOptions = warehouses
    .filter((w) => w.level === 1 && !isKhoTongVatTu(w.name))
    .map((w) => ({ value: w.id, label: w.name }));

  // Lv0 only for source/ingredients
  const sourceWarehouseOptions = warehouses
    .filter((w) => w.level === 0 && !isKhoTongVatTu(w.name))
    .map((w) => ({ value: w.id, label: w.name }));

  const solutionProductOptions = solutionProducts.map((p) => ({ value: p.id, label: p.name }));
  const volumeLabel = selectedVolumeUnitName ? `Thể tích pha (${selectedVolumeUnitName})` : "Thể tích pha";

  // Table data for ingredient section
  const tableData: IngredientRow[] = fields.map((f, i) => ({ key: f.id, index: i }));

  const ingredientColumns: ColumnsType<IngredientRow> = [
    {
      title: "Loại vật tư / hóa chất",
      width: "22%",
      render: (_, record) => (
        <Controller
          name={`ingredients.${record.index}.productType`}
          control={control}
          render={({ field }) => (
            <Select
              {...clearableSelectProps(field)}
              options={availableTypeOptions}
              placeholder={watchedSourceWarehouse ? "Loại vật tư" : "Chọn kho trước"}
              disabled={!watchedSourceWarehouse || loadingWarehouseProducts}
              allowClear
              size="small"
              onChange={(v) => {
                field.onChange(v);
                setValue(`ingredients.${record.index}.productId`, undefined as never);
              }}
              style={{ width: "100%" }}
            />
          )}
        />
      ),
    },
    {
      title: "Tên hóa chất",
      ellipsis: true,
      render: (_, record) => {
        const filtered = getFilteredProducts(record.index);
        // Fallback: if editing and saved product is no longer in warehouse list, add it as an option
        const savedProductId = watchedIngredients?.[record.index]?._savedProductId;
        const savedIngredient = isEdit && editingItem && savedProductId
          ? editingItem.ingredients.find((i) => i.productId === savedProductId)
          : undefined;
        const options = filtered.map((p) => ({
          value: p.productId,
          label: p.productName,
          title: `${p.productName} (còn: ${formatVolume(p.availableQuantity, p.unitName ?? undefined)})`,
        }));
        if (savedIngredient?.productId && !filtered.find((p) => p.productId === savedIngredient.productId)) {
          options.unshift({ value: savedIngredient.productId, label: savedIngredient.productName, title: savedIngredient.productName });
        }
        return (
          <Controller
            name={`ingredients.${record.index}.productId`}
            control={control}
            render={({ field }) => (
              <Select
                {...clearableSelectProps(field)}
                disabled={!watchedSourceWarehouse}
                options={options}
                showSearch
                optionFilterProp="label"
                placeholder={watchedSourceWarehouse ? "Chọn nguyên liệu" : "Chọn kho trước"}
                allowClear
                size="small"
                style={{ width: "100%" }}
              />
            )}
          />
        );
      },
    },
    {
      title: "Số lượng tiêu hao",
      width: 200,
      render: (_, record) => {
        const info = getProductInfo(watchedIngredients?.[record.index]?.productId);
        const savedProductId = watchedIngredients?.[record.index]?._savedProductId;
        const savedIngredient = isEdit && editingItem && savedProductId
          ? editingItem.ingredients.find((i) => i.productId === savedProductId)
          : undefined;
        const unitName = info?.unitName ?? savedIngredient?.unitName;
        const idx = record.index;
        return (
          <Controller
            name={`ingredients.${idx}.quantityUsed`}
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value}
                onChange={(v) => field.onChange(v)}
                onBlur={() => {
                  const v = getValues(`ingredients.${idx}.quantityUsed`);
                  if (v != null) setValue(`ingredients.${idx}.quantityUsed`, Math.ceil(v * 1e8) / 1e8);
                  field.onBlur();
                }}
                min={0.00000001}
                size="small"
                style={{ width: "100%" }}
                placeholder="Số lượng"
                addonAfter={
                  unitName ? (
                    <span
                      style={{
                        display: "inline-block",
                        maxWidth: 64,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                      title={unitName}
                    >
                      {unitName}
                    </span>
                  ) : undefined
                }
              />
            )}
          />
        );
      },
    },
    {
      title: "Tồn kho hiện tại",
      width: 120,
      render: (_, record) => {
        const info = getProductInfo(watchedIngredients?.[record.index]?.productId);
        const savedProductId = watchedIngredients?.[record.index]?._savedProductId;
        const savedIngredient = isEdit && editingItem && savedProductId
          ? editingItem.ingredients.find((i) => i.productId === savedProductId)
          : undefined;
        if (info) {
          return (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {formatVolume(info.availableQuantity, info.unitName ?? undefined)}
            </Typography.Text>
          );
        }
        if (savedIngredient) {
          return (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {formatVolume(savedIngredient.warehouseQuantitySnapshot, savedIngredient.unitName ?? undefined)}
            </Typography.Text>
          );
        }
        return null;
      },
    },
    {
      title: "",
      width: 40,
      render: (_, record) => (
        <Tooltip title="Xóa">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => remove(record.index)}
            disabled={fields.length === 1}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={isEdit ? "Chỉnh sửa phiếu pha dung dịch" : "Tạo phiếu pha dung dịch"}
      width={960}
      centered
      className="prepared-solution-create-modal"
      onCancel={onClose}
      destroyOnClose
      styles={{ body: { maxHeight: "calc(100vh - 220px)", overflowY: "auto", overflowX: "hidden" } }}
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEdit ? "Cập nhật" : "Lưu & Tự Động Trừ Kho"}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" style={{ marginTop: 8 }}>
        {/* ── Section 1 ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={BADGE_STYLE}>1</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Tên dung dịch cần pha</span>
        </div>

        {/* Row A: Tên dung dịch pha — full width */}
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item
              label="Tên dung dịch pha"
              required
              validateStatus={errors.solutionProductId ? "error" : ""}
              help={errors.solutionProductId?.message}
            >
              <Controller
                name="solutionProductId"
                control={control}
                rules={{ required: "Vui lòng chọn dung dịch" }}
                render={({ field }) => (
                  <Select
                    {...clearableSelectProps(field)}
                    options={solutionProductOptions}
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn dung dịch pha"
                    allowClear
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row B: Mã nhận dạng | Mã lô */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Mã nhận dạng">
              <Input value={selectedProductCode || ""} disabled placeholder="Tự động theo sản phẩm" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Mã lô"
              required
              validateStatus={errors.lotCode ? "error" : ""}
              help={errors.lotCode?.message}
            >
              <Controller
                name="lotCode"
                control={control}
                rules={{ required: "Vui lòng nhập mã lô" }}
                render={({ field }) => <Input {...field} placeholder="VD: LOT-2024-001" />}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row C: Ngày pha | Ngày hết hạn */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Ngày pha"
              required
              validateStatus={errors.preparationDate ? "error" : ""}
            >
              <Controller
                name="preparationDate"
                control={control}
                rules={{ required: "Vui lòng chọn ngày pha" }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày pha"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Ngày hết hạn"
              required
              validateStatus={errors.expiryDate ? "error" : ""}
              help={errors.expiryDate?.message}
              extra={
                showExpiryWarning ? (
                  <Typography.Text type="warning" style={{ fontSize: 12 }}>
                    Hạn sử dụng cao hơn số ngày cho phép
                  </Typography.Text>
                ) : undefined
              }
            >
              <Controller
                name="expiryDate"
                control={control}
                rules={{
                  required: "Vui lòng chọn hạn sử dụng",
                  validate: (value) => {
                    if (!value) return true;
                    const prepDate = getValues("preparationDate");
                    if (!prepDate) return true;
                    return (
                      value.isAfter(prepDate) ||
                      value.isSame(prepDate, "day") ||
                      "Hạn sử dụng phải sau hoặc bằng ngày pha"
                    );
                  },
                }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn hạn sử dụng"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row D: Thể tích pha | Vị trí lưu kho */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={volumeLabel}
              required
              validateStatus={errors.totalVolume ? "error" : ""}
              help={errors.totalVolume?.message}
            >
              <Controller
                name="totalVolume"
                control={control}
                rules={{ required: "Vui lòng nhập thể tích" }}
                render={({ field }) => (
                  <InputNumber
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    onBlur={() => {
                      const v = getValues("totalVolume");
                      if (v != null) setValue("totalVolume", Math.ceil(v * 1e8) / 1e8);
                      field.onBlur();
                    }}
                        min={0.00000001}
                    style={{ width: "100%" }}
                    placeholder="VD: 100"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Vị trí lưu kho">
              <Controller
                name="storageWarehouseId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...clearableSelectProps(field)}
                    options={storageWarehouseOptions}
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn vị trí lưu kho"
                    allowClear
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row E: Điều kiện bảo quản | Cách pha */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Điều kiện bảo quản">
              <Controller
                name="storageConditions"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={(html) => field.onChange(html)}
                    placeholder="VD: Bảo quản 2–8°C, tránh ánh sáng..."
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Cách pha">
              <Controller
                name="preparationMethod"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={(html) => field.onChange(html)}
                    placeholder="Mô tả cách pha..."
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Section 2 ── */}
        <Divider style={{ margin: "4px 0 16px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={BADGE_STYLE}>2</span>
          <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Nguyên liệu gốc cần trừ tiêu hao</span>
          <Button type="default" size="small" icon={<PlusOutlined />} onClick={() => append({})}>
            Thêm vật tư / hóa chất tiêu hao
          </Button>
        </div>

        {/* Kho vật tư — Lv0 */}
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={12}>
            <Form.Item label="Chọn kho vật tư" style={{ marginBottom: 0 }}>
              <Controller
                name="sourceWarehouseId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onBlur={field.onBlur}
                    onChange={(v) => handleSourceWarehouseChange(field, v)}
                    options={sourceWarehouseOptions}
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn kho vật tư"
                    allowClear
                    style={{ width: "100%" }}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Ingredient table */}
        <Spin spinning={loadingWarehouseProducts}>
          <Table<IngredientRow>
            dataSource={tableData}
            columns={ingredientColumns}
            pagination={false}
            size="small"
            locale={{ emptyText: "Chưa có nguyên liệu" }}
          />
        </Spin>
        {ingredientsError && (
          <Typography.Text type="danger" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
            {ingredientsError}
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
};

export default PreparedSolutionCreateModal;
