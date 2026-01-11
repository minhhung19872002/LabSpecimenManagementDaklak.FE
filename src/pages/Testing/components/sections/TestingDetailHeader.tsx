import React from "react";
import { Card, Row, Col, Space, Typography } from "antd";
import { ExperimentOutlined } from "../../../../components/common/Icon";
import { TestingDetailDto } from "../../../../types/testing";
import { getStatusTag } from "./shared";

const { Title, Text } = Typography;

interface TestingDetailHeaderProps {
  detail: TestingDetailDto;
}

const TestingDetailHeader: React.FC<TestingDetailHeaderProps> = ({ detail }) => {
  return (
    <Card style={{ marginBottom: 16 }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Space direction="vertical" size={0}>
            <Title level={4} style={{ margin: 0 }}>
              <ExperimentOutlined style={{ marginRight: 8 }} />
              Số hợp đồng: {detail.contractNumber || "N/A"}
            </Title>
            <Space>
              {getStatusTag(detail.testingStatus)}
              <Text type="secondary">
                KTV: {detail.technicianNames || "Chưa có"}
              </Text>
              <Text type="secondary">|</Text>
              <Text type="secondary">
                Khoa phòng: {detail.laboratoryName || "N/A"}
              </Text>
            </Space>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default TestingDetailHeader;
