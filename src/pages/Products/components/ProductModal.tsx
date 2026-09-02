import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Form,
  Select,
  Switch,
  Row,
  Col,
  Divider,
  Button,
  message,
} from "antd";
import { useForm, FormProvider, Controller } from "react-hook-form";
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
import {
  ChemicalFields,
  BiologicalFields,
  StandardFields,
  SupplyFields,
  SolventFields,
  PreparedSolutionFields,
  EquipmentFields,
  SharedFields,
  SkuSection,
} from "./ProductFields";
import type { BaseProductOption } from "./ProductFields/types";
import "../Products.css";

const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.Chemical, label: "Hóa chất" },
  { value: ProductType.Biological, label: "Sinh phẩm" },
  { value: ProductType.Supply, label: "Vật tư tiêu hao" },
  { value: ProductType.Standard, label: "Chất chuẩn" },
  { value: ProductType.Solvent, label: "Dung môi" },
  { value: ProductType.Equipment, label: "Thiết bị phòng Lab" },
  { value: ProductType.PreparedSolution, label: "Dung dịch pha" },
];

const isChemicalType = (type: number) => type === ProductType.Chemical;
const isBiologicalType = (type: number) => type === ProductType.Biological;
const isStandardType = (type: number) => type === ProductType.Standard;
const isSupplyType = (type: number) => type === ProductType.Supply;
const isSolventType = (type: number) => type === ProductType.Solvent;
const isPreparedSolutionType = (type: number) => type === ProductType.PreparedSolution;
const isEquipmentType = (type: number) => type === ProductType.Equipment;
const isBaseProductType = (type: number) =>
  type === ProductType.Chemical || type === ProductType.Biological || type === ProductType.Solvent;
const isChemOrBioOrStdOrSupplyOrSolventType = (type: number) =>
  type === ProductType.Chemical || type === ProductType.Biological ||
  type === ProductType.Standard || type === ProductType.Supply ||
  type === ProductType.Solvent;

