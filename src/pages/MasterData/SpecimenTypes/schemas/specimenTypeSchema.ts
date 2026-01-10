import * as yup from "yup";

export const specimenTypeSchema = yup.object({
  name: yup.string().required("Vui lòng nhập tên loại mẫu"),
  description: yup.string().optional(),
  isActive: yup.boolean().default(true),
});

export type SpecimenTypeFormData = yup.InferType<typeof specimenTypeSchema>;