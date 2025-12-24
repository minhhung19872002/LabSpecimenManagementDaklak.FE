import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import { DatabaseOutlined } from "@ant-design/icons";
import { MasterDataStatisticsDto } from "../types";
import { categoryLabels, getStatCount } from "../constants";

interface StatisticsCardsProps {
  statistics: MasterDataStatisticsDto | null;
  statisticsLoading: boolean;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  statistics,
  statisticsLoading,
}) => {
  // Calculate total items from statistics
  const totalItems = statistics
    ? statistics.departmentCount +
      statistics.laboratoryCount +
      statistics.specimenTypeCount +
      statistics.testMethodCount +
      statistics.storageLocationCount +
      statistics.customerCount +
      statistics.indicatorCount +
      statistics.formTemplateCount
    : 0;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} sm={8} md={6}>
        <Card>
          <Statistic
            title="Tổng danh mục"
            value={Object.keys(categoryLabels).length}
            prefix={<DatabaseOutlined />}
            loading={statisticsLoading}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={6}>
        <Card>
          <Statistic
            title="Tổng dữ liệu"
            value={totalItems}
            loading={statisticsLoading}
          />
        </Card>
      </Col>
      {Object.entries(categoryLabels)
        .slice(0, 3)
        .map(([key, label]) => (
          <Col xs={12} sm={8} md={4} key={key}>
            <Card>
              <Statistic
                title={label}
                value={getStatCount(key, statistics)}
                loading={statisticsLoading}
              />
            </Card>
          </Col>
        ))}
    </Row>
  );
};

export default StatisticsCards;
