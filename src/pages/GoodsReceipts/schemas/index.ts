import * as yup from "yup";

export const goodsReceiptSchema = yup.object({
  supplierId: yup.string().nullable().required("Vui lòng chọn nhà cung cấp"),
  supplierAddress: yup.string().nullable().max(500),
  supplierPhone: yup.string().nullable().max(20),
  purchaserId: yup.string().nullable().required("Vui lòng chọn nhân viên mua hàng"),
  purchaserName: yup.string().nullable().max(200),
  deliveryNoteNumber: yup.string().nullable().max(100),
  documentDate: yup.string().nullable(),
  documentExpiryDate: yup.string().nullable().test(
    "min-expiry-date",
    "Ngày hết hạn phải lớn hơn ngày nhận chứng từ",
    function (value) {
      const { documentDate } = this.parent;
      if (!value || !documentDate) return true;
      return value >= documentDate;
    }
  ),
  expectedDeliveryDate: yup.string().nullable(),
  supplierRepresentativePhone: yup.string().nullable().required("Vui lòng nhập SĐT người đại diện NCC").max(20),
  supplierRepresentativeName: yup.string().nullable().required("Vui lòng nhập tên người đại diện NCC").max(200, "Tên người đại diện NCC không quá 200 ký tự"),
  vatPercent: yup.number().min(0).max(100).default(8),
  notes: yup.string().nullable().max(2000),
});

export type GoodsReceiptFormData = yup.InferType<typeof goodsReceiptSchema>;

export const equipmentReceiptSchema = yup.object({
  supplierId: yup.string().nullable().required("Vui lòng chọn nhà cung cấp"),
  supplierAddress: yup.string().nullable().max(500),
  supplierPhone: yup.string().nullable().max(20),
  purchaserId: yup.string().nullable().required("Vui lòng chọn nhân viên mua hàng"),
  purchaserName: yup.string().nullable().max(200),
  deliveryNoteNumber: yup.string().nullable().max(100),
  documentDate: yup.string().nullable(),
  documentExpiryDate: yup.string().nullable().test(
    "min-expiry-date",
    "Ngày hết hạn phải lớn hơn ngày nhận chứng từ",
    function (value) {
      const { documentDate } = this.parent;
      if (!value || !documentDate) return true;
      return value >= documentDate;
    }
  ),
  expectedDeliveryDate: yup.string().nullable(),
  supplierRepresentativePhone: yup.string().nullable().required("Vui lòng nhập SĐT người đại diện NCC").max(20),
  supplierRepresentativeName: yup.string().nullable().required("Vui lòng nhập tên người đại diện NCC").max(200, "Tên người đại diện NCC không quá 200 ký tự"),
  vatPercent: yup.number().min(0).max(100).default(8),
  notes: yup.string().nullable().max(2000),
});

export type EquipmentReceiptFormData = yup.InferType<typeof equipmentReceiptSchema>;

export const paymentSchema = yup.object({
  amount: yup
    .number()
    .required("Vui lòng nhập số tiền")
    .min(1, "Số tiền phải lớn hơn 0"),
  paymentMethod: yup.number().required("Vui lòng chọn phương thức"),
  paymentDate: yup.string().required("Vui lòng chọn ngày thanh toán"),
  phone: yup.string().nullable().max(20),
  representativeName: yup.string().nullable().max(200),
  notes: yup.string().nullable().max(1000),
});

export type PaymentFormData = yup.InferType<typeof paymentSchema>;
