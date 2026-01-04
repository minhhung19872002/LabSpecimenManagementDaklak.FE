import { Tag, Button, Space } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  ReceiptDto,
  ReceiptStatus,
  ReceiptStatusLabels,
  ReceiptStatusColors,
} from '../../../types/receipt';
import { formatCurrency } from '../../../utils/formatters';

interface ColumnProps {
  onEdit: (record: ReceiptDto) => void;
}

export const getColumns = ({ onEdit }: ColumnProps): ColumnsType<ReceiptDto> => [
  {
    title: 'Số hợp đồng',
    dataIndex: 'contractNumber',
    key: 'contractNumber',
    width: 150,
    sorter: true,
    render: (text: string | undefined) => text || '-',
  },
  {
    title: 'Ngày yêu cầu',
    dataIndex: 'requestDate',
    key: 'requestDate',
    width: 130,
    sorter: true,
    render: (date: string | undefined) =>
      date ? dayjs(date).format('DD/MM/YYYY') : '-',
  },
  {
    title: 'Ngày HT dự kiến',
    dataIndex: 'expectedCompletionDate',
    key: 'expectedCompletionDate',
    width: 140,
    sorter: true,
    render: (date: string | undefined) =>
      date ? dayjs(date).format('DD/MM/YYYY') : '-',
  },
  {
    title: 'Số phiếu thu',
    dataIndex: 'receiptNumber',
    key: 'receiptNumber',
    width: 140,
    sorter: true,
    render: (text: string | undefined) => text || '-',
  },
  {
    title: 'Tên khách hàng',
    dataIndex: 'customerName',
    key: 'customerName',
    ellipsis: true,
    render: (text: string | undefined) => text || '-',
  },
  {
    title: 'Tổng tiền',
    dataIndex: 'totalCost',
    key: 'totalCost',
    width: 140,
    align: 'right',
    sorter: true,
    render: (value: number) => formatCurrency(value),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: 150,
    align: 'center',
    sorter: true,
    render: (status: ReceiptStatus) => (
      <Tag color={ReceiptStatusColors[status]}>
        {ReceiptStatusLabels[status]}
      </Tag>
    ),
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 100,
    align: 'center',
    fixed: 'right',
    render: (_, record) => (
      <Space size="small">
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
          title="Chi tiết"
        />
      </Space>
    ),
  },
];
