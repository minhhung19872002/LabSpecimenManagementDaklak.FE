import React from "react";
import { Tag, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "../../../../components/common/Icon";
import { TestRequestDto } from "../../../../types/testRequest";

const { Title, Text } = Typography;

interface MethodRequirementsSectionProps {
  data: TestRequestDto;
}

const MethodTag: React.FC<{ value: boolean; label: string }> = ({ value, label }) => (
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

const MethodRequirementsSection: React.FC<MethodRequirementsSectionProps> = ({
  data,
}) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Yêu cầu về phương pháp
      </Title>
      <div className="detail-column-list">
        <div className="sample-type-tags" style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <MethodTag
            value={data.methodWestHighlandInstitute}
            label="Theo Viện KHKT NN Tây Nguyên"
          />
          <MethodTag
            value={data.methodCustomer}
            label="Theo yêu cầu khách hàng"
          />
        </div>
        {data.methodCustomerDetail && (
          <div className="detail-item">
            <Text type="secondary">Chi tiết PP KH:</Text>
            <Text>{data.methodCustomerDetail}</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default MethodRequirementsSection;
