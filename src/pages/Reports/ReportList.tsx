import React, { useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Modal,
  Descriptions,
  Divider,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  QrcodeOutlined,
  DownloadOutlined,
} from "../../components/common/Icon";
import QRCodeGenerator, { MiniQRCode } from "../../components/common/QRCodeGenerator";
import { useReportList, getStatusConfig } from "./hooks";
import { ReportFormModal, getReportColumns } from "./components";
import StatusTag from "../../components/common/StatusTag";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import "../../styles/ListCard.css";

const { RangePicker } = DatePicker;

const ReportList: React.FC = () => {
  const {
    data,
    testRequests,
    specimens,
    tests,
    loading,
    createLoading,
    workflowLoading,
    searchText,
    statusFilter,
    isCreateModalOpen,
    isPreviewOpen,
    isQrModalOpen,
    selectedReport,
    form,
    handleSearchChange,
    handleStatusFilterChange,
    handleOpenCreateModal,
    handleTestRequestChange,
    handleCreateModalCancel,
    handleCreateModalSubmit,
    handlePreview,
    handlePreviewClose,
    handleShowQR,
    handleQrModalClose,
    handleExportPDF,
    handleSendEmail,
    handlePrint,
    handleSubmitForApproval,
    handleApprove,
    handleIssue,
    loadData,
  } = useReportList();

  const columns = useMemo(
    () =>
      getReportColumns({
        onPreview: handlePreview,
        onShowQR: handleShowQR,
        onExportPDF: handleExportPDF,
        onPrint: handlePrint,
        onSendEmail: handleSendEmail,
        onSubmitForApproval: handleSubmitForApproval,
        onApprove: handleApprove,
        onIssue: handleIssue,
        workflowLoading,
      }),
    [
      handlePreview,
      handleShowQR,
      handleExportPDF,
      handlePrint,
      handleSendEmail,
      handleSubmitForApproval,
      handleApprove,
      handleIssue,
      workflowLoading,
    ]
  );

  return (
    <div>
      <Card
        className="list-card"
        title="Báo cáo kết quả thử nghiệm"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData} />
            {authService.hasPermission(PERMISSIONS.Reports.Create) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
                Tạo báo cáo
              </Button>
            )}
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo mã, khách hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <Select.Option value="Draft">Bản nháp</Select.Option>
              <Select.Option value="PendingApproval">Chờ duyệt</Select.Option>
              <Select.Option value="Approved">Đã duyệt</Select.Option>
              <Select.Option value="Issued">Đã phát hành</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={10}>
            <RangePicker style={{ width: "100%" }} placeholder={["Từ ngày", "Đến ngày"]} />
          </Col>
        </Row>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1620 }}
          pagination={{
            pageSize: 50,
            pageSizeOptions: [50, 100, 150],
            showSizeChanger: true,
            showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
          }}
        />
      </Card>

      {/* Create Report Modal */}
      <ReportFormModal
        open={isCreateModalOpen}
        form={form}
        testRequests={testRequests}
        specimens={specimens}
        tests={tests}
        loading={createLoading}
        onTestRequestChange={handleTestRequestChange}
        onCancel={handleCreateModalCancel}
        onSubmit={handleCreateModalSubmit}
      />

      {/* Preview Modal */}
      <Modal
        title={`Chi tiết báo cáo: ${selectedReport?.reportNumber}`}
        open={isPreviewOpen}
        onCancel={handlePreviewClose}
        centered
        footer={[
          <Button key="close" onClick={handlePreviewClose}>
            Đóng
          </Button>,
          (selectedReport?.status === "Approved" || selectedReport?.status === "Issued") && (
            <Button
              key="qr"
              icon={<QrcodeOutlined />}
              onClick={() => {
                handlePreviewClose();
                if (selectedReport) handleShowQR(selectedReport);
              }}
            >
              Mã QR
            </Button>
          ),
          <Button
            key="pdf"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedReport && handleExportPDF(selectedReport)}
            disabled={
              selectedReport?.status !== "Approved" && selectedReport?.status !== "Issued"
            }
          >
            Xuất PDF
          </Button>,
        ]}
        width={800}
      >
        {selectedReport && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Số báo cáo">
                {selectedReport.reportNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <StatusTag color={getStatusConfig(selectedReport.status).color}>
                  {getStatusConfig(selectedReport.status).text}
                </StatusTag>
              </Descriptions.Item>
              <Descriptions.Item label="Số yêu cầu">
                {selectedReport.requestNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{selectedReport.createdAt}</Descriptions.Item>
              <Descriptions.Item label="Khách hàng" span={2}>
                {selectedReport.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Mã mẫu">{selectedReport.specimenCode}</Descriptions.Item>
              <Descriptions.Item label="Tên mẫu">{selectedReport.specimenName}</Descriptions.Item>
              <Descriptions.Item label="Số phép thử">{selectedReport.testCount}</Descriptions.Item>
              {selectedReport.approvedAt && (
                <>
                  <Descriptions.Item label="Ngày duyệt">
                    {selectedReport.approvedAt}
                  </Descriptions.Item>
                  <Descriptions.Item label="Người duyệt">
                    {selectedReport.approvedBy}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {(selectedReport.status === "Approved" || selectedReport.status === "Issued") && (
              <>
                <Divider>Mã QR truy xuất</Divider>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <MiniQRCode
                    value={`${window.location.origin}/verify/${selectedReport.reportNumber}`}
                    size={100}
                    tooltipText="Quét mã để xác minh báo cáo"
                  />
                </div>
              </>
            )}
          </>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        title="Mã QR truy xuất báo cáo"
        open={isQrModalOpen}
        onCancel={handleQrModalClose}
        footer={[
          <Button key="close" onClick={handleQrModalClose}>
            Đóng
          </Button>,
        ]}
        width={400}
        centered
      >
        {selectedReport && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <QRCodeGenerator
              value={`${window.location.origin}/verify/${selectedReport.reportNumber}`}
              reportNumber={selectedReport.reportNumber}
              reportDate={selectedReport.createdAt}
              customerName={selectedReport.customerName}
              specimenCode={selectedReport.specimenCode}
              size={200}
              showDetails={true}
              title="Mã QR truy xuất nguồn gốc"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportList;
