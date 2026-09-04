import React from "react";
import { Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PreparedSolutionBatchDto,
  PreparedSolutionStatus,
} from "../../../services/preparedSolutionService";
import { STATUS_COLOR, STATUS_LABEL, formatDate, formatVolume } from "../PreparedSolutions/utils";
import DaysRemainingText from "../PreparedSolutions/DaysRemainingText";

export interface PreparedSolutionDetailTableProps {
  item: PreparedSolutionBatchDto;
}

const columns: ColumnsType<PreparedSolutionBatchDto> = [
  {
    title: "Tên dung dịch pha",
    key: "name",
    width: "16%",
    render: (_: unknown, row: PreparedSolutionBatchDto) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{row.solutionProductName}</Typography.Text>
        {row.identificationCode && (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.identificationCode}
          </Typography.Text>
        )}
      </Space>
    ),
  },
  {
    title: "Đơn vị tính",
    dataIndex: "volumeUnitName",
    key: "unit",
    width: "6%",
    render: (v?: string) => v || "-",
  },
  {
    title: "Thể tích pha",
    key: "totalVolume",
    width: "8%",
    align: "right",
    render: (_: unknown, row: PreparedSolutionBatchDto) => formatVolume(row.totalVolume),
  },
  {
    title: "Số lô",
    dataIndex: "lotCode",
    key: "lotCode",
    width: "10%",
  },
  {
    title: "Hạn sử dụng",
    key: "expiryDate",
    width: "10%",
    render: (_: unknown, row: PreparedSolutionBatchDto) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>{formatDate(row.expiryDate)}</Typography.Text>
        <DaysRemainingText expiryDate={row.expiryDate} daysRemaining={row.daysRemaining} />
      </Space>
    ),
  },
  {
    title: "Kho lưu trữ",
    dataIndex: "storageWarehouseName",
    key: "storageWarehouse",
    width: "11%",
    render: (v?: string) => v || "-",
  },
  {
    title: "Trạng thái",
    dataIndex: "computedStatus",
    key: "status",
    width: "9%",
    render: (status: PreparedSolutionStatus) => (
      <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
    ),
  },
  {
    title: "Cách pha",
    dataIndex: "preparationMethod",
    key: "preparationMethod",
    width: "30%",
    render: (v?: string) =>
      v ? <Typography.Text style={{ whiteSpace: "pre-wrap" }}>{v}</Typography.Text> : "-",
  },
];

/** Bảng thông tin dung dịch của phiếu — 1 phiếu = 1 dòng, không bọc group */
const PreparedSolutionDetailTable: React.FC<PreparedSolutionDetailTableProps> = ({ item }) => (
  <Table
    columns={columns}
    dataSource={[item]}
    rowKey="id"
    pagination={false}
    scroll={{ x: 900 }}
    tableLayout="fixed"
    size="small"
    bordered
  />
);

export default PreparedSolutionDetailTable;
