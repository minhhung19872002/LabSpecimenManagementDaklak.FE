import * as yup from "yup";
import dayjs from "dayjs";
import { TestStatus } from "../../../types/test";

export interface TestFormData {
  code?: string;
  specimenId?: string;
  name: string;
  method: string;
  standard: string;
  status?: number;
  assignmentDate?: dayjs.Dayjs | null;
  startDate?: dayjs.Dayjs | null;
  completionDate?: dayjs.Dayjs | null;
  assigneeId?: string | null;
  estimatedDuration?: number | null;
  notes?: string | null;
}

export const testSchema: yup.ObjectSchema<TestFormData> = yup.object({
  code: yup.string().optional(),
  specimenId: yup.string().optional(),
  name: yup.string().required("Vui lòng nhập tên phép thử"),
  method: yup.string().required("Vui lòng chọn phương pháp"),
  standard: yup.string().required("Vui lòng nhập tiêu chuẩn"),
  status: yup.number().optional().default(TestStatus.Pending),
  assignmentDate: yup.mixed<dayjs.Dayjs>().optional().nullable(),
  startDate: yup.mixed<dayjs.Dayjs>().optional().nullable(),
  completionDate: yup.mixed<dayjs.Dayjs>().optional().nullable(),
  assigneeId: yup.string().optional().nullable(),
  estimatedDuration: yup.number().optional().nullable(),
  notes: yup.string().optional().nullable(),
});
