import React, { useMemo, useEffect, useRef } from "react";
import { Button, Row, Col } from "antd";
import { PlusOutlined } from "../../../components/common/Icon";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSpecimenTypesData, useSpecimenTypesActions } from "./hooks";
import { SpecimenTypesTable, SpecimenTypeModal, AddIndicatorsModal } from "./components";
import { getSpecimenTypeColumns, getIndicatorColumns } from "./constants";
import { SpecimenTypesTabProps } from "./types";
import {
  specimenTypeSchema,
  SpecimenTypeFormData,
} from "./schemas/specimenTypeSchema";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

const SpecimenTypesList: React.FC<SpecimenTypesTabProps> = ({ onDataChange, refreshKey }) => {
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

  return (
    <>
      {/* Header Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="auto" />
        <Col>
          {authService.hasPermission(PERMISSIONS.MasterData.Create) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreate(specimenTypeForm)}
            >
              Thêm loại mẫu
            </Button>
          )}
        </Col>
      </Row>

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
    </>
  );
};

export default SpecimenTypesList;
