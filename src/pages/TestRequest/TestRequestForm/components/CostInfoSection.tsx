// @ts-nocheck
import React from "react";
import { Form, Input, Row, Col, Typography } from "antd";
import { numberToVietnameseWords } from "../../../../utils/numberToWords";

const { Title, Text } = Typography;

interface CostInfoSectionProps {
  totalSampleCost: number;
  sampleTypeTask: boolean;
}

const CostInfoSection: React.FC<CostInfoSectionProps> = ({
  totalSampleCost,
  sampleTypeTask,
}) => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Thông tin chi phí
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24}>
          <div
            style={{
              background: "#e6f7ff",
              padding: "16px",
              borderRadius: 8,
              border: "1px solid #91d5ff",
              textAlign: "center",
            }}
          >
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Tổng chi phí:
            </Text>
            <Text strong style={{ fontSize: 24, color: "#1890ff" }}>
              {sampleTypeTask ? "0" : totalSampleCost.toLocaleString("vi-VN")} đ
            </Text>
          </div>
        </Col>
        <Col xs={24}>
          <Row align="middle">
            <Col xs={6}>
              <Text>Bằng chữ:</Text>
            </Col>
            <Col xs={18}>
              <Input
                size="small"
                value={
                  sampleTypeTask || totalSampleCost === 0
                    ? ""
                    : numberToVietnameseWords(totalSampleCost)
                }
                disabled
              />
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Row align="middle">
            <Col xs={6}>
              <Text>Số phiếu thu:</Text>
            </Col>
            <Col xs={18}>
              <Form.Item name="receiptNumber" style={{ marginBottom: 0 }}>
                <Input size="small" placeholder="Số phiếu thu TTDV..." />
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default CostInfoSection;
