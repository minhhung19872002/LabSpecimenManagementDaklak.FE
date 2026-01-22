import React from "react";
import { Table, Button, Space, Card, Input, Row, Col, Select } from "antd";
import { PlusOutlined, ReloadOutlined } from "../../components/common/Icon";
import { ResultApprovalStatus } from "../../types/testResult";
import { useTestResultList } from "./hooks";
import TestResultFormModal from "./components/TestResultFormModal";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";

const TestResultList: React.FC = () => {
  const {
    data,
    tests,
    loading,
    totalCount,
    currentPage,
    pageSize,
    searchInput,
    statusFilter,
    passFilter,
    columns,
    isModalOpen,
    editingItem,
    form,
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusChange,
    handlePassFilterChange,
    handlePageChange,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
  } = useTestResultList();

  return (
    <Card
      title="Kết quả thử nghiệm"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          {authService.hasPermission(PERMISSIONS.TestResults.Create) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm kết quả
            </Button>
          )}
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo mã, chỉ tiêu, giá trị..."
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
            placeholder="Trạng thái duyệt"
            value={statusFilter === undefined ? "all" : statusFilter}
            onChange={handleStatusChange}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value={ResultApprovalStatus.Draft}>
              Nháp
            </Select.Option>
            <Select.Option value={ResultApprovalStatus.Submitted}>
              Đã nộp
            </Select.Option>
            <Select.Option value={ResultApprovalStatus.Step1Reviewed}>
              Đã xem xét
            </Select.Option>
            <Select.Option value={ResultApprovalStatus.Step2Approved}>
              Đã phê duyệt
            </Select.Option>
            <Select.Option value={ResultApprovalStatus.Rejected}>
              Từ chối
            </Select.Option>
          </Select>
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            style={{ width: "100%" }}
            placeholder="Kết quả"
            value={
              passFilter === undefined ? "all" : passFilter ? "pass" : "fail"
            }
            onChange={handlePassFilterChange}
          >
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="pass">Đạt</Select.Option>
            <Select.Option value="fail">Không đạt</Select.Option>
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
          showTotal: (total) => `Tổng ${total} kết quả`,
          onChange: handlePageChange,
        }}
        scroll={{ x: 1300 }}
      />

      {/* Create/Edit Modal */}
      <TestResultFormModal
        open={isModalOpen}
        isEditing={!!editingItem}
        form={form}
        tests={tests}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />
    </Card>
  );
};

export default TestResultList;
