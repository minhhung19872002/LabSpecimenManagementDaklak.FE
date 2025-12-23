import React from "react";
import { Row, Col, Typography } from "antd";

const { Title, Text } = Typography;

interface CustomerInfoSectionProps {
  data: {
    customerName?: string;
    taxCode?: string;
    address?: string;
    ward?: string;
    district?: string;
    province?: string;
    contactPerson?: string;
    phone?: string;
  };
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ data }) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Thông tin khách hàng
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} md={12}>
          <div className="detail-item">
            <Text type="secondary">Tên CS/DN:</Text>
            <Text strong style={{ fontSize: 15 }}>
              {data.customerName || "-"}
            </Text>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="detail-item">
            <Text type="secondary">Mã số thuế:</Text>
            <Text>{data.taxCode || "-"}</Text>
          </div>
        </Col>
      </Row>
      <Row gutter={[16, 12]} style={{ marginTop: 8 }}>
        <Col xs={24}>
          <div className="detail-item">
            <Text type="secondary">Địa chỉ:</Text>
            <Text>
              {[data.address, data.ward, data.district, data.province]
                .filter(Boolean)
                .join(", ") || "-"}
            </Text>
          </div>
        </Col>
      </Row>
      <Row gutter={[16, 12]} style={{ marginTop: 8 }}>
        <Col xs={24} sm={12}>
          <div className="detail-item">
            <Text type="secondary">Người liên hệ:</Text>
            <Text strong>{data.contactPerson || "-"}</Text>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div className="detail-item">
            <Text type="secondary">Điện thoại:</Text>
            <Text strong>{data.phone || "-"}</Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerInfoSection;
