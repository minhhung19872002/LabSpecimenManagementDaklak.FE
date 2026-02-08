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
                  Viện VS DT Tây Nguyên
                </Radio>
                <Radio value="customerRequest">Theo yêu cầu KH</Radio>
              </div>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="methodCustomerDetail"
            style={{ marginBottom: 0, marginTop: 12 }}
          >
            <Input.TextArea
              placeholder="Chi tiết yêu cầu về phương pháp..."
              disabled={methodRequirement !== "customerRequest"}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default MethodRequirementSection;
