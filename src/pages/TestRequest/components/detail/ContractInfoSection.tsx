import React from "react";
import { Row, Col, Space, Typography } from "antd";
import dayjs from "dayjs";
import BoolIcon from "./BoolIcon";

const { Title, Text } = Typography;

interface ContractInfoSectionProps {
  data: {
    contractNumber?: string;
    contractDate?: string;
    receiptNumber?: string;
    requestDate?: string;
    sentToAccounting?: boolean;
    paymentReceived?: boolean;
    sentToDepartment?: boolean;
    resultReturned?: boolean;
  };
}

const ContractInfoSection: React.FC<ContractInfoSectionProps> = ({ data }) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Thông tin hợp đồng
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} sm={12} md={6}>
          <div className="detail-item">
            <Text type="secondary">Số HĐ:</Text>
            <Text strong>{data.contractNumber || "-"}</Text>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="detail-item">
            <Text type="secondary">Ngày HĐ:</Text>
            <Text strong>
              {data.contractDate
                ? dayjs(data.contractDate).format("DD/MM/YYYY")
                : "-"}
            </Text>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="detail-item">
            <Text type="secondary">Số phiếu thu:</Text>
            <Text>{data.receiptNumber || "-"}</Text>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="detail-item">
            <Text type="secondary">Ngày yêu cầu:</Text>
            <Text strong>
              {data.requestDate
                ? dayjs(data.requestDate).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Text>
          </div>
        </Col>
      </Row>
      <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
        <Col xs={24}>
          <Space wrap size={[16, 8]}>
            <Space size={4}>
              <BoolIcon value={data.sentToAccounting || false} />
              <Text style={{ fontSize: 13 }}>Gửi kế toán</Text>
            </Space>
            <Space size={4}>
              <BoolIcon value={data.paymentReceived || false} />
              <Text style={{ fontSize: 13 }}>Đã thu tiền</Text>
            </Space>
            <Space size={4}>
              <BoolIcon value={data.sentToDepartment || false} />
              <Text style={{ fontSize: 13 }}>Gửi khoa phòng</Text>
            </Space>
            <Space size={4}>
              <BoolIcon value={data.resultReturned || false} />
              <Text style={{ fontSize: 13 }}>Trả kết quả</Text>
            </Space>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ContractInfoSection;
