import React, { useState } from "react";
import { Button, Dropdown, Image, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import type { MenuProps } from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined, MessageOutlined, MoreOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { SupplementaryTaskDto, SupplementaryTaskPriority, SupplementaryTaskStatus } from "../../../services/supplementaryTaskService";
import { authService } from "../../../services/authService";
import { STATUS_COLOR, STATUS_LABEL, PRIORITY_COLOR, PRIORITY_LABEL, formatDate, isOverdueDate } from "./utils";

const CompletionImagesCell: React.FC<{ urls: string[] }> = ({ urls }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCurrent, setPreviewCurrent] = useState(0);
  if (!urls.length) return <Typography.Text type="secondary">—</Typography.Text>;
  const showCount = urls.length >= 3 ? 1 : urls.length;
  const remaining = urls.length - showCount;
  const items = urls.map((url) => ({ src: url }));
  return (
    <>
      <Image.PreviewGroup
        items={items}
        preview={{
          visible: previewOpen,
          current: previewCurrent,
          onVisibleChange: setPreviewOpen,
          onChange: (current) => setPreviewCurrent(current),
        }}
      />
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {urls.slice(0, showCount).map((url, i) => (
          <Image
            key={i}
            src={url}
            width={32}
            height={32}
            style={{ objectFit: "cover", borderRadius: 4, cursor: "pointer" }}
            preview={false}
            onClick={() => { setPreviewCurrent(i); setPreviewOpen(true); }}
          />
        ))}
        {remaining > 0 && (
          <div
            onClick={() => { setPreviewCurrent(showCount); setPreviewOpen(true); }}
            style={{
              width: 32, height: 32, borderRadius: 4, background: "#f0f0f0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#666", cursor: "pointer",
            }}
          >
            +{remaining}
          </div>
        )}
      </div>
    </>
  );
};

