import * as yup from "yup";
import dayjs from "dayjs";
import { SpecimenStatus } from "../../../types/specimen";

export interface SpecimenFormData {
  testRequestId: string;
  receivedDate: dayjs.Dayjs;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  storageLocation?: string | null;
  deviation?: string | null;
  status?: number;
  notes?: string | null;
}

export const specimenFormSchema: yup.ObjectSchema<SpecimenFormData> = yup.object({
  testRequestId: yup.string().required("Vui lòng chọn phiếu yêu cầu"),
  receivedDate: yup.mixed<dayjs.Dayjs>().required("Vui lòng chọn ngày nhận mẫu"),
  name: yup
    .string()
    .required("Vui lòng nhập tên mẫu")
    .max(256, "Tên mẫu không được vượt quá 256 ký tự"),
  type: yup
    .string()
    .required("Vui lòng chọn loại mẫu")
    .max(256, "Loại mẫu không được vượt quá 256 ký tự"),
  quantity: yup.number().required("Vui lòng nhập số lượng").min(0),
  unit: yup
    .string()
    .required("Vui lòng chọn đơn vị")
    .max(50, "Đơn vị không được vượt quá 50 ký tự"),
  storageLocation: yup
    .string()
    .optional()
    .nullable()
    .max(256, "Vị trí lưu mẫu không được vượt quá 256 ký tự"),
  deviation: yup
    .string()
    .optional()
    .nullable()
    .max(1000, "Sai lệch không được vượt quá 1000 ký tự"),
  status: yup.number().optional().default(SpecimenStatus.Received),
  notes: yup
    .string()
    .optional()
    .nullable()
    .max(2000, "Ghi chú không được vượt quá 2000 ký tự"),
});
