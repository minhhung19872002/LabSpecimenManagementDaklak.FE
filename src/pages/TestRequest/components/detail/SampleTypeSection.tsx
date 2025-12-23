import React from "react";
import { Row, Col, Space, Typography } from "antd";
import BoolIcon from "./BoolIcon";

const { Title, Text } = Typography;

interface SampleTypeSectionProps {
  data: {
    sampleTypeService?: boolean;
    sampleTypeContract?: boolean;
    sampleTypeTask?: boolean;
    sampleTypeSubContract?: boolean;
    subContract?: string;
  };
}

const SampleTypeSection: React.FC<SampleTypeSectionProps> = ({ data }) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Loại hình mẫu
      </Title>
      <Row gutter={[16, 8]}>
        <Col xs={24}>
          <Space wrap size={[16, 8]}>
            <Space size={4}>
              <BoolIcon value={data.sampleTypeService || false} />
              <Text style={{ fontSize: 13 }}>Dịch vụ</Text>
            </Space>
            <Space size={4}>
              <BoolIcon value={data.sampleTypeContract || false} />
              <Text style={{ fontSize: 13 }}>Hợp đồng</Text>
            </Space>
            <Space size={4}>
              <BoolIcon value={data.sampleTypeTask || false} />
              <Text style={{ fontSize: 13 }}>Nhiệm vụ</Text>
            </Space>
            <Space size={4}>
              <BoolIcon value={data.sampleTypeSubContract || false} />
              <Text style={{ fontSize: 13 }}>Thầu phụ</Text>
            </Space>
          </Space>
        </Col>
      </Row>
      {data.subContract && (
        <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
          <Col xs={24}>
            <div className="detail-item">
              <Text type="secondary">Thầu phụ:</Text>
              <Text>{data.subContract}</Text>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SampleTypeSection;
