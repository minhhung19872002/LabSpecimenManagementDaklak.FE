import React from "react";
import { Table, Button, Space, Tooltip, Typography } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { LaboratoryTaskDto, LaboratoryTaskStatus } from "../../../types/laboratoryTask";
import { renderStatusTag, isTaskUrgent, canEditTask, getLockedMessage } from "../utils/taskStatus";
import { TABLE_SCROLL, URGENT_DAYS_THRESHOLD } from "../constants/taskManagement.constants";

const { Text } = Typography;

interface TaskTableProps {
  tasks: LaboratoryTaskDto[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
  };
  totalCount: number;
  isDeleting: boolean;
  onTableChange: (pagination: any) => void;
  onRowDoubleClick: (record: LaboratoryTaskDto) => void;
  onEdit: (record: LaboratoryTaskDto) => void;
  onDelete: (id: string) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  loading,
  pagination,
  totalCount,
  isDeleting,
  onTableChange,
  onRowDoubleClick,
  onEdit,
  onDelete,
}) => {
  const columns: ColumnsType<LaboratoryTaskDto> = [
    {
      title: "Số hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      width: 150,
      fixed: "left",
      render: (value: string) => value || "-",
    },
    {
      title: "Tổng số mẫu",
      dataIndex: "totalSampleCount",
      key: "totalSampleCount",
      width: 120,
      align: "center",
    },
    {
      title: "Quản lý kỹ thuật",
      dataIndex: "technicalManagerName",
      key: "technicalManagerName",
      width: 180,
      render: (value: string) => value || "-",
    },
    {
      title: "Ngày chuyển đi",
      dataIndex: "transferDate",
      key: "transferDate",
      width: 140,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Ngày YC xong",
      dataIndex: "requestCompletionDate",
      key: "requestCompletionDate",
      width: 130,
      render: (date: string, record: LaboratoryTaskDto) => {
        if (!date) return "-";
        const d = dayjs(date);
        const daysRemaining = d.diff(dayjs(), "day");
        const isUrgent =
          daysRemaining <= URGENT_DAYS_THRESHOLD &&
          record.status !== LaboratoryTaskStatus.Approved &&
          record.status !== LaboratoryTaskStatus.ResultSent;
        return (
          <span
            style={{
              color: isUrgent ? "#ff4d4f" : undefined,
              fontWeight: isUrgent ? "bold" : undefined,
            }}
          >
            {d.format("DD/MM/YYYY")}
          </span>
        );
      },
    },
    {
      title: "Ngày thí nghiệm",
      dataIndex: "testDate",
      key: "testDate",
      width: 140,
      render: (date: string) =>
        date ? (
          dayjs(date).format("DD/MM/YYYY")
        ) : (
          <Text type="secondary">Chưa đặt</Text>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (status: LaboratoryTaskStatus) => renderStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_: any, record: LaboratoryTaskDto) => {
        const canEdit = canEditTask(record.status);
        const lockedReason = getLockedMessage(record.status);

        return (
          <Space size="small">
            <Tooltip title={!canEdit ? lockedReason : "Cập nhật"}>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                disabled={!canEdit}
              />
            </Tooltip>
            <Tooltip title={!canEdit ? lockedReason : "Xóa"}>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record.id)}
                disabled={!canEdit || isDeleting}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tasks}
      rowKey="id"
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: totalCount,
        pageSizeOptions: [20, 50, 100],
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} công việc`,
      }}
      onChange={onTableChange}
      scroll={TABLE_SCROLL}
      onRow={(record) => ({
        onDoubleClick: () => onRowDoubleClick(record),
        style: { cursor: "pointer" },
      })}
      rowClassName={(record) => (isTaskUrgent(record) ? "urgent-row" : "")}
    />
  );
};

export default TaskTable;
