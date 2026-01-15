import { Tag, Button, Tooltip } from "antd";
import { DollarOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  ReceiptDto,
  ReceiptStatus,
  ReceiptStatusLabels,
  ReceiptStatusColors,
} from "../../../types/receipt";
import { formatCurrency } from "../../../utils/formatters";

interface GetColumnsOptions {
  onConfirmPayment?: (testRequestId: string) => void;
}

export const getColumns = (options?: GetColumnsOptions): ColumnsType<ReceiptDto> => [
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
  {
    title: "Thao tác",
    key: "actions",
    width: 130,
    align: "center",
    fixed: "right",
    render: (_: unknown, record: ReceiptDto) => {
      // Chỉ hiển thị button khi status là PendingPayment hoặc PartiallyPaid
      const canConfirmPayment =
        record.status === ReceiptStatus.PendingPayment ||
        record.status === ReceiptStatus.PartiallyPaid;

      if (!canConfirmPayment) {
        return null;
      }

      return (
        <Tooltip title="Xác nhận thanh toán">
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              options?.onConfirmPayment?.(record.testRequestId);
            }}
          >
            Thanh toán
          </Button>
        </Tooltip>
      );
    },
  },
];
