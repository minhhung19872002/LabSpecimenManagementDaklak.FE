import React from "react";
import { Row, Col, Space, Typography } from "antd";
import { TestRequestDto } from "../../../../types/testRequest";
import { BoolItem } from "./shared";

const { Title, Text } = Typography;

interface MethodRequirementsSectionProps {
  data: TestRequestDto;
}

const MethodRequirementsSection: React.FC<MethodRequirementsSectionProps> = ({
  data,
}) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Yêu cầu về phương pháp
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24}>
          <Space wrap size={[16, 8]}>
            <BoolItem
              value={data.methodWestHighlandInstitute}
              label="Theo Viện KHKT NN Tây Nguyên"
            />
            <BoolItem
              value={data.methodCustomer}
              label="Theo yêu cầu khách hàng"
            />
          </Space>
        </Col>
        {data.methodCustomerDetail && (
          <Col xs={24}>
            <div className="detail-item">
              <Text type="secondary">Chi tiết PP KH:</Text>
              <Text>{data.methodCustomerDetail}</Text>
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default MethodRequirementsSection;
