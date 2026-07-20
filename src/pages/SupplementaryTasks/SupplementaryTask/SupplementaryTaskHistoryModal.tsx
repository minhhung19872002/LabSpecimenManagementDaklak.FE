import React, { useEffect, useState } from "react";
import { Avatar, Badge, Empty, Image, message, Modal, Space, Spin, Tag, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined, PictureOutlined, SendOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  SupplementaryTaskDto,
  SupplementaryTaskLogDto,
  SupplementaryTaskStatus,
  supplementaryTaskService,
} from "../../../services/supplementaryTaskService";
import { STATUS_LABEL } from "./utils";

const { Text, Paragraph } = Typography;

export interface SupplementaryTaskHistoryModalProps {
  open: boolean;
  item?: SupplementaryTaskDto;
  onClose: () => void;
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

const SupplementaryTaskHistoryModal: React.FC<SupplementaryTaskHistoryModalProps> = ({
  open, item, onClose,
}) => {
  const [logs, setLogs] = useState<SupplementaryTaskLogDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && item) {
      setLoading(true);
      supplementaryTaskService.getLogs(item.id)
        .then(setLogs)
        .catch(() => { setLogs([]); message.error("Không thể tải lịch sử"); })
        .finally(() => setLoading(false));
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

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HistoryOutlined style={{ fontSize: 18, color: "#fa8c16" }} />
          <span>Lịch sử kết quả</span>
          {item?.title && (
            <span style={{ fontWeight: "normal", fontSize: 14, color: "rgba(0, 0, 0, 0.45)" }}>
              — {item.title}
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      styles={{
        body: { padding: "16px 24px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" },
      }}
      centered
      destroyOnClose
    >
      <Spin spinning={loading}>
        {relevantLogs.length === 0 ? (
          <Empty description="Chưa có lịch sử" />
        ) : (
          <div>
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
        )}
      </Spin>
    </Modal>
  );
};

export default SupplementaryTaskHistoryModal;
