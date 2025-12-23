import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import { ExperimentOutlined } from "@ant-design/icons";

interface TaskStats {
  total: number;
  notAssigned: number;
  assigned: number;
  testing: number;
  pendingApproval: number;
  approved: number;
  resultSent: number;
}

interface TaskStatisticsProps {
  stats: TaskStats;
}

const TaskStatistics: React.FC<TaskStatisticsProps> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="Tổng công việc"
            value={stats.total}
            prefix={<ExperimentOutlined />}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="Chưa gán PP"
            value={stats.notAssigned}
            valueStyle={{ color: "#8c8c8c" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="Đã gán PP"
            value={stats.assigned}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="Đang TN"
            value={stats.testing}
            valueStyle={{ color: "#faad14" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="Chờ duyệt"
            value={stats.pendingApproval}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="Đã duyệt"
            value={stats.approved}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={4}>
        <Card size="small">
          <Statistic
            title="Đã gửi KQ"
            value={stats.resultSent}
            valueStyle={{ color: "#722ed1" }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default TaskStatistics;
