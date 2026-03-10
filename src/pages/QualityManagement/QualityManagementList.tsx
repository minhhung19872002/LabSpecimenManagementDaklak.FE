import React, { useState, useRef } from "react";
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
import { QualityManagementStatus, QualityManagementStatusLabels } from "../../types/qualityManagement";
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
  const assignmentLogReloadRef = useRef<(() => void) | null>(null);

  const {
    loading,
    tasks,
    statistics,
    statusFilter,
    overdueFilter,
    pagination,
    historyModalVisible,
    selectedTask,
    changeApprovalModalVisible,
    selectedChangeApprovalTaskId,
    columns,
    loadData,
    handleSearch,
    handleStatusFilter,
    handleOverdueFilter,
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
            filterValue: QualityManagementStatus.PendingApproval,
          },
          {
            title: "Trễ hạn",
            value: statistics?.overdueCount || 0,
            iconBg: "red",
            icon: "exclamation-triangle",
            valueColor: "#FF4D4F",
            filterValue: undefined,
            isOverdue: true,
          },
          {
            title: "Chờ phát hành",
            value: statistics?.pendingPublishCount || 0,
            iconBg: "blue",
            icon: "file-text",
            valueColor: "#096DD9",
            filterValue: QualityManagementStatus.PendingPublish,
          },
          {
            title: "Đã phát hành",
            value: statistics?.publishedCount || 0,
            iconBg: "cyan",
            icon: "file-earmark-check",
            valueColor: "#13C2C2",
            filterValue: QualityManagementStatus.FullyPublished,
          },
        ].map((stat, index) => {
          const isActive = stat.isOverdue
            ? overdueFilter
            : stat.filterValue !== undefined && statusFilter === stat.filterValue;
          return (
            <Card
              key={index}
              className={`dashboard-stat-card quality-stat-clickable${isActive ? " quality-stat-active" : ""}`}
              bordered={false}
              onClick={() => {
                if (activeTab !== "reports") return;
                if (stat.isOverdue) {
                  handleOverdueFilter(!overdueFilter);
                } else if (stat.filterValue !== undefined) {
                  handleStatusFilter(isActive ? undefined : stat.filterValue as any);
                }
              }}
            >
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
          );
        })}
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
          <Button
            icon={<ReloadOutlined />}
            onClick={
              activeTab === "reports"
                ? loadData
                : () => assignmentLogReloadRef.current?.()
            }
          />
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
          <SampleAssignmentLogTab onRegisterReload={(fn) => { assignmentLogReloadRef.current = fn; }} />
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
