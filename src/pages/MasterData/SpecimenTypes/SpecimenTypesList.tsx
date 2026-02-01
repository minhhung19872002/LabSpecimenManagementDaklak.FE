import { useMemo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { UploadFile } from "antd/es/upload/interface";
import { useSpecimenTypesData, useSpecimenTypesActions } from "./hooks";
import { SpecimenTypesTable, SpecimenTypeModal, AddIndicatorsModal, ImportSpecimenTypeModal } from "./components";
import { getSpecimenTypeColumns, getIndicatorColumns } from "./constants";
import { SpecimenTypesTabProps, SpecimenTypesActions, SpecimenTypeImportPreviewDto } from "./types";
import {
  specimenTypeSchema,
  SpecimenTypeFormData,
} from "./schemas/specimenTypeSchema";
import { API_BASE_URL, api } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/errorHandler";

const SpecimenTypesList = forwardRef<SpecimenTypesActions, SpecimenTypesTabProps>(({ onDataChange, refreshKey }, ref) => {
  const {
    loading,
    searchText,
    groupedData,
    expandedSpecimenTypeKeys,
    indicatorGroups,
    indicatorsByGroup,
    categoryOptions,
    setSearchText,
    setExpandedSpecimenTypeKeys,
    fetchData,
    // Batch selection for indicators
    selectedIndicatorKeys,
    setSelectedIndicatorKeys,
    batchLoading,
    setBatchLoading,
  } = useSpecimenTypesData();

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
    // SpecimenType modal
    modalOpen,
    editingItem,
    modalLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleModalCancel,
    // Add indicators modal
    addIndicatorsModalOpen,
    addIndicatorsLoading,
    selectedSpecimenTypeId,
    handleOpenAddIndicators,
    handleAddIndicatorsOk,
    handleAddIndicatorsCancel,
    handleRemoveIndicator,
    handleToggleIndicatorActive,
    // Batch remove indicators
    handleBatchRemoveIndicators,
  } = useSpecimenTypesActions({
    fetchData,
    onDataChange,
    expandedSpecimenTypeKeys,
    setExpandedSpecimenTypeKeys,
    selectedIndicatorKeys,
    setSelectedIndicatorKeys,
    setBatchLoading,
  });

  const specimenTypeForm = useForm<SpecimenTypeFormData>({
    resolver: yupResolver(specimenTypeSchema) as any,
    defaultValues: { code: "", name: "", description: "", isActive: true, sampleTypeCategoryId: "" },
  });

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] =
    useState<SpecimenTypeImportPreviewDto | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Import handlers
  const handleDownloadTemplate = () => {
    window.open(
      `${API_BASE_URL}/api/v1/import/specimen-types/template`,
      "_blank",
    );
  };

  const handlePreviewImport = async () => {
    if (!fileList.length || !fileList[0].originFileObj) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj as Blob);

    try {
      const response = await api.upload<SpecimenTypeImportPreviewDto>(
        "/api/v1/import/specimen-types/preview",
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
      }>("/api/v1/import/specimen-types", formData);

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

  // Get existing indicator IDs for the selected specimen type
  const existingIndicatorIds = useMemo(() => {
    if (!selectedSpecimenTypeId) return [];
    const type = groupedData.find((t) => t.id === selectedSpecimenTypeId);
    return type?.indicators?.map((ind) => ind.indicatorId) || [];
  }, [selectedSpecimenTypeId, groupedData]);

  // Memoized columns for specimen types (with category column)
  const specimenTypeColumns = useMemo(
    () =>
      getSpecimenTypeColumns(
        (record) => handleEdit(record, specimenTypeForm),
        handleDelete
      ),
    [handleEdit, handleDelete, specimenTypeForm]
  );

  // Memoized columns for indicators
  const indicatorColumns = useMemo(
    () => getIndicatorColumns(handleRemoveIndicator, handleToggleIndicatorActive),
    [handleRemoveIndicator, handleToggleIndicatorActive]
  );

  // Expose actions to parent
  useImperativeHandle(ref, () => ({
    handleCreate: () => handleCreate(specimenTypeForm),
    handleDownloadTemplate,
    handleImport: () => setImportModalOpen(true),
  }));

  return (
    <>

      {/* SpecimenTypes Table with nested Indicators */}
      <SpecimenTypesTable
        loading={loading}
        batchLoading={batchLoading}
        groupedData={groupedData}
        specimenTypeColumns={specimenTypeColumns}
        indicatorColumns={indicatorColumns}
        expandedSpecimenTypeKeys={expandedSpecimenTypeKeys}
        searchText={searchText}
        // Batch selection for indicators
        selectedIndicatorKeys={selectedIndicatorKeys}
        onSelectedIndicatorKeysChange={setSelectedIndicatorKeys}
        onBatchRemoveIndicators={handleBatchRemoveIndicators}
        // Handlers
        onSearchChange={setSearchText}
        onExpandedSpecimenTypeKeysChange={setExpandedSpecimenTypeKeys}
        onAddIndicators={handleOpenAddIndicators}
      />

      {/* Create/Edit SpecimenType Modal */}
      <SpecimenTypeModal
        open={modalOpen}
        loading={modalLoading}
        editingItem={editingItem}
        form={specimenTypeForm}
        categoryOptions={categoryOptions}
        onOk={(data) => handleModalOk(data, specimenTypeForm)}
        onCancel={() => handleModalCancel(specimenTypeForm)}
      />

      {/* Add Indicators Modal */}
      <AddIndicatorsModal
        open={addIndicatorsModalOpen}
        loading={addIndicatorsLoading}
        indicatorGroups={indicatorGroups}
        indicatorsByGroup={indicatorsByGroup}
        existingIndicatorIds={existingIndicatorIds}
        onOk={handleAddIndicatorsOk}
        onCancel={handleAddIndicatorsCancel}
      />

      {/* Import Modal */}
      <ImportSpecimenTypeModal
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

SpecimenTypesList.displayName = "SpecimenTypesList";

export default SpecimenTypesList;
