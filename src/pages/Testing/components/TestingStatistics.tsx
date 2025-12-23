import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import { ExperimentOutlined } from "@ant-design/icons";

interface TestingStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

interface TestingStatisticsProps {
  stats: TestingStats;
}

const TestingStatistics: React.FC<TestingStatisticsProps> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} sm={8} md={6}>
        <Card size="small">
          <Statistic
            title="Tổng xét nghiệm"
            value={stats.total}
            prefix={<ExperimentOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={6}>
        <Card size="small">
          <Statistic
            title="Cần làm"
            value={stats.todo}
            valueStyle={{ color: "#8c8c8c" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={6}>
        <Card size="small">
          <Statistic
            title="Đang thí nghiệm"
            value={stats.inProgress}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={6}>
        <Card size="small">
          <Statistic
            title="Đã xong"
            value={stats.done}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default TestingStatistics;
