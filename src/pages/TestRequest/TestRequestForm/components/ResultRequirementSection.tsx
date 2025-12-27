// @ts-nocheck
import React from "react";
import { Form, Input, Radio, Checkbox, Row, Col, Typography } from "antd";
import { ResultLanguage } from "../../../../types/testRequest";

const { Title, Text } = Typography;

const ResultRequirementSection: React.FC = () => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Yêu cầu về kết quả
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} sm={12}>
          <div className="form-field-mobile">
            <Text className="form-field-label">Ngôn ngữ:</Text>
            <Form.Item name="resultLanguage" style={{ marginBottom: 0 }}>
              <Radio.Group
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <Radio value={ResultLanguage.Vietnamese}>Tiếng Việt</Radio>
                <Radio value={ResultLanguage.English}>Tiếng Anh</Radio>
                <Radio value={ResultLanguage.VietnameseAndEnglish}>
                  Việt/Anh
                </Radio>
              </Radio.Group>
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div className="form-field-mobile" style={{ marginBottom: 8 }}>
            <Text className="form-field-label">Số bản:</Text>
            <Form.Item name="resultCopyCount" style={{ marginBottom: 0 }}>
              <Input size="small" style={{ width: 80 }} />
            </Form.Item>
          </div>
          <Form.Item
            name="separatePassedResults"
            valuePropName="checked"
            style={{ marginBottom: 0 }}
          >
            <Checkbox>Tách riêng CT đạt</Checkbox>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
        <Col xs={24} sm={12}>
          <div className="form-field-mobile">
            <Text className="form-field-label">Công bố hợp quy:</Text>
            <Form.Item name="conformityDeclaration" style={{ marginBottom: 0 }}>
              <Input size="small" />
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div className="form-field-mobile">
            <Text className="form-field-label">Yêu cầu khác:</Text>
            <Form.Item name="otherRequirements" style={{ marginBottom: 0 }}>
              <Input size="small" />
            </Form.Item>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ResultRequirementSection;
