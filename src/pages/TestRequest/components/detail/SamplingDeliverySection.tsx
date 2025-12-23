import React from "react";
import { Row, Col, Space, Typography } from "antd";
import dayjs from "dayjs";
import { SamplingRequirement, SampleStorageOption } from "../../../../types/testRequest";
import { SAMPLING_REQUIREMENT_MAP, SAMPLE_STORAGE_MAP } from "../../constants";
import BoolIcon from "./BoolIcon";

const { Title, Text } = Typography;

interface SamplingDeliverySectionProps {
  data: {
    samplingRequirement?: SamplingRequirement;
    sampleStorage?: SampleStorageOption;
    deliveryDirectPickup?: boolean;
    deliveryPostal?: boolean;
    returnStoredSample?: boolean;
    resultDeliveryDate?: string;
    expectedCompletionDate?: string;
  };
}

const SamplingDeliverySection: React.FC<SamplingDeliverySectionProps> = ({ data }) => {
  const getSamplingRequirementText = (req: SamplingRequirement) => {
    return SAMPLING_REQUIREMENT_MAP[req] || "KH tự lấy mẫu";
  };

  const getSampleStorageText = (opt: SampleStorageOption) => {
    return SAMPLE_STORAGE_MAP[opt] || "Không";
  };

  return (
    <div className="detail-section" style={{ marginTop: 16 }}>
      <Title level={5} style={{ marginBottom: 12 }}>
        Yêu cầu về lấy mẫu & giao trả
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} sm={12}>
          <div className="detail-item">
            <Text type="secondary">Lấy mẫu:</Text>
            <Text>
              {getSamplingRequirementText(data.samplingRequirement!)}
            </Text>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div className="detail-item">
            <Text type="secondary">Lưu mẫu:</Text>
            <Text>{getSampleStorageText(data.sampleStorage!)}</Text>
          </div>
        </Col>
        <Col xs={24}>
          <Space wrap size={[16, 8]}>
            <Space size={4}>
              <BoolIcon value={data.deliveryDirectPickup || false} />
              <Text style={{ fontSize: 13 }}>Nhận trực tiếp</Text>
            </Space>
            <Space size={4}>
              <BoolIcon value={data.deliveryPostal || false} />
              <Text style={{ fontSize: 13 }}>Gửi bưu điện</Text>
            </Space>
            <Space size={4}>
              <BoolIcon value={data.returnStoredSample || false} />
              <Text style={{ fontSize: 13 }}>Trả lại mẫu lưu</Text>
            </Space>
          </Space>
        </Col>
        <Col xs={24} sm={12}>
          <div className="detail-item">
            <Text type="secondary">Ngày trả KQ:</Text>
            <Text strong style={{ color: "#1890ff" }}>
              {data.resultDeliveryDate
                ? dayjs(data.resultDeliveryDate).format("DD/MM/YYYY")
                : "-"}
            </Text>
          </div>
        </Col>
        <Col xs={24} sm={12}>
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
