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
        <Col xs={24} sm={8}>
          <div style={{ background: "#F5F5F5", padding: 12, borderRadius: 6 }}>
            <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
              Ngôn ngữ:
            </Text>
            <Form.Item name="resultLanguage" style={{ marginBottom: 0 }}>
              <Radio.Group
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <Radio value={ResultLanguage.English}>Tiếng anh</Radio>
                <Radio value={ResultLanguage.Vietnamese}>Tiếng Việt</Radio>
                <Radio value={ResultLanguage.VietnameseAndEnglish}>
                  Anh Việt
                </Radio>
              </Radio.Group>
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 8 }}>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Công bố hợp quy:
            </Text>
            <Form.Item name="conformityDeclaration" style={{ marginBottom: 0 }}>
              <Input placeholder="Chi tiết" size="small" />
            </Form.Item>
          </div>
          <div>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Số bản:
            </Text>
            <Form.Item name="resultCopyCount" style={{ marginBottom: 0 }}>
              <Input placeholder="Chi tiết" size="small" />
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 8 }}>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Yêu cầu Khác:
            </Text>
            <Form.Item name="otherRequirements" style={{ marginBottom: 0 }}>
              <Input placeholder="Chi tiết" size="small" />
            </Form.Item>
          </div>
          <div>
            <div style={{ marginBottom: 4, lineHeight: "22px" }}>&nbsp;</div>
            <Form.Item
              name="separatePassedResults"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Tách riêng CT đạt</Checkbox>
            </Form.Item>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ResultRequirementSection;
