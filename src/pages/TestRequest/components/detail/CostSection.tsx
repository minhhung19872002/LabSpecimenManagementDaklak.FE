import React from "react";
import { Row, Col, Typography } from "antd";

const { Title, Text } = Typography;

interface CostSectionProps {
  data: {
    totalCost?: number;
    totalCostInWords?: string;
  };
}

const CostSection: React.FC<CostSectionProps> = ({ data }) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
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
              {(data.totalCost || 0).toLocaleString("vi-VN")} đ
            </Text>
          </div>
        </Col>
        {data.totalCostInWords && (
          <Col xs={24}>
            <div className="detail-item">
              <Text type="secondary">Bằng chữ:</Text>
              <Text italic>{data.totalCostInWords}</Text>
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default CostSection;
