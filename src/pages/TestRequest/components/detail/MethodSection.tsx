import React from "react";
import { Row, Col, Space, Typography } from "antd";
import BoolIcon from "./BoolIcon";

const { Title, Text } = Typography;

interface MethodSectionProps {
  data: {
    methodWestHighlandInstitute?: boolean;
    methodCustomer?: boolean;
    methodCustomerDetail?: string;
  };
}

const MethodSection: React.FC<MethodSectionProps> = ({ data }) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Yêu cầu về phương pháp
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24}>
          <Space wrap size={[16, 8]}>
            <Space size={4}>
              <BoolIcon value={data.methodWestHighlandInstitute || false} />
              <Text style={{ fontSize: 13 }}>
                Theo Viện KHKT NN Tây Nguyên
              </Text>
            </Space>
            <Space size={4}>
              <BoolIcon value={data.methodCustomer || false} />
              <Text style={{ fontSize: 13 }}>
                Theo yêu cầu khách hàng
              </Text>
            </Space>
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

export default MethodSection;
