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
} from "../../components/common/Icon";
import { TestingStatus } from "../../types/testing";
import { useTestingList } from "./hooks";

const TestingList: React.FC = () => {
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
    handleSearch,
    handleSearchInputChange,
    handleStatusFilterChange,
    handleTechnicianFilterChange,
    handleTableChange,
    handleRefresh,
    handleRowDoubleClick,
    getRowClassName,
  } = useTestingList();

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic
              title="Tổng xét nghiệm"
              value={stats.total}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic
              title="Chưa bắt đầu"
              value={stats.notStarted}
              valueStyle={{ color: "#8c8c8c" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic
              title="Đang thử nghiệm"
              value={stats.inProgress}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic
              title="Chờ phê duyệt"
              value={stats.pendingApproval}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic
              title="Bị từ chối"
              value={stats.rejected}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic
              title="Hoàn thành"
              value={stats.completed}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ExperimentOutlined />
            Quản lý thử nghiệm
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
        }
      >
        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
            pageSizeOptions: [20, 50, 100],
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} xét nghiệm`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
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
      `}</style>
    </div>
  );
};

export default TestingList;
