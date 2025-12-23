import React from "react";
import { Form, Input, Checkbox, Row, Col, Typography } from "antd";

const { Title } = Typography;

interface MethodSectionProps {
  methodCustomerChecked: boolean;
  onMethodCustomerChange: (checked: boolean) => void;
}

const MethodSection: React.FC<MethodSectionProps> = ({
  methodCustomerChecked,
  onMethodCustomerChange,
}) => {
  return (
    <div className="form-section">
      <Title level={5} className="section-title">
        Yêu cầu về phương pháp
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <Form.Item
              name="methodWestHighlandInstitute"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Viện KHKT NN Tây Nguyên</Checkbox>
            </Form.Item>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <Checkbox
                checked={methodCustomerChecked}
                onChange={(e) => onMethodCustomerChange(e.target.checked)}
              >
                Theo yêu cầu KH
              </Checkbox>
              <Form.Item name="methodCustomerDetail" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="Chi tiết..."
                  disabled={!methodCustomerChecked}
                  style={{ width: 150 }}
                  size="small"
                />
              </Form.Item>
            </span>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default MethodSection;
