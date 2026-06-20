import * as yup from "yup";

export const productSchema = yup.object({
  name: yup.string().defined().default("").max(500),
  formattedName: yup.string().optional(),
  identificationCode: yup.string().defined().default("").required("Vui lòng nhập mã nhận dạng").max(256),
  productType: yup.number().defined().default(0).min(0).max(4),
  baseUnitId: yup.string().nullable().optional(),
  packagingQuantity: yup.number().required("Vui lòng nhập số lượng").integer().min(1, "Tối thiểu 1").typeError("Vui lòng nhập số lượng"),
  packagingUnitId: yup.string().required("Vui lòng chọn đơn vị"),
  volumePerUnit: yup.number().required("Vui lòng nhập số lượng").integer().min(1, "Tối thiểu 1").typeError("Vui lòng nhập số lượng"),
  volumeUnitId: yup.string().required("Vui lòng chọn đơn vị"),
  packagingSpec: yup.string().nullable().max(256),
  casNumber: yup.string().nullable().max(100),
  manufacturer: yup.string().nullable().max(256),
  origin: yup.string().nullable().max(256),
  concentration: yup.string().nullable().max(256),
  storageConditions: yup.string().nullable(),
  formattedStorageConditions: yup.string().nullable(),
  categories: yup.string().nullable(),
  minStockLevel: yup.number().nullable().min(0),
  maxStockLevel: yup.number().nullable().min(0),
  isActive: yup.boolean().default(true),
});

export type ProductFormData = yup.InferType<typeof productSchema>;
