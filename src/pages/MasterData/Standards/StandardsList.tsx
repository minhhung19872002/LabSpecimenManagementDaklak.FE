import { useMemo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Form, message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { UploadFile } from "antd/es/upload/interface";
import { useStandardsData, useStandardsActions } from "./hooks";
import {
  StandardsTable,
  StandardModal,
  AddIndicatorsModal,
  EditIndicatorModal,
  ImportStandardModal,
} from "./components";
import { getStandardColumns, getIndicatorColumns } from "./constants";
import {
  StandardsTabProps,
  StandardsActions,
  StandardIndicatorDto,
  StandardImportPreviewDto,
} from "./types";
import { standardSchema, StandardFormData } from "./schemas/standardSchema";
import { API_BASE_URL, api } from "../../../services/api";

const StandardsList = forwardRef<StandardsActions, StandardsTabProps>(({
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
    getMethodsForIndicator,
    setSearchText,
    setExpandedRowKeys,
    fetchData,
    // Batch selection for indicators
    selectedIndicatorKeys,
    setSelectedIndicatorKeys,
    batchLoading,
    setBatchLoading,
  } = useStandardsData();

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
    selectedStandardId,
    selectedStandardName,
    editIndicatorModalOpen,
    editIndicatorLoading,
    editingIndicator,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleModalCancel,
    handleToggleActive,
    handleOpenAddIndicators,
    handleAddIndicatorsOk,
    handleAddIndicatorsCancel,
    handleOpenEditIndicator,
    handleEditIndicatorOk,
    handleEditIndicatorCancel,
    handleRemoveIndicator,
    handleToggleIndicatorActive,
    // Batch remove indicators
    handleBatchRemoveIndicators,
    // Batch activate/deactivate indicators
    handleBatchActivateIndicators,
    handleBatchDeactivateIndicators,
  } = useStandardsActions({
    fetchData,
    onDataChange,
    expandedRowKeys,
    setExpandedRowKeys,
    selectedIndicatorKeys,
    setSelectedIndicatorKeys,
    setBatchLoading,
  });

  const form = useForm<StandardFormData>({
    resolver: yupResolver(standardSchema) as any,
    defaultValues: { name: "", limitDescription: "", isActive: true },
  });
  const [addIndicatorsForm] = Form.useForm();
  const [editIndicatorForm] = Form.useForm();

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] =
    useState<StandardImportPreviewDto | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Import handlers
  const handleDownloadTemplate = () => {
    window.open(
      `${API_BASE_URL}/api/v1/import/standards-with-indicators/template`,
      "_blank"
    );
  };

  const handlePreviewImport = async () => {
    if (!fileList.length || !fileList[0].originFileObj) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj as Blob);

    try {
      const response = await api.upload<StandardImportPreviewDto>(
        "/api/v1/import/standards-with-indicators/preview",
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
      }>("/api/v1/import/standards-with-indicators", formData);

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

  // Memoized columns for standards
  const standardColumns = useMemo(
    () =>
      getStandardColumns(
        (record) => handleEdit(record, form),
        handleDelete,
        handleToggleActive
      ),
    [handleEdit, handleDelete, handleToggleActive, form]
  );

  // Memoized columns for indicators
  const indicatorColumns = useMemo(
    () =>
      getIndicatorColumns(
        (standardId: string, indicator: StandardIndicatorDto) =>
          handleOpenEditIndicator(standardId, indicator, editIndicatorForm),
        handleRemoveIndicator,
        handleToggleIndicatorActive
      ),
    [
      handleOpenEditIndicator,
      handleRemoveIndicator,
      handleToggleIndicatorActive,
      editIndicatorForm,
    ]
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
      <StandardsTable
        loading={loading}
        batchLoading={batchLoading}
        groupedData={groupedData}
        standardColumns={standardColumns}
        indicatorColumns={indicatorColumns}
        expandedRowKeys={expandedRowKeys}
        searchText={searchText}
        // Batch selection for indicators
        selectedIndicatorKeys={selectedIndicatorKeys}
        onSelectedIndicatorKeysChange={setSelectedIndicatorKeys}
        onBatchRemoveIndicators={handleBatchRemoveIndicators}
        onBatchActivateIndicators={handleBatchActivateIndicators}
        onBatchDeactivateIndicators={handleBatchDeactivateIndicators}
        // Handlers
        onSearchChange={setSearchText}
        onExpandedRowsChange={setExpandedRowKeys}
        onAddIndicators={(standardId, standardName) =>
          handleOpenAddIndicators(standardId, standardName, addIndicatorsForm)
        }
      />

      {/* Create/Edit Standard Modal */}
      <StandardModal
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
        standardName={selectedStandardName}
        indicatorGroups={indicatorGroups}
        indicatorsByGroup={indicatorsByGroup}
        existingIndicatorIds={
          selectedStandardId
            ? groupedData
                .find((s) => s.id === selectedStandardId)
                ?.indicators?.map((ind) => ind.indicatorId) || []
            : []
        }
        getMethodsForIndicator={getMethodsForIndicator}
        onOk={() => handleAddIndicatorsOk(addIndicatorsForm)}
        onCancel={() => handleAddIndicatorsCancel(addIndicatorsForm)}
      />

      {/* Edit Indicator Modal */}
      <EditIndicatorModal
        open={editIndicatorModalOpen}
        loading={editIndicatorLoading}
        indicator={editingIndicator}
        form={editIndicatorForm}
        onOk={() => handleEditIndicatorOk(editIndicatorForm)}
        onCancel={() => handleEditIndicatorCancel(editIndicatorForm)}
      />

      {/* Import Standard Modal */}
      <ImportStandardModal
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

StandardsList.displayName = "StandardsList";

export default StandardsList;
