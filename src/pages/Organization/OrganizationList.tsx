import React, { useState } from "react";
import { Card, Button, Space, Input, Row, Col, message } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined,
} from "../../components/common/Icon";
import type { UploadFile } from "antd/es/upload/interface";
import { useOrganizationList } from "./hooks/useOrganizationList";
import {
  OrganizationTable,
  OrganizationFormModal,
  ImportOrganizationModal,
} from "./components";
import {
  importService,
  downloadBlobAsFile,
  type OrganizationTestRequestImportPreviewDto,
} from "../../services/importService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import "../../styles/ListCard.css";

const OrganizationList: React.FC = () => {
  // Import modal state
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFileList, setImportFileList] = useState<UploadFile[]>([]);
  const [importPreviewData, setImportPreviewData] =
    useState<OrganizationTestRequestImportPreviewDto | null>(null);

  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const blob =
        await importService.downloadOrganizationTestRequestTemplate();
      downloadBlobAsFile(blob, "Template_CoSo_YeuCau.xlsx");
      message.success("Tải template thành công!");
    } catch (error) {
      message.error("Không thể tải template. Vui lòng thử lại.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Import handlers
  const handleImportPreview = async () => {
    if (!importFileList.length || !importFileList[0].originFileObj) {
      message.warning("Vui lòng chọn file Excel để import.");
      return;
    }

    try {
      setImportLoading(true);
      const result = await importService.previewOrganizationTestRequests(
        importFileList[0].originFileObj as File
      );
      setImportPreviewData(result);
    } catch (error: any) {
      message.error(error?.message || "Không thể xem trước dữ liệu.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFileList.length || !importFileList[0].originFileObj) {
      message.warning("Vui lòng chọn file Excel để import.");
      return;
    }

    try {
      setImportLoading(true);
      const result = await importService.importOrganizationTestRequests(
        importFileList[0].originFileObj as File
      );

      if (result.success) {
        message.success(
          `Import thành công! Đã import ${result.importedRows} dòng.`
        );
        handleImportReset();
        setImportModalVisible(false);
        loadData();
      } else {
        message.error(
          result.message || "Import thất bại. Vui lòng kiểm tra lỗi."
        );
      }
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra khi import.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportReset = () => {
    setImportFileList([]);
    setImportPreviewData(null);
  };

  const handleImportCancel = () => {
    handleImportReset();
    setImportModalVisible(false);
  };

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
    submitting,
    form,
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
      className="list-card"
      title="Quản lý Cơ sở / Doanh nghiệp"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            loading={downloadingTemplate}
          >
            Tải template mẫu
          </Button>
          {authService.hasPermission(PERMISSIONS.MasterData.Create) && (
            <Button
              icon={<UploadOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              Nhập danh sách
            </Button>
          )}
          {authService.hasPermission(PERMISSIONS.MasterData.Create) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm mới
            </Button>
          )}
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
        form={form}
        submitting={submitting}
        wards={wards}
        onProvinceChange={handleProvinceChange}
        onSave={handleSave}
        onClose={handleModalClose}
      />

      <ImportOrganizationModal
        open={importModalVisible}
        loading={importLoading}
        fileList={importFileList}
        previewData={importPreviewData}
        onFileListChange={setImportFileList}
        onPreview={handleImportPreview}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
        onReset={handleImportReset}
      />
    </Card>
  );
};

export default OrganizationList;
