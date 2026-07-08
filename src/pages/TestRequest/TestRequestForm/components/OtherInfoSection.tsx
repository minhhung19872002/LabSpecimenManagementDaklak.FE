// @ts-nocheck
import React from "react";
import { Form, Input, Checkbox, Row, Col, Typography } from "antd";

const { Title, Text } = Typography;

const OtherInfoSection: React.FC = () => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Thông tin khác
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24}>
          <Row align="middle">
            <Col xs={6}>
              <Text>Thay đổi YC:</Text>
            </Col>
            <Col xs={18}>
              <Form.Item name="changeRequest" style={{ marginBottom: 0 }}>
                <Input size="small" placeholder="Nếu có..." />
              </Form.Item>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Form.Item
            name="agreeTerms"
            valuePropName="checked"
            style={{ marginBottom: 0 }}
          >
            <Checkbox>
              Đã đọc và đồng ý với quy định chung về yêu cầu dịch vụ thử nghiệm
            </Checkbox>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

// memo: chan re-render lan tu form cha khi go phim o bang mau (props khong doi)
export default React.memo(OtherInfoSection);
