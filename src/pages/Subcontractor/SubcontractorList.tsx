import React from "react";
import { Card, Table, Button, Space, Input, Row, Col, Select } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from "../../components/common/Icon";
import { useSubcontractorList } from "./hooks";
import {
  SubcontractorFormModal,
  SubcontractorDetailModal,
} from "./components";

const SubcontractorList: React.FC = () => {
  const {
    data,
    loading,
    totalCount,
    searchInput,
    statusFilter,
    currentPage,
    pageSize,
    isModalOpen,
    isDetailModalOpen,
    editingItem,
    selectedItem,
    form,
    columns,
    handleSearchInputChange,
    handleSearch,
    handleClearSearch,
    handleStatusFilterChange,
    handlePageChange,
    handleRefresh,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
    handleDetailModalClose,
  } = useSubcontractorList();

  return (
    <div>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            Quản lý Nhà thầu phụ
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm nhà thầu phụ
            </Button>
          </Space>
        }
      >
        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Tìm kiếm theo mã, tên, người liên hệ..."
              prefix={<SearchOutlined />}
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
              onChange={handleStatusFilterChange}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="active">Đang hoạt động</Select.Option>
              <Select.Option value="inactive">Ngừng hoạt động</Select.Option>
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
            pageSizeOptions: [20, 50, 100],
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} nhà thầu phụ`,
            onChange: handlePageChange,
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <SubcontractorFormModal
        open={isModalOpen}
        isEditing={!!editingItem}
        form={form}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />

      {/* Detail Modal */}
      <SubcontractorDetailModal
        open={isDetailModalOpen}
        subcontractor={selectedItem}
        onClose={handleDetailModalClose}
      />
    </div>
  );
};

export default SubcontractorList;
