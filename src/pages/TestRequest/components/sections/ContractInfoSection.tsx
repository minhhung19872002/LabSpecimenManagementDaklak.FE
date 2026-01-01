import React from "react";
import { Row, Col, Space, Typography } from "antd";
import dayjs from "dayjs";
import { TestRequestDto, TestRequestStatus } from "../../../../types/testRequest";
import { BoolIcon } from "./shared";

const { Title, Text } = Typography;

interface ContractInfoSectionProps {
  data: TestRequestDto;
}

const ContractInfoSection: React.FC<ContractInfoSectionProps> = ({ data }) => {
  return (
    <div className="detail-section">
      <Title level={5} style={{ marginBottom: 12 }}>
        Thông tin hợp đồng
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24} lg={12} xl={8}>
          <div className="detail-item">
            <Text type="secondary">Số HĐ:</Text>
            <Text strong>{data.contractNumber || "-"}</Text>
          </div>
        </Col>
        <Col xs={24} lg={12} xl={8}>
          <div className="detail-item">
            <Text type="secondary">Ngày HĐ:</Text>
            <Text strong>
              {data.contractDate
                ? dayjs(data.contractDate).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Text>
          </div>
        </Col>
        <Col xs={24} lg={12} xl={8}>
          <div className="detail-item">
            <Text type="secondary">Số phiếu thu:</Text>
            <Text>{data.receiptNumber || "-"}</Text>
          </div>
        </Col>
      </Row>
      {data.status === TestRequestStatus.ResultSent && (
        <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
          <Col xs={24}>
            <Space wrap size={[16, 8]}>
              <Space size={4}>
                <BoolIcon value={data.sentToAccounting} />
                <Text style={{ fontSize: 13 }}>Gửi kế toán</Text>
              </Space>
            </Space>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ContractInfoSection;
