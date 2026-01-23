import * as yup from "yup";

export const subcontractorSchema = yup.object({
  code: yup.string().required("Vui lòng nhập mã nhà thầu phụ"),
  name: yup.string().required("Vui lòng nhập tên nhà thầu phụ"),
  contactPerson: yup.string().required("Vui lòng nhập người liên hệ"),
  phone: yup.string().required("Vui lòng nhập số điện thoại"),
  email: yup.string().optional().nullable().default("").email("Email không hợp lệ"),
  taxCode: yup.string().optional().nullable().default(""),
  address: yup.string().optional().nullable().default(""),
  capabilities: yup.array().of(yup.string().required()).optional().default([]),
  status: yup.string().oneOf(["active", "inactive"]).default("active"),
  contractStartDate: yup.date().optional().nullable().default(null),
  contractEndDate: yup.date().optional().nullable().default(null),
  notes: yup.string().optional().nullable().default(""),
});

export type SubcontractorFormData = yup.InferType<typeof subcontractorSchema>;
