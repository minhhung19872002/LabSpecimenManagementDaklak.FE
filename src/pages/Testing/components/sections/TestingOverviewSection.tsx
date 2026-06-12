import React from "react";
import { Card, Row, Col, Typography, Tooltip } from "antd";
import { TestingDetailDto, TestingSampleDto } from "../../../../types/testing";
import { formatDateVN } from "../../../../utils/formatters";

const { Title, Text } = Typography;

interface TestingOverviewSectionProps {
  detail: TestingDetailDto;
  sortedSamples: TestingSampleDto[];
  isUrgent: boolean;
}

const TestingOverviewSection: React.FC<TestingOverviewSectionProps> = ({
  detail,
  sortedSamples,
  isUrgent,
}) => {
  return (
    <Card
      className="testing-detail-header"
      style={{
        marginBottom: 16,
        background: "#FAFAFA",
        borderColor: "#D9D9D9",
      }}
    >
      <Title
        level={5}
        className="testing-section-title"
        style={{ margin: "0 0 16px 0" }}
      >
        Thông tin tổng quan
      </Title>
      <Row gutter={[48, 16]}>
        <Col xs={24} md={12}>
          <div className="testing-overview-items">
            <Row className="testing-overview-row">
              <Col flex="150px">
                <Text type="secondary">Quản lý kỹ thuật:</Text>
              </Col>
              <Col flex="auto">
                <Text>{detail.technicalManagerName || "N/A"}</Text>
              </Col>
            </Row>
            <Row className="testing-overview-row">
              <Col flex="150px">
                <Text type="secondary">Ngày YC hoàn thành:</Text>
              </Col>
              <Col flex="auto">
                <Text
                  style={{
                    color: isUrgent ? "#ff4d4f" : undefined,
                    fontWeight: isUrgent ? "bold" : undefined,
                  }}
                >
                  {detail.requestCompletionDate
                    ? new Date(detail.requestCompletionDate).toLocaleDateString(
                        "vi-VN",
                      )
                    : "N/A"}
                </Text>
              </Col>
            </Row>
            <Row className="testing-overview-row">
              <Col flex="150px">
                <Text type="secondary">Ngày gửi KP:</Text>
              </Col>
              <Col flex="auto">
                <Text>{formatDateVN(detail.underReviewDate)}</Text>
              </Col>
            </Row>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="testing-overview-items">
            <Row className="testing-overview-row">
              <Col flex="150px">
                <Text type="secondary">Mẫu được phân công:</Text>
              </Col>
              <Col flex="auto">
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {sortedSamples.map((sample) => (
                    <li key={sample.sampleId} style={{ marginBottom: 2 }}>
                      <Text strong>{sample.sampleCode}</Text>
                      <Text type="secondary"> - </Text>
                      <Tooltip title={sample.sampleName}>
                        <Text type="secondary">{sample.sampleName}</Text>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </Col>
            </Row>
            <Row className="testing-overview-row">
              <Col flex="150px">
                <Text type="secondary">Số chỉ tiêu:</Text>
              </Col>
              <Col flex="auto">
                <Text strong style={{ color: "#52c41a" }}>
                  {detail.completedIndicatorCount}
                </Text>
                <Text type="secondary">
                  {" "}
                  / {detail.totalIndicatorCount} đã hoàn thành
                </Text>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default TestingOverviewSection;
