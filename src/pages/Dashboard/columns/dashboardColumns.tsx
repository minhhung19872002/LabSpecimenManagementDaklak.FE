import { Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { QualityManagementTaskDto } from "../../../types/qualityManagement";
import {
  DashboardRecentRequestDto,
  RevenueByCustomerDto,
} from "../../../services/dashboardService";
import { formatDate } from "../../../utils/formatters";

const { Text } = Typography;

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

// Format currency in short form (e.g., 6tr, 1.5tỷ)
export const formatCurrencyShort = (value: number): string => {
  if (value >= 1000000000) {
    const billions = value / 1000000000;
    return `${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}tỷ`;
  }
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}tr`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }
  return value.toString();
};

export const getPendingTasksColumns = (): ColumnsType<QualityManagementTaskDto> => [
  {
    title: "Số HĐ",
    dataIndex: "contractNumber",
    key: "contractNumber",
    width: 120,
    render: (text: string) => <Text strong>{text}</Text>,
  },
  {
    title: "Khách hàng",
    dataIndex: "customerName",
    key: "customerName",
    ellipsis: true,
  },
  {
    title: "Loại",
    dataIndex: "taskType",
    key: "taskType",
    width: 100,
    render: (type: number) => (
      <Tag color={type === 0 ? "blue" : "orange"}>
        {type === 0 ? "Kết quả" : "Thay đổi"}
      </Tag>
    ),
  },
];

export const getRecentRequestsColumns = (): ColumnsType<DashboardRecentRequestDto> => [
  {
    title: "Số HĐ",
    dataIndex: "contractNumber",
    key: "contractNumber",
    width: 120,
    render: (text: string) => <Text strong>{text}</Text>,
  },
  {
    title: "Tên CS/DN",
    dataIndex: "customerName",
    key: "customerName",
    ellipsis: true,
  },
  {
    title: "Ngày gửi YC",
    dataIndex: "pendingDate",
    key: "pendingDate",
    width: 110,
    render: (date: string) => formatDate(date),
  },
  {
    title: "Mẫu",
    dataIndex: "sampleCount",
    key: "sampleCount",
    width: 60,
    align: "center" as const,
  },
  {
    title: "Chỉ tiêu",
    dataIndex: "indicatorCount",
    key: "indicatorCount",
    width: 80,
    align: "center" as const,
  },
  {
    title: "Tổng tiền",
    dataIndex: "totalCost",
    key: "totalCost",
    width: 120,
    align: "right" as const,
    render: (value: number) => formatCurrency(value),
  },
];

export const getRevenueColumns = (): ColumnsType<RevenueByCustomerDto> => [
  {
    title: "Cơ sở/Doanh nghiệp",
    dataIndex: "customerName",
    key: "customerName",
    width: 150,
    ellipsis: true,
  },
  {
    title: "Mẫu",
    dataIndex: "totalSamples",
    key: "totalSamples",
    width: 70,
    align: "center" as const,
  },
  {
    title: "Chỉ tiêu",
    dataIndex: "totalIndicators",
    key: "totalIndicators",
    width: 80,
    align: "center" as const,
  },
  {
    title: "Doanh thu",
    dataIndex: "revenue",
    key: "revenue",
    width: 130,
    align: "right" as const,
    render: (value: number) => formatCurrency(value),
  },
];
