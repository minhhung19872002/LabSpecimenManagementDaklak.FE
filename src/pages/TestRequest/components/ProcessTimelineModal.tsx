import React, { useEffect, useState } from "react";
import { Modal, Timeline, Typography, Spin, message } from "antd";
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons";
import { TestRequestTimelineDto, TimelineStepDto } from "../../../types/testRequest";
import { testRequestService } from "../../../services/testRequestService";
import { formatDateTime } from "../../../utils/formatters";

const { Text } = Typography;

interface ProcessTimelineModalProps {
  open: boolean;
  onClose: () => void;
  testRequestId: string;
}

const ProcessTimelineModal: React.FC<ProcessTimelineModalProps> = ({
  open,
  onClose,
  testRequestId,
}) => {
  const [loading, setLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<TestRequestTimelineDto | null>(null);

  useEffect(() => {
    if (open && testRequestId) {
      loadTimeline();
    }
  }, [open, testRequestId]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const data = await testRequestService.getTimeline(testRequestId);
      setTimelineData(data);
    } catch (error) {
      message.error("Không thể tải tiến trình");
      console.error("Error loading timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimelineDot = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleFilled style={{ fontSize: 18, color: "#1890ff" }} />;
      case "current":
        return <ClockCircleFilled style={{ fontSize: 18, color: "#faad14" }} />;
      case "pending":
        return <ClockCircleFilled style={{ fontSize: 18, color: "#d9d9d9" }} />;
      default:
        return undefined;
    }
  };

  // Get date label based on step title
  const getDateLabel = (title: string): string => {
    switch (title) {
      case "Mới":
        return "Ngày tạo";
      case "Chờ xử lý":
        return "Ngày tạo";
      case "Đã gửi mẫu":
        return "Ngày gửi";
      case "Đang thử nghiệm":
        return "Ngày tạo";
      case "Chờ phê duyệt KQ":
        return "Ngày tạo";
      case "Đã phê duyệt":
        return "Ngày duyệt";
      case "Đã gửi kết quả":
        return "Ngày tạo";
      case "Hoàn thành":
        return "Ngày hoàn thành";
      default:
        return "Ngày";
    }
  };

  // Get user label based on step title
  const getUserLabel = (title: string): string => {
    switch (title) {
      case "Mới":
        return "Người tạo";
      case "Chờ xử lý":
        return "Người tạo";
      case "Đã gửi mẫu":
        return ""; // No user label, shows laboratories instead
      case "Đang thử nghiệm":
        return ""; // No user label for this step
      case "Chờ phê duyệt KQ":
        return "Người duyệt";
      case "Đã phê duyệt":
        return "Người duyệt";
      case "Đã gửi kết quả":
        return "Người gửi";
      case "Hoàn thành":
        return ""; // No user label for completion
      default:
        return "Người thực hiện";
    }
  };

  const renderStepContent = (step: TimelineStepDto) => {
    const dateLabel = getDateLabel(step.title);
    const userLabel = getUserLabel(step.title);
    const isPending = step.status === "pending";

    return (
      <div style={{ paddingBottom: 8 }}>
        <Text
          strong
          style={{
            color: isPending ? "#999" : "#000",
            fontSize: 15,
            display: "block",
          }}
        >
          {step.title}
        </Text>
        {step.date && !isPending && (
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {dateLabel}: {formatDateTime(step.date)}
          </Text>
        )}
        {step.userName && userLabel && !isPending && (
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {userLabel}: {step.userName}
          </Text>
        )}
        {step.extraInfo && step.extraInfo.length > 0 && !isPending && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              Khoa phòng:
            </Text>
            {step.extraInfo.map((info, idx) => (
              <Text
                key={idx}
                type="secondary"
                style={{ fontSize: 12, display: "block", paddingLeft: 8 }}
              >
                - {info}
              </Text>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title="Tiến trình hợp đồng"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      styles={{
        mask: { width: "100%" },
        wrapper: { width: "100%" },
      }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : timelineData ? (
        <Timeline
          style={{ marginTop: 24, paddingLeft: 8 }}
          items={timelineData.steps.map((step) => ({
            dot: getTimelineDot(step.status),
            children: renderStepContent(step),
          }))}
        />
      ) : null}
    </Modal>
  );
};

export default ProcessTimelineModal;
