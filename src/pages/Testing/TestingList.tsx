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
  Radio,
  Typography,
} from "antd";
import Icon, {
  ExperimentOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "../../components/common/Icon";
import { TestingStatus, TestingTabType } from "../../types/testing";
import { useTestingList } from "./hooks";
import LabSampleAssignmentLogTab from "./components/LabSampleAssignmentLogTab";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";
import "./Testing.css";

const { Text } = Typography;

// Extended tab type to include sample assignment log
type ExtendedTabType = TestingTabType | "sample-assignment-log";

const TestingList: React.FC = () => {
  // Tab state - now includes sample-assignment-log
  const [currentTab, setCurrentTab] = useState<ExtendedTabType>(
    TestingTabType.MyAssignments,
  );

  const {
    tasks,
    loading,
    searchText,
    statusFilter,
    technicianFilter,
    technicians,
    loadingTechnicians,
    pagination,
    stats,
    columns,
    activeTab,
    handleSearch,
    handleSearchInputChange,
    handleStatusFilterChange,
    handleTechnicianFilterChange,
    handleTabChange,
    handleTableChange,
    handleRefresh,
    handleRowDoubleClick,
    getRowClassName,
  } = useTestingList();

  // Handle tab change - sync with useTestingList for testing tabs
  const handleExtendedTabChange = (value: string) => {
    if (value === "sample-assignment-log") {
      setCurrentTab("sample-assignment-log");
    } else {
      const numericKey = Number(value) as TestingTabType;
      setCurrentTab(numericKey);
      handleTabChange(value);
    }
  };

  // Determine if showing testing content or sample assignment log
  const isShowingSampleAssignmentLog = currentTab === "sample-assignment-log";

  return (
    <div>
      {/* Statistics Cards - only show for testing tabs */}
      {!isShowingSampleAssignmentLog && (
        <div className="dashboard-stats-grid testing-stats-grid">
          {[
            {
              title: "Tổng xét nghiệm",
              value: stats.total,
              iconBg: "contract",
              icon: "flask",
            },
            {
              title: "Chưa bắt đầu",
              value: stats.notStarted,
              iconBg: "pending",
              icon: "hourglass",
              valueColor: "#8C8C8C",
            },
            {
              title: "Đang thử nghiệm",
              value: stats.inProgress,
              iconBg: "blue",
              icon: "arrow-repeat",
              valueColor: "#1890FF",
            },
            {
              title: "Chờ phê duyệt",
              value: stats.pendingApproval,
              iconBg: "late",
              icon: "clock",
              valueColor: "#FAAD14",
            },
            {
              title: "Bị từ chối",
              value: stats.rejected,
              iconBg: "red",
              icon: "x-circle",
              valueColor: "#FF4D4F",
            },
            {
              title: "Hoàn thành",
              value: stats.completed,
              iconBg: "green",
              icon: "check-circle",
              valueColor: "#52C41A",
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
            Quản lý thử nghiệm
          </Space>
        }
        extra={
          !isShowingSampleAssignmentLog && (
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          )
        }
      >
        {/* Tabs */}
        <div className="statistics-detail-tabs" style={{ padding: "0 16px" }}>
          <Radio.Group
            value={
              currentTab === "sample-assignment-log"
                ? "sample-assignment-log"
                : String(activeTab)
            }
            onChange={(e) => handleExtendedTabChange(e.target.value)}
            optionType="button"
          >
            <Radio.Button value={String(TestingTabType.MyAssignments)}>
              Công việc của tôi
            </Radio.Button>
            <Radio.Button value={String(TestingTabType.All)}>
              Công việc của Lab
            </Radio.Button>
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
                  placeholder="Tìm theo số hợp đồng..."
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
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  allowClear
                >
                  <Select.Option value={TestingStatus.NotStarted}>
                    Chưa bắt đầu
                  </Select.Option>
                  <Select.Option value={TestingStatus.InProgress}>
                    Đang thử nghiệm
                  </Select.Option>
                  <Select.Option value={TestingStatus.PendingApproval}>
                    Chờ phê duyệt
                  </Select.Option>
                  <Select.Option value={TestingStatus.Rejected}>
                    Bị từ chối
                  </Select.Option>
                  <Select.Option value={TestingStatus.Completed}>
                    Hoàn thành
                  </Select.Option>
                </Select>
              </Col>
              <Col xs={24} sm={6} md={4}>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Thử nghiệm viên"
                  value={technicianFilter}
                  onChange={handleTechnicianFilterChange}
                  allowClear
                  loading={loadingTechnicians}
                  maxTagCount={1}
                  optionFilterProp="children"
                  showSearch
                >
                  {technicians.map((tech) => (
                    <Select.Option key={tech.id} value={tech.id}>
                      {tech.displayName || tech.userName}
                    </Select.Option>
                  ))}
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
              scroll={{ x: 1000 }}
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
      `}</style>
    </div>
  );
};

export default TestingList;
