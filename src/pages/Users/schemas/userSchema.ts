import * as yup from "yup";

export const userSchema = yup.object({
  username: yup
    .string()
    .required("Vui lòng nhập tên đăng nhập")
    .matches(/^[a-z0-9._]+$/, "Chỉ cho phép chữ thường, số, dấu chấm và gạch dưới"),
  fullName: yup.string().required("Vui lòng nhập họ tên"),
  email: yup.string().required("Vui lòng nhập email").email("Email không hợp lệ"),
  phone: yup.string().optional().nullable().default(""),
  department: yup.string().required("Vui lòng chọn phòng ban"),
  role: yup.string().required("Vui lòng chọn vai trò"),
  password: yup.string().optional().nullable().default(""),
});

export type UserFormData = yup.InferType<typeof userSchema>;
