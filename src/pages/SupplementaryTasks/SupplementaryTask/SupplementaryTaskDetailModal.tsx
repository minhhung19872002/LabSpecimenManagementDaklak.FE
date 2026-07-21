import React, { useEffect, useState } from "react";
import { Avatar, Badge, Button, Image, Modal, Space, Spin, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  PictureOutlined,
  ReloadOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  SupplementaryTaskDto,
  SupplementaryTaskLogDto,
  SupplementaryTaskStatus,
  supplementaryTaskService,
} from "../../../services/supplementaryTaskService";
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_LABEL,
  formatDate,
} from "./utils";

const { Text, Paragraph } = Typography;

export interface SupplementaryTaskDetailModalProps {
  open: boolean;
  item?: SupplementaryTaskDto;
  isDirector: boolean;
  onClose: () => void;
  onComplete: (item: SupplementaryTaskDto) => void;
  onApprove: (item: SupplementaryTaskDto) => void;
  onReject: (item: SupplementaryTaskDto) => void;
}

const getStatusTag = (status: SupplementaryTaskStatus) => {
  switch (status) {
    case SupplementaryTaskStatus.WaitingForConfirmation:
      return <Tag color="orange" icon={<SendOutlined />} style={{ margin: 0 }}>Gửi xác nhận</Tag>;
    case SupplementaryTaskStatus.Rejected:
      return <Tag color="red" icon={<CloseCircleOutlined />} style={{ margin: 0 }}>Từ chối</Tag>;
    case SupplementaryTaskStatus.Completed:
      return <Tag color="green" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>Xác nhận hoàn thành</Tag>;
    default:
      return <Tag style={{ margin: 0 }}>{STATUS_LABEL[status]}</Tag>;
  }
};

const getCardColor = (status: SupplementaryTaskStatus) => {
  switch (status) {
    case SupplementaryTaskStatus.Rejected:
      return "#ff4d4f";
    case SupplementaryTaskStatus.Completed:
      return "#52c41a";
    default:
      return "#fa8c16";
  }
};

