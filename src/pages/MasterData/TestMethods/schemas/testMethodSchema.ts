import * as yup from "yup";

export const testMethodSchema = yup.object({
  name: yup.string().required("Vui lòng nhập tên phương pháp"),
  unit: yup.string().required("Vui lòng nhập đơn vị tính"),
  isActive: yup.boolean().default(true),
});

export type TestMethodFormData = yup.InferType<typeof testMethodSchema>;
