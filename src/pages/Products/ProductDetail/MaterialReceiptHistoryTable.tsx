import React from "react";
import { Button, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { ProductMaterialReceiptHistoryDto } from "../../../services/productService";
import { formatStockDisplay } from "../../MaterialReceipts/MaterialReceipt/utils";

const { Link } = Typography;

interface MaterialReceiptHistoryTableProps {
  items: ProductMaterialReceiptHistoryDto[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  showWarehouse: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onReceiptClick: (receiptId: string) => void;
  onBarcodeListClick: (barcodes: string[]) => void;
}

const displayDate = (value?: string) => value ? dayjs(value).format("DD/MM/YYYY") : "—";
const displayText = (value?: string) => value || "—";

const MaterialReceiptHistoryTable: React.FC<MaterialReceiptHistoryTableProps> = ({
  items,
  total,
  loading,
  page,
  pageSize,
  showWarehouse,
  onPageChange,
  onReceiptClick,
  onBarcodeListClick,
}) => {
  const columns: ColumnsType<ProductMaterialReceiptHistoryDto> = [
    {
      title: "Phiếu nhận vật tư",
      dataIndex: "receiptCode",
      width: 160,
      render: (code: string, record) => (
        <Link onClick={() => onReceiptClick(record.materialReceiptId)}>{code}</Link>
      ),
    },
    {
      title: "Ngày nhận",
      dataIndex: "receiptDate",
      width: 115,
      render: displayDate,
    },
    {
      title: "Số lượng nhận",
      width: 135,
      render: (_, record) => `${record.receivedQuantity.toLocaleString("vi-VN")} ${record.unitName || ""}`.trim(),
    },
    {
      title: "Hạn sử dụng",
      dataIndex: "lotExpiryDate",
      width: 115,
      render: displayDate,
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturerName",
      width: 150,
      ellipsis: true,
      render: displayText,
    },
    {
      title: "Barcode",
      dataIndex: "barcodes",
      width: 210,
      render: (barcodes: string[]) => {
        if (!barcodes?.length) return "—";
        if (barcodes.length === 1) return barcodes[0];
        return <Button type="link" size="small" onClick={() => onBarcodeListClick(barcodes)}>{barcodes.length} barcode</Button>;
      },
    },
    ...(showWarehouse ? [{
      title: "Kho nhận",
      dataIndex: "receivingWarehouseName",
      width: 150,
      ellipsis: true,
      render: displayText,
    } as ColumnsType<ProductMaterialReceiptHistoryDto>[number]] : []),
    {
      title: "Tồn trước nhập",
      width: 155,
      render: (_, record) => formatStockDisplay(
        record.stockBeforeBaseQuantity ?? undefined,
        record.storageUnitName,
        record.consumableUnitName,
        record.volumePerUnit,
      ),
    },
    {
      title: "Tồn sau nhập",
      width: 155,
      render: (_, record) => formatStockDisplay(
        record.stockAfterBaseQuantity ?? undefined,
        record.storageUnitName,
        record.consumableUnitName,
        record.volumePerUnit,
      ),
    },
  ];

  return (
    <Table<ProductMaterialReceiptHistoryDto>
      columns={columns}
      dataSource={items}
      rowKey={(record, index) => `${record.materialReceiptId}-${record.receivingWarehouseId}-${record.manufacturerId || "none"}-${record.lotNumber || "none"}-${index}`}
      loading={loading}
      size="small"
      scroll={{ x: 1150 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
        showTotal: (count, range) => `Hiển thị ${range[0]}-${range[1]}/${count}`,
        onChange: onPageChange,
      }}
    />
  );
};

export default MaterialReceiptHistoryTable;
