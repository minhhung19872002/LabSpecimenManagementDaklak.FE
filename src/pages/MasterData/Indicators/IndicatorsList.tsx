import { useMemo, forwardRef, useImperativeHandle } from "react";
import { Form } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useIndicatorsData, useIndicatorsActions } from "./hooks";
import { getIndicatorColumns } from "./constants";
import {
  IndicatorsTable,
  IndicatorModal,
  BulkCreateModal,
  ImportIndicatorModal,
  ImportIndicatorGroupModal,
  AdminImportNameModal,
} from "./components";
import { IndicatorsTabProps, IndicatorsActions } from "./types";
import { indicatorSchema, IndicatorFormData } from "./schemas/indicatorSchema";

const IndicatorsList = forwardRef<IndicatorsActions, IndicatorsTabProps>(({ onDataChange }, ref) => {

  const {
    indicators,
    loading,
    searchText,
    groupFilter,
    selectedRowKeys,
    batchLoading,
    groupOptions,
    groupFilterOptions,
    laboratoryOptions,
    pagedIndicators,
    totalCount,
    currentPage,
    pageSize,
    setSearchText,
    setGroupFilter,
    setSelectedRowKeys,
    setBatchLoading,
    handlePageChange,
    fetchData,
  } = useIndicatorsData();

  const {
    // Modal states
    indicatorModalOpen,
    setIndicatorModalOpen,
    bulkModalOpen,
    setBulkModalOpen,
    importModalOpen,
    setImportModalOpen,
    editingIndicator,
    modalLoading,
    importResult,
    setImportResult,
    fileList,
    setFileList,
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
    // Admin import (ID-based)
    adminImportModalOpen,
    setAdminImportModalOpen,
    adminImportFileList,
    setAdminImportFileList,
    adminImportPreview,
    handleDownloadAdminTemplate,
    handlePreviewAdminImport,
    handleConfirmAdminImport,
    handleResetAdminImport,
  } = useIndicatorsActions({
    selectedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    fetchData,
    onDataChange,
  });
  const indicatorForm = useForm<IndicatorFormData>({
    resolver: yupResolver(indicatorSchema) as any,
    defaultValues: { indicatorGroupId: null, laboratoryId: "", name: "", isActive: true },
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

  // Expose actions to parent
  useImperativeHandle(ref, () => ({
    handleBulkCreate: () => handleBulkCreate(bulkForm),
    handleDownloadTemplate: handleDownloadIndicatorGroupTemplate,
    handleImport: () => setImportIndicatorGroupModalOpen(true),
    handleDownloadAdminTemplate,
    handleAdminImport: () => setAdminImportModalOpen(true),
  }));

  return (
    <>
      <IndicatorsTable
        loading={loading}
        batchLoading={batchLoading}
        dataSource={pagedIndicators}
        selectedRowKeys={selectedRowKeys}
        indicators={indicators}
        columns={indicatorColumns}
        onSelectedRowsChange={setSelectedRowKeys}
        onBatchDelete={handleBatchDelete}
        onBatchDeactivate={handleBatchDeactivate}
        onBatchActivate={handleBatchActivate}
        searchText={searchText}
        onSearchChange={setSearchText}
        groupFilter={groupFilter}
        groupFilterOptions={groupFilterOptions}
        onGroupFilterChange={setGroupFilter}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      {/* Single Indicator Modal */}
      <IndicatorModal
        open={indicatorModalOpen}
        loading={modalLoading}
        editingIndicator={editingIndicator}
        form={indicatorForm}
        groupOptions={groupOptions}
        laboratoryOptions={laboratoryOptions}
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
        laboratoryOptions={laboratoryOptions}
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

      {/* Admin Import tên chỉ tiêu (simplified) */}
      <AdminImportNameModal
        open={adminImportModalOpen}
        loading={modalLoading}
        fileList={adminImportFileList}
        previewData={adminImportPreview}
        onFileListChange={setAdminImportFileList}
        onPreview={handlePreviewAdminImport}
        onConfirm={handleConfirmAdminImport}
        onCancel={() => {
          setAdminImportModalOpen(false);
          handleResetAdminImport();
        }}
        onReset={handleResetAdminImport}
      />
    </>
  );
});

IndicatorsList.displayName = "IndicatorsList";

export default IndicatorsList;
