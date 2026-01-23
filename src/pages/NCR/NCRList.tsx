import React from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Alert,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "../../components/common/Icon";
import { NCRStatus } from "../../services/ncrService";
import { useNCRList } from "./hooks";
import { NCRFormModal, NCRDetailModal } from "./components";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import "../../styles/ListCard.css";

const NCRList: React.FC = () => {
  const {
    data,
    departments,
    loading,
    totalCount,
    currentPage,
    pageSize,
    openCount,
    inProgressCount,
    closedCount,
    searchInput,
    statusFilter,
    isModalOpen,
    isDetailOpen,
    editingItem,
    selectedItem,
    form,
    columns,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusFilterChange,
    handlePageChange,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
    handleDetailClose,
    loadData,
  } = useNCRList();

  return (
    <div>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="NCR đang mở"
              value={openCount}
              valueStyle={{ color: "#cf1322" }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đang xử lý"
              value={inProgressCount}
              valueStyle={{ color: "#1890ff" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã đóng"
              value={closedCount}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {openCount > 0 && (
        <Alert
          message={`Có ${openCount} NCR đang chờ xử lý`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        className="list-card"
        title="Quản lý Công việc không phù hợp (NCR)"
        extra={
          <Space>
            {authService.hasPermission(PERMISSIONS.NCRs.Create) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Tạo NCR
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={loadData} />
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Tìm kiếm theo mã NCR, tiêu đề, phòng ban..."
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              allowClear
              onClear={handleClearSearch}
              enterButton
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <Select.Option value={NCRStatus.Open}>Mở</Select.Option>
              <Select.Option value={NCRStatus.InProgress}>Đang xử lý</Select.Option>
              <Select.Option value={NCRStatus.Resolved}>Đã giải quyết</Select.Option>
              <Select.Option value={NCRStatus.Closed}>Đã đóng</Select.Option>
            </Select>
          </Col>
        </Row>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1290 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            pageSizeOptions: [50, 100, 150],
            showSizeChanger: true,
            showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
            onChange: handlePageChange,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <NCRFormModal
        open={isModalOpen}
        isEditing={!!editingItem}
        form={form}
        departments={departments}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />

      {/* Detail Modal */}
      <NCRDetailModal
        open={isDetailOpen}
        ncr={selectedItem}
        onClose={handleDetailClose}
      />
    </div>
  );
};

export default NCRList;
