import React from "react";
import { Table, Button, Space, Card, Input, Row, Col, Select } from "antd";
import { PlusOutlined, ReloadOutlined } from "../../components/common/Icon";
import { TestStatus } from "../../types/test";
import { useTestList } from "./hooks";
import TestFormModal from "./components/TestFormModal";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";

const TestList: React.FC = () => {
  const {
    data,
    loading,
    totalCount,
    currentPage,
    pageSize,
    searchInput,
    statusFilter,
    columns,
    isModalOpen,
    editingItem,
    form,
    testMethods,
    specimens,
    users,
    standards,
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusChange,
    handlePageChange,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
  } = useTestList();

  return (
    <Card
      title="Danh sách phép thử"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          {authService.hasPermission(PERMISSIONS.Tests.Create) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm phép thử
            </Button>
          )}
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo mã, tên, phương pháp, tiêu chuẩn..."
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            allowClear
            onClear={handleClearSearch}
            enterButton
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            style={{ width: "100%" }}
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value={TestStatus.Pending}>Chờ xử lý</Select.Option>
            <Select.Option value={TestStatus.Assigned}>Đã giao</Select.Option>
            <Select.Option value={TestStatus.InProgress}>
              Đang thực hiện
            </Select.Option>
            <Select.Option value={TestStatus.Completed}>
              Hoàn thành
            </Select.Option>
            <Select.Option value={TestStatus.Reviewed}>
              Đã xem xét
            </Select.Option>
            <Select.Option value={TestStatus.Approved}>
              Đã phê duyệt
            </Select.Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} phép thử`,
          onChange: handlePageChange,
        }}
        scroll={{ x: 1400 }}
      />

      {/* Create/Edit Modal */}
      <TestFormModal
        open={isModalOpen}
        isEditing={!!editingItem}
        form={form}
        specimens={specimens}
        testMethods={testMethods}
        standards={standards}
        users={users}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />
    </Card>
  );
};

export default TestList;
