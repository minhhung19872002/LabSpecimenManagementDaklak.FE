import * as yup from "yup";

export const goodsReceiptSchema = yup.object({
  supplierId: yup.string().nullable(),
  supplierAddress: yup.string().nullable().max(500),
  supplierPhone: yup.string().nullable().max(20),
  purchaserName: yup.string().nullable().max(200),
  deliveryNoteNumber: yup.string().nullable().max(100),
  documentDate: yup.string().nullable(),
  documentExpiryDate: yup.string().nullable(),
  supplierRepresentativePhone: yup.string().nullable().max(20),
  vatPercent: yup.number().min(0).max(100).default(8),
  notes: yup.string().nullable().max(2000),
});

export type GoodsReceiptFormData = yup.InferType<typeof goodsReceiptSchema>;

export const equipmentReceiptSchema = yup.object({
  supplierId: yup.string().nullable(),
  supplierAddress: yup.string().nullable().max(500),
  supplierPhone: yup.string().nullable().max(20),
  purchaserName: yup.string().nullable().max(200),
  deliveryNoteNumber: yup.string().nullable().max(100),
  documentDate: yup.string().nullable(),
  documentExpiryDate: yup.string().nullable(),
  supplierRepresentativePhone: yup.string().nullable().max(20),
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
