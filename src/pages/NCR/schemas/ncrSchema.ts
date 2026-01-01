import * as yup from "yup";
import { NCRType, NCRSeverity, NCRStatus } from "../../../services/ncrService";

export const ncrSchema = yup.object({
  title: yup.string().required("Vui lòng nhập tiêu đề"),
  description: yup.string().required("Vui lòng nhập mô tả"),
  type: yup.number().required("Vui lòng chọn loại NCR").default(NCRType.Other),
  severity: yup.number().required("Vui lòng chọn mức độ").default(NCRSeverity.Minor),
  status: yup.number().optional().default(NCRStatus.Open),
  department: yup.string().optional().nullable().default(""),
  relatedEntityCode: yup.string().optional().nullable().default(""),
  assignedToId: yup.string().optional().nullable().default(""),
  rootCause: yup.string().optional().nullable().default(""),
  correctiveAction: yup.string().optional().nullable().default(""),
  preventiveAction: yup.string().optional().nullable().default(""),
  dueDate: yup.date().required("Vui lòng chọn hạn xử lý"),
  notes: yup.string().optional().nullable().default(""),
});

export type NCRFormData = yup.InferType<typeof ncrSchema>;
