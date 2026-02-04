import { useMemo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { UploadFile } from "antd/es/upload/interface";
import { useTestMethodsData, useTestMethodsActions } from "./hooks";
import {
  TestMethodsTable,
  TestMethodModal,
  AddIndicatorsModal,
  EditIndicatorModal,
  ImportTestMethodModal,
} from "./components";
import { getTestMethodColumns, getIndicatorColumns } from "./constants";
import { TestMethodsTabProps, TestMethodsActions, TestMethodImportPreviewDto } from "./types";
import {
  testMethodSchema,
  TestMethodFormData,
} from "./schemas/testMethodSchema";
import { API_BASE_URL, api } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/errorHandler";

const TestMethodsList = forwardRef<TestMethodsActions, TestMethodsTabProps>(({
  onDataChange,
  refreshKey,
}, ref) => {
  const {
    loading,
    searchText,
    groupedData,
    expandedRowKeys,
    indicatorGroups,
    indicatorsByGroup,
    specimenTypes,
    getSpecimenTypesByIndicator,
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
    // Edit indicator
    editIndicatorModalOpen,
    editIndicatorLoading,
    editingIndicator,
    handleOpenEditIndicator,
    handleEditIndicatorOk,
    handleEditIndicatorCancel,
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
      "_blank",
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
        formData,
      );
      setPreviewData(response.data);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Lỗi khi đọc file"));
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
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Lỗi khi import"));
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

  // Get existing indicator keys (indicatorId + specimenTypeId) for the selected test method
  const existingIndicatorKeys = useMemo(() => {
    if (!selectedTestMethodId) return [];
    const method = groupedData.find((m) => m.id === selectedTestMethodId);
    return method?.indicators
      ?.filter((ind) => !ind.parentIndicatorId) // Only parent indicators
      ?.map((ind) => ({
        indicatorId: ind.indicatorId,
        specimenTypeId: ind.specimenTypeId,
      })) || [];
  }, [selectedTestMethodId, groupedData]);

  // Memoized columns for test methods
  const methodColumns = useMemo(
    () =>
      getTestMethodColumns(
        (record) => handleEdit(record, form),
        handleDelete,
        handleToggleActive,
      ),
    [handleEdit, handleDelete, handleToggleActive, form],
  );

  // Memoized columns for indicators
  const indicatorColumns = useMemo(
    () => getIndicatorColumns(handleRemoveIndicator, handleOpenEditIndicator),
    [handleRemoveIndicator, handleOpenEditIndicator],
  );

  // Expose actions to parent
  useImperativeHandle(ref, () => ({
    handleCreate: () => handleCreate(form),
    handleDownloadTemplate,
    handleImport: () => setImportModalOpen(true),
  }));

  return (
    <>

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
        onAddIndicators={handleOpenAddIndicators}
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
        indicatorGroups={indicatorGroups}
        indicatorsByGroup={indicatorsByGroup}
        specimenTypes={specimenTypes}
        existingIndicatorKeys={existingIndicatorKeys}
        getSpecimenTypesByIndicator={getSpecimenTypesByIndicator}
        onOk={handleAddIndicatorsOk}
        onCancel={handleAddIndicatorsCancel}
      />

      {/* Edit Indicator Modal */}
      <EditIndicatorModal
        open={editIndicatorModalOpen}
        loading={editIndicatorLoading}
        indicator={editingIndicator}
        onOk={handleEditIndicatorOk}
        onCancel={handleEditIndicatorCancel}
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
});

TestMethodsList.displayName = "TestMethodsList";

export default TestMethodsList;
