import * as yup from "yup";
import { SpecimenStatus } from "../../../types/specimenHistory";

export const specimenHistorySchema = yup.object({
  specimenId: yup.string().required("Vui lòng chọn mẫu"),
  action: yup.string().required("Vui lòng chọn hành động"),
  location: yup.string().required("Vui lòng chọn vị trí"),
  status: yup.number().default(SpecimenStatus.Received),
  performedById: yup.string().optional().nullable().default(null),
  temperature: yup.number().optional().nullable().default(null),
  humidity: yup.number().optional().nullable().default(null).min(0).max(100),
  timestamp: yup.date().optional().nullable().default(null),
  notes: yup.string().optional().nullable().default(""),
});

export type SpecimenHistoryFormData = yup.InferType<typeof specimenHistorySchema>;
