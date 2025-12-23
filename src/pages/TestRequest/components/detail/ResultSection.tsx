import React from "react";
import { Row, Col, Space, Typography } from "antd";
import { ResultLanguage } from "../../../../types/testRequest";
import { RESULT_LANGUAGE_MAP } from "../../constants";
import BoolIcon from "./BoolIcon";

const { Title, Text } = Typography;

interface ResultSectionProps {
  data: {
    resultLanguage?: ResultLanguage;
    resultCopyCount?: number | string;
    separatePassedResults?: boolean;
    conformityDeclaration?: string;
    otherRequirements?: string;
  };
}

const ResultSection: React.FC<ResultSectionProps> = ({ data }) => {
  const getResultLanguageText = (lang: ResultLanguage) => {
    return RESULT_LANGUAGE_MAP[lang] || "Tiếng Việt";
  };

  return (
    <div className="detail-section" style={{ marginTop: 16 }}>
      <Title level={5} style={{ marginBottom: 12 }}>
        Yêu cầu về kết quả
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} sm={12}>
          <div className="detail-item">
            <Text type="secondary">Ngôn ngữ:</Text>
            <Text>{getResultLanguageText(data.resultLanguage!)}</Text>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div className="detail-item">
            <Text type="secondary">Số bản:</Text>
            <Text>{data.resultCopyCount || "-"}</Text>
          </div>
        </Col>
        <Col xs={24}>
          <Space wrap size={[16, 8]}>
            <Space size={4}>
              <BoolIcon value={data.separatePassedResults || false} />
              <Text style={{ fontSize: 13 }}>Tách riêng CT đạt</Text>
            </Space>
          </Space>
        </Col>
        {data.conformityDeclaration && (
          <Col xs={24}>
            <div className="detail-item">
              <Text type="secondary">Công bố hợp quy:</Text>
              <Text>{data.conformityDeclaration}</Text>
            </div>
          </Col>
        )}
        {data.otherRequirements && (
          <Col xs={24}>
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

export default ResultSection;
