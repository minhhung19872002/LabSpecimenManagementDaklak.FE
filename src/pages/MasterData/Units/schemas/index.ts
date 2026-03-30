import * as yup from "yup";

export const unitSchema = yup.object({
  code: yup
    .string()
    .required("Vui lòng nhập mã đơn vị hàng hóa")
    .max(50, "Mã không được vượt quá 50 ký tự"),
  name: yup
    .string()
    .required("Vui lòng nhập tên đơn vị hàng hóa")
    .max(256, "Tên không được vượt quá 256 ký tự"),
  isActive: yup.boolean().default(true),
});

export type UnitFormData = yup.InferType<typeof unitSchema>;
