import { useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSpecimenTypesData, useSpecimenTypesActions } from "./hooks";
import { SpecimenTypesTable, SpecimenTypeModal, AddIndicatorsModal } from "./components";
import { getSpecimenTypeColumns, getIndicatorColumns } from "./constants";
import { SpecimenTypesTabProps, SpecimenTypesActions } from "./types";
import {
  specimenTypeSchema,
  SpecimenTypeFormData,
} from "./schemas/specimenTypeSchema";

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
    </>
  );
});

SpecimenTypesList.displayName = "SpecimenTypesList";

export default SpecimenTypesList;
