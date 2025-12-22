import React from "react";
import { Modal, Typography, Spin, Empty, Badge, Avatar } from "antd";
import { HistoryOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetRejectionHistoryQuery } from "../../../store/api/testingApi";

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
  // RTK Query hook - only fetch when modal is visible and indicatorId is provided
  const { data: histories = [], isLoading: loading } = useGetRejectionHistoryQuery(indicatorId, {
    skip: !visible || !indicatorId,
  });

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HistoryOutlined style={{ fontSize: 18, color: "#fa8c16" }} />
          <span>Lịch sử từ chối</span>
          {indicatorName && (
            <Text type="secondary" style={{ fontWeight: "normal", fontSize: 14 }}>
              - {indicatorName}
            </Text>
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <Text strong style={{ fontSize: 14 }}>
                          {item.rejectedByName || "N/A"}
                        </Text>
                        {index === 0 && (
                          <Badge
                            count="Mới nhất"
                            style={{
                              backgroundColor: "#fa8c16",
                              marginLeft: 8,
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
                        borderLeft: `3px solid ${index === 0 ? "#fa8c16" : "#d9d9d9"}`,
                      }}
                    >
                      <Paragraph
                        style={{ margin: 0, color: "#595959" }}
                        ellipsis={{ rows: 3, expandable: true, symbol: "Xem thêm" }}
                      >
                        {item.rejectionReason || "Không có lý do"}
                      </Paragraph>
                    </div>
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
