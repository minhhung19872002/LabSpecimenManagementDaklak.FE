import React, { useState, useEffect } from "react";
import { Modal, Typography, Spin, Empty, Badge, Avatar, Image, Space, Tag } from "antd";
import { HistoryOutlined, UserOutlined, PictureOutlined, StopOutlined, CloseCircleOutlined } from "../../../components/common/Icon";
import dayjs from "dayjs";
import { testingService } from "../../../services/testingService";
import { RejectionHistoryDto } from "../../../types/testing";
import { API_BASE_URL } from "../../../services/api";
import { IndicatorName } from "../../../components/common";

const { Text, Paragraph } = Typography;

interface RejectionHistoryModalProps {
  visible: boolean;
  indicatorId: string;
  indicatorName?: string;
  onClose: () => void;
}

const RejectionHistoryModal: React.FC<RejectionHistoryModalProps> = ({
  visible,
  indicatorId,
  indicatorName,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [histories, setHistories] = useState<RejectionHistoryDto[]>([]);

  useEffect(() => {
    if (visible && indicatorId) {
      loadHistory();
    }
  }, [visible, indicatorId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await testingService.getRejectionHistory(indicatorId);
      setHistories(result);
    } catch (error) {
      console.error("Failed to load rejection history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HistoryOutlined style={{ fontSize: 18, color: "#fa8c16" }} />
          <span>Lịch sử từ chối</span>
          {indicatorName && (
            <span style={{ fontWeight: "normal", fontSize: 14, color: "rgba(0, 0, 0, 0.45)" }}>
              - <IndicatorName name={indicatorName} />
            </span>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      styles={{
        body: { padding: "16px 24px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" },
      }}
      centered
    >
      <Spin spinning={loading}>
        {histories.length === 0 ? (
          <Empty description="Không có lịch sử từ chối" />
        ) : (
          <div>
            {histories.map((item, index) => (
              <div key={item.id || index}>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "16px",
                    backgroundColor: index === 0 ? "#fff7e6" : "#fafafa",
                    borderRadius: 8,
                    border: index === 0 ? "1px solid #ffd591" : "1px solid #f0f0f0",
                    position: "relative",
                  }}
                >
                  {/* Avatar */}
                  <Avatar
                    size={40}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: index === 0 ? "#fa8c16" : "#bfbfbf",
                      flexShrink: 0,
                    }}
                  />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Text strong style={{ fontSize: 14 }}>
                          {item.rejectedByName || "N/A"}
                        </Text>
                        {/* Badge phân biệt loại */}
                        {item.isCannotTest ? (
                          <Tag color="orange" icon={<StopOutlined />} style={{ margin: 0 }}>
                            KTV báo không TN được
                          </Tag>
                        ) : (
                          <Tag color="red" icon={<CloseCircleOutlined />} style={{ margin: 0 }}>
                            {item.reportedByRole === "QualityManager" ? "QLCL từ chối" : "QLKT từ chối"}
                          </Tag>
                        )}
                        {index === 0 && (
                          <Badge
                            count="Mới nhất"
                            style={{
                              backgroundColor: "#fa8c16",
                              fontSize: 11,
                            }}
                          />
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {dayjs(item.rejectedDate).format("DD/MM/YYYY HH:mm")}
                      </Text>
                    </div>

                    {/* Reason */}
                    <div
                      style={{
                        padding: "10px 12px",
                        backgroundColor: "#fff",
                        borderRadius: 6,
                        borderLeft: `3px solid ${item.isCannotTest ? "#fa8c16" : "#ff4d4f"}`,
                      }}
                    >
                      <Paragraph
                        style={{ margin: 0, color: "#595959" }}
                        ellipsis={{ rows: 3, expandable: true, symbol: "Xem thêm" }}
                      >
                        {item.rejectionReason || "Không có lý do"}
                      </Paragraph>
                    </div>

                    {/* Images */}
                    {item.images && item.images.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <Space size={4} align="center" style={{ marginBottom: 8 }}>
                          <PictureOutlined style={{ color: "#8c8c8c" }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Hình ảnh đính kèm ({item.images.length})
                          </Text>
                        </Space>
                        <Image.PreviewGroup>
                          <Space size={8} wrap>
                            {item.images.map((img) => (
                              <Image
                                key={img.id}
                                src={`${API_BASE_URL}${img.url}`}
                                alt={img.fileName}
                                width={80}
                                height={80}
                                style={{
                                  objectFit: "cover",
                                  borderRadius: 4,
                                  border: "1px solid #f0f0f0",
                                }}
                                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                              />
                            ))}
                          </Space>
                        </Image.PreviewGroup>
                      </div>
                    )}
                  </div>
                </div>

                {index < histories.length - 1 && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                    <div
                      style={{
                        width: 2,
                        height: 20,
                        backgroundColor: "#e8e8e8",
                      }}
                    />
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

export default RejectionHistoryModal;
