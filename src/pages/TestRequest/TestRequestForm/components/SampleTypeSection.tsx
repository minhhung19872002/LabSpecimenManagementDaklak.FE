// @ts-nocheck
import React from "react";
import { Form, Input, Checkbox, Typography } from "antd";

const { Title, Text } = Typography;

const SampleTypeSection: React.FC = () => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Loại hình mẫu
      </Title>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
      <div style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ marginBottom: 4, display: "block" }}>Hợp đồng phụ:</Text>
        <Form.Item name="subContract" style={{ marginBottom: 0 }}>
          <Input size="small" placeholder="Nhập số hợp đồng" />
        </Form.Item>
      </div>
    </div>
  );
};

export default SampleTypeSection;