const SECTION2_TITLE: Record<number, string> = {
  [ProductType.Standard]: "Thông tin chất chuẩn",
  [ProductType.Chemical]: "Thông tin hóa chất",
  [ProductType.Biological]: "Thông tin sinh phẩm",
  [ProductType.Supply]: "Thông tin vật tư tiêu hao",
  [ProductType.Solvent]: "Thông tin dung môi",
  [ProductType.PreparedSolution]: "Thông tin dung dịch pha",
  [ProductType.Equipment]: "Thông tin thiết bị phòng Lab",
};

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
  const [hasBaseSubstance, setHasBaseSubstance] = useState(false);

  const methods = useForm<ProductFormData>({
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
      formattedConcentration: "",
      formattedOrigin: "",
      ghsCode: "",
      standardCertificationType: undefined,
      formattedChemicalFormula: "",
      certifiedValue: "",
      formattedCertifiedValue: "",
      measurementUncertainty: "",
      formattedMeasurementUncertainty: "",
      standardLink: "",
      analysisGrade: "",
      formattedPackagingSpec: "",
      materialComposition: "",
      formattedMaterialComposition: "",
      isReusable: undefined,
      maxReuseCount: undefined,
      isSterile: undefined,
      usagePurpose: "",
      shelfLifeDays: undefined,
      baseProductId: undefined,
      chemicalFormula: "",
      minStockLevel: undefined,
      equipmentModel: "",
      powerConsumption: undefined,
      manufactureYear: undefined,
      mainTechnicalSpecs: "",
      installationLocation: "",
      storageConditions: "",
      formattedStorageConditions: "",
      categories: "",
      isActive: true,
      skus: [],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
  } = methods;

  const watched = watch();
  const watchedType = watched.productType;
  const watchedCategories = watched.categories;

  const toOption = (u: UnitDto) => ({
    value: u.id,
    label: u.isActive ? (
      u.name
    ) : (
      <span style={{ color: "#ff4d4f", textDecoration: "line-through" }}>{u.name}</span>
    ),
    title: u.name,
  });

  const buildOptionsWithFallback = (category: UnitCategory, usedIds: (string | undefined | null)[]) => {
    const filtered = units.filter((u) => u.category === category);
    const filteredIdSet = new Set(filtered.map((u) => u.id));
    const missing = usedIds
      .filter((id): id is string => !!id && !filteredIdSet.has(id))
      .map((id) => units.find((u) => u.id === id))
      .filter((u): u is UnitDto => !!u);
    return [...filtered, ...missing].map(toOption);
  };

  const skuUnitIds = useMemo(() => {
    const skus = editingProduct?.skus || [];
    return {
      baseUnitIds: [editingProduct?.baseUnitId, ...skus.map((s) => s.baseUnitId)],
      packagingUnitIds: [editingProduct?.packagingUnitId, ...skus.map((s) => s.packagingUnitId)],
      volumeUnitIds: [editingProduct?.volumeUnitId, ...skus.map((s) => s.volumeUnitId)],
    };
  }, [editingProduct]);

  const purchaseUnitOptions = useMemo(
    () => buildOptionsWithFallback(UnitCategory.PurchaseUnit, skuUnitIds.baseUnitIds),
    [units, skuUnitIds],
  );
  const storageUnitOptions = useMemo(
    () => buildOptionsWithFallback(UnitCategory.StorageUnit, skuUnitIds.packagingUnitIds),
    [units, skuUnitIds],
  );
  const consumableUnitOptions = useMemo(
    () => buildOptionsWithFallback(UnitCategory.ConsumableUnit, skuUnitIds.volumeUnitIds),
    [units, skuUnitIds],
  );

  const manufacturerOptions = useMemo(
    () => manufacturers.map((m) => ({ value: m.id, label: m.name, title: m.name })),
    [manufacturers],
  );

  const tuphaManufacturerId = useMemo(
    () => manufacturers.find((m) => m.isSystem)?.id,
    [manufacturers],
  );

  const baseProductOptions: BaseProductOption[] = useMemo(
    () =>
      allProducts
        .filter((p) => isBaseProductType(p.productType))
        .map((p) => ({
          value: p.id,
          label: p.name,
          title: p.name,
          productType: p.productType,
        })),
    [allProducts],
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

  const migrateOldStorageConditions = (jsonStr?: string): string => {
    if (!jsonStr) return "";
    try {
      const tags: string[] = JSON.parse(jsonStr);
      if (Array.isArray(tags)) return tags.join(", ");
    } catch {}
    return jsonStr;
  };

  const resetForm = () => {
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
        formattedConcentration: editingProduct.formattedConcentration || "",
        formattedOrigin: editingProduct.formattedOrigin || "",
        ghsCode: editingProduct.ghsCode || "",
        standardCertificationType: editingProduct.standardCertificationType ?? undefined,
        formattedChemicalFormula: editingProduct.formattedChemicalFormula || "",
        certifiedValue: editingProduct.certifiedValue || "",
        formattedCertifiedValue: editingProduct.formattedCertifiedValue || "",
        measurementUncertainty: editingProduct.measurementUncertainty || "",
        formattedMeasurementUncertainty: editingProduct.formattedMeasurementUncertainty || "",
        standardLink: editingProduct.standardLink || "",
        analysisGrade: editingProduct.analysisGrade || "",
        formattedPackagingSpec: editingProduct.formattedPackagingSpec || "",
        materialComposition: editingProduct.materialComposition || "",
        formattedMaterialComposition: editingProduct.formattedMaterialComposition || "",
        isReusable: editingProduct.isReusable ?? undefined,
        maxReuseCount: editingProduct.maxReuseCount ?? undefined,
        isSterile: editingProduct.isSterile ?? undefined,
        usagePurpose: editingProduct.usagePurpose || "",
        shelfLifeDays: editingProduct.shelfLifeDays ?? undefined,
        baseProductId: editingProduct.baseProductId || undefined,
        chemicalFormula: editingProduct.chemicalFormula || "",
        minStockLevel: editingProduct.minStockLevel ?? undefined,
        equipmentModel: editingProduct.equipmentModel || "",
        powerConsumption: editingProduct.powerConsumption ?? undefined,
        manufactureYear: editingProduct.manufactureYear ?? undefined,
        mainTechnicalSpecs: editingProduct.mainTechnicalSpecs || "",
        installationLocation: editingProduct.installationLocation || "",
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
        formattedConcentration: "",
        formattedOrigin: "",
        ghsCode: "",
        standardCertificationType: undefined,
        formattedChemicalFormula: "",
        certifiedValue: "",
        formattedCertifiedValue: "",
        measurementUncertainty: "",
        formattedMeasurementUncertainty: "",
        standardLink: "",
        analysisGrade: "",
        formattedPackagingSpec: "",
        materialComposition: "",
        formattedMaterialComposition: "",
        isReusable: undefined,
        maxReuseCount: undefined,
        isSterile: undefined,
        usagePurpose: "",
        shelfLifeDays: undefined,
        baseProductId: undefined,
        chemicalFormula: "",
        minStockLevel: undefined,
        equipmentModel: "",
        powerConsumption: undefined,
        manufactureYear: undefined,
        mainTechnicalSpecs: "",
        installationLocation: "",
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
    setHasBaseSubstance(editingProduct ? !!editingProduct.baseProductId : false);
  };

  useEffect(() => {
    if (open) {
      const controller = new AbortController();
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

      Promise.all([
        unitService
          .getActive(includeIds?.length ? includeIds : undefined)
          .catch(() => null),
        manufacturerService.getActive().catch(() => null),
        productService.getActive().catch(() => null),
      ]).then(([unitItems, mfItems, prodItems]) => {
        if (controller.signal.aborted) return;
        if (unitItems) setUnits(unitItems);
        if (mfItems) setManufacturers(mfItems);
        if (prodItems) setAllProducts(prodItems.filter((p) => p.id !== editingProduct?.id));
        resetForm();
      });

      return () => controller.abort();
    }
  }, [open, editingProduct]);

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
    volumeUnitId: (isChemOrBioOrStdOrSupplyOrSolventType(data.productType) || isPreparedSolutionType(data.productType)) ? data.volumeUnitId || null : null,
    formattedPackagingSpec: isSupplyType(data.productType) ? data.formattedPackagingSpec || undefined : undefined,
    materialComposition: isSupplyType(data.productType) ? data.materialComposition || undefined : undefined,
    formattedMaterialComposition: isSupplyType(data.productType) ? data.formattedMaterialComposition || undefined : undefined,
    isReusable: isSupplyType(data.productType) ? data.isReusable ?? null : null,
    maxReuseCount: (isSupplyType(data.productType) && data.isReusable === true) ? data.maxReuseCount ?? null : null,
    isSterile: isSupplyType(data.productType) ? data.isSterile ?? null : null,
    packagingSpec: data.packagingSpec || undefined,
    casNumber: isChemOrBioOrStdOrSupplyOrSolventType(data.productType) ? data.casNumber || undefined : undefined,
    manufacturer: data.manufacturer || undefined,
    origin: (isBiologicalType(data.productType) || isStandardType(data.productType) || isEquipmentType(data.productType)) ? data.origin || undefined : undefined,
    equipmentModel: isEquipmentType(data.productType) ? data.equipmentModel || undefined : undefined,
    manufactureYear: isEquipmentType(data.productType) ? data.manufactureYear ?? null : null,
    powerConsumption: isEquipmentType(data.productType) ? data.powerConsumption ?? null : null,
    mainTechnicalSpecs: isEquipmentType(data.productType) ? data.mainTechnicalSpecs || undefined : undefined,
    installationLocation: isEquipmentType(data.productType) ? data.installationLocation || undefined : undefined,
    concentration: (isChemOrBioOrStdOrSupplyOrSolventType(data.productType) || isPreparedSolutionType(data.productType)) ? data.concentration || undefined : undefined,
    formattedConcentration: (isChemicalType(data.productType) || isBiologicalType(data.productType) || isStandardType(data.productType) || isSolventType(data.productType) || isPreparedSolutionType(data.productType) || isSupplyType(data.productType)) ? data.formattedConcentration || undefined : undefined,
    formattedOrigin: (isBiologicalType(data.productType) || isStandardType(data.productType)) ? data.formattedOrigin || undefined : undefined,
    ghsCode: (isBiologicalType(data.productType) || isStandardType(data.productType) || isSupplyType(data.productType) || isSolventType(data.productType) || isPreparedSolutionType(data.productType)) ? data.ghsCode || undefined : undefined,
    chemicalFormula: (isChemicalType(data.productType) || isStandardType(data.productType) || isSolventType(data.productType) || isPreparedSolutionType(data.productType)) ? data.chemicalFormula || undefined : undefined,
    minStockLevel: (isChemOrBioOrStdOrSupplyOrSolventType(data.productType) || isPreparedSolutionType(data.productType)) ? data.minStockLevel ?? null : null,
    standardCertificationType: isStandardType(data.productType) ? data.standardCertificationType ?? null : null,
    formattedChemicalFormula: (isStandardType(data.productType) || isSolventType(data.productType) || isPreparedSolutionType(data.productType)) ? data.formattedChemicalFormula || undefined : undefined,
    certifiedValue: isStandardType(data.productType) ? data.certifiedValue || undefined : undefined,
    formattedCertifiedValue: isStandardType(data.productType) ? data.formattedCertifiedValue || undefined : undefined,
    measurementUncertainty: isStandardType(data.productType) ? data.measurementUncertainty || undefined : undefined,
    formattedMeasurementUncertainty: isStandardType(data.productType) ? data.formattedMeasurementUncertainty || undefined : undefined,
    standardLink: isStandardType(data.productType) ? data.standardLink || undefined : undefined,
    analysisGrade: (isStandardType(data.productType) || isSolventType(data.productType)) ? data.analysisGrade || undefined : undefined,
    usagePurpose: isPreparedSolutionType(data.productType) ? data.usagePurpose || undefined : undefined,
    shelfLifeDays: isPreparedSolutionType(data.productType) ? data.shelfLifeDays ?? null : null,
    baseProductId: (isPreparedSolutionType(data.productType) && hasBaseSubstance) ? data.baseProductId || null : null,
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

  const validateBaseProduct = (data: ProductFormData): boolean => {
    if (isPreparedSolutionType(data.productType) && hasBaseSubstance && !data.baseProductId) {
      setError("baseProductId", { message: "Vui lòng chọn chất nền" });
      return false;
    }
    return true;
  };

  const onValidationError = (formErrors: any) => {
    console.warn("Form validation errors:", formErrors);
    const fieldNames = Object.keys(formErrors);
    const firstField = fieldNames[0];
    const firstMsg = formErrors[firstField]?.message
      || formErrors[firstField]?.[0]?.message
      || (Array.isArray(formErrors[firstField])
        ? Object.values(formErrors[firstField].find((e: any) => e) || {}).find((v: any) => v?.message)
        : undefined)
      || "Vui lòng kiểm tra lại các trường bắt buộc";
    const displayMsg = typeof firstMsg === "string" ? firstMsg : "Vui lòng kiểm tra lại các trường bắt buộc";
    message.error(displayMsg);
  };

  const onSaveDraft = (data: ProductFormData) => {
    if (!validateBaseProduct(data)) return;
    onOk(buildPayload(data, true), removedAttachmentIds);
  };

  const onSaveAndClose = (data: ProductFormData) => {
    if (!validateBaseProduct(data)) return;
    onOk(buildPayload(data, false), removedAttachmentIds);
  };

  const categoryTags = parseTags(watchedCategories as string);
  const showChemicalFields = isChemicalType(watchedType);
  const showBiologicalFields = isBiologicalType(watchedType);
  const showStandardFields = isStandardType(watchedType);
  const showSupplyFields = isSupplyType(watchedType);
  const showSolventFields = isSolventType(watchedType);
  const showPreparedSolutionFields = isPreparedSolutionType(watchedType);
  const showEquipmentFields = isEquipmentType(watchedType);

  return (
    <FormProvider {...methods}>
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
            <Button onClick={handleSubmit(onSaveDraft, onValidationError)} loading={loading}>
              Lưu nháp
            </Button>
            <Button type="primary" onClick={handleSubmit(onSaveAndClose, onValidationError)} loading={loading}>
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
            <span style={{ fontWeight: 600, fontSize: 14 }}>{SECTION2_TITLE[watchedType] ?? "Thông tin vật tư"}</span>
          </div>

          {showChemicalFields && (
            <ChemicalFields
              consumableUnitOptions={consumableUnitOptions}
              identificationCodeOptions={identificationCodeOptions}
            />
          )}
          {showBiologicalFields && (
            <BiologicalFields
              consumableUnitOptions={consumableUnitOptions}
              identificationCodeOptions={identificationCodeOptions}
            />
          )}
          {showStandardFields && (
            <StandardFields
              consumableUnitOptions={consumableUnitOptions}
              identificationCodeOptions={identificationCodeOptions}
            />
          )}
          {showSupplyFields && (
            <SupplyFields
              consumableUnitOptions={consumableUnitOptions}
              identificationCodeOptions={identificationCodeOptions}
            />
          )}
          {showSolventFields && (
            <SolventFields
              consumableUnitOptions={consumableUnitOptions}
              identificationCodeOptions={identificationCodeOptions}
            />
          )}
          {showPreparedSolutionFields && (
            <PreparedSolutionFields
              consumableUnitOptions={consumableUnitOptions}
              identificationCodeOptions={identificationCodeOptions}
              baseProductOptions={baseProductOptions}
              hasBaseSubstance={hasBaseSubstance}
              setHasBaseSubstance={setHasBaseSubstance}
            />
          )}
          {showEquipmentFields && (
            <EquipmentFields
              consumableUnitOptions={consumableUnitOptions}
              identificationCodeOptions={identificationCodeOptions}
              manufacturerOptions={manufacturerOptions}
            />
          )}

          <SharedFields
            categoryTags={categoryTags}
            categoryTagInput={categoryTagInput}
            setCategoryTagInput={setCategoryTagInput}
            handleAddTag={handleAddTag}
            handleRemoveTag={handleRemoveTag}
            existingAttachments={existingAttachments}
            newAttachments={newAttachments}
            setNewAttachments={setNewAttachments}
            setExistingAttachments={setExistingAttachments}
            setRemovedAttachmentIds={setRemovedAttachmentIds}
          />

          {/* Section 3 */}
          {!showEquipmentFields && (
            <>
              <Divider style={{ margin: "4px 0 16px" }} />
              <SkuSection
                units={units}
                manufacturerOptions={manufacturerOptions}
                purchaseUnitOptions={purchaseUnitOptions}
                storageUnitOptions={storageUnitOptions}
                consumableUnitOptions={consumableUnitOptions}
                tuphaManufacturerId={tuphaManufacturerId}
              />
            </>
          )}
        </Form>
      </Modal>
    </FormProvider>
  );
};

export default ProductModal;