export interface SupplementaryTaskTableProps {
  items: SupplementaryTaskDto[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  isDirector: boolean;
  sortField?: "dueDate" | "creationTime";
  sortDescending?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onSortChange: (field: "dueDate" | "creationTime", descending: boolean) => void;
  onEdit: (item: SupplementaryTaskDto) => void;
  onCancel: (item: SupplementaryTaskDto) => void;
  onComplete: (item: SupplementaryTaskDto) => void;
  onApprove: (item: SupplementaryTaskDto) => void;
  onReject: (item: SupplementaryTaskDto) => void;
  onViewHistory: (item: SupplementaryTaskDto) => void;
  onRowDoubleClick: (item: SupplementaryTaskDto) => void;
}

const SupplementaryTaskTable: React.FC<SupplementaryTaskTableProps> = ({
  items, loading, totalCount, page, pageSize, isDirector,
  sortField, sortDescending,
  onPageChange, onSortChange, onEdit, onCancel, onComplete, onApprove, onReject, onViewHistory, onRowDoubleClick,
}) => {
  const currentUserId = authService.getUserInfo()?.id;

  const handleTableChange: TableProps<SupplementaryTaskDto>["onChange"] = (_, __, sorter, extra) => {
    if (extra.action !== "sort") return;

    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const key = s?.columnKey as "dueDate" | "creationTime" | undefined;
    if (!key || !s?.order) return;
    onSortChange(key, s.order === "descend");
  };

  const columns: ColumnsType<SupplementaryTaskDto> = [
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      width: 200,
      ellipsis: true,
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
      title: "Hình ảnh",
      key: "imageUrls",
      width: 100,
      render: (_, record) => <CompletionImagesCell urls={record.completionImageUrls ?? []} />,
    },
    {
      title: "Nhân viên",
      dataIndex: "assignedToName",
      key: "assignedToName",
      width: 160,
      render: (name) => <Typography.Text>{name}</Typography.Text>,
    },
    {
      title: "Ngày giao việc",
      dataIndex: "creationTime",
      key: "creationTime",
      width: 140,
      sorter: true,
      sortOrder: sortField === "creationTime" ? (sortDescending ? "descend" : "ascend") : null,
      render: (creationTime) => (
        <Typography.Text>{formatDate(creationTime)}</Typography.Text>
      ),
    },
    {
      title: "Hạn hoàn thành",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 150,
      sorter: true,
      sortOrder: sortField === "dueDate" ? (sortDescending ? "descend" : "ascend") : null,
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
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLOR[priority as SupplementaryTaskPriority], display: "inline-block" }} />
          <Typography.Text>{PRIORITY_LABEL[priority as SupplementaryTaskPriority]}</Typography.Text>
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status, record) => {
        const tag = (
          <Tag color={STATUS_COLOR[status as SupplementaryTaskStatus]} style={{ borderRadius: 12 }}>
            {STATUS_LABEL[status as SupplementaryTaskStatus]}
          </Tag>
        );
        if (status === SupplementaryTaskStatus.Rejected && record.rejectionReason) {
          return <Tooltip title={record.rejectionReason}>{tag}</Tooltip>;
        }
        return tag;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: isDirector ? 150 : 180,
      fixed: "right" as const,
      render: (_, record) => {
        const isDone = record.status === SupplementaryTaskStatus.Completed || record.status === SupplementaryTaskStatus.Cancelled;
        const isWaiting = record.status === SupplementaryTaskStatus.WaitingForConfirmation;
        const isRejected = record.status === SupplementaryTaskStatus.Rejected;
        const isAssignee = record.assignedToId === currentUserId;
        const hasHistory = isWaiting || isRejected || record.status === SupplementaryTaskStatus.Completed;

        const moreMenuItems: MenuProps["items"] = [];
        if (hasHistory) {
          moreMenuItems.push({ key: "note", icon: <MessageOutlined />, label: "Xem ghi chú", onClick: () => onViewHistory(record) });
        }
        if (isDirector && !isDone) {
          moreMenuItems.push({ key: "edit", icon: <EditOutlined />, label: "Chỉnh sửa", onClick: () => onEdit(record) });
          moreMenuItems.push({ key: "cancel", icon: <StopOutlined />, label: "Hủy công việc", danger: true, onClick: () => onCancel(record) });
        }

        return (
          <Space size="small">
            {isDirector && isWaiting && (
              <Tooltip title="Xác nhận hoàn thành">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => onApprove(record)}
                />
              </Tooltip>
            )}
            {isDirector && isWaiting && (
              <Tooltip title="Từ chối">
                <Button
                  type="primary"
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => onReject(record)}
                />
              </Tooltip>
            )}
            {isDirector && !isDone && !isWaiting && (
              <>
                {hasHistory && (
                  <Tooltip title="Xem ghi chú hoàn thành">
                    <Button type="link" size="small" icon={<MessageOutlined />} onClick={() => onViewHistory(record)} />
                  </Tooltip>
                )}
                <Tooltip title="Chỉnh sửa">
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
                </Tooltip>
                <Tooltip title="Hủy công việc">
                  <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => onCancel(record)} />
                </Tooltip>
              </>
            )}
            {isDirector && isWaiting && moreMenuItems.length > 0 && (
              <Dropdown menu={{ items: moreMenuItems }} trigger={["click"]}>
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            )}
            {(isDirector ? isDone : true) && hasHistory && (
              <Tooltip title="Xem lịch sử kết quả">
                <Button type="link" size="small" icon={<MessageOutlined />} onClick={() => onViewHistory(record)} />
              </Tooltip>
            )}
            {!isDirector && isAssignee && !isDone && !isWaiting && !isRejected && (
              <Button type="primary" size="small" onClick={() => onComplete(record)}>
                Xác nhận hoàn thành
              </Button>
            )}
            {!isDirector && isAssignee && isRejected && (
              <Button type="primary" size="small" icon={<ReloadOutlined />} onClick={() => onComplete(record)}>
                Gửi lại
              </Button>
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
        scroll={{ x: 950 }}
        style={{ marginTop: 12 }}
        onChange={handleTableChange}
        onRow={(record) => ({
          onDoubleClick: () => onRowDoubleClick(record),
          style: { cursor: "pointer" },
        })}
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
