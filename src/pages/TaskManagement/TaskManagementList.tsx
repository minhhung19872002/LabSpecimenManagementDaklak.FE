import React, { useState, useEffect, useCallback, useRef } from "react";
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
  TeamOutlined,
} from "../../components/common/Icon";
import {
  LaboratoryTaskStatus,
  QLKTDisplayStatus,
} from "../../types/laboratoryTask";
import { TestRequestStatus } from "../../types/testRequest";
import { SampleAssignmentLogStatisticsDto } from "../../types/qualityManagement";
import { laboratoryTaskService } from "../../services/laboratoryTaskService";
import { useTaskManagementList } from "./hooks";
import { useActionPermission } from "../../hooks/useActionPermission";
import LabSampleAssignmentLogTab from "./components/LabSampleAssignmentLogTab";
import DepartmentSupporterModal from "./components/DepartmentSupporterModal";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";
import "./TaskManagement.css";

const { Text } = Typography;

// Tab types
type TaskManagementTabType = "tasks" | "sample-assignment-log";

const TaskManagementList: React.FC = () => {
  // Tab state
  const [currentTab, setCurrentTab] = useState<TaskManagementTabType>("tasks");
  const [deptSupporterModalOpen, setDeptSupporterModalOpen] = useState(false);

  // Permission: only QLKT/Admin can add department supporters
  const { canAll: canAddDeptSupporter } = useActionPermission(
    "tasks",
    "addSupporter",
  );

  const {
    tasks,
    loading,
    searchText,
    statusFilter,
    testRequestStatusFilter,
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

  // SAL reload ref
  const salReloadRef = useRef<(() => void) | null>(null);

  // Determine if showing task list or sample assignment log
  const isShowingSampleAssignmentLog = currentTab === "sample-assignment-log";

  // SAL statistics & display status filter
  const [salStats, setSalStats] = useState<SampleAssignmentLogStatisticsDto>({
    total: 0,
    underReview: 0,
    toDo: 0,
    testing: 0,
    waitingApproval: 0,
    resultRejected: 0,
    completed: 0,
  });
  const [salDisplayStatusFilter, setSalDisplayStatusFilter] = useState<
    QLKTDisplayStatus | undefined
  >(undefined);

  const loadSalStats = useCallback(async () => {
    try {
      const result =
        await laboratoryTaskService.getSampleAssignmentLogStatistics();
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
      value === "all" ? undefined : (Number(value) as QLKTDisplayStatus),
    );
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value as TaskManagementTabType);
  };

  return (
    <div>
      {/* Statistics Cards */}
      <div className="dashboard-stats-grid task-stats-grid">
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
                title: "Tổng công việc",
                value: stats.total,
                iconBg: "contract",
                icon: "flask",
                filterValue: "all",
              },
              {
                title: "Đánh giá TN",
                value: stats.underEvaluation,
                iconBg: "pending",
                icon: "clipboard-check",
                valueColor: "#13C2C2",
                filterValue: String(LaboratoryTaskStatus.UnderEvaluation),
              },
              {
                title: "Chấp nhận TN",
                value: stats.accepted,
                iconBg: "green",
                icon: "check-circle",
                valueColor: "#389E0D",
                filterValue: String(LaboratoryTaskStatus.FullyAccepted),
              },
              {
                title: "Đang TN",
                value: stats.inProgress,
                iconBg: "orange",
                icon: "arrow-repeat",
                valueColor: "#D46B08",
                filterValue: String(LaboratoryTaskStatus.InProgress),
              },
              {
                title: "Chờ duyệt",
                value: stats.waitingApproval,
                iconBg: "late",
                icon: "clock",
                valueColor: "#FAAD14",
                filterValue: String(LaboratoryTaskStatus.WaitingApproval),
              },
              {
                title: "Đã duyệt",
                value: stats.approved,
                iconBg: "ontime",
                icon: "check2-circle",
                valueColor: "#52C41A",
                filterValue: String(LaboratoryTaskStatus.Approved),
              },
              {
                title: "Đã gửi QLCL",
                value: stats.sentToQuality,
                iconBg: "purple",
                icon: "send",
                valueColor: "#531DAB",
                filterValue: String(LaboratoryTaskStatus.SentToQuality),
              },
            ]
        ).map((stat, index) => {
          const isActive = isShowingSampleAssignmentLog
            ? stat.filterValue === "all"
              ? salDisplayStatusFilter === undefined
              : salDisplayStatusFilter === Number(stat.filterValue)
            : stat.filterValue === "all"
              ? statusFilter === undefined &&
                testRequestStatusFilter === undefined
              : statusFilter === Number(stat.filterValue);

          return (
            <Card
              key={index}
              className={`dashboard-stat-card task-stat-clickable${isActive ? " task-stat-active" : ""}`}
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
            Quản lý công việc khoa phòng
          </Space>
        }
        extra={
          <Space>
            {!isShowingSampleAssignmentLog && canAddDeptSupporter && (
              <Button
                icon={<TeamOutlined />}
                onClick={() => setDeptSupporterModalOpen(true)}
              >
                Thêm người hỗ trợ
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                if (isShowingSampleAssignmentLog) {
                  salReloadRef.current?.();
                  loadSalStats();
                } else {
                  handleRefresh();
                }
              }}
            />
          </Space>
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
          <LabSampleAssignmentLogTab
            displayStatusFilter={salDisplayStatusFilter}
            onReloadRef={salReloadRef}
          />
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
                    testRequestStatusFilter === TestRequestStatus.Cancelled
                      ? "cancelled-request"
                      : statusFilter !== undefined
                        ? String(statusFilter)
                        : "all"
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
                  <Select.Option value="cancelled-request">
                    Hủy bỏ yêu cầu
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
              sticky={{ offsetHeader: 80 }}
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

      {/* Department Supporter Modal */}
      <DepartmentSupporterModal
        open={deptSupporterModalOpen}
        onClose={() => setDeptSupporterModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default TaskManagementList;
