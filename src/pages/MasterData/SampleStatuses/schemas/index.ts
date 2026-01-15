import * as yup from "yup";

export const sampleConditionSchema = yup.object({
  name: yup.string()
    .required("Vui lòng nhập tên tình trạng mẫu")
    .max(256, "Tên không được vượt quá 256 ký tự"),
  description: yup.string()
    .nullable()
    .max(500, "Mô tả không được vượt quá 500 ký tự"),
  isActive: yup.boolean().default(true),
});

export type SampleConditionFormData = yup.InferType<typeof sampleConditionSchema>;
