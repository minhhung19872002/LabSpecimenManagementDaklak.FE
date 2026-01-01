import React from "react";
import { Row, Col, Space, Typography } from "antd";
import dayjs from "dayjs";
import { TestRequestDto } from "../../../../types/testRequest";
import { formatDate } from "../../../../utils/formatters";
import { BoolItem, getSamplingRequirementText, getSampleStorageText } from "./shared";

const { Title, Text } = Typography;

interface SamplingDeliverySectionProps {
  data: TestRequestDto;
}

const SamplingDeliverySection: React.FC<SamplingDeliverySectionProps> = ({
  data,
}) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Yêu cầu về lấy mẫu & giao trả
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} xl={12}>
          <div className="detail-item">
            <Text type="secondary">Lấy mẫu:</Text>
            <Text>{getSamplingRequirementText(data.samplingRequirement)}</Text>
          </div>
        </Col>
        <Col xs={24} xl={12}>
          <div className="detail-item">
            <Text type="secondary">Lưu mẫu:</Text>
            <Text>{getSampleStorageText(data.sampleStorage)}</Text>
          </div>
        </Col>
        <Col span={24}>
          <Space wrap size={[16, 8]}>
            <BoolItem value={data.deliveryDirectPickup} label="Nhận trực tiếp" />
            <BoolItem value={data.deliveryPostal} label="Gửi bưu điện" />
            <BoolItem value={data.returnStoredSample} label="Trả lại mẫu lưu" />
          </Space>
        </Col>
        <Col span={24}>
          <div className="detail-item">
            <Text type="secondary">Ngày trả KQ:</Text>
            <Text strong style={{ color: "#1890ff" }}>
              {formatDate(data.resultDeliveryDate)}
            </Text>
          </div>
        </Col>
        <Col span={24}>
          <div className="detail-item">
            <Text type="secondary">Ngày hoàn thành dự kiến:</Text>
            <Text strong style={{ color: "#52c41a" }}>
              {data.expectedCompletionDate
                ? dayjs(data.expectedCompletionDate).format("DD/MM/YYYY")
                : "-"}
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SamplingDeliverySection;
