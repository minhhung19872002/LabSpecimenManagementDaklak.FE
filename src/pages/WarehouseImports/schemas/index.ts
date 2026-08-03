import * as yup from "yup";

export const warehouseImportReceiptSchema = yup.object({
  goodsReceiptId: yup.string().nullable().required("Vui lòng chọn phiếu mua hàng"),
  actualImportDate: yup.string().nullable().required("Vui lòng chọn ngày nhập kho thực tế"),
  warehouseKeeperId: yup.string().nullable(),
  warehouseKeeperName: yup.string().nullable().max(200),
  warehouseId: yup.string().nullable(),
  notes: yup.string().nullable().max(2000),
  supplierId: yup.string().nullable(),
  supplierName: yup.string().nullable().required("Vui lòng chọn hoặc nhập tên nhà cung cấp").max(500),
  totalAmount: yup.number().nullable()
    .transform((val, orig) => (orig === null || orig === "" ? undefined : val)),
});

export type WarehouseImportReceiptFormData = yup.InferType<typeof warehouseImportReceiptSchema>;
