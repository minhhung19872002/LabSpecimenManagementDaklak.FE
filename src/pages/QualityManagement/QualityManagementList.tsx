import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Radio,
  Space,
} from "antd";
import Icon, {
  SafetyCertificateOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "../../components/common/Icon";
import { QualityManagementStatusLabels } from "../../types/qualityManagement";
import HistoryModal from "./components/HistoryModal";
import ChangeApprovalModal from "./components/ChangeApprovalModal";
import SampleAssignmentLogTab from "./components/SampleAssignmentLogTab";
import { useQualityManagementList } from "./hooks";

import "./components/ReportManagementTab.css";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";
import "./QualityManagement.css";

const { Text } = Typography;

const QualityManagementList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("reports");

  const {
    loading,
    tasks,
    statistics,
    statusFilter,
    pagination,
    historyModalVisible,
    selectedTask,
    changeApprovalModalVisible,
    selectedChangeApprovalTaskId,
    columns,
    loadData,
    handleSearch,
    handleStatusFilter,
    handleTableChange,
    handleRowDoubleClick,
    isUrgent,
    closeHistoryModal,
    closeChangeApprovalModal,
  } = useQualityManagementList();

  return (
    <div>
      {/* Statistics Cards */}
      <div className="dashboard-stats-grid quality-stats-grid">
        {[
          {
            title: "Chờ phê duyệt",
            value: statistics?.pendingApprovalCount || 0,
            iconBg: "late",
            icon: "clock",
            valueColor: "#FAAD14",
          },
          {
            title: "Trễ hạn",
            value: statistics?.overdueCount || 0,
            iconBg: "red",
            icon: "exclamation-triangle",
            valueColor: "#FF4D4F",
          },
          {
            title: "Chờ phát hành",
            value: statistics?.pendingPublishCount || 0,
            iconBg: "blue",
            icon: "file-text",
            valueColor: "#096DD9",
          },
          {
            title: "Đã phát hành",
            value: statistics?.publishedCount || 0,
            iconBg: "cyan",
            icon: "file-earmark-check",
            valueColor: "#13C2C2",
          },
        ].map((stat, index) => (
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
                <Icon name={stat.icon} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card
        className="list-card"
        title={
          <Space>
            <SafetyCertificateOutlined />
            Quản lý chất lượng
          </Space>
        }
        extra={
          activeTab === "reports" && (
            <Button icon={<ReloadOutlined />} onClick={loadData} />
          )
        }
      >
        {/* Tabs */}
        <div className="statistics-detail-tabs" style={{ padding: "0 16px" }}>
          <Radio.Group
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            optionType="button"
          >
            <Radio.Button value="reports">Quản lý báo cáo</Radio.Button>
            <Radio.Button value="assignment-log">
              Sổ nhận mẫu giao việc
            </Radio.Button>
          </Radio.Group>
        </div>
        <div style={{ borderBottom: "1px solid #f0f0f0" }} />

        {/* Content */}
        {activeTab === "assignment-log" ? (
          <SampleAssignmentLogTab />
        ) : (
          <>
            {/* Filters */}
            <Row gutter={[16, 16]} align="middle" style={{ padding: 16 }}>
              <Col xs={24} sm={12} md={8}>
                <Input.Search
                  placeholder="Tìm theo hợp đồng, QLKT..."
                  prefix={<SearchOutlined />}
                  allowClear
                  onSearch={handleSearch}
                  enterButton
                />
              </Col>
              <Col xs={24} sm={8} md={6}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Lọc theo trạng thái"
                  allowClear
                  value={statusFilter}
                  onChange={handleStatusFilter}
                >
                  {Object.entries(QualityManagementStatusLabels).map(
                    ([key, label]) => (
                      <Select.Option key={key} value={Number(key)}>
                        {label}
                      </Select.Option>
                    ),
                  )}
                </Select>
              </Col>
            </Row>

            {/* Table */}
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total, range) => (
                  <>
                    Hiển thị{" "}
                    <b>
                      {range[0]}-{range[1]}/{total}
                    </b>
                  </>
                ),
                pageSizeOptions: [50, 100, 150],
              }}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
              onRow={(record) => ({
                onDoubleClick: () => handleRowDoubleClick(record),
                style: { cursor: "pointer" },
                className: isUrgent(record) ? "urgent-row" : "",
              })}
              size="small"
            />
          </>
        )}
      </Card>

      {/* History Modal */}
      <HistoryModal
        visible={historyModalVisible}
        task={selectedTask}
        onClose={closeHistoryModal}
      />

      {/* Change Approval Modal */}
      <ChangeApprovalModal
        visible={changeApprovalModalVisible}
        taskId={selectedChangeApprovalTaskId}
        onClose={closeChangeApprovalModal}
        onUpdated={loadData}
      />
    </div>
  );
};

export default QualityManagementList;
