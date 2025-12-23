import React from "react";
import { Card, Button, Space, Row, Col, Typography, Tag, Divider } from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  LaboratoryTaskStatus,
  LaboratoryTaskStatusLabels,
  LaboratoryTaskStatusColors,
} from "../../../../types/laboratoryTask";

const { Title, Text } = Typography;

interface TaskDetailHeaderProps {
  task: {
    testRequestNumber?: string;
    contractNumber?: string;
    laboratoryName?: string;
    technicalManagerName?: string;
    status: LaboratoryTaskStatus;
    transferDate?: string;
    requestCompletionDate?: string;
    testDate?: string;
  };
  allSamplesApproved: boolean;
  actionLoading: boolean;
  onBack: () => void;
  onSendResults: () => void;
}

const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({
  task,
  allSamplesApproved,
  actionLoading,
  onBack,
  onSendResults,
}) => {
  const getStatusTag = (status: LaboratoryTaskStatus) => (
    <Tag color={LaboratoryTaskStatusColors[status]}>
      {LaboratoryTaskStatusLabels[status]}
    </Tag>
  );

  return (
    <Card style={{ marginBottom: 16 }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              Quay lại
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              Số nhận mẫu giao việc: {task.testRequestNumber}
            </Title>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<SendOutlined />}
            disabled={
              !allSamplesApproved ||
              task.status === LaboratoryTaskStatus.ResultSent
            }
            loading={actionLoading}
            onClick={onSendResults}
          >
            Gửi kết quả
          </Button>
        </Col>
      </Row>

      <div style={{ marginTop: 12 }}>
        <Space split={<Divider type="vertical" />}>
          <Text>
            Số hợp đồng: <Text strong>{task.contractNumber || "-"}</Text>
          </Text>
          <Text>
            Khoa phòng: <Text strong>{task.laboratoryName || "-"}</Text>
          </Text>
          <Text>
            QLKT: <Text strong>{task.technicalManagerName || "-"}</Text>
          </Text>
          {getStatusTag(task.status)}
        </Space>
      </div>

      <div style={{ marginTop: 8 }}>
        <Space split={<Divider type="vertical" />}>
          <Text type="secondary">
            Ngày chuyển:{" "}
            {task.transferDate
              ? dayjs(task.transferDate).format("DD/MM/YYYY")
              : "-"}
          </Text>
          <Text type="secondary">
            Ngày YC xong:{" "}
            {task.requestCompletionDate
              ? dayjs(task.requestCompletionDate).format("DD/MM/YYYY")
              : "-"}
          </Text>
          <Text type="secondary">
            Ngày TN:{" "}
            {task.testDate
              ? dayjs(task.testDate).format("DD/MM/YYYY")
              : "Chưa đặt"}
          </Text>
        </Space>
      </div>
    </Card>
  );
};

export default TaskDetailHeader;
