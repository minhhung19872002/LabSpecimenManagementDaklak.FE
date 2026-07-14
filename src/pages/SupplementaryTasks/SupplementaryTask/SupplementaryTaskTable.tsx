import React, { useState } from "react";
import { Avatar, Button, Image, Modal, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { EditOutlined, MessageOutlined, PictureOutlined, StopOutlined } from "@ant-design/icons";
import { SupplementaryTaskDto, SupplementaryTaskPriority, SupplementaryTaskStatus } from "../../../services/supplementaryTaskService";
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
}

const SupplementaryTaskTable: React.FC<SupplementaryTaskTableProps> = ({
  items, loading, totalCount, page, pageSize, isDirector,
  sortField, sortDescending,
  onPageChange, onSortChange, onEdit, onCancel, onComplete,
}) => {
  const [noteItem, setNoteItem] = useState<SupplementaryTaskDto | null>(null);

  const handleTableChange: TableProps<SupplementaryTaskDto>["onChange"] = (_, __, sorter) => {
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
      render: (status) => (
        <Tag color={STATUS_COLOR[status as SupplementaryTaskStatus]} style={{ borderRadius: 12 }}>
          {STATUS_LABEL[status as SupplementaryTaskStatus]}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: isDirector ? 130 : 180,
      fixed: "right" as const,
      render: (_, record) => {
        const isDone = record.status === SupplementaryTaskStatus.Completed || record.status === SupplementaryTaskStatus.Cancelled;
        const hasNote = record.status === SupplementaryTaskStatus.Completed &&
          (!!record.completionNote || record.completionImageUrls?.length > 0);
        return (
          <Space size="small">
            {hasNote && (
              <Tooltip title="Xem ghi chú hoàn thành">
                <Button
                  type="link"
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={() => setNoteItem(record)}
                />
              </Tooltip>
            )}
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
              <Button type="primary" size="small" onClick={() => onComplete(record)}>
                Xác nhận hoàn thành
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 950 }}
        style={{ marginTop: 12 }}
        onChange={handleTableChange}
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

      <Modal
        open={!!noteItem}
        title="Ghi chú hoàn thành"
        footer={<Button onClick={() => setNoteItem(null)}>Đóng</Button>}
        onCancel={() => setNoteItem(null)}
        width={600}
        centered
      >
        {noteItem && (
          <div style={{ padding: "8px 0" }}>
            <div style={{
              display: "flex", gap: 12, padding: 16,
              backgroundColor: "#f6ffed", borderRadius: 8,
              border: "1px solid #b7eb8f",
            }}>
              <Avatar size={40} style={{ backgroundColor: "#52c41a", flexShrink: 0 }}>
                {noteItem.assignedToName?.[0]?.toUpperCase()}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <Typography.Text strong>{noteItem.assignedToName}</Typography.Text>
                  <Tag color="success">Hoàn thành</Tag>
                </div>
                {noteItem.completionNote && (
                  <div style={{
                    padding: "10px 12px", backgroundColor: "#fff",
                    borderRadius: 6, borderLeft: "3px solid #52c41a",
                    marginBottom: noteItem.completionImageUrls?.length > 0 ? 12 : 0,
                  }}>
                    <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {noteItem.completionNote}
                    </Typography.Paragraph>
                  </div>
                )}
                {noteItem.completionImageUrls?.length > 0 && (
                  <div>
                    <Space size={4} align="center" style={{ marginBottom: 8 }}>
                      <PictureOutlined style={{ color: "#8c8c8c" }} />
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Hình ảnh đính kèm ({noteItem.completionImageUrls.length})
                      </Typography.Text>
                    </Space>
                    <Image.PreviewGroup>
                      <Space size={8} wrap>
                        {noteItem.completionImageUrls.map((url, i) => (
                          <Image
                            key={i}
                            src={url}
                            width={80}
                            height={80}
                            style={{ objectFit: "cover", borderRadius: 4, border: "1px solid #f0f0f0" }}
                          />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default SupplementaryTaskTable;
