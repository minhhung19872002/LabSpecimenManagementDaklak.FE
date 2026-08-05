import { useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { Form } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useIndicatorsData, useIndicatorsActions, useIndicatorMethodsActions } from "./hooks";
import { getIndicatorColumns, getGroupColumns } from "./constants";
import {
  IndicatorsTable,
  GroupModal,
  IndicatorModal,
  BulkCreateModal,
  ImportIndicatorModal,
  ImportGroupModal,
  ImportIndicatorGroupModal,
  AdminImportNameModal,
  AddMethodToIndicatorModal,
  EditMethodModal,
} from "./components";
import type { IndicatorsTableRef } from "./components/IndicatorsTable";
import { IndicatorsTabProps, IndicatorsActions } from "./types";
import {
  indicatorSchema,
  indicatorGroupSchema,
  IndicatorFormData,
  IndicatorGroupFormData,
} from "./schemas/indicatorSchema";

const IndicatorsList = forwardRef<IndicatorsActions, IndicatorsTabProps>(({ onDataChange }, ref) => {
  const tableRef = useRef<IndicatorsTableRef>(null);

  const {
    indicators,
    loading,
    searchText,
    expandedRowKeys,
    selectedRowKeys,
    batchLoading,
    groupOptions,
    laboratoryOptions,
    groupedData,
    totalCount,
    currentPage,
    pageSize,
    filterSpecimenTypeIds,
    filterTestMethodIds,
    specimenTypeFilterOptions,
    testMethodFilterOptions,
    setSearchText,
    setExpandedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    setFilterSpecimenTypeIds,
    setFilterTestMethodIds,
    handlePageChange,
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
    indicators,
    selectedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    fetchData,
    onDataChange,
  });

  const {
    specimenTypes,
    testMethods,
    addMethodModalOpen,
    addMethodLoading,
    addMethodTarget,
    handleOpenAddMethod,
    handleAddMethodOk,
    handleAddMethodCancel,
    editMethodModalOpen,
    editMethodLoading,
    editingMethod,
    editMethodIndicatorName,
    editMethodIndicatorFormattedName,
    editMethodExistingKeys,
    handleOpenEditMethod,
    handleEditMethodOk,
    handleEditMethodCancel,
    handleToggleMethodActive,
    handleDeleteMethod,
  } = useIndicatorMethodsActions({
    invalidateMethodsMap: () => tableRef.current?.invalidateMethodsCache(),
    fetchData,
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
    handleDownloadAdminTemplate,
    handleAdminImport: () => setAdminImportModalOpen(true),
  }));

  return (
    <>

      <IndicatorsTable
        ref={tableRef}
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
        onAddMethod={handleOpenAddMethod}
        onEditMethod={handleOpenEditMethod}
        onDeleteMethod={handleDeleteMethod}
        onToggleMethodActive={handleToggleMethodActive}
        searchText={searchText}
        filterSpecimenTypeIds={filterSpecimenTypeIds}
        filterTestMethodIds={filterTestMethodIds}
        specimenTypeOptions={specimenTypeFilterOptions}
        testMethodOptions={testMethodFilterOptions}
        onSearchChange={setSearchText}
        onFilterSpecimenTypeChange={setFilterSpecimenTypeIds}
        onFilterTestMethodChange={setFilterTestMethodIds}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
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

      {/* Add Method to Indicator Modal */}
      {addMethodTarget && (
        <AddMethodToIndicatorModal
          open={addMethodModalOpen}
          loading={addMethodLoading}
          indicatorId={addMethodTarget.id}
          indicatorName={addMethodTarget.name}
          indicatorFormattedName={addMethodTarget.formattedName}
          specimenTypes={specimenTypes}
          testMethods={testMethods}
          existingMethodKeys={addMethodTarget.existingKeys}
          onOk={handleAddMethodOk}
          onCancel={handleAddMethodCancel}
        />
      )}

      {/* Edit Method Modal */}
      <EditMethodModal
        open={editMethodModalOpen}
        loading={editMethodLoading}
        indicatorName={editMethodIndicatorName}
        indicatorFormattedName={editMethodIndicatorFormattedName}
        record={editingMethod}
        specimenTypes={specimenTypes}
        testMethods={testMethods}
        existingMethodKeys={editMethodExistingKeys}
        onOk={handleEditMethodOk}
        onCancel={handleEditMethodCancel}
      />
    </>
  );
});

IndicatorsList.displayName = "IndicatorsList";

export default IndicatorsList;
