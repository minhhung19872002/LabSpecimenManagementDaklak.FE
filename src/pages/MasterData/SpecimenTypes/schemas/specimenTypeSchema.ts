import * as yup from "yup";

export const specimenTypeSchema = yup.object({
  code: yup.string().optional(), // Code will be auto-generated
  name: yup.string().required("Vui lòng nhập tên loại mẫu"),
  description: yup.string().optional(),
  isActive: yup.boolean().default(true),
  sampleTypeCategoryId: yup.string().required("Vui lòng chọn danh mục loại mẫu"),
});

export type SpecimenTypeFormData = yup.InferType<typeof specimenTypeSchema>;
