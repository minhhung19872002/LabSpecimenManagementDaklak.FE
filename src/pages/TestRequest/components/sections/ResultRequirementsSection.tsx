import React from "react";
import { Tag, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "../../../../components/common/Icon";
import { TestRequestDto } from "../../../../types/testRequest";
import { getResultLanguageText } from "./shared";

const { Title, Text } = Typography;

interface ResultRequirementsSectionProps {
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

const ResultRequirementsSection: React.FC<ResultRequirementsSectionProps> = ({
  data,
}) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Yêu cầu về kết quả
      </Title>
      <div className="detail-column-list">
        <div className="detail-item">
          <Text type="secondary">Ngôn ngữ:</Text>
          <Text>{getResultLanguageText(data.resultLanguage)}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Số bản:</Text>
          <Text>{data.resultCopyCount || "-"}</Text>
        </div>
        <div className="sample-type-tags" style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <BoolTag value={data.separatePassedResults} label="Tách riêng CT đạt" />
        </div>
        {data.conformityDeclaration && (
          <div className="detail-item">
            <Text type="secondary">Công bố hợp quy:</Text>
            <Text>{data.conformityDeclaration}</Text>
          </div>
        )}
        {data.otherRequirements && (
          <div className="detail-item">
            <Text type="secondary">Yêu cầu khác:</Text>
            <Text>{data.otherRequirements}</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultRequirementsSection;
