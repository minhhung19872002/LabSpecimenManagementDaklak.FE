import * as yup from "yup";

export const standardSchema = yup.object({
  name: yup.string().required("Vui lòng nhập tên tiêu chuẩn"),
  limitDescription: yup.string().optional().nullable().default(""),
  isActive: yup.boolean().default(true),
});

export type StandardFormData = yup.InferType<typeof standardSchema>;
