import * as yup from "yup";

export const organizationSchema = yup.object({
  name: yup
    .string()
    .required("Vui lòng nhập tên!")
    .max(256, "Tên không được quá 256 ký tự!"),
  provinceCode: yup.string().required("Vui lòng chọn tỉnh thành!"),
  wardCode: yup.string().required("Vui lòng chọn phường xã!"),
  address: yup
    .string()
    .required("Vui lòng nhập địa chỉ!")
    .max(500, "Địa chỉ không được quá 500 ký tự!"),
  taxCode: yup
    .string()
    .optional()
    .nullable()
    .default("")
    .max(20, "MST không được quá 20 ký tự!"),
  contactPerson: yup
    .string()
    .required("Vui lòng nhập người liên hệ!")
    .max(100, "Tên không được quá 100 ký tự!"),
  phone: yup
    .string()
    .required("Vui lòng nhập số điện thoại!")
    .matches(/^(0|\+84)[0-9]{9,10}$/, "Số điện thoại không hợp lệ!"),
  secondaryPhone: yup
    .string()
    .optional()
    .nullable()
    .default("")
    .max(20, "SĐT phụ không được quá 20 ký tự!"),
  isActive: yup.boolean().default(true),
});

export type OrganizationFormData = yup.InferType<typeof organizationSchema>;
