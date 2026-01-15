import React from "react";
import { Table, Button, Space, Card, Input, Row, Col, Select } from "antd";
import { PlusOutlined, ReloadOutlined } from "../../components/common/Icon";
import { SpecimenStatus } from "../../types/specimenHistory";
import { useSpecimenHistoryList } from "./hooks";
import SpecimenHistoryFormModal from "./components/SpecimenHistoryFormModal";

const SpecimenHistoryList: React.FC = () => {
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
    specimens,
    storageLocations,
    users,
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusChange,
    handlePageChange,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
  } = useSpecimenHistoryList();

  return (
    <Card
      title="Lịch sử mẫu thử nghiệm"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm lịch sử
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo mã mẫu, hành động, vị trí..."
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
            <Select.Option value={SpecimenStatus.Received}>
              Đã nhận
            </Select.Option>
            <Select.Option value={SpecimenStatus.Testing}>
              Đang thử nghiệm
            </Select.Option>
            <Select.Option value={SpecimenStatus.Storage}>
              Lưu kho
            </Select.Option>
            <Select.Option value={SpecimenStatus.Disposal}>
              Chờ hủy
            </Select.Option>
            <Select.Option value={SpecimenStatus.Destroyed}>
              Đã hủy
            </Select.Option>
            <Select.Option value={SpecimenStatus.ReturnedToCustomer}>
              Đã trả khách
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
          showTotal: (total) => `Tổng ${total} bản ghi`,
          onChange: handlePageChange,
        }}
        scroll={{ x: 1500 }}
      />

      {/* Create/Edit Modal */}
      <SpecimenHistoryFormModal
        open={isModalOpen}
        isEditing={!!editingItem}
        form={form}
        specimens={specimens}
        storageLocations={storageLocations}
        users={users}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />
    </Card>
  );
};

export default SpecimenHistoryList;
