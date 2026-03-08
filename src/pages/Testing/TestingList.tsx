import React, { useState, useEffect, useCallback } from "react";
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
  DatePicker,
} from "antd";
const { RangePicker } = DatePicker;
import Icon, {
  ExperimentOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "../../components/common/Icon";
import { TestingStatus, TestingTabType } from "../../types/testing";
import { QLKTDisplayStatus } from "../../types/laboratoryTask";
import { SampleAssignmentLogStatisticsDto } from "../../types/qualityManagement";
import { testingService } from "../../services/testingService";
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
    dateRange,
    selectedIndicatorIds,
    indicators,
    handleSearch,
    handleSearchInputChange,
    handleStatusFilterChange,
    handleTechnicianFilterChange,
    handleDateRangeChange,
    handleIndicatorChange,
    handleTabChange,
    handleTableChange,
    handleRefresh,
    handleRowDoubleClick,
    getRowClassName,
  } = useTestingList();

  // Determine if showing testing content or sample assignment log
  const isShowingSampleAssignmentLog = currentTab === "sample-assignment-log";

  // Sample assignment log stats & filter
  const [salStats, setSalStats] = useState<SampleAssignmentLogStatisticsDto>({
    total: 0, underReview: 0, toDo: 0, testing: 0, waitingApproval: 0, resultRejected: 0, completed: 0,
  });
  const [salDisplayStatusFilter, setSalDisplayStatusFilter] = useState<
    QLKTDisplayStatus | undefined
  >(undefined);

  const loadSalStats = useCallback(async () => {
    try {
      const result = await testingService.getSampleAssignmentLogStatistics();
      setSalStats(result);
    } catch (error) {
      console.error("Failed to load SAL statistics:", error);
    }
  }, []);

  useEffect(() => {
    if (isShowingSampleAssignmentLog) {
      loadSalStats();
    }
  }, [isShowingSampleAssignmentLog, loadSalStats]);

  const handleSalDisplayStatusFilterChange = useCallback((value: string) => {
    setSalDisplayStatusFilter(
      value === "all" ? undefined : (Number(value) as QLKTDisplayStatus)
    );
  }, []);

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

  // Show extra filters only for "Công việc của Lab" tab
  const isAllTab = activeTab === TestingTabType.All;

  return (
    <div>
      {/* Statistics Cards */}
      <div className="dashboard-stats-grid testing-stats-grid">
        {(isShowingSampleAssignmentLog
          ? [
              {
                title: "Tổng chỉ tiêu",
                value: salStats.total,
                iconBg: "contract",
                icon: "flask",
                filterValue: "all",
              },
              {
                title: "Đang xem xét",
                value: salStats.underReview,
                iconBg: "pending",
                icon: "search",
                valueColor: "#8C8C8C",
                filterValue: String(QLKTDisplayStatus.UnderReview),
              },
              {
                title: "Cần làm",
                value: salStats.toDo,
                iconBg: "blue",
                icon: "list-task",
                valueColor: "#1890FF",
                filterValue: String(QLKTDisplayStatus.ToDo),
              },
              {
                title: "Đang TN",
                value: salStats.testing,
                iconBg: "late",
                icon: "arrow-repeat",
                valueColor: "#FAAD14",
                filterValue: String(QLKTDisplayStatus.Testing),
              },
              {
                title: "Chờ duyệt",
                value: salStats.waitingApproval,
                iconBg: "red",
                icon: "clock",
                valueColor: "#FA8C16",
                filterValue: String(QLKTDisplayStatus.WaitingQLKTApproval),
              },
              {
                title: "Hoàn thành",
                value: salStats.completed,
                iconBg: "green",
                icon: "check-circle",
                valueColor: "#52C41A",
                filterValue: String(QLKTDisplayStatus.Completed),
              },
            ]
          : [
              {
                title: "Tổng xét nghiệm",
                value: stats.total,
                iconBg: "contract",
                icon: "flask",
                filterValue: "all",
              },
              {
                title: "Chưa bắt đầu",
                value: stats.notStarted,
                iconBg: "pending",
                icon: "hourglass",
                valueColor: "#8C8C8C",
                filterValue: String(TestingStatus.NotStarted),
              },
              {
                title: "Đang thử nghiệm",
                value: stats.inProgress,
                iconBg: "blue",
                icon: "arrow-repeat",
                valueColor: "#1890FF",
                filterValue: String(TestingStatus.InProgress),
              },
              {
                title: "Chờ phê duyệt",
                value: stats.pendingApproval,
                iconBg: "late",
                icon: "clock",
                valueColor: "#FAAD14",
                filterValue: String(TestingStatus.PendingApproval),
              },
              {
                title: "Bị từ chối",
                value: stats.rejected,
                iconBg: "red",
                icon: "x-circle",
                valueColor: "#FF4D4F",
                filterValue: String(TestingStatus.Rejected),
              },
              {
                title: "Hoàn thành",
                value: stats.completed,
                iconBg: "green",
                icon: "check-circle",
                valueColor: "#52C41A",
                filterValue: String(TestingStatus.Completed),
              },
            ]
        ).map((stat, index) => {
          const isActive = isShowingSampleAssignmentLog
            ? stat.filterValue === "all"
              ? salDisplayStatusFilter === undefined
              : salDisplayStatusFilter === Number(stat.filterValue)
            : stat.filterValue === "all"
              ? statusFilter === undefined
              : statusFilter === Number(stat.filterValue);

          return (
            <Card
              key={index}
              className={`dashboard-stat-card testing-stat-clickable${isActive ? " testing-stat-active" : ""}`}
              bordered={false}
              onClick={() =>
                isShowingSampleAssignmentLog
                  ? handleSalDisplayStatusFilterChange(stat.filterValue)
                  : handleStatusFilterChange(stat.filterValue)
              }
            >
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-info">
                  <Text className="dashboard-stat-title">{stat.title}</Text>
                  <div
                    className="dashboard-stat-value"
                    style={
                      stat.valueColor
                        ? {
                            background: "none",
                            WebkitBackgroundClip: "unset",
                            WebkitTextFillColor: stat.valueColor,
                            backgroundClip: "unset",
                            color: stat.valueColor,
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
          );
        })}
      </div>

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
          <LabSampleAssignmentLogTab displayStatusFilter={salDisplayStatusFilter} />
        ) : (
          <>
            {/* Search & Filter */}
            <Row gutter={[16, 16]} style={{ marginBottom: 0, padding: 16 }}>
              <Col xs={24} sm={12} md={isAllTab ? 6 : 8}>
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
              {isAllTab && (
                <>
                  <Col xs={24} sm={12} md={5}>
                    <RangePicker
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      style={{ width: "100%" }}
                      format="DD/MM/YY"
                      allowClear
                    />
                  </Col>
                  <Col xs={24} sm={12} md={7}>
                    <Select
                      mode="multiple"
                      style={{ width: "100%" }}
                      placeholder="Chọn chỉ tiêu"
                      value={selectedIndicatorIds}
                      onChange={handleIndicatorChange}
                      showSearch
                      filterOption={(input, option) =>
                        ((option?.label as string) ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={indicators.map((ind) => ({
                        value: ind.id,
                        label: ind.name,
                      }))}
                      maxTagCount="responsive"
                      allowClear
                    />
                  </Col>
                </>
              )}
              <Col xs={24} sm={6} md={isAllTab ? 6 : 4}>
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
              sticky={{ offsetHeader: 80 }}
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
