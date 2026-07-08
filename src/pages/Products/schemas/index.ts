import * as yup from "yup";

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
    .required("Vui lòng nhập mã nhận dạng")
    .max(256),
  productType: yup.number().defined().default(0).min(0).max(5),
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
  packagingSpec: yup.string().nullable().max(256),
  casNumber: yup.string().nullable().max(100),
  manufacturer: yup.string().nullable().max(256),
  origin: yup.string().nullable().max(256),
  concentration: yup.string().nullable().max(256),
  chemicalFormula: yup.string().nullable().max(256),
  minStockLevel: yup
    .number()
    .nullable()
    .optional()
    .min(0, "Không được âm")
    .transform((v, orig) => (orig === "" || orig === null ? null : v)),
  storageConditions: yup.string().nullable(),
  formattedStorageConditions: yup.string().nullable(),
  categories: yup.string().nullable(),
  isActive: yup.boolean().default(true),
  skus: yup.array().of(skuSchema).optional().default([]),
});

export type ProductFormData = yup.InferType<typeof productSchema>;
export type SkuFormData = yup.InferType<typeof skuSchema>;
