import React from "react";
import {
  Table,
  Button,
  Space,
  Card,
  Input,
  Row,
  Col,
  Select,
  DatePicker,
  Alert,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  CloudOutlined,
  SortAscendingOutlined,
} from "../../components/common/Icon";
import {
  TestRequestStatus,
  TestRequestStatusLabels,
} from "../../types/testRequest";
import ImportExcelModal from "../../components/common/ImportExcelModal";
import { useTestRequestList } from "./hooks";
import { useActionPermission, useHeaderHeight } from "../../hooks";
import "../../styles/ListCard.css";

const TestRequestList: React.FC = () => {
  const headerHeight = useHeaderHeight();
  const {
    loading,
    data,
    totalCount,
    currentPage,
    pageSize,
    searchInput,
    statusFilter,
    sorting,
    dateRange,
    importModalOpen,
    columns,
    isOfflineData,
    loadData,
    handleSearch,
    handleStatusChange,
    handleSortChange,
    handleDateRangeChange,
    handleCreate,
    handleRowDoubleClick,
    isUrgentRow,
    handlePageChange,
    handleSearchInputChange,
    handleClearSearch,
    closeImportModal,
    handleImportSuccess,
  } = useTestRequestList();

  // Check permission cho action "create" theo Permission Matrix
  // Chỉ BP Giao nhận và Admin có quyền tạo mới, QLCL chỉ có quyền View
  const { canAll: canCreate } = useActionPermission("testRequests", "create");

  return (
    <Card
      className="list-card"
      title="Danh sách yêu cầu thử nghiệm"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          {/* Chỉ hiển thị buttons tạo mới/import khi có quyền create */}
          {canCreate && (
            <>
              {/* <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                loading={downloadingTemplate}
              >
                Tải Template
              </Button>
              <Button icon={<ImportOutlined />} onClick={openImportModal}>
                Import Excel
              </Button> */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Tạo mới
              </Button>
            </>
          )}
        </Space>
      }
    >
      {/* Offline data alert */}
      {isOfflineData && (
        <Alert
          message={
            <Space>
              <CloudOutlined />
              <span>
                Đang xem dữ liệu đã lưu trong bộ nhớ đệm. Một số thông tin có
                thể không được cập nhật.
              </span>
            </Space>
          }
          type="warning"
          showIcon={false}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo số YC, tên CS/DN, người liên hệ, SĐT..."
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            allowClear
            onClear={handleClearSearch}
            enterButton
          />
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Select
            style={{ width: "100%" }}
            placeholder="Lọc theo trạng thái"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value={TestRequestStatus.New}>
              {TestRequestStatusLabels[TestRequestStatus.New]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.PendingPayment}>
              {TestRequestStatusLabels[TestRequestStatus.PendingPayment]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.Paid}>
              {TestRequestStatusLabels[TestRequestStatus.Paid]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.SampleSent}>
              {TestRequestStatusLabels[TestRequestStatus.SampleSent]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.InProgress}>
              {TestRequestStatusLabels[TestRequestStatus.InProgress]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.PendingChangeApproval}>
              {TestRequestStatusLabels[TestRequestStatus.PendingChangeApproval]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.Completed}>
              {TestRequestStatusLabels[TestRequestStatus.Completed]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.Cancelled}>
              {TestRequestStatusLabels[TestRequestStatus.Cancelled]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.UnderReview}>
              {TestRequestStatusLabels[TestRequestStatus.UnderReview]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.WaitingCustomerConfirm}>
              {
                TestRequestStatusLabels[
                  TestRequestStatus.WaitingCustomerConfirm
                ]
              }
            </Select.Option>
            <Select.Option value={TestRequestStatus.RequestApproved}>
              {TestRequestStatusLabels[TestRequestStatus.RequestApproved]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.PartialResultSent}>
              {TestRequestStatusLabels[TestRequestStatus.PartialResultSent]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.ReportPublished}>
              {TestRequestStatusLabels[TestRequestStatus.ReportPublished]}
            </Select.Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ whiteSpace: "nowrap", color: "#666" }}>
              Ngày HT dự kiến:
            </span>
            <DatePicker.RangePicker
              style={{ flex: 1 }}
              placeholder={["Từ ngày", "Đến ngày"]}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={handleDateRangeChange}
              allowClear
            />
          </div>
        </Col>
        <Col flex="auto" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Select
            value={sorting}
            onChange={handleSortChange}
            prefix={<SortAscendingOutlined />}
          >
            <Select.Option value="contractDate desc">Ngày hợp đồng mới nhất</Select.Option>
            <Select.Option value="expectedCompletionDate desc">Ngày yêu cầu xong mới nhất</Select.Option>
            <Select.Option value="expectedCompletionDate asc">Ngày yêu cầu xong cũ nhất</Select.Option>
          </Select>
        </Col>
      </Row>

      <style>{`
        .urgent-row > td { background-color: #fff2f0 !important; }
        .urgent-row:hover > td { background-color: #ffebe8 !important; }
      `}</style>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        rowClassName={(record) => (isUrgentRow(record) ? "urgent-row" : "")}
        onRow={(record) => ({
          onDoubleClick: () => handleRowDoubleClick(record),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total, range) => (
            <>
              Hiển thị{" "}
              <b>
                {range[0]}-{range[1]}/{total}
              </b>
            </>
          ),
          onChange: handlePageChange,
        }}
        sticky={{ offsetHeader: headerHeight }}
        scroll={{ x: 1600 }}
      />

      {/* Import Excel Modal */}
      <ImportExcelModal
        open={importModalOpen}
        onClose={closeImportModal}
        onSuccess={handleImportSuccess}
        importType="test-requests"
      />
    </Card>
  );
};

export default TestRequestList;
