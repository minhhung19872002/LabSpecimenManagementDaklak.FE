import React from "react";
import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, StopOutlined } from "@ant-design/icons";
import { SupplementaryTaskDto, SupplementaryTaskStatus } from "../../../services/supplementaryTaskService";
import { STATUS_COLOR, STATUS_LABEL, PRIORITY_COLOR, PRIORITY_LABEL, formatDate, isOverdueDate } from "./utils";

export interface SupplementaryTaskTableProps {
  items: SupplementaryTaskDto[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  isDirector: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (item: SupplementaryTaskDto) => void;
  onCancel: (item: SupplementaryTaskDto) => void;
  onComplete: (item: SupplementaryTaskDto) => void;
}

const SupplementaryTaskTable: React.FC<SupplementaryTaskTableProps> = ({
  items, loading, totalCount, page, pageSize, isDirector,
  onPageChange, onEdit, onCancel, onComplete,
}) => {
  const columns: ColumnsType<SupplementaryTaskDto> = [
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      render: (title, record) => (
        <div>
          <Typography.Text strong style={{ display: "block" }}>{title}</Typography.Text>
          {record.description && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: record.description }}>
              {record.description}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "Nhân viên",
      dataIndex: "assignedToName",
      key: "assignedToName",
      width: 180,
      render: (name) => <Typography.Text>{name}</Typography.Text>,
    },
    {
      title: "Hạn hoàn thành",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 140,
      render: (dueDate, record) => {
        const overdue = isOverdueDate(dueDate, record.status);
        return (
          <Typography.Text style={{ color: overdue ? "#f5222d" : undefined }}>
            {formatDate(dueDate)}
          </Typography.Text>
        );
      },
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 110,
      render: (priority) => (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLOR[priority], display: "inline-block" }} />
          <Typography.Text>{PRIORITY_LABEL[priority]}</Typography.Text>
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag color={STATUS_COLOR[status as SupplementaryTaskStatus]} style={{ borderRadius: 12 }}>
          {STATUS_LABEL[status as SupplementaryTaskStatus]}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: isDirector ? 100 : 180,
      fixed: "right" as const,
      render: (_, record) => {
        const isDone = record.status === SupplementaryTaskStatus.Completed || record.status === SupplementaryTaskStatus.Cancelled;
        return (
          <Space size="small">
            {isDirector && !isDone && (
              <Tooltip title="Chỉnh sửa">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
            )}
            {isDirector && !isDone && (
              <Tooltip title="Hủy công việc">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => onCancel(record)}
                />
              </Tooltip>
            )}
            {!isDirector && !isDone && (
              <Popconfirm
                title="Xác nhận hoàn thành công việc này?"
                okText="Xác nhận"
                cancelText="Hủy"
                onConfirm={() => onComplete(record)}
              >
                <Button type="primary" size="small">
                  Xác nhận hoàn thành
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={items}
      columns={columns}
      rowKey="id"
      loading={loading}
      scroll={{ x: 800 }}
      style={{ marginTop: 12 }}
      pagination={{
        current: page,
        pageSize,
        total: totalCount,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: (total) => `${total} công việc`,
        pageSizeOptions: ["10", "20", "50"],
      }}
      size="middle"
    />
  );
};

export default SupplementaryTaskTable;
