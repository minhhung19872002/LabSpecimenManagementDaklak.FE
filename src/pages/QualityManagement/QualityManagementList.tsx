import React, { useState, useRef, useCallback } from "react";
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
  DatePicker,
} from "antd";
import Icon, {
  SafetyCertificateOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "../../components/common/Icon";
import {
  QualityManagementStatus,
  QualityManagementStatusLabels,
  QLCLDisplayStatus,
  QLCLSampleAssignmentLogStatisticsDto,
} from "../../types/qualityManagement";
import HistoryModal from "./components/HistoryModal";
import ChangeApprovalModal from "./components/ChangeApprovalModal";
import SampleAssignmentLogTab, {
  AssignmentLogControls,
} from "./components/SampleAssignmentLogTab";
import { useQualityManagementList } from "./hooks";

import "./components/ReportManagementTab.css";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";
import "./QualityManagement.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const QualityManagementList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("reports");
  const assignmentLogControlsRef = useRef<AssignmentLogControls | null>(null);
  const [assignmentLogStats, setAssignmentLogStats] =
    useState<QLCLSampleAssignmentLogStatisticsDto | null>(null);
  const [assignmentLogQlclStatuses, setAssignmentLogQlclStatuses] = useState<
    number[] | undefined
  >(undefined);
  const [assignmentLogFilterHandler, setAssignmentLogFilterHandler] = useState<
    ((s: number[] | undefined) => void) | null
  >(null);

  const handleRegisterControls = useCallback(
    (controls: AssignmentLogControls) => {
      assignmentLogControlsRef.current = controls;
      setAssignmentLogStats(controls.statistics);
      setAssignmentLogQlclStatuses(controls.qlclDisplayStatuses);
      setAssignmentLogFilterHandler(() => controls.handleQlclStatusFilter);
    },
    [],
  );

  const {
    loading,
    tasks,
    statistics,
    statusFilter,
    overdueFilter,
    dateRange,
    laboratoryIds,
    laboratories,
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
    handleDateRangeChange,
    handleLaboratoryChange,
    handleTableChange,
    handleRowDoubleClick,
    isUrgent,
    closeHistoryModal,
    closeChangeApprovalModal,
  } = useQualityManagementList();

  return (
    <div>
      {/* Statistics Cards - switch based on active tab */}
      <div className="dashboard-stats-grid quality-stats-grid">
        {(activeTab === "reports"
          ? [
              {
                title: "Chờ phê duyệt",
                value: statistics?.pendingApprovalCount || 0,
                iconBg: "late",
                icon: "clock",
                valueColor: "#FAAD14",
                isActive:
                  statusFilter === QualityManagementStatus.PendingApproval,
                onClick: () =>
                  handleStatusFilter(
                    statusFilter === QualityManagementStatus.PendingApproval
                      ? undefined
                      : QualityManagementStatus.PendingApproval,
                  ),
              },
              {
                title: "Trễ hạn",
                value: statistics?.overdueCount || 0,
                iconBg: "red",
                icon: "exclamation-triangle",
                valueColor: "#FF4D4F",
                isActive: overdueFilter,
                onClick: () => handleOverdueFilter(!overdueFilter),
              },
              {
                title: "Chờ phát hành",
                value: statistics?.pendingPublishCount || 0,
                iconBg: "blue",
                icon: "file-text",
                valueColor: "#096DD9",
                isActive:
                  statusFilter === QualityManagementStatus.PendingPublish,
                onClick: () =>
                  handleStatusFilter(
                    statusFilter === QualityManagementStatus.PendingPublish
                      ? undefined
                      : QualityManagementStatus.PendingPublish,
                  ),
              },
              {
                title: "Đã phát hành",
                value: statistics?.publishedCount || 0,
                iconBg: "cyan",
                icon: "file-earmark-check",
                valueColor: "#13C2C2",
                isActive:
                  statusFilter === QualityManagementStatus.FullyPublished,
                onClick: () =>
                  handleStatusFilter(
                    statusFilter === QualityManagementStatus.FullyPublished
                      ? undefined
                      : QualityManagementStatus.FullyPublished,
                  ),
              },
            ]
          : [
              {
                title: "Đang thực hiện",
                value: assignmentLogStats?.toDo || 0,
                iconBg: "red",
                icon: "flask",
                valueColor: "#FF4D4F",
                isActive:
                  assignmentLogQlclStatuses?.includes(QLCLDisplayStatus.ToDo) ??
                  false,
                onClick: () => {
                  const statuses = [
                    QLCLDisplayStatus.ToDo,
                    QLCLDisplayStatus.Testing,
                  ];
                  const isActive = assignmentLogQlclStatuses?.includes(
                    QLCLDisplayStatus.ToDo,
                  );
                  assignmentLogFilterHandler?.(isActive ? undefined : statuses);
                },
              },
              {
                title: "Chờ QLKT duyệt",
                value: assignmentLogStats?.waitingQLKTApproval || 0,
                iconBg: "late",
                icon: "clock",
                valueColor: "#FAAD14",
                isActive:
                  assignmentLogQlclStatuses?.includes(
                    QLCLDisplayStatus.WaitingQLKTApproval,
                  ) ?? false,
                onClick: () => {
                  const isActive = assignmentLogQlclStatuses?.includes(
                    QLCLDisplayStatus.WaitingQLKTApproval,
                  );
                  assignmentLogFilterHandler?.(
                    isActive
                      ? undefined
                      : [QLCLDisplayStatus.WaitingQLKTApproval],
                  );
                },
              },
              {
                title: "Chờ QLCL duyệt",
                value: assignmentLogStats?.waitingQLCLApproval || 0,
                iconBg: "purple",
                icon: "shield-check",
                valueColor: "#722ED1",
                isActive:
                  assignmentLogQlclStatuses?.includes(
                    QLCLDisplayStatus.WaitingQLCLApproval,
                  ) ?? false,
                onClick: () => {
                  const isActive = assignmentLogQlclStatuses?.includes(
                    QLCLDisplayStatus.WaitingQLCLApproval,
                  );
                  assignmentLogFilterHandler?.(
                    isActive
                      ? undefined
                      : [QLCLDisplayStatus.WaitingQLCLApproval],
                  );
                },
              },
              {
                title: "Chờ phát hành",
                value: assignmentLogStats?.waitingForPublishing || 0,
                iconBg: "blue",
                icon: "file-text",
                valueColor: "#096DD9",
                isActive:
                  assignmentLogQlclStatuses?.includes(
                    QLCLDisplayStatus.WaitingForPublishing,
                  ) ?? false,
                onClick: () => {
                  const isActive = assignmentLogQlclStatuses?.includes(
                    QLCLDisplayStatus.WaitingForPublishing,
                  );
                  assignmentLogFilterHandler?.(
                    isActive
                      ? undefined
                      : [QLCLDisplayStatus.WaitingForPublishing],
                  );
                },
              },
            ]
        ).map((stat, index) => (
          <Card
            key={`${activeTab}-${index}`}
            className={`dashboard-stat-card quality-stat-clickable${stat.isActive ? " quality-stat-active" : ""}`}
            bordered={false}
            onClick={stat.onClick}
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
          <Button
            icon={<ReloadOutlined />}
            onClick={
              activeTab === "reports"
                ? loadData
                : () => assignmentLogControlsRef.current?.reload()
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
          <SampleAssignmentLogTab onRegisterControls={handleRegisterControls} />
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
              {/* <Col xs={24} sm={8} md={4}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Trạng thái"
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
              </Col> */}
              <Col xs={24} sm={8} md={6}>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: "100%" }}
                  format="DD/MM/YY"
                  placeholder={["Ngày YC xong từ", "Đến ngày"]}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={8} md={6}>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Chọn phòng lab"
                  value={laboratoryIds}
                  onChange={handleLaboratoryChange}
                  showSearch
                  filterOption={(input, option) =>
                    ((option?.label as string) ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={laboratories.map((lab) => ({
                    value: lab.id,
                    label: lab.name,
                  }))}
                  maxTagCount="responsive"
                  allowClear
                />
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
