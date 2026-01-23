import React from "react";
import { Table, Button, Space, Card, Input, Row, Col, Select } from "antd";
import { ReloadOutlined } from "../../components/common/Icon";
import {
  SampleStorageStatus,
  SampleStorageStatusLabels,
} from "../../types/sampleStorage";
import SampleStorageDetailModal from "./components/SampleStorageDetailModal";
import { useSpecimenList } from "./hooks";
import "../../styles/ListCard.css";

const SpecimenList: React.FC = () => {
  const {
    loading,
    data,
    totalCount,
    currentPage,
    pageSize,
    searchInput,
    statusFilter,
    selectedId,
    modalOpen,
    columns,
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusChange,
    handleRowDoubleClick,
    handleModalClose,
    handleModalSuccess,
    handlePageChange,
    getRowClassName,
  } = useSpecimenList();

  return (
    <Card
      className="list-card"
      title="Quản lý mẫu"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo số hợp đồng, khách hàng..."
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
            <Select.Option value={SampleStorageStatus.Received}>
              {SampleStorageStatusLabels[SampleStorageStatus.Received]}
            </Select.Option>
            <Select.Option value={SampleStorageStatus.PendingDisposal}>
              {SampleStorageStatusLabels[SampleStorageStatus.PendingDisposal]}
            </Select.Option>
            <Select.Option value={SampleStorageStatus.Disposed}>
              {SampleStorageStatusLabels[SampleStorageStatus.Disposed]}
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
          showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
          onChange: handlePageChange,
        }}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onDoubleClick: () => handleRowDoubleClick(record),
          className: getRowClassName(record),
        })}
        rowClassName={getRowClassName}
      />

      {/* Detail Modal */}
      <SampleStorageDetailModal
        open={modalOpen}
        testRequestId={selectedId}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </Card>
  );
};

export default SpecimenList;
