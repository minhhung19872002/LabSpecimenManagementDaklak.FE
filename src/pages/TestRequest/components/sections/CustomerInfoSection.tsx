import React from "react";
import { Typography } from "antd";
import { TestRequestDto } from "../../../../types/testRequest";

const { Title, Text } = Typography;

interface CustomerInfoSectionProps {
  data: TestRequestDto;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ data }) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Thông tin khách hàng
      </Title>
      <div className="detail-column-list">
        <div className="detail-item">
          <Text type="secondary">Tên CS/DN:</Text>
          <Text strong>{data.customerName || "-"}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Mã số thuế:</Text>
          <Text>{data.taxCode || "-"}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Địa chỉ:</Text>
          <Text>
            {[data.address, data.ward, data.district, data.province]
              .filter(Boolean)
              .join(", ") || "-"}
          </Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Người liên hệ:</Text>
          <Text strong>{data.contactPerson || "-"}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Điện thoại:</Text>
          <Text strong>{data.phone || "-"}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Email:</Text>
          <Text>{data.email || "-"}</Text>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoSection;
