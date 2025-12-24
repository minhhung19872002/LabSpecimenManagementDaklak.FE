// @ts-nocheck
import React from "react";
import { Form, Input, Radio, Row, Col, Typography } from "antd";

const { Title } = Typography;

interface MethodRequirementSectionProps {
  methodRequirement: string;
}

const MethodRequirementSection: React.FC<MethodRequirementSectionProps> = ({
  methodRequirement,
}) => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Yêu cầu về phương pháp
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24}>
          <Form.Item
            name="methodRequirement"
            style={{ marginBottom: 0 }}
            initialValue="westHighlandInstitute"
          >
            <Radio.Group>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <Radio value="westHighlandInstitute">
                  Viện KHKT NN Tây Nguyên
                </Radio>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <Radio value="customerRequest">Theo yêu cầu KH</Radio>
                  <Form.Item
                    name="methodCustomerDetail"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Chi tiết..."
                      disabled={methodRequirement !== "customerRequest"}
                      style={{ width: 150 }}
                      size="small"
                    />
                  </Form.Item>
                </span>
              </div>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default MethodRequirementSection;
