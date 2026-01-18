import React, { useMemo, useEffect, useRef, useState } from "react";
import { Button, Space, Row, Col, Form, message } from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "../../../components/common/Icon";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { UploadFile } from "antd/es/upload/interface";
import { useTestMethodsData, useTestMethodsActions } from "./hooks";
import {
  TestMethodsTable,
  TestMethodModal,
  AddIndicatorsModal,
  ImportTestMethodModal,
} from "./components";
import { getTestMethodColumns, getIndicatorColumns } from "./constants";
import { TestMethodsTabProps, TestMethodImportPreviewDto } from "./types";
import {
  testMethodSchema,
  TestMethodFormData,
} from "./schemas/testMethodSchema";
import { API_BASE_URL, api } from "../../../services/api";

const TestMethodsList: React.FC<TestMethodsTabProps> = ({ onDataChange, refreshKey }) => {
  const {
    loading,
    searchText,
    groupedData,
    expandedRowKeys,
    indicatorGroups,
    indicatorsByGroup,
    setSearchText,
    setExpandedRowKeys,
    fetchData,
    // Batch selection for indicators
    selectedIndicatorKeys,
    setSelectedIndicatorKeys,
    batchLoading,
    setBatchLoading,
  } = useTestMethodsData();

  // Refresh data when refreshKey changes (when switching to this tab)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (refreshKey !== undefined) {
      fetchData();
    }
  }, [refreshKey]);

  const {
    modalOpen,
    editingItem,
    modalLoading,
    addIndicatorsModalOpen,
    addIndicatorsLoading,
    selectedTestMethodId,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleModalCancel,
    handleOpenAddIndicators,
    handleAddIndicatorsOk,
    handleAddIndicatorsCancel,
    handleRemoveIndicator,
    handleToggleActive,
    // Batch remove indicators
    handleBatchRemoveIndicators,
  } = useTestMethodsActions({
    fetchData,
    onDataChange,
    expandedRowKeys,
    setExpandedRowKeys,
    selectedIndicatorKeys,
    setSelectedIndicatorKeys,
    setBatchLoading,
  });

  const form = useForm<TestMethodFormData>({
    resolver: yupResolver(testMethodSchema) as any,
    defaultValues: { name: "", unit: "", isActive: true },
  });
  const [addIndicatorsForm] = Form.useForm();

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] =
    useState<TestMethodImportPreviewDto | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Import handlers
  const handleDownloadTemplate = () => {
    window.open(
      `${API_BASE_URL}/api/v1/import/test-methods-with-indicators/template`,
      "_blank"
    );
  };

  const handlePreviewImport = async () => {
    if (!fileList.length || !fileList[0].originFileObj) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj as Blob);

    try {
      const response = await api.upload<TestMethodImportPreviewDto>(
        "/api/v1/import/test-methods-with-indicators/preview",
        formData
      );
      setPreviewData(response.data);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.error?.message ||
          "Lỗi khi đọc file"
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!fileList.length || !fileList[0].originFileObj) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj as Blob);

    try {
      const response = await api.upload<{
        success: boolean;
        message?: string;
      }>("/api/v1/import/test-methods-with-indicators", formData);

      const result = response.data;

      if (result.success) {
        message.success(result.message);
        setImportModalOpen(false);
        setPreviewData(null);
        setFileList([]);
        fetchData();
        onDataChange?.();
      } else {
        message.error(result.message || "Lỗi khi import");
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.error?.message ||
          "Lỗi khi import"
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportCancel = () => {
    setImportModalOpen(false);
    setPreviewData(null);
    setFileList([]);
  };

  const handleImportReset = () => {
    setPreviewData(null);
    setFileList([]);
  };

  // Get existing indicator IDs for the selected test method
  const existingIndicatorIds = useMemo(() => {
    if (!selectedTestMethodId) return [];
    const method = groupedData.find((m) => m.id === selectedTestMethodId);
    return method?.indicators?.map((ind) => ind.indicatorId) || [];
  }, [selectedTestMethodId, groupedData]);

  // Memoized columns for test methods
  const methodColumns = useMemo(
    () =>
      getTestMethodColumns(
        (record) => handleEdit(record, form),
        handleDelete,
        handleToggleActive
      ),
    [handleEdit, handleDelete, handleToggleActive, form]
  );

  // Memoized columns for indicators
  const indicatorColumns = useMemo(
    () => getIndicatorColumns(handleRemoveIndicator),
    [handleRemoveIndicator]
  );

  return (
    <>
      {/* Header Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="auto" />
        <Col>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              Download template
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setImportModalOpen(true)}
            >
              Import
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreate(form)}
            >
              Thêm phương pháp
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Expandable Table */}
      <TestMethodsTable
        loading={loading}
        batchLoading={batchLoading}
        groupedData={groupedData}
        methodColumns={methodColumns}
        indicatorColumns={indicatorColumns}
        expandedRowKeys={expandedRowKeys}
        searchText={searchText}
        // Batch selection for indicators
        selectedIndicatorKeys={selectedIndicatorKeys}
        onSelectedIndicatorKeysChange={setSelectedIndicatorKeys}
        onBatchRemoveIndicators={handleBatchRemoveIndicators}
        // Handlers
        onSearchChange={setSearchText}
        onExpandedRowsChange={setExpandedRowKeys}
        onAddIndicators={(testMethodId) =>
          handleOpenAddIndicators(testMethodId, addIndicatorsForm)
        }
      />

      {/* Create/Edit TestMethod Modal */}
      <TestMethodModal
        open={modalOpen}
        loading={modalLoading}
        editingItem={editingItem}
        form={form}
        onOk={(data) => handleModalOk(data, form)}
        onCancel={() => handleModalCancel(form)}
      />

      {/* Add Indicators Modal */}
      <AddIndicatorsModal
        open={addIndicatorsModalOpen}
        loading={addIndicatorsLoading}
        form={addIndicatorsForm}
        indicatorGroups={indicatorGroups}
        indicatorsByGroup={indicatorsByGroup}
        existingIndicatorIds={existingIndicatorIds}
        onOk={() => handleAddIndicatorsOk(addIndicatorsForm)}
        onCancel={() => handleAddIndicatorsCancel(addIndicatorsForm)}
      />

      {/* Import TestMethod Modal */}
      <ImportTestMethodModal
        open={importModalOpen}
        loading={importLoading}
        fileList={fileList}
        previewData={previewData}
        onFileListChange={setFileList}
        onPreview={handlePreviewImport}
        onConfirm={handleConfirmImport}
        onCancel={handleImportCancel}
        onReset={handleImportReset}
      />
    </>
  );
};

export default TestMethodsList;
