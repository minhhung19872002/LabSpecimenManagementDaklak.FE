import React from "react";
import { Row, Col, Typography } from "antd";

const { Title, Text } = Typography;

interface PersonnelSectionProps {
  data: {
    supervisorName?: string;
    directorName?: string;
  };
}

const PersonnelSection: React.FC<PersonnelSectionProps> = ({ data }) => {
  return (
    <div className="detail-section" style={{ marginTop: 16 }}>
      <Title level={5} style={{ marginBottom: 12 }}>
        Người phụ trách
      </Title>
      <Row gutter={[16, 12]}>
        <Col xs={24}>
          <div className="detail-item">
            <Text type="secondary">Người giám sát:</Text>
            <Text strong>{data.supervisorName || "-"}</Text>
          </div>
        </Col>
        <Col xs={24}>
          <div className="detail-item">
            <Text type="secondary">Giám đốc:</Text>
            <Text strong>{data.directorName || "-"}</Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PersonnelSection;
