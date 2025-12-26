import React, { useMemo } from "react";
import { Button, Space, Input, Row, Col, Form } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FolderAddOutlined,
} from "@ant-design/icons";
import { useIndicatorsData, useIndicatorsActions } from "./hooks";
import { getIndicatorColumns, getGroupColumns } from "./constants";
import {
  IndicatorsTable,
  GroupModal,
  IndicatorModal,
  BulkCreateModal,
  ImportIndicatorModal,
  ImportGroupModal,
} from "./components";
import { IndicatorsTabProps } from "./types";

const IndicatorsList: React.FC<IndicatorsTabProps> = ({ onDataChange }) => {
  const {
    indicators,
    loading,
    searchText,
    expandedRowKeys,
    selectedRowKeys,
    batchLoading,
    groupOptions,
    groupedData,
    setSearchText,
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
  } = useIndicatorsActions({
    indicators,
    selectedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    fetchData,
    onDataChange,
  });

  const [groupForm] = Form.useForm();
  const [indicatorForm] = Form.useForm();
  const [bulkForm] = Form.useForm();

  // Memoized columns with handlers
  const indicatorColumns = useMemo(
    () =>
      getIndicatorColumns(
        (indicator) => handleEditIndicator(indicator, indicatorForm),
        handleToggleActive,
        handleDeleteIndicator
      ),
    [handleEditIndicator, handleToggleActive, handleDeleteIndicator, indicatorForm]
  );

  const groupColumns = useMemo(
    () =>
      getGroupColumns(
        (group) => handleEditGroup(group, groupForm),
        handleDeleteGroup
      ),
    [handleEditGroup, handleDeleteGroup, groupForm]
  );

  return (
    <>
      {/* Search and Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên, tên nhóm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={16} style={{ textAlign: "right" }}>
          <Space wrap>
            <Button
              icon={<FolderAddOutlined />}
              onClick={() => handleCreateGroup(groupForm)}
            >
              Thêm nhóm
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleBulkCreate(bulkForm)}
            >
              Thêm chỉ tiêu
            </Button>
          </Space>
        </Col>
      </Row>

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
        onOk={() => handleGroupModalOk(groupForm)}
        onCancel={() => {
          setGroupModalOpen(false);
          groupForm.resetFields();
        }}
      />

      {/* Single Indicator Modal */}
      <IndicatorModal
        open={indicatorModalOpen}
        loading={modalLoading}
        editingIndicator={editingIndicator}
        form={indicatorForm}
        groupOptions={groupOptions}
        onOk={() => handleIndicatorModalOk(indicatorForm)}
        onCancel={() => {
          setIndicatorModalOpen(false);
          indicatorForm.resetFields();
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
    </>
  );
};

export default IndicatorsList;
