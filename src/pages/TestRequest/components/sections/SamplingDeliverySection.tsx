import React from "react";
import { Tag, Typography } from "antd";
import dayjs from "dayjs";
import { CheckCircleOutlined, CloseCircleOutlined } from "../../../../components/common/Icon";
import { TestRequestDto } from "../../../../types/testRequest";
import { formatDate } from "../../../../utils/formatters";
import { getSamplingRequirementText, getSampleStorageText } from "./shared";

const { Title, Text } = Typography;

interface SamplingDeliverySectionProps {
  data: TestRequestDto;
}

const BoolTag: React.FC<{ value: boolean; label: string }> = ({ value, label }) => (
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

const SamplingDeliverySection: React.FC<SamplingDeliverySectionProps> = ({
  data,
}) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Yêu cầu về lấy mẫu & giao trả
      </Title>
      <div className="detail-column-list">
        <div className="detail-item">
          <Text type="secondary">Lấy mẫu:</Text>
          <Text>{getSamplingRequirementText(data.samplingRequirement)}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Lưu mẫu:</Text>
          <Text>{getSampleStorageText(data.sampleStorage)}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Ngày trả KQ:</Text>
          <Text strong style={{
            background: "linear-gradient(to right, #1E63F8, #009AE3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {formatDate(data.resultDeliveryDate)}
          </Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Ngày HT dự kiến:</Text>
          <Text strong style={{ color: "#389E0D" }}>
            {data.expectedCompletionDate
              ? dayjs(data.expectedCompletionDate).format("DD/MM/YYYY")
              : "-"}
          </Text>
        </div>
        <div className="sample-type-tags" style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <BoolTag value={data.deliveryDirectPickup} label="Nhận trực tiếp" />
          <BoolTag value={data.deliveryPostal} label="Gửi bưu điện" />
          <BoolTag value={data.returnStoredSample} label="Trả lại mẫu lưu" />
        </div>
      </div>
    </div>
  );
};

export default SamplingDeliverySection;
