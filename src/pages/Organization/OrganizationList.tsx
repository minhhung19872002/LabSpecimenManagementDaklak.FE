import React from 'react';
import { Card, Button, Space, Input, Row, Col } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useOrganizationList } from './hooks/useOrganizationList';
import { OrganizationTable, OrganizationFormModal } from './components';

const OrganizationList: React.FC = () => {
  const {
    // Data
    data,
    loading,
    totalCount,

    // Pagination
    currentPage,
    pageSize,
    handlePageChange,

    // Search
    searchInput,
    handleSearchInputChange,
    handleSearch,
    handleClearSearch,

    // Modal
    modalVisible,
    modalMode,
    editingRecord,
    submitting,
    handleCreate,
    handleEdit,
    handleModalClose,

    // Location
    wards,
    handleProvinceChange,

    // Actions
    handleSave,
    handleDelete,
    loadData,
  } = useOrganizationList();

  return (
    <Card
      title="Quản lý Cơ sở / Doanh nghiệp"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm mới
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo tên..."
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            allowClear
            onClear={handleClearSearch}
            enterButton
          />
        </Col>
      </Row>

      <OrganizationTable
        data={data}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <OrganizationFormModal
        visible={modalVisible}
        mode={modalMode}
        editingRecord={editingRecord}
        submitting={submitting}
        wards={wards}
        onProvinceChange={handleProvinceChange}
        onSave={handleSave}
        onClose={handleModalClose}
      />
    </Card>
  );
};

export default OrganizationList;
