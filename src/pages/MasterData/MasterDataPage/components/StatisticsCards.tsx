import React from "react";
import { Card, Typography } from "antd";
import Icon from "../../../../components/common/Icon";
import { MasterDataStatisticsDto } from "../types";
import { categoryLabels } from "../constants";
import "../../../Dashboard/Dashboard.css";

const { Text } = Typography;

export interface StatisticsCardsProps {
  statistics: MasterDataStatisticsDto | null;
  statisticsLoading: boolean;
  /** BA: thống kê thu gọn được (collapse/expand) cho trang đỡ dài */
  open: boolean;
  onToggle: () => void;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  statistics,
  open,
  onToggle,
}) => {
  // Calculate total items from statistics
  const totalItems = statistics
    ? (statistics.departmentCount || 0) +
      (statistics.laboratoryCount || 0) +
      (statistics.specimenTypeCount || 0) +
      (statistics.testMethodCount || 0) +
      (statistics.storageLocationCount || 0) +
      (statistics.customerCount || 0) +
      (statistics.indicatorCount || 0) +
      (statistics.formTemplateCount || 0) +
      (statistics.standardCount || 0) +
      (statistics.indicatorGroupCount || 0) +
      (statistics.productCount || 0)
    : 0;

  const statsData = [
    {
      title: "Tổng danh mục",
      value: Object.keys(categoryLabels).length,
      iconBg: "blue",
      icon: "grid-fill",
      valueColor: "#096DD9",
    },
    {
      title: "Tổng dữ liệu",
      value: totalItems,
      iconBg: "purple",
      icon: "database-fill",
      valueColor: "#531DAB",
    },
    {
      title: "Phương pháp thử",
      value: statistics?.testMethodCount || 0,
      iconBg: "cyan",
      icon: "clipboard2-data-fill",
      valueColor: "#13C2C2",
    },
    {
      title: "Tiêu chuẩn",
      value: statistics?.standardCount || 0,
      iconBg: "green",
      icon: "check2-square",
      valueColor: "#389E0D",
    },
  ];

  return (
    <div className={`md-stats${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="md-stats-toggle"
        aria-expanded={open}
        onClick={onToggle}
      >
        <Icon name="bar-chart-line" className="md-stats-toggle-icon" />
        <span className="md-stats-toggle-title">Thống kê tổng quan</span>
        {!open && (
          <span className="md-stats-toggle-summary">
            {statsData.map((stat) => (
              <span key={stat.title}>
                {stat.title}{" "}
                <b style={{ color: stat.valueColor }}>{stat.value}</b>
              </span>
            ))}
          </span>
        )}
        <span className="md-stats-toggle-action">
          {open ? "Thu gọn" : "Mở rộng"}
          <Icon name="chevron-down" className="md-stats-chevron" />
        </span>
      </button>
      {open && (
        <div className="dashboard-stats-grid">
          {statsData.map((stat, index) => (
            <Card key={index} className="dashboard-stat-card" bordered={false}>
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-info">
                  <Text className="dashboard-stat-title">{stat.title}</Text>
                  <div
                    className="dashboard-stat-value"
                    style={{
                      background: stat.valueColor,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
                <div className={`dashboard-stat-icon ${stat.iconBg}`}>
                  <Icon name={stat.icon} style={{ fontSize: 24 }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatisticsCards;
