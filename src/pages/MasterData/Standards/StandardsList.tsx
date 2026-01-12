import React, { useMemo, useEffect, useRef } from "react";
import { Button, Space, Row, Col, Form } from "antd";
import { PlusOutlined } from "../../../components/common/Icon";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useStandardsData, useStandardsActions } from "./hooks";
import {
  StandardsTable,
  StandardModal,
  AddIndicatorsModal,
  EditIndicatorModal,
} from "./components";
import { getStandardColumns, getIndicatorColumns } from "./constants";
import { StandardsTabProps, StandardIndicatorDto } from "./types";
import { standardSchema, StandardFormData } from "./schemas/standardSchema";

const StandardsList: React.FC<StandardsTabProps> = ({ onDataChange, refreshKey }) => {
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
  } = useStandardsActions({
    fetchData,
    onDataChange,
    expandedRowKeys,
    setExpandedRowKeys,
  });

  const form = useForm<StandardFormData>({
    resolver: yupResolver(standardSchema),
    defaultValues: { name: "", limitDescription: "", isActive: true },
  });
  const [addIndicatorsForm] = Form.useForm();
  const [editIndicatorForm] = Form.useForm();

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
    [handleOpenEditIndicator, handleRemoveIndicator, handleToggleIndicatorActive, editIndicatorForm]
  );

  return (
    <>
      {/* Header Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="auto" />
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreate(form)}
            >
              Thêm tiêu chuẩn
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Expandable Table */}
      <StandardsTable
        loading={loading}
        groupedData={groupedData}
        standardColumns={standardColumns}
        indicatorColumns={indicatorColumns}
        expandedRowKeys={expandedRowKeys}
        searchText={searchText}
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
    </>
  );
};

export default StandardsList;
