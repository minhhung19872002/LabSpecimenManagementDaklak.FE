import * as yup from "yup";

export const warehouseImportReceiptSchema = yup.object({
  goodsReceiptId: yup.string().nullable().required("Vui lòng chọn phiếu mua hàng"),
  actualImportDate: yup.string().nullable().required("Vui lòng chọn ngày nhập kho thực tế"),
  warehouseKeeperId: yup.string().nullable(),
  warehouseKeeperName: yup.string().nullable().max(200),
  warehouseId: yup.string().nullable().required("Phải chọn kho nhập hàng"),
  notes: yup.string().nullable().max(2000),
});

export type WarehouseImportReceiptFormData = yup.InferType<typeof warehouseImportReceiptSchema>;
