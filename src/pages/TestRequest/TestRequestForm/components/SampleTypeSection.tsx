// @ts-nocheck
import React from "react";
import { Form, Input, Radio, Typography } from "antd";

const { Title, Text } = Typography;

const SampleTypeSection: React.FC = () => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Loại hình mẫu
      </Title>
      <Form.Item name="sampleType" style={{ marginBottom: 0 }}>
        <Radio.Group style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Radio value="service">Dịch vụ</Radio>
          <Radio value="contract">Hợp đồng</Radio>
          <Radio value="task">Mẫu nhiệm vụ</Radio>
          <Radio value="subContract">Hợp đồng phụ</Radio>
        </Radio.Group>
      </Form.Item>
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
