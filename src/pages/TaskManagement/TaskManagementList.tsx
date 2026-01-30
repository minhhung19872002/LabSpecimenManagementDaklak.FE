import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Row,
  Col,
  Select,
  Typography,
  Radio,
} from "antd";
import Icon, {
  ExperimentOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "../../components/common/Icon";
import { LaboratoryTaskStatus } from "../../types/laboratoryTask";
import { useTaskManagementList } from "./hooks";
import LabSampleAssignmentLogTab from "./components/LabSampleAssignmentLogTab";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";
import "./TaskManagement.css";

const { Text } = Typography;

// Tab types
type TaskManagementTabType = "tasks" | "sample-assignment-log";

const TaskManagementList: React.FC = () => {
  // Tab state
  const [currentTab, setCurrentTab] = useState<TaskManagementTabType>("tasks");

  const {
    tasks,
    loading,
    searchText,
    statusFilter,
    pagination,
    stats,
    columns,
    handleSearch,
    handleSearchInputChange,
    handleStatusFilterChange,
    handleTableChange,
    handleRefresh,
    handleRowDoubleClick,
    getRowClassName,
  } = useTaskManagementList();

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value as TaskManagementTabType);
  };

  // Determine if showing task list or sample assignment log
  const isShowingSampleAssignmentLog = currentTab === "sample-assignment-log";

  return (
    <div>
      {/* Statistics Cards - only show for tasks tab */}
      {!isShowingSampleAssignmentLog && (
        <div className="dashboard-stats-grid task-stats-grid">
          {[
            {
              title: "Tổng công việc",
              value: stats.total,
              iconBg: "contract",
              icon: "flask",
            },
            {
              title: "Đánh giá TN",
              value: stats.underEvaluation,
              iconBg: "pending",
              icon: "clipboard-check",
              valueColor: "#13C2C2",
            },
            {
              title: "Chấp nhận TN",
              value: stats.accepted,
              iconBg: "green",
              icon: "check-circle",
              valueColor: "#389E0D",
            },
            {
              title: "Đang TN",
              value: stats.inProgress,
              iconBg: "orange",
              icon: "arrow-repeat",
              valueColor: "#D46B08",
            },
            {
              title: "Chờ duyệt",
              value: stats.waitingApproval,
              iconBg: "late",
              icon: "clock",
              valueColor: "#FAAD14",
            },
            {
              title: "Đã duyệt",
              value: stats.approved,
              iconBg: "ontime",
              icon: "check2-circle",
              valueColor: "#52C41A",
            },
            {
              title: "Đã gửi QLCL",
              value: stats.sentToQuality,
              iconBg: "purple",
              icon: "send",
              valueColor: "#531DAB",
            },
          ].map((stat, index) => (
            <Card key={index} className="dashboard-stat-card" bordered={false}>
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-info">
                  <Text className="dashboard-stat-title">{stat.title}</Text>
                  <div
                    className="dashboard-stat-value"
                    style={
                      stat.valueColor
                        ? {
                            background: stat.valueColor,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }
                        : undefined
                    }
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
      )}

      <Card
        className="list-card"
        title={
          <Space>
            <ExperimentOutlined />
            Quản lý công việc khoa phòng
          </Space>
        }
        extra={
          !isShowingSampleAssignmentLog && (
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          )
        }
        styles={{ body: { padding: 0 } }}
      >
        {/* Tabs */}
        <div
          className="statistics-detail-tabs"
          style={{ padding: "16px 16px 0" }}
        >
          <Radio.Group
            value={currentTab}
            onChange={(e) => handleTabChange(e.target.value)}
            optionType="button"
          >
            <Radio.Button value="tasks">Công việc khoa phòng</Radio.Button>
            <Radio.Button value="sample-assignment-log">
              Sổ nhận mẫu giao việc
            </Radio.Button>
          </Radio.Group>
        </div>
        <div style={{ borderBottom: "1px solid #f0f0f0" }} />

        {/* Content based on selected tab */}
        {isShowingSampleAssignmentLog ? (
          <LabSampleAssignmentLogTab />
        ) : (
          <>
            {/* Search & Filter */}
            <Row gutter={[16, 16]} style={{ marginBottom: 0, padding: 16 }}>
              <Col xs={24} sm={12} md={8}>
                <Input.Search
                  placeholder="Tìm theo số hợp đồng, quản lý kỹ thuật..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onSearch={handleSearch}
                  allowClear
                  enterButton
                />
              </Col>
              <Col xs={24} sm={6} md={4}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Trạng thái"
                  value={
                    statusFilter !== undefined ? String(statusFilter) : "all"
                  }
                  onChange={handleStatusFilterChange}
                >
                  <Select.Option value="all">Tất cả trạng thái</Select.Option>
                  <Select.Option
                    value={String(LaboratoryTaskStatus.UnderEvaluation)}
                  >
                    Đánh giá thử nghiệm
                  </Select.Option>
                  <Select.Option
                    value={String(LaboratoryTaskStatus.WaitingCustomerResponse)}
                  >
                    Chờ KH phản hồi
                  </Select.Option>
                  <Select.Option
                    value={String(LaboratoryTaskStatus.FullyAccepted)}
                  >
                    Chấp nhận TN
                  </Select.Option>
                  <Select.Option
                    value={String(LaboratoryTaskStatus.PartialAccepted)}
                  >
                    Chấp nhận 1 phần
                  </Select.Option>
                  <Select.Option value={String(LaboratoryTaskStatus.Assigned)}>
                    Đã phân công
                  </Select.Option>
                  <Select.Option
                    value={String(LaboratoryTaskStatus.InProgress)}
                  >
                    Đang thử nghiệm
                  </Select.Option>
                  <Select.Option
                    value={String(LaboratoryTaskStatus.WaitingApproval)}
                  >
                    Chờ duyệt kết quả
                  </Select.Option>
                  <Select.Option value={String(LaboratoryTaskStatus.Approved)}>
                    Đã duyệt
                  </Select.Option>
                  <Select.Option
                    value={String(LaboratoryTaskStatus.SentToQuality)}
                  >
                    Đã gửi QLCL
                  </Select.Option>
                </Select>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                pageSizeOptions: [50, 100, 150],
                showSizeChanger: true,
                showTotal: (total, range) => (
                  <>
                    Hiển thị{" "}
                    <b>
                      {range[0]}-{range[1]}/{total}
                    </b>
                  </>
                ),
              }}
              onChange={handleTableChange}
              scroll={{ x: 1100 }}
              onRow={(record) => ({
                onDoubleClick: () => handleRowDoubleClick(record),
                style: { cursor: "pointer" },
              })}
              rowClassName={getRowClassName}
            />
          </>
        )}
      </Card>

      <style>{`
        .urgent-row > td {
          background-color: #fff2f0 !important;
        }
        .urgent-row:hover > td {
          background-color: #ffebe8 !important;
        }
        .delayed-row > td {
          background-color: #fff7e6 !important;
        }
        .delayed-row:hover > td {
          background-color: #ffe7ba !important;
        }
      `}</style>
    </div>
  );
};

export default TaskManagementList;
