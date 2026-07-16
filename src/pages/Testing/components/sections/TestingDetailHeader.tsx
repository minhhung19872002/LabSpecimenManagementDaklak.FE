import React from "react";
import { Card, Space, Typography } from "antd";
import { ExperimentOutlined } from "../../../../components/common/Icon";
import { TestingDetailDto } from "../../../../types/testing";
import { getStatusTag } from "./shared";

const { Title, Text } = Typography;

interface TestingDetailHeaderProps {
  detail: TestingDetailDto;
}

const TestingDetailHeader: React.FC<TestingDetailHeaderProps> = ({
  detail,
}) => {
  const technicianList = detail.technicianNames
    ? detail.technicianNames.split(",").map((n) => n.trim()).filter(Boolean)
    : [];

  return (
    <Card
      className="testing-detail-header"
      style={{
        marginBottom: 16,
        background: "#FAFAFA",
        borderColor: "#D9D9D9",
        flex: 1,
      }}
    >
      <Space direction="vertical" size={8}>
        <Title level={4} style={{ margin: 0 }}>
          <ExperimentOutlined style={{ marginRight: 8 }} />
          Số hợp đồng: {detail.contractNumber || "N/A"}
        </Title>
        {getStatusTag(detail.testingStatus, detail.testRequestStatus)}
        <Text type="secondary">
          Khoa phòng: <Text>{detail.laboratoryName || "N/A"}</Text>
        </Text>
        <div style={{ display: "flex", gap: 8 }}>
          <Text type="secondary" style={{ whiteSpace: "nowrap" }}>Thử nghiệm viên:</Text>
          <div>
            {technicianList.length > 0 ? (
              technicianList.map((name, i) => (
                <div key={i}><Text>{name}</Text></div>
              ))
            ) : (
              <Text type="secondary">Chưa có</Text>
            )}
          </div>
        </div>
      </Space>
    </Card>
  );
};

export default TestingDetailHeader;
