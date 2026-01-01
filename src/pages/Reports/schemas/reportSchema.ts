import * as yup from "yup";

export const reportSchema = yup.object({
  testRequestId: yup.string().required("Vui lòng chọn yêu cầu thử nghiệm"),
  title: yup.string().required("Vui lòng nhập tiêu đề báo cáo"),
  customerName: yup.string().required("Vui lòng nhập tên khách hàng"),
  specimenIds: yup.array().of(yup.string().required()).optional().default([]),
  testIds: yup.array().of(yup.string().required()).optional().default([]),
  notes: yup.string().optional().nullable().default(""),
});

export type ReportFormData = yup.InferType<typeof reportSchema>;
