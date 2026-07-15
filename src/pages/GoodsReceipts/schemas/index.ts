import * as yup from "yup";

export const goodsReceiptSchema = yup.object({
  deliveryNoteNumber: yup.string().nullable().max(100),
  expectedDeliveryDate: yup.string().nullable(),
  notes: yup.string().nullable().max(2000),
});

export type GoodsReceiptFormData = yup.InferType<typeof goodsReceiptSchema>;

export const equipmentReceiptSchema = yup.object({
  deliveryNoteNumber: yup.string().nullable().max(100),
  expectedDeliveryDate: yup.string().nullable(),
  notes: yup.string().nullable().max(2000),
});

export type EquipmentReceiptFormData = yup.InferType<typeof equipmentReceiptSchema>;

export const paymentSchema = yup.object({
  amount: yup
    .number()
    .required("Vui lòng nhập số tiền")
    .min(0, "Số tiền không hợp lệ"),
  paymentMethod: yup.number().required("Vui lòng chọn phương thức"),
  paymentDate: yup.string().required("Vui lòng chọn ngày thanh toán"),
  phone: yup.string().nullable().max(20),
  representativeName: yup.string().nullable().max(200),
  notes: yup.string().nullable().max(1000),
  invoiceFiles: yup
    .array()
    .of(yup.object({ fileId: yup.string().required(), fileName: yup.string().required(), fileSize: yup.number().nullable() }))
    .min(1, "Vui lòng đính kèm hóa đơn")
    .required("Vui lòng đính kèm hóa đơn"),
});

export type PaymentFormData = yup.InferType<typeof paymentSchema>;
