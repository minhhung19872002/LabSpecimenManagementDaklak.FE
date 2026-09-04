import React from "react";
import { Button, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  PreparedSolutionBatchDto,
  PreparedSolutionStatus,
} from "../../../services/preparedSolutionService";
import { STATUS_COLOR, STATUS_LABEL, formatDate, formatVolume } from "./utils";
import DaysRemainingText from "./DaysRemainingText";

export interface PreparedSolutionTableProps {
  items: PreparedSolutionBatchDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (item: PreparedSolutionBatchDto) => void;
  onProcess: (item: PreparedSolutionBatchDto) => void;
  onRowDoubleClick: (item: PreparedSolutionBatchDto) => void;
}

// Row background: đỏ nhạt cho Sắp hết hạn + Hết hạn, xanh nhạt cho Hết
const ROW_BG: Partial<Record<PreparedSolutionStatus, string>> = {
  [PreparedSolutionStatus.NearingExpiry]: "#fff1f0",
  [PreparedSolutionStatus.Expired]: "#fff1f0",
  [PreparedSolutionStatus.Empty]: "#e6f4ff",
};

const canEdit = (row: PreparedSolutionBatchDto): boolean => {
  if (row.isProcessed) return false;
  if (row.computedStatus === PreparedSolutionStatus.Expired) return false;
  if (row.computedStatus === PreparedSolutionStatus.Empty) return false;
  if (dayjs().diff(dayjs(row.preparationDate), "hour") > 24) return false;
  return true;
};

const PreparedSolutionTable: React.FC<PreparedSolutionTableProps> = ({
  items,
  totalCount,
  page,
  pageSize,
  loading,
  onPageChange,
  onEdit,
  onProcess,
  onRowDoubleClick,
}) => {
  const columns: ColumnsType<PreparedSolutionBatchDto> = [
    {
      title: "Mã lô (Code / Lot)",
      key: "lotCode",
      width: 160,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {row.lotCode}
          </Typography.Text>
          {row.identificationCode && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.identificationCode}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: "Tên dung dịch pha",
      key: "name",
      width: 200,
      ellipsis: true,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Tooltip title={row.solutionProductName}>
          <Typography.Text ellipsis>{row.solutionProductName}</Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: "Còn lại",
      key: "remaining",
      width: 160,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Space size={4}>
          <Typography.Text>{formatVolume(row.remainingVolume)}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            / {formatVolume(row.totalVolume, row.volumeUnitName ?? undefined)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Hạn dùng",
      key: "expiryDate",
      width: 120,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>{formatDate(row.expiryDate)}</Typography.Text>
          <DaysRemainingText expiryDate={row.expiryDate} daysRemaining={row.daysRemaining} />
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "computedStatus",
      key: "status",
      width: 130,
      render: (status: PreparedSolutionStatus) => (
        <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: "Vị trí",
      dataIndex: "storageWarehouseName",
      key: "location",
      width: 140,
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Người pha",
      dataIndex: "preparedByName",
      key: "preparedBy",
      width: 130,
      render: (v?: string) => v ?? "—",
    },
    {
      title: "",
      key: "actions",
      width: 88,
      fixed: "right" as const,
      render: (_: unknown, row: PreparedSolutionBatchDto) => (
        <Space size={4}>
          {canEdit(row) && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(row)}
                style={{ color: "#1677ff" }}
              />
            </Tooltip>
          )}
          {!row.isProcessed && (
            <Tooltip title="Xác nhận đã xử lý">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onProcess(row)}
                style={{ color: "#52c41a" }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={items}
      loading={loading}
      size="small"
      scroll={{ x: "max-content" }}
      onRow={(row: PreparedSolutionBatchDto) => {
        let bg = ROW_BG[row.computedStatus];
        if (
          !bg &&
          row.expiryDate &&
          row.daysRemaining < 30 &&
          row.computedStatus !== PreparedSolutionStatus.Empty &&
          row.computedStatus !== PreparedSolutionStatus.Processed
        ) {
          bg = "#fff1f0";
        }
        return {
          style: { backgroundColor: bg, cursor: "pointer" },
          onDoubleClick: () => onRowDoubleClick(row),
        };
      }}
      pagination={{
        current: page,
        pageSize,
        total: totalCount,
        showSizeChanger: true,
        pageSizeOptions: [20, 50, 100],
        showTotal: (total, range) => (
          <>
            Hiển thị <b>{range[0]}–{range[1]}</b> / {total}
          </>
        ),
        onChange: onPageChange,
      }}
    />
  );
};

export default PreparedSolutionTable;
