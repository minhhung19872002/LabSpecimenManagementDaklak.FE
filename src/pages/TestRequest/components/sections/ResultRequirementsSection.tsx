import React from "react";
import { Row, Col, Space, Typography } from "antd";
import { TestRequestDto } from "../../../../types/testRequest";
import { BoolItem, getResultLanguageText } from "./shared";

const { Title, Text } = Typography;

interface ResultRequirementsSectionProps {
  data: TestRequestDto;
}

const ResultRequirementsSection: React.FC<ResultRequirementsSectionProps> = ({
  data,
}) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Yêu cầu về kết quả
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} xl={12}>
          <div className="detail-item">
            <Text type="secondary">Ngôn ngữ:</Text>
            <Text>{getResultLanguageText(data.resultLanguage)}</Text>
          </div>
        </Col>
        <Col xs={24} xl={12}>
          <div className="detail-item">
            <Text type="secondary">Số bản:</Text>
            <Text>{data.resultCopyCount || "-"}</Text>
          </div>
        </Col>
        <Col span={24}>
          <Space wrap size={[16, 8]}>
            <BoolItem value={data.separatePassedResults} label="Tách riêng CT đạt" />
          </Space>
        </Col>
        {data.conformityDeclaration && (
          <Col span={24}>
            <div className="detail-item">
              <Text type="secondary">Công bố hợp quy:</Text>
              <Text>{data.conformityDeclaration}</Text>
            </div>
          </Col>
        )}
        {data.otherRequirements && (
          <Col span={24}>
            <div className="detail-item">
              <Text type="secondary">Yêu cầu khác:</Text>
              <Text>{data.otherRequirements}</Text>
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ResultRequirementsSection;
