import { useMemo, forwardRef, useImperativeHandle } from "react";
import { Form } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useIndicatorsData, useIndicatorsActions } from "./hooks";
import { getIndicatorColumns, getGroupColumns } from "./constants";
import {
  IndicatorsTable,
  GroupModal,
  IndicatorModal,
  BulkCreateModal,
  ImportIndicatorModal,
  ImportGroupModal,
  ImportIndicatorGroupModal,
} from "./components";
import { IndicatorsTabProps, IndicatorsActions } from "./types";
import {
  indicatorSchema,
  indicatorGroupSchema,
  IndicatorFormData,
  IndicatorGroupFormData,
} from "./schemas/indicatorSchema";

const IndicatorsList = forwardRef<IndicatorsActions, IndicatorsTabProps>(({ onDataChange }, ref) => {
  const {
    indicators,
    loading,
    searchText: _searchText,
    expandedRowKeys,
    selectedRowKeys,
    batchLoading,
    groupOptions,
    laboratoryOptions,
    groupedData,
    setSearchText: _setSearchText,
    setExpandedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    fetchData,
  } = useIndicatorsData();

  const {
    // Modal states
    groupModalOpen,
    setGroupModalOpen,
    indicatorModalOpen,
    setIndicatorModalOpen,
    bulkModalOpen,
    setBulkModalOpen,
    importModalOpen,
    setImportModalOpen,
    importGroupModalOpen,
    setImportGroupModalOpen,
    editingGroup,
    editingIndicator,
    modalLoading,
    importResult,
    setImportResult,
    importGroupResult,
    setImportGroupResult,
    fileList,
    setFileList,
    groupFileList,
    setGroupFileList,
    // Group actions
    handleCreateGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleGroupModalOk,
    // Indicator actions
    handleEditIndicator,
    handleDeleteIndicator,
    handleToggleActive,
    handleIndicatorModalOk,
    // Batch actions
    handleBatchDelete,
    handleBatchDeactivate,
    handleBatchActivate,
    // Bulk create
    handleBulkCreate,
    handleBulkModalOk,
    // Import
    handleImportExcel,
    handleImportGroupExcel,
    // Import nhóm chỉ tiêu mới (với preview)
    importIndicatorGroupModalOpen,
    setImportIndicatorGroupModalOpen,
    importIndicatorGroupFileList,
    setImportIndicatorGroupFileList,
    importIndicatorGroupPreview,
    setImportIndicatorGroupPreview,
    handleDownloadIndicatorGroupTemplate,
    handlePreviewIndicatorGroupImport,
    handleConfirmIndicatorGroupImport,
    handleResetIndicatorGroupImport,
  } = useIndicatorsActions({
    indicators,
    selectedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    fetchData,
    onDataChange,
  });

  const groupForm = useForm<IndicatorGroupFormData>({
    resolver: yupResolver(indicatorGroupSchema) as any,
    defaultValues: { name: "", isActive: true, laboratoryId: undefined },
  });
  const indicatorForm = useForm<IndicatorFormData>({
    resolver: yupResolver(indicatorSchema) as any,
    defaultValues: { indicatorGroupId: "", name: "", isActive: true },
  });
  const [bulkForm] = Form.useForm();

  // Memoized columns with handlers
  const indicatorColumns = useMemo(
    () =>
      getIndicatorColumns(
        (indicator) => handleEditIndicator(indicator, indicatorForm),
        handleToggleActive,
        handleDeleteIndicator,
      ),
    [
      handleEditIndicator,
      handleToggleActive,
      handleDeleteIndicator,
      indicatorForm,
    ],
  );

  const groupColumns = useMemo(
    () =>
      getGroupColumns(
        (group) => handleEditGroup(group, groupForm),
        handleDeleteGroup,
      ),
    [handleEditGroup, handleDeleteGroup, groupForm],
  );

  // Expose actions to parent
  useImperativeHandle(ref, () => ({
    handleBulkCreate: () => handleBulkCreate(bulkForm),
    handleCreateGroup: () => handleCreateGroup(groupForm),
    handleDownloadTemplate: handleDownloadIndicatorGroupTemplate,
    handleImport: () => setImportIndicatorGroupModalOpen(true),
  }));

  return (
    <>

      <IndicatorsTable
        loading={loading}
        batchLoading={batchLoading}
        groupedData={groupedData}
        expandedRowKeys={expandedRowKeys}
        selectedRowKeys={selectedRowKeys}
        indicators={indicators}
        groupColumns={groupColumns}
        indicatorColumns={indicatorColumns}
        onExpandedRowsChange={setExpandedRowKeys}
        onSelectedRowsChange={setSelectedRowKeys}
        onBatchDelete={handleBatchDelete}
        onBatchDeactivate={handleBatchDeactivate}
        onBatchActivate={handleBatchActivate}
      />

      {/* Group Modal */}
      <GroupModal
        open={groupModalOpen}
        loading={modalLoading}
        editingGroup={editingGroup}
        form={groupForm}
        laboratoryOptions={laboratoryOptions}
        onOk={(data) => handleGroupModalOk(data, groupForm)}
        onCancel={() => {
          setGroupModalOpen(false);
          groupForm.reset();
        }}
      />

      {/* Single Indicator Modal */}
      <IndicatorModal
        open={indicatorModalOpen}
        loading={modalLoading}
        editingIndicator={editingIndicator}
        form={indicatorForm}
        groupOptions={groupOptions}
        onOk={(data) => handleIndicatorModalOk(data, indicatorForm)}
        onCancel={() => {
          setIndicatorModalOpen(false);
          indicatorForm.reset();
        }}
      />

      {/* Bulk Create Modal */}
      <BulkCreateModal
        open={bulkModalOpen}
        loading={modalLoading}
        form={bulkForm}
        groupOptions={groupOptions}
        onOk={() => handleBulkModalOk(bulkForm)}
        onCancel={() => {
          setBulkModalOpen(false);
          bulkForm.resetFields();
        }}
      />

      {/* Import Excel Modal */}
      <ImportIndicatorModal
        open={importModalOpen}
        loading={modalLoading}
        fileList={fileList}
        importResult={importResult}
        onFileListChange={setFileList}
        onOk={handleImportExcel}
        onCancel={() => {
          setImportModalOpen(false);
          setImportResult(null);
          setFileList([]);
        }}
      />

      {/* Import Group Excel Modal */}
      <ImportGroupModal
        open={importGroupModalOpen}
        loading={modalLoading}
        fileList={groupFileList}
        importResult={importGroupResult}
        onFileListChange={setGroupFileList}
        onOk={handleImportGroupExcel}
        onCancel={() => {
          setImportGroupModalOpen(false);
          setImportGroupResult(null);
          setGroupFileList([]);
        }}
      />

      {/* Import Nhóm Chỉ Tiêu Modal (với preview) */}
      <ImportIndicatorGroupModal
        open={importIndicatorGroupModalOpen}
        loading={modalLoading}
        fileList={importIndicatorGroupFileList}
        previewData={importIndicatorGroupPreview}
        onFileListChange={setImportIndicatorGroupFileList}
        onPreview={handlePreviewIndicatorGroupImport}
        onConfirm={handleConfirmIndicatorGroupImport}
        onCancel={() => {
          setImportIndicatorGroupModalOpen(false);
          setImportIndicatorGroupPreview(null);
          setImportIndicatorGroupFileList([]);
        }}
        onReset={handleResetIndicatorGroupImport}
      />
    </>
  );
});

IndicatorsList.displayName = "IndicatorsList";

export default IndicatorsList;