const SupplementaryTaskDetailModal: React.FC<SupplementaryTaskDetailModalProps> = ({
  open, item, isDirector, onClose, onComplete, onApprove, onReject,
}) => {
  const [logs, setLogs] = useState<SupplementaryTaskLogDto[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (open && item) {
      setLogsLoading(true);
      supplementaryTaskService.getLogs(item.id)
        .then(setLogs)
        .catch(() => setLogs([]))
        .finally(() => setLogsLoading(false));
    } else {
      setLogs([]);
    }
  }, [open, item]);

  const relevantLogs = logs
    .filter(
      (l) =>
        l.newStatus === SupplementaryTaskStatus.WaitingForConfirmation ||
        l.newStatus === SupplementaryTaskStatus.Rejected ||
        l.newStatus === SupplementaryTaskStatus.Completed
    )
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

  if (!item) return null;

  const isDone = item.status === SupplementaryTaskStatus.Completed || item.status === SupplementaryTaskStatus.Cancelled;
  const isWaiting = item.status === SupplementaryTaskStatus.WaitingForConfirmation;
  const isRejected = item.status === SupplementaryTaskStatus.Rejected;
  const canComplete = !isDirector && !isDone && !isWaiting;
  const canApproveReject = isDirector && isWaiting;

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  const renderFooter = () => {
    const buttons: React.ReactNode[] = [
      <Button key="close" onClick={onClose}>
        {canComplete || canApproveReject ? "Hủy" : "Đóng"}
      </Button>,
    ];

    if (canApproveReject) {
      buttons.push(
        <Button key="reject" danger onClick={() => handleAction(() => onReject(item))}>
          Từ chối
        </Button>,
        <Button key="approve" type="primary" icon={<CheckOutlined />} onClick={() => handleAction(() => onApprove(item))}>
          Xác nhận
        </Button>,
      );
    } else if (canComplete) {
      buttons.push(
        <Button
          key="complete"
          type="primary"
          icon={isRejected ? <ReloadOutlined /> : undefined}
          onClick={() => handleAction(() => onComplete(item))}
        >
          {isRejected ? "Gửi lại" : "Hoàn thành"}
        </Button>,
      );
    }

    return <Space>{buttons}</Space>;
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 24 }}>
          <span>Chi tiết công việc</span>
          <Tag
            color={PRIORITY_COLOR[item.priority]}
            style={{ borderRadius: 12, margin: 0, fontWeight: 500 }}
          >
            {PRIORITY_LABEL[item.priority]}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={renderFooter()}
      width={700}
      centered
      destroyOnClose
      styles={{
        body: { padding: "16px 16px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" },
      }}
    >
      {/* Info row */}
      <div className="detail-modal-info-row">
        <div className="detail-modal-info-item">
          <Text type="secondary" className="detail-modal-label">Tên công việc</Text>
          <Text strong>{item.title}</Text>
        </div>
        <div className="detail-modal-info-item" style={{ textAlign: "right" }}>
          <Text type="secondary" className="detail-modal-label">Ngày yêu cầu hoàn thành</Text>
          <Text strong>{formatDate(item.dueDate)}</Text>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <div style={{ marginTop: 20 }}>
          <Text type="secondary" className="detail-modal-label">Mô tả:</Text>
          <Paragraph style={{ marginTop: 8, marginBottom: 0, whiteSpace: "pre-wrap" }}>
            {item.description}
          </Paragraph>
        </div>
      )}

      {/* Images */}
      {item.imageUrls?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Text type="secondary" className="detail-modal-label">Hình ảnh</Text>
          <div style={{ marginTop: 8 }}>
            <Image.PreviewGroup>
              <Space size={8} wrap>
                {item.imageUrls.map((url, i) => (
                  <Image
                    key={i}
                    src={url}
                    width={80}
                    height={80}
                    style={{ objectFit: "cover", borderRadius: 6, border: "1px solid #f0f0f0" }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </div>
        </div>
      )}

      {/* History section */}
      {relevantLogs.length > 0 && (
        <div className="detail-modal-history-section">
          <div className="detail-modal-history-header">
            <Space size={8}>
              <HistoryOutlined style={{ color: "#fa8c16" }} />
              <Text strong>Lịch sử kết quả</Text>
              <Text type="secondary">— {item.title}</Text>
            </Space>
          </div>

          <Spin spinning={logsLoading}>
            <div style={{ marginTop: 12 }}>
              {relevantLogs.map((log, index) => (
                <div key={log.id}>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: 16,
                      backgroundColor: index === 0 ? "#fff7e6" : "#fafafa",
                      borderRadius: 8,
                      border: index === 0 ? "1px solid #ffd591" : "1px solid #f0f0f0",
                    }}
                  >
                    <Avatar
                      size={40}
                      style={{
                        backgroundColor: index === 0 ? getCardColor(log.newStatus) : "#bfbfbf",
                        flexShrink: 0,
                      }}
                    >
                      {log.changedByName?.[0]?.toUpperCase()}
                    </Avatar>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <Text strong style={{ fontSize: 14 }}>{log.changedByName}</Text>
                          {getStatusTag(log.newStatus)}
                          {index === 0 && (
                            <Badge count="Mới nhất" style={{ backgroundColor: "#fa8c16", fontSize: 11 }} />
                          )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                          {dayjs(log.changedAt).format("DD/MM/YYYY HH:mm")}
                        </Text>
                      </div>

                      {log.note && (
                        <div
                          style={{
                            padding: "10px 12px",
                            backgroundColor: "#fff",
                            borderRadius: 6,
                            borderLeft: `3px solid ${getCardColor(log.newStatus)}`,
                          }}
                        >
                          <Paragraph
                            style={{ margin: 0, color: "#595959" }}
                            ellipsis={{ rows: 3, expandable: true, symbol: "Xem thêm" }}
                          >
                            {log.note}
                          </Paragraph>
                        </div>
                      )}

                      {log.imageUrls?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <Space size={4} align="center" style={{ marginBottom: 8 }}>
                            <PictureOutlined style={{ color: "#8c8c8c" }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Hình ảnh đính kèm ({log.imageUrls.length})
                            </Text>
                          </Space>
                          <Image.PreviewGroup>
                            <Space size={8} wrap>
                              {log.imageUrls.map((url, i) => (
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

                  {index < relevantLogs.length - 1 && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                      <div style={{ width: 2, height: 20, backgroundColor: "#e8e8e8" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Spin>
        </div>
      )}
    </Modal>
  );
};

export default SupplementaryTaskDetailModal;
