import React from "react";
import { Form, Radio, Checkbox, DatePicker, Row, Col, Typography } from "antd";
import { SamplingRequirement, SampleStorageOption } from "../../../../types/testRequest";

const { Title, Text } = Typography;

const SamplingSection: React.FC = () => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Yêu cầu về lấy mẫu & giao trả
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} sm={12}>
          <Row align="middle">
            <Col xs={10}>
              <Text>Lấy mẫu:</Text>
            </Col>
            <Col xs={14}>
              <Form.Item name="samplingRequirement" style={{ marginBottom: 0 }}>
                <Radio.Group
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <Radio value={SamplingRequirement.LabSampling}>TTKN lấy mẫu</Radio>
                  <Radio value={SamplingRequirement.CustomerSampling}>KH tự lấy mẫu</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </Col>
        <Col xs={24} sm={12}>
          <Row align="middle">
            <Col xs={10}>
              <Text>Lưu mẫu:</Text>
            </Col>
            <Col xs={14}>
              <Form.Item name="sampleStorageOption" style={{ marginBottom: 0 }}>
                <Radio.Group
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <Radio value={SampleStorageOption.No}>Không</Radio>
                  <Radio value={SampleStorageOption.Yes}>Có (theo QĐ của TT)</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
        <Col xs={24}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <Form.Item name="deliveryDirectPickup" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Nhận trực tiếp</Checkbox>
            </Form.Item>
            <Form.Item name="deliveryPostal" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Gửi bưu điện</Checkbox>
            </Form.Item>
            <Form.Item name="returnStoredSample" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Trả lại mẫu lưu</Checkbox>
            </Form.Item>
          </div>
        </Col>
      </Row>
      <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
        <Col xs={24} sm={12}>
          <Row align="middle">
            <Col xs={10}>
              <Text>Ngày trả KQ:</Text>
            </Col>
            <Col xs={14}>
              <Form.Item name="expectedCompletionDate" style={{ marginBottom: 0 }}>
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default SamplingSection;
