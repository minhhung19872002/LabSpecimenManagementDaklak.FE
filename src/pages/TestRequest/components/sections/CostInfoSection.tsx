import React from "react";
import { Row, Col, Typography, Button } from "antd";
import { HistoryOutlined } from "../../../../components/common/Icon";
import { TestRequestDto } from "../../../../types/testRequest";
import { numberToVietnameseWords } from "../../../../utils/numberToWords";

const { Title, Text } = Typography;

interface CostInfoSectionProps {
  data: TestRequestDto;
  onViewCostHistory?: () => void;
}

const CostInfoSection: React.FC<CostInfoSectionProps> = ({
  data,
  onViewCostHistory,
}) => {
  // Mẫu nhiệm vụ: Không cần thanh toán
  const isTaskSample = data.sampleTypeTask;
  const displayCost = isTaskSample ? 0 : data.totalCost || 0;

  return (
    <>
      <div className="detail-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Thông tin chi phí
          </Title>
          {onViewCostHistory && !isTaskSample && (
            <Button
              type="link"
              icon={<HistoryOutlined />}
              onClick={onViewCostHistory}
              size="small"
            >
              Xem lịch sử thay đổi
            </Button>
          )}
        </div>
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
                {displayCost.toLocaleString("vi-VN")} đ
              </Text>
            </div>
          </Col>
          {!isTaskSample && displayCost > 0 && (
            <Col xs={24}>
              <div className="detail-item">
                <Text type="secondary">Bằng chữ:</Text>
                <Text italic>{numberToVietnameseWords(displayCost)}</Text>
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
