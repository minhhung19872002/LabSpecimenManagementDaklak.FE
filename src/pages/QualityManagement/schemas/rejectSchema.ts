import * as yup from "yup";

export const rejectSchema = yup.object({
  reason: yup
    .string()
    .required("Vui lòng nhập lý do từ chối")
    .min(10, "Lý do từ chối phải có ít nhất 10 ký tự"),
});

export type RejectFormData = yup.InferType<typeof rejectSchema>;
