import React from "react";
import { Modal, Button, Descriptions, Tag, Card, Timeline } from "antd";
import dayjs from "dayjs";
import { NCRStatus } from "../../../services/ncrService";
import { NCRDisplay, NCR_TYPES, SEVERITY_CONFIG, STATUS_CONFIG } from "../hooks";
import StatusTag from "../../../components/common/StatusTag";

interface NCRDetailModalProps {
  open: boolean;
  ncr: NCRDisplay | null;
  onClose: () => void;
}

const NCRDetailModal: React.FC<NCRDetailModalProps> = ({ open, ncr, onClose }) => {
  if (!ncr) return null;

  const timelineItems = [
    {
      color: "red",
      children: `${dayjs(ncr.reportedAt).format("DD/MM/YYYY HH:mm")} - NCR được tạo`,
    },
    ...(ncr.status !== NCRStatus.Open
      ? [
          {
            color: "blue",
            children: "Đang xử lý - Phân tích nguyên nhân và thực hiện khắc phục",
          },
        ]
      : []),
    ...(ncr.status === NCRStatus.Closed && ncr.closedAt
      ? [
          {
            color: "green",
            children: `${dayjs(ncr.closedAt).format("DD/MM/YYYY HH:mm")} - Đã đóng`,
          },
        ]
      : []),
  ];

  return (
    <Modal
      title={`Chi tiết NCR: ${ncr.ncrNumber}`}
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Đóng</Button>}
      width={800}
      centered
      styles={{ body: { maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" } }}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Mã NCR">{ncr.ncrNumber}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <StatusTag color={STATUS_CONFIG[ncr.status]?.color}>
            {STATUS_CONFIG[ncr.status]?.text}
          </StatusTag>
        </Descriptions.Item>
        <Descriptions.Item label="Tiêu đề" span={2}>
          {ncr.title}
        </Descriptions.Item>
        <Descriptions.Item label="Loại">
          {NCR_TYPES.find((t) => t.value === ncr.type)?.label}
        </Descriptions.Item>
        <Descriptions.Item label="Mức độ">
          <Tag color={SEVERITY_CONFIG[ncr.severity]?.color}>
            {SEVERITY_CONFIG[ncr.severity]?.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Phòng ban">
          {ncr.department || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày báo cáo">
          {dayjs(ncr.reportedAt).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label="Hạn xử lý">
          {dayjs(ncr.dueDate).format("DD/MM/YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Mã liên quan" span={2}>
          {ncr.relatedEntityCode || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả" span={2}>
          {ncr.description}
        </Descriptions.Item>
        {ncr.rootCause && (
          <Descriptions.Item label="Nguyên nhân gốc" span={2}>
            {ncr.rootCause}
          </Descriptions.Item>
        )}
        {ncr.correctiveAction && (
          <Descriptions.Item label="Hành động khắc phục" span={2}>
            {ncr.correctiveAction}
          </Descriptions.Item>
        )}
        {ncr.preventiveAction && (
          <Descriptions.Item label="Hành động phòng ngừa" span={2}>
            {ncr.preventiveAction}
          </Descriptions.Item>
        )}
        {ncr.notes && (
          <Descriptions.Item label="Ghi chú" span={2}>
            {ncr.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Card title="Lịch sử xử lý" style={{ marginTop: 16 }} size="small">
        <Timeline items={timelineItems} />
      </Card>
    </Modal>
  );
};

export default NCRDetailModal;
