import * as yup from "yup";

export const productSchema = yup.object({
  name: yup
    .string()
    .required("Vui lòng nhập tên vật tư/hóa chất")
    .max(500, "Tên không được vượt quá 500 ký tự"),
  productType: yup
    .number()
    .required("Vui lòng chọn loại sản phẩm")
    .min(0)
    .max(2),
  baseUnitId: yup
    .string()
    .required("Vui lòng chọn đơn vị tính"),
  packagingSpec: yup.string().nullable().max(256),
  casNumber: yup.string().nullable().max(100),
  manufacturer: yup.string().nullable().max(256),
  origin: yup.string().nullable().max(256),
  concentration: yup.string().nullable().max(256),
  storageConditions: yup.string().nullable(),
  categories: yup.string().nullable(),
  minStockLevel: yup.number().nullable().min(0),
  maxStockLevel: yup.number().nullable().min(0),
  isActive: yup.boolean().default(true),
});

export type ProductFormData = yup.InferType<typeof productSchema>;
