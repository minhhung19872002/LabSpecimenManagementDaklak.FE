import React from "react";
import { Space, Typography } from "antd";
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
      <div className="detail-column-list">
        <div className="detail-item">
          <Text type="secondary">Số HĐ:</Text>
          <Text strong>{data.contractNumber || "-"}</Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Ngày HĐ:</Text>
          <Text strong>
            {data.contractDate
              ? dayjs(data.contractDate).format("DD/MM/YYYY HH:mm")
              : "-"}
          </Text>
        </div>
        <div className="detail-item">
          <Text type="secondary">Số phiếu thu:</Text>
          <Text>{data.receiptNumber || "-"}</Text>
        </div>
        {data.status === TestRequestStatus.ResultSent && (
          <div className="detail-item">
            <Space size={4}>
              <BoolIcon value={data.sentToAccounting} />
              <Text style={{ fontSize: 13 }}>Gửi kế toán</Text>
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractInfoSection;
