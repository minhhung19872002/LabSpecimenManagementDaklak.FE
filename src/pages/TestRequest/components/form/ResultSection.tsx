import React from "react";
import { Form, Input, Radio, Checkbox, Row, Col, Typography } from "antd";
import { ResultLanguage } from "../../../../types/testRequest";

const { Title, Text } = Typography;

const ResultSection: React.FC = () => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Yêu cầu về kết quả
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} sm={12}>
          <Row align="middle">
            <Col xs={10}>
              <Text>Ngôn ngữ:</Text>
            </Col>
            <Col xs={14}>
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
                  <Radio value={ResultLanguage.VietnameseAndEnglish}>Việt/Anh</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </Col>
        <Col xs={24} sm={12}>
          <Row align="middle" style={{ marginBottom: 8 }}>
            <Col xs={10}>
              <Text>Số bản:</Text>
            </Col>
            <Col xs={14}>
              <Form.Item name="resultCopyCount" style={{ marginBottom: 0 }}>
                <Input size="small" style={{ width: 80 }} />
              </Form.Item>
            </Col>
          </Row>
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
          <Row align="middle">
            <Col xs={10}>
              <Text>Công bố hợp quy:</Text>
            </Col>
            <Col xs={14}>
              <Form.Item name="conformityDeclaration" style={{ marginBottom: 0 }}>
                <Input size="small" />
              </Form.Item>
            </Col>
          </Row>
        </Col>
        <Col xs={24} sm={12}>
          <Row align="middle">
            <Col xs={10}>
              <Text>Yêu cầu khác:</Text>
            </Col>
            <Col xs={14}>
              <Form.Item name="otherRequirements" style={{ marginBottom: 0 }}>
                <Input size="small" />
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default ResultSection;
