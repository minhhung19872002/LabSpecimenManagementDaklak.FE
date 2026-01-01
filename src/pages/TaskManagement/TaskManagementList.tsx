import React from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Row,
  Col,
  Select,
  Statistic,
} from "antd";
import {
  ExperimentOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { LaboratoryTaskStatus } from "../../types/laboratoryTask";
import { useTaskManagementList } from "./hooks";

const TaskManagementList: React.FC = () => {
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

  return (
    <div>
      {/* Statistics Cards */}
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
              title="Chưa giao việc"
              value={stats.notAssigned}
              valueStyle={{ color: "#8c8c8c" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Đã giao việc"
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
              title="Đã gửi QLCL"
              value={stats.sentToQuality}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ExperimentOutlined />
            Quản lý công việc khoa phòng
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Làm mới
          </Button>
        }
      >
        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
              value={statusFilter !== undefined ? String(statusFilter) : "all"}
              onChange={handleStatusFilterChange}
            >
              <Select.Option value="all">Tất cả trạng thái</Select.Option>
              <Select.Option value={String(LaboratoryTaskStatus.NotAssigned)}>
                Chưa giao việc
              </Select.Option>
              <Select.Option value={String(LaboratoryTaskStatus.Assigned)}>
                Đã giao việc
              </Select.Option>
              <Select.Option value={String(LaboratoryTaskStatus.Testing)}>
                Đang thử nghiệm
              </Select.Option>
              <Select.Option
                value={String(LaboratoryTaskStatus.PendingApproval)}
              >
                Chờ duyệt kết quả
              </Select.Option>
              <Select.Option value={String(LaboratoryTaskStatus.Approved)}>
                Đã duyệt
              </Select.Option>
              <Select.Option value={String(LaboratoryTaskStatus.SentToQuality)}>
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
            pageSizeOptions: [20, 50, 100],
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} công việc`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
          onRow={(record) => ({
            onDoubleClick: () => handleRowDoubleClick(record),
            style: { cursor: "pointer" },
          })}
          rowClassName={getRowClassName}
        />
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
