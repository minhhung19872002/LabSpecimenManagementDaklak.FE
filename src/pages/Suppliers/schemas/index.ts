import * as yup from "yup";

export const supplierSchema = yup.object({
  name: yup
    .string()
    .required("Vui lòng nhập tên nhà cung cấp")
    .max(500, "Tên không được vượt quá 500 ký tự"),
  phone: yup.string().required("Vui lòng nhập số điện thoại").max(20, "Số điện thoại không được vượt quá 20 ký tự"),
  email: yup.string().nullable().email("Email không đúng định dạng"),
  code: yup.string().nullable().max(50, "Mã không được vượt quá 50 ký tự"),
  taxCode: yup.string().nullable(),
  address: yup.string().nullable(),
  supplierGroup: yup.string().nullable(),
  note: yup.string().nullable().max(1000, "Ghi chú không được vượt quá 1000 ký tự"),
  logoFileId: yup.string().nullable(),
  isActive: yup.boolean().default(true),
});

export type SupplierFormData = yup.InferType<typeof supplierSchema>;
