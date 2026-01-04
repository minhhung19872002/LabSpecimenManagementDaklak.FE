import { Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  ReceiptDto,
  ReceiptStatus,
  ReceiptStatusLabels,
  ReceiptStatusColors,
} from "../../../types/receipt";
import { formatCurrency } from "../../../utils/formatters";

export const getColumns = (): ColumnsType<ReceiptDto> => [
  {
    title: "Số hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    width: 150,
    render: (text: string | undefined) => text || "-",
  },
  {
    title: "Ngày yêu cầu",
    dataIndex: "requestDate",
    key: "requestDate",
    width: 140,
    render: (date: string | undefined) =>
      date ? dayjs(date).format("DD/MM/YYYY") : "-",
  },
  {
    title: "Ngày HT dự kiến",
    dataIndex: "expectedCompletionDate",
    key: "expectedCompletionDate",
    width: 140,
    render: (date: string | undefined) =>
      date ? dayjs(date).format("DD/MM/YYYY") : "-",
  },
  {
    title: "Số phiếu thu",
    dataIndex: "receiptNumber",
    key: "receiptNumber",
    width: 140,
    render: (text: string | undefined) => text || "-",
  },
  {
    title: "Tên khách hàng",
    dataIndex: "customerName",
    key: "customerName",
    ellipsis: true,
    render: (text: string | undefined) => text || "-",
  },
  {
    title: "Tổng tiền",
    dataIndex: "totalCost",
    key: "totalCost",
    width: 140,
    align: "right",
    render: (value: number) => formatCurrency(value),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    align: "center",
    fixed: "right",
    render: (status: ReceiptStatus) => (
      <Tag color={ReceiptStatusColors[status]}>
        {ReceiptStatusLabels[status]}
      </Tag>
    ),
  },
];
