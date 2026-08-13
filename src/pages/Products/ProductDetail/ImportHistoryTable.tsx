import React from "react";
import { Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { ProductImportHistoryDto } from "../../../services/productService";

const { Link } = Typography;

export interface ImportHistoryTableProps {
  items: ProductImportHistoryDto[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onReceiptClick: (receiptId: string) => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const formatCurrency = (value?: number | null) => {
  if (value == null) return "-";
  return value.toLocaleString("vi-VN") + " đ";
};

const ImportHistoryTable: React.FC<ImportHistoryTableProps> = ({
  items,
  total,
  loading,
  page,
  pageSize,
  onPageChange,
  onReceiptClick,
}) => {
  const columns: ColumnsType<ProductImportHistoryDto> = [
    {
      title: "Phiếu nhập kho",
      dataIndex: "warehouseImportReceiptCode",
      key: "warehouseImportReceiptCode",
      width: 160,
      render: (code: string, record) => (
        <Link onClick={() => onReceiptClick(record.warehouseImportReceiptId)}>
          {code}
        </Link>
      ),
    },
    {
      title: "Ngày nhập kho",
      dataIndex: "actualImportDate",
      key: "actualImportDate",
      width: 120,
      render: formatDate,
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplierName",
      key: "supplierName",
      width: 160,
      ellipsis: true,
      render: (v: string) => v || "-",
    },
    {
      title: "SL đặt",
      key: "orderedQuantity",
      width: 120,
      align: "right" as const,
      render: (_: any, record: ProductImportHistoryDto) => {
        const unit = record.purchaseUnitName || record.unitName || "";
        return `${record.orderedQuantity} ${unit}`.trim();
      },
    },
    {
      title: "SL thực nhận",
      key: "actualReceivedQuantity",
      width: 120,
      align: "right" as const,
      render: (_: any, record: ProductImportHistoryDto) => {
        const unit = record.unitName || "";
        return `${record.actualReceivedQuantity} ${unit}`.trim();
      },
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturerName",
      key: "manufacturerName",
      width: 150,
      ellipsis: true,
      render: (v: string) => v || "-",
    },
    {
      title: "Số lô (Code/Lot)",
      dataIndex: "lotNumber",
      key: "lotNumber",
      width: 140,
      ellipsis: true,
      render: (v: string) => v || "-",
    },
    {
      title: "Hạn lô",
      dataIndex: "lotExpiryDate",
      key: "lotExpiryDate",
      width: 110,
      render: formatDate,
    },
    {
      title: "Tổng giá trị đơn",
      dataIndex: "totalLineAmount",
      key: "totalLineAmount",
      width: 150,
      align: "right" as const,
      render: formatCurrency,
    },
  ];

  return (
    <Table<ProductImportHistoryDto>
      columns={columns}
      dataSource={items}
      rowKey={(_record, index) => `${_record.warehouseImportReceiptId}-${index}`}
      loading={loading}
      size="small"
      scroll={{ x: 1300 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
        showTotal: (t, range) => `Hiển thị ${range[0]}-${range[1]}/${t}`,
        onChange: onPageChange,
      }}
      onRow={(record) => ({
        onDoubleClick: () => onReceiptClick(record.warehouseImportReceiptId),
        style: { cursor: "pointer" },
      })}
    />
  );
};

export default ImportHistoryTable;
