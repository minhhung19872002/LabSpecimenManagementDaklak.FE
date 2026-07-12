import * as yup from "yup";
import { TemporaryEmployeeType } from "../../../services/temporaryAccessService";

const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasDigit = /[0-9]/;
const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

export const temporaryAccessSchema = yup.object({
  employeeType: yup
    .number()
    .oneOf([TemporaryEmployeeType.Internal, TemporaryEmployeeType.External])
    .required("Vui lòng chọn loại nhân viên"),

  userId: yup
    .string()
    .nullable()
    .when("employeeType", {
      is: (v: number) => v === TemporaryEmployeeType.Internal,
      then: (schema) => schema.required("Vui lòng chọn nhân viên"),
      otherwise: (schema) => schema.optional().nullable(),
    }),

  externalUsername: yup
    .string()
    .nullable()
    .when("employeeType", {
      is: (v: number) => v === TemporaryEmployeeType.External,
      then: (schema) =>
        schema
          .required("Vui lòng nhập tên đăng nhập")
          .matches(/^[a-z0-9._]+$/, "Chỉ cho phép chữ thường, số, dấu chấm và gạch dưới"),
      otherwise: (schema) => schema.optional().nullable(),
    }),

  externalFullName: yup
    .string()
    .nullable()
    .when("employeeType", {
      is: (v: number) => v === TemporaryEmployeeType.External,
      then: (schema) => schema.required("Vui lòng nhập họ tên"),
      otherwise: (schema) => schema.optional().nullable(),
    }),

  externalPhone: yup.string().nullable().optional(),
  externalEmail: yup
    .string()
    .nullable()
    .optional()
    .email("Email không hợp lệ"),

  externalPassword: yup
    .string()
    .nullable()
    .when("employeeType", {
      is: (v: number) => v === TemporaryEmployeeType.External,
      then: (schema) =>
        schema
          .required("Vui lòng nhập mật khẩu")
          .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
          .test("hasUppercase", "Mật khẩu phải có ít nhất 1 chữ hoa", (v) =>
            v ? hasUppercase.test(v) : false,
          )
          .test("hasLowercase", "Mật khẩu phải có ít nhất 1 chữ thường", (v) =>
            v ? hasLowercase.test(v) : false,
          )
          .test("hasDigit", "Mật khẩu phải có ít nhất 1 chữ số", (v) =>
            v ? hasDigit.test(v) : false,
          )
          .test("hasSpecialChar", "Mật khẩu phải có ít nhất 1 ký tự đặc biệt", (v) =>
            v ? hasSpecialChar.test(v) : false,
          ),
      otherwise: (schema) => schema.optional().nullable(),
    }),

  externalConfirmPassword: yup
    .string()
    .nullable()
    .when("employeeType", {
      is: (v: number) => v === TemporaryEmployeeType.External,
      then: (schema) =>
        schema
          .required("Vui lòng xác nhận mật khẩu")
          .oneOf([yup.ref("externalPassword")], "Mật khẩu xác nhận không khớp"),
      otherwise: (schema) => schema.optional().nullable(),
    }),

  startDate: yup
    .string()
    .required("Vui lòng chọn ngày bắt đầu")
    .test("notPast", "Ngày phân công không được nhỏ hơn ngày hôm nay", (value) => {
      if (!value) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(value) >= today;
    }),

  expiryDate: yup
    .string()
    .required("Vui lòng chọn ngày hết hạn")
    .test("notBeforeStart", "Ngày hết hiệu lực không được nhỏ hơn ngày phân công", function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),

  selectedModules: yup
    .array()
    .of(yup.string().required())
    .min(1, "Vui lòng chọn ít nhất 1 nhóm quyền")
    .required("Vui lòng chọn ít nhất 1 nhóm quyền"),

  reason: yup.string().optional().nullable(),
});

export const updateTemporaryAccessSchema = yup.object({
  startDate: yup.string().required("Vui lòng chọn ngày bắt đầu"),

  expiryDate: yup
    .string()
    .required("Vui lòng chọn ngày hết hạn")
    .test("notPast", "Ngày hết hạn không được nhỏ hơn ngày hôm nay", (value) => {
      if (!value) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(value) >= today;
    })
    .test("notBeforeStart", "Ngày hết hiệu lực không được nhỏ hơn ngày phân công", function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),

  selectedModules: yup
    .array()
    .of(yup.string().required())
    .min(1, "Vui lòng chọn ít nhất 1 nhóm quyền")
    .required("Vui lòng chọn ít nhất 1 nhóm quyền"),

  reason: yup.string().optional().nullable(),
});

export interface TemporaryAccessFormData {
  employeeType: TemporaryEmployeeType;
  userId?: string | null;
  externalUsername?: string | null;
  externalFullName?: string | null;
  externalPhone?: string | null;
  externalEmail?: string | null;
  externalPassword?: string | null;
  externalConfirmPassword?: string | null;
  startDate: string;
  expiryDate: string;
  selectedModules: string[];
  reason?: string | null;
}
