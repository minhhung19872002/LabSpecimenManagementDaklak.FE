import React from "react";
import { Card, Button, Space, Row, Col, Tag, Typography } from "antd";
import {
  ArrowLeftOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  TestingStatus,
  TestingStatusLabels,
  TestingStatusColors,
} from "../../../../types/testing";

const { Title, Text } = Typography;

interface TestingDetailHeaderProps {
  contractNumber?: string;
  testingStatus: TestingStatus;
  technicianNames?: string;
  laboratoryName?: string;
  allApproved: boolean;
  allSubmittedOrApproved: boolean;
  onBack: () => void;
}

const STATUS_ICONS: Record<TestingStatus, React.ReactNode> = {
  [TestingStatus.Todo]: <ClockCircleOutlined />,
  [TestingStatus.InProgress]: <SyncOutlined spin />,
  [TestingStatus.Done]: <CheckCircleOutlined />,
};

const TestingDetailHeader: React.FC<TestingDetailHeaderProps> = ({
  contractNumber,
  testingStatus,
  technicianNames,
  laboratoryName,
  allApproved,
  allSubmittedOrApproved,
  onBack,
}) => {
  const getStatusTag = (status: TestingStatus) => {
    const label = TestingStatusLabels[status];
    const color = TestingStatusColors[status];
    const icon = STATUS_ICONS[status];

    return (
      <Tag color={color} icon={icon} style={{ fontSize: 14, padding: "4px 12px" }}>
        {label}
      </Tag>
    );
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Quay lại
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={4} style={{ margin: 0 }}>
                <ExperimentOutlined style={{ marginRight: 8 }} />
                Số hợp đồng: {contractNumber || "N/A"}
              </Title>
              <Space>
                {getStatusTag(testingStatus)}
                <Text type="secondary">KTV: {technicianNames || "Chưa có"}</Text>
                <Text type="secondary">|</Text>
                <Text type="secondary">Khoa phòng: {laboratoryName || "N/A"}</Text>
              </Space>
            </Space>
          </Col>
          <Col>
            {allApproved && (
              <Tag color="success" style={{ fontSize: 14, padding: "8px 16px" }}>
                <CheckCircleOutlined /> Tất cả đã phê duyệt
              </Tag>
            )}
            {allSubmittedOrApproved && !allApproved && (
              <Tag color="processing" style={{ fontSize: 14, padding: "8px 16px" }}>
                <ClockCircleOutlined /> Đang chờ phê duyệt
              </Tag>
            )}
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default TestingDetailHeader;
