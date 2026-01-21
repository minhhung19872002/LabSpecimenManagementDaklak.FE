import * as yup from "yup";

// Password validation regex patterns
const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasDigit = /[0-9]/;
const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

export const employeeSchema = yup.object({
  username: yup
    .string()
    .required("Vui lòng nhập tên đăng nhập")
    .matches(
      /^[a-z0-9._]+$/,
      "Chỉ cho phép chữ thường, số, dấu chấm và gạch dưới"
    ),
  fullName: yup.string().required("Vui lòng nhập họ tên"),
  email: yup
    .string()
    .required("Vui lòng nhập email")
    .email("Email không hợp lệ"),
  phone: yup.string().optional().nullable().default(""),
  departmentId: yup.string().required("Vui lòng chọn phòng ban"),
  position: yup.string().optional().nullable().default(""),
  // Note: role field removed - quản lý quyền thông qua "Quản lý phân quyền"
  isActive: yup.boolean().default(true),
  // Temporary account settings
  isTemporaryAccount: yup.boolean().default(false),
  accountExpirationDate: yup
    .date()
    .nullable()
    .when("isTemporaryAccount", {
      is: true,
      then: (schema) => schema.required("Vui lòng chọn ngày hết hạn"),
    }),
  // Password mode: 'auto' = auto-generate and send email, 'manual' = enter password manually
  passwordMode: yup
    .string()
    .oneOf(["auto", "manual"])
    .default("auto"),
  // Password fields (required when passwordMode = 'manual')
  password: yup
    .string()
    .optional()
    .when("passwordMode", {
      is: "manual",
      then: (schema) =>
        schema
          .required("Vui lòng nhập mật khẩu")
          .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
          .test("hasUppercase", "Mật khẩu phải có ít nhất 1 chữ hoa", (value) =>
            value ? hasUppercase.test(value) : false
          )
          .test("hasLowercase", "Mật khẩu phải có ít nhất 1 chữ thường", (value) =>
            value ? hasLowercase.test(value) : false
          )
          .test("hasDigit", "Mật khẩu phải có ít nhất 1 chữ số", (value) =>
            value ? hasDigit.test(value) : false
          )
          .test("hasSpecialChar", "Mật khẩu phải có ít nhất 1 ký tự đặc biệt", (value) =>
            value ? hasSpecialChar.test(value) : false
          ),
    }),
  confirmPassword: yup
    .string()
    .optional()
    .when("passwordMode", {
      is: "manual",
      then: (schema) =>
        schema
          .required("Vui lòng xác nhận mật khẩu")
          .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp"),
    }),
});

// Define type manually because yup.InferType doesn't work well with .when()
export interface EmployeeFormData {
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  departmentId: string;
  position: string | null;
  // Note: role field removed - quản lý quyền thông qua "Quản lý phân quyền"
  isActive: boolean;
  isTemporaryAccount: boolean;
  accountExpirationDate?: Date | null;
  passwordMode: "auto" | "manual";
  password?: string;
  confirmPassword?: string;
}
