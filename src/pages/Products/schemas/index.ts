import * as yup from "yup";
import { ProductType } from "../../../services/productService";

export const skuSchema = yup.object({
  id: yup.string().nullable().optional(),
  manufacturerId: yup.string().required("Vui lòng chọn hãng sản xuất"),
  baseUnitId: yup.string().nullable().optional(),
  packagingQuantity: yup
    .number()
    .integer()
    .min(1, "Tối thiểu 1")
    .required("Vui lòng nhập số lượng")
    .typeError("Vui lòng nhập số lượng")
    .transform((v, orig) => (orig === "" || orig === null || orig === undefined ? undefined : v)),
  packagingUnitId: yup
    .string()
    .required("Vui lòng chọn đơn vị lưu kho")
    .typeError("Vui lòng chọn đơn vị lưu kho"),
  volumePerUnit: yup
    .number()
    .integer()
    .min(1, "Tối thiểu 1")
    .required("Vui lòng nhập dung tích")
    .typeError("Vui lòng nhập dung tích")
    .transform((v, orig) => (orig === "" || orig === null || orig === undefined ? undefined : v)),
  volumeUnitId: yup
    .string()
    .required("Vui lòng chọn đơn vị tiêu hao")
    .typeError("Vui lòng chọn đơn vị tiêu hao"),
});

export const productSchema = yup.object({
  name: yup.string().defined().default("").max(500),
  formattedName: yup.string().optional(),
  identificationCode: yup
    .string()
    .defined()
    .default("")
    .max(256)
    .when("productType", {
      is: (pt: number) => pt !== ProductType.Equipment,
      then: (schema) => schema.required("Vui lòng nhập mã nhận dạng"),
      otherwise: (schema) => schema.optional(),
    }),
  productType: yup.number().defined().default(0).min(0).max(6),
  baseUnitId: yup.string().nullable().optional(),
  packagingQuantity: yup
    .number()
    .nullable()
    .optional()
    .integer()
    .min(1, "Tối thiểu 1")
    .transform((v, orig) => (orig === "" || orig === null ? null : v)),
  packagingUnitId: yup.string().nullable().optional(),
  volumePerUnit: yup
    .number()
    .nullable()
    .optional()
    .integer()
    .min(1, "Tối thiểu 1")
    .transform((v, orig) => (orig === "" || orig === null ? null : v)),
  volumeUnitId: yup.string().nullable().optional(),
  packagingSpec: yup.string().nullable(),
  casNumber: yup.string().nullable().max(100),
  manufacturer: yup.string().nullable().max(256),
  origin: yup.string().nullable().max(256),
  concentration: yup.string().nullable(),
  formattedConcentration: yup.string().nullable(),
  formattedOrigin: yup.string().nullable(),
  ghsCode: yup.string().nullable().max(128),
  standardCertificationType: yup.number().nullable().optional(),
  formattedChemicalFormula: yup.string().nullable(),
  certifiedValue: yup.string().nullable(),
  formattedCertifiedValue: yup.string().nullable(),
  measurementUncertainty: yup.string().nullable(),
  formattedMeasurementUncertainty: yup.string().nullable(),
  standardLink: yup.string().nullable().max(500),
  analysisGrade: yup.string().nullable().max(256),
  formattedPackagingSpec: yup.string().nullable(),
  materialComposition: yup.string().nullable(),
  formattedMaterialComposition: yup.string().nullable(),
  isReusable: yup.boolean().nullable().optional(),
  maxReuseCount: yup.number().nullable().optional().integer().min(1, "Tối thiểu 1")
    .transform((v, orig) => (orig === "" || orig === null ? null : v)),
  isSterile: yup.boolean().nullable().optional(),
  usagePurpose: yup.string().nullable().optional(),
  shelfLifeDays: yup.number().nullable().optional().integer().min(1, "Tối thiểu 1")
    .transform((v, orig) => (orig === "" || orig === null ? null : v)),
  baseProductId: yup.string().nullable().optional(),
  chemicalFormula: yup.string().nullable().max(256),
  equipmentModel: yup.string().nullable().max(256),
  powerConsumption: yup.number().nullable().optional().min(0, "Không được âm")
    .transform((v, orig) => (orig === "" || orig === null ? null : v)),
  manufactureYear: yup.number().nullable().optional().integer().min(1900, "Năm không hợp lệ").max(2100, "Năm không hợp lệ")
    .transform((v, orig) => (orig === "" || orig === null ? null : v)),
  mainTechnicalSpecs: yup.string().nullable(),
  installationLocation: yup.string().nullable().max(256),
  minStockLevel: yup
    .number()
    .nullable()
    .min(0, "Không được âm")
    .transform((v, orig) => (orig === "" || orig === null ? null : v))
    .when("productType", {
      is: (productType: number) => productType !== ProductType.Equipment,
      then: (schema) =>
        schema.test(
          "required-min-stock",
          "Vui lòng nhập tồn kho tối thiểu",
          (val) => val !== null && val !== undefined
        ),
      otherwise: (schema) => schema.optional(),
    }),
  storageConditions: yup.string().nullable(),
  formattedStorageConditions: yup.string().nullable(),
  categories: yup.string().nullable(),
  isActive: yup.boolean().default(true),
  skus: yup.array().of(skuSchema).optional().default([]),
});

export type ProductFormData = yup.InferType<typeof productSchema>;
export type SkuFormData = yup.InferType<typeof skuSchema>;
