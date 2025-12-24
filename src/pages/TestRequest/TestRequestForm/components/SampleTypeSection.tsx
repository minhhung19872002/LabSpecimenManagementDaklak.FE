// @ts-nocheck
import React from "react";
import { Form, Input, Checkbox, Row, Col, Typography } from "antd";

const { Title, Text } = Typography;

const SampleTypeSection: React.FC = () => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Loại hình mẫu
      </Title>
      <Row gutter={[16, 8]}>
        <Col xs={24}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <Form.Item
              name="sampleTypeService"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Dịch vụ</Checkbox>
            </Form.Item>
            <Form.Item
              name="sampleTypeContract"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Hợp đồng</Checkbox>
            </Form.Item>
            <Form.Item
              name="sampleTypeTask"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Mẫu nhiệm vụ</Checkbox>
            </Form.Item>
            <Form.Item
              name="sampleTypeSubContract"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Hợp đồng phụ</Checkbox>
            </Form.Item>
          </div>
        </Col>
      </Row>
      <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
        <Col xs={24} sm={12}>
          <Row align="middle">
            <Col xs={10} sm={8}>
              <Text>Hợp đồng phụ:</Text>
            </Col>
            <Col xs={14} sm={16}>
              <Form.Item name="subContract" style={{ marginBottom: 0 }}>
                <Input size="small" placeholder="Tên thầu phụ..." />
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default SampleTypeSection;
