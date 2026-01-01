import React from "react";
import { Row, Col, Space, Typography } from "antd";
import { TestRequestDto } from "../../../../types/testRequest";
import { BoolItem } from "./shared";

const { Title, Text } = Typography;

interface SampleTypeSectionProps {
  data: TestRequestDto;
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
            <BoolItem value={data.sampleTypeService} label="Dịch vụ" />
            <BoolItem value={data.sampleTypeContract} label="Hợp đồng" />
            <BoolItem value={data.sampleTypeTask} label="Nhiệm vụ" />
            <BoolItem value={data.sampleTypeSubContract} label="Thầu phụ" />
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
