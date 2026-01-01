import * as yup from "yup";
import dayjs from "dayjs";
import { ResultApprovalStatus } from "../../../types/testResult";

export interface TestResultFormData {
  testId?: string;
  parameter: string;
  value: string;
  unit: string;
  lowerLimit?: number | null;
  upperLimit?: number | null;
  isPass: boolean;
  approvalStatus?: number;
  entryDate?: dayjs.Dayjs | null;
  reviewDate?: dayjs.Dayjs | null;
  reviewComment?: string | null;
  approvalDate?: dayjs.Dayjs | null;
  approvalComment?: string | null;
  chartData?: string | null;
  notes?: string | null;
}

export const testResultSchema: yup.ObjectSchema<TestResultFormData> = yup.object({
  testId: yup.string().optional(),
  parameter: yup.string().required("Vui lòng nhập chỉ tiêu"),
  value: yup.string().required("Vui lòng nhập giá trị"),
  unit: yup.string().required("Vui lòng chọn đơn vị"),
  lowerLimit: yup.number().optional().nullable(),
  upperLimit: yup.number().optional().nullable(),
  isPass: yup.boolean().required().default(false),
  approvalStatus: yup.number().optional().default(ResultApprovalStatus.Draft),
  entryDate: yup.mixed<dayjs.Dayjs>().optional().nullable(),
  reviewDate: yup.mixed<dayjs.Dayjs>().optional().nullable(),
  reviewComment: yup.string().optional().nullable(),
  approvalDate: yup.mixed<dayjs.Dayjs>().optional().nullable(),
  approvalComment: yup.string().optional().nullable(),
  chartData: yup.string().optional().nullable(),
  notes: yup.string().optional().nullable(),
});
