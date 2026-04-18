import * as yup from "yup";

export const subIndicatorSchema = yup.object({
  id: yup.string().optional(),
  name: yup.string().required("Vui lòng nhập tên chỉ tiêu phụ"),
  formattedName: yup.string().optional(),
});

export const indicatorSchema = yup.object({
  indicatorGroupId: yup.string().required("Vui lòng chọn nhóm"),
  name: yup.string().required("Vui lòng nhập tên chỉ tiêu"),
  formattedName: yup.string().optional(),
  isActive: yup.boolean().default(true),
  subIndicators: yup.array().of(subIndicatorSchema).default([]),
});

export type SubIndicatorFormData = yup.InferType<typeof subIndicatorSchema>;
export type IndicatorFormData = yup.InferType<typeof indicatorSchema>;

export const indicatorGroupSchema = yup.object({
  name: yup.string().required("Vui lòng nhập tên nhóm"),
  isActive: yup.boolean().default(true),
  laboratoryId: yup.string().optional(),
});

export type IndicatorGroupFormData = yup.InferType<typeof indicatorGroupSchema>;
