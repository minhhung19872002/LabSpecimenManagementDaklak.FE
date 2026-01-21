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
  SearchOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "../../components/common/Icon";
import { NCRStatus } from "../../services/ncrService";
import { useNCRList } from "./hooks";
import { NCRFormModal, NCRDetailModal } from "./components";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";

const NCRList: React.FC = () => {
  const {
    data,
    departments,
    loading,
    openCount,
    inProgressCount,
    closedCount,
    searchText,
    statusFilter,
    isModalOpen,
    isDetailOpen,
    editingItem,
    selectedItem,
    form,
    columns,
    handleSearchChange,
    handleStatusFilterChange,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
    handleDetailClose,
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
        title="Quản lý Công việc không phù hợp (NCR)"
        extra={
          <Space>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <Select.Option value={NCRStatus.Open}>Mở</Select.Option>
              <Select.Option value={NCRStatus.InProgress}>Đang xử lý</Select.Option>
              <Select.Option value={NCRStatus.Resolved}>Đã giải quyết</Select.Option>
              <Select.Option value={NCRStatus.Closed}>Đã đóng</Select.Option>
            </Select>
            {authService.hasPermission(PERMISSIONS.NCRs.Create) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Tạo NCR
              </Button>
            )}
          </Space>
        }
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1290 }}
          pagination={{
            pageSize: 50,
            pageSizeOptions: [50, 100, 150],
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} NCR`,
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
