import { useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSampleConditionData, useSampleConditionActions } from "./hooks";
import { StatusTable, StatusModal } from "./components";
import { getConditionColumns } from "./constants";
import { SampleConditionTabProps, SampleConditionActions } from "./types";
import { sampleConditionSchema, SampleConditionFormData } from "./schemas";

const SampleConditionList = forwardRef<SampleConditionActions, SampleConditionTabProps>(({
  onDataChange,
  refreshKey,
}, ref) => {
  const {
    loading,
    searchText,
    filteredConditions,
    setSearchText,
    fetchData,
  } = useSampleConditionData();

  // Refresh data when refreshKey changes
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
    editingCondition,
    modalLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  } = useSampleConditionActions({
    fetchData,
    onDataChange,
  });

  const form = useForm<SampleConditionFormData>({
    resolver: yupResolver(sampleConditionSchema) as any,
    defaultValues: { name: "", description: "", isActive: true },
  });

  // Memoized columns
  const conditionColumns = useMemo(
    () =>
      getConditionColumns(
        (record) => handleEdit(record, form),
        handleDelete,
        handleToggleActive
      ),
    [handleEdit, handleDelete, handleToggleActive, form]
  );

  // Expose actions to parent
  useImperativeHandle(ref, () => ({
    handleCreate: () => handleCreate(form),
  }));

  return (
    <>

      {/* Condition Table */}
      <StatusTable
        loading={loading}
        data={filteredConditions}
        columns={conditionColumns}
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* Condition Modal */}
      <StatusModal
        open={modalOpen}
        loading={modalLoading}
        editingCondition={editingCondition}
        form={form}
        onOk={(data) => handleModalOk(data, form)}
        onCancel={() => handleModalCancel(form)}
      />
    </>
  );
});

SampleConditionList.displayName = "SampleConditionList";

export default SampleConditionList;
