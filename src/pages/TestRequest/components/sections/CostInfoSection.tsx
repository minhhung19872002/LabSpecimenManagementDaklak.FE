import React from "react";
import { Row, Col, Typography } from "antd";
import { TestRequestDto } from "../../../../types/testRequest";

const { Title, Text } = Typography;

interface CostInfoSectionProps {
  data: TestRequestDto;
}

const CostInfoSection: React.FC<CostInfoSectionProps> = ({ data }) => {
  return (
    <>
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

      {data.notes && (
        <div className="detail-section" style={{ marginTop: 16 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            Ghi chú
          </Title>
          <Text>{data.notes}</Text>
        </div>
      )}

      {data.subcontractor && (
        <div className="detail-section" style={{ marginTop: 16 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            Nhà thầu phụ
          </Title>
          <Text>{data.subcontractor}</Text>
        </div>
      )}
    </>
  );
};

export default CostInfoSection;
