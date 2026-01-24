import React from "react";
import { Tag, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "../../../../components/common/Icon";
import { TestRequestDto } from "../../../../types/testRequest";

const { Title, Text } = Typography;

interface SampleTypeSectionProps {
  data: TestRequestDto;
}

const SampleTypeTag: React.FC<{ value: boolean; label: string }> = ({ value, label }) => (
  <Tag
    icon={value ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
    style={{
      backgroundColor: value ? "#F6FFED" : "#FFFFFF",
      color: value ? "#52C41A" : "#8C8C8C",
      border: value ? "1px solid #B7EB8F" : "1px solid #D9D9D9",
      borderRadius: 18,
      padding: "4px 12px",
      margin: 0,
      width: "fit-content",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}
  >
    {label}
  </Tag>
);

const SampleTypeSection: React.FC<SampleTypeSectionProps> = ({ data }) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Loại hình mẫu
      </Title>
      <div className="detail-column-list">
        <div className="sample-type-tags">
          <SampleTypeTag value={data.sampleTypeService} label="Dịch vụ" />
          <SampleTypeTag value={data.sampleTypeContract} label="Hợp đồng" />
          <SampleTypeTag value={data.sampleTypeTask} label="Nhiệm vụ" />
          <SampleTypeTag value={data.sampleTypeSubContract} label="Thầu phụ" />
        </div>
        {data.subContract && (
          <div className="detail-item-col">
            <Text type="secondary">Thầu phụ:</Text>
            <Text>{data.subContract}</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default SampleTypeSection;
