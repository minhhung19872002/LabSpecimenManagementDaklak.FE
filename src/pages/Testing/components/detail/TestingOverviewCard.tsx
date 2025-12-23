import React from "react";
import { Card, Descriptions, Row, Col, Typography, Tooltip } from "antd";
import { TestingSampleDto } from "../../../../types/testing";

const { Title, Text } = Typography;

interface TestingOverviewCardProps {
  customerName?: string;
  technicalManagerName?: string;
  requestCompletionDate?: string;
  sortedSamples: TestingSampleDto[];
  completedIndicatorCount: number;
  totalIndicatorCount: number;
}

const TestingOverviewCard: React.FC<TestingOverviewCardProps> = ({
  customerName,
  technicalManagerName,
  requestCompletionDate,
  sortedSamples,
  completedIndicatorCount,
  totalIndicatorCount,
}) => {
  return (
    <Card title="Thông tin tổng quan" style={{ marginBottom: 16 }}>
      <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
        <Descriptions.Item label="Khách hàng">
          {customerName || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Quản lý kỹ thuật">
          {technicalManagerName || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày YC hoàn thành">
          {requestCompletionDate
            ? new Date(requestCompletionDate).toLocaleDateString("vi-VN")
            : "N/A"}
        </Descriptions.Item>
      </Descriptions>

      <Row gutter={[24, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Title level={5}>Mẫu được phân công</Title>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {sortedSamples.map((sample) => (
              <li key={sample.sampleId} style={{ marginBottom: 4 }}>
                <Text strong style={{ whiteSpace: "nowrap" }}>
                  {sample.sampleCode}
                </Text>
                <Text type="secondary"> - </Text>
                <Tooltip title={sample.sampleName}>
                  <Text
                    type="secondary"
                    style={{
                      display: "inline-block",
                      maxWidth: "calc(100% - 120px)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      verticalAlign: "bottom",
                    }}
                  >
                    {sample.sampleName}
                  </Text>
                </Tooltip>
              </li>
            ))}
          </ul>
        </Col>
        <Col span={12}>
          <Title level={5}>Số chỉ tiêu</Title>
          <Text>
            <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
              {completedIndicatorCount}
            </Text>
            <Text type="secondary"> / {totalIndicatorCount}</Text>
            <Text type="secondary"> đã hoàn thành</Text>
          </Text>
        </Col>
      </Row>
    </Card>
  );
};

export default TestingOverviewCard;
