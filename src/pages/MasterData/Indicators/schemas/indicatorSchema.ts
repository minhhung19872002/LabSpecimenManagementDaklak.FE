import * as yup from "yup";

export const indicatorSchema = yup.object({
  indicatorGroupId: yup.string().required("Vui lòng chọn nhóm"),
  name: yup.string().required("Vui lòng nhập tên chỉ tiêu"),
  formattedName: yup.string().optional(),
  isActive: yup.boolean().default(true),
});

export type IndicatorFormData = yup.InferType<typeof indicatorSchema>;

export const indicatorGroupSchema = yup.object({
  name: yup.string().required("Vui lòng nhập tên nhóm"),
  isActive: yup.boolean().default(true),
  laboratoryId: yup.string().optional(),
});

export type IndicatorGroupFormData = yup.InferType<typeof indicatorGroupSchema>;
