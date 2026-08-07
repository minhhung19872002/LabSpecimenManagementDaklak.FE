import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useUnitData, useUnitActions } from "./hooks";
import { UnitTable, UnitModal } from "./components";
import { unitSchema, UnitFormData } from "./schemas";
import { getUnitColumns } from "./constants";
import { UnitTabProps, UnitActions } from "./types";

const UnitList = forwardRef<UnitActions, UnitTabProps>(
  ({ onDataChange, refreshKey }, ref) => {
    const {
      loading,
      totalCount,
      searchText,
      currentPage,
      pageSize,
      filteredUnits,
      setSearchText,
      fetchData,
      handlePageChange,
    } = useUnitData();

    const isFirstMount = useRef(true);
    useEffect(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      if (refreshKey !== undefined) {
        fetchData();
      }
    }, [refreshKey, fetchData]);

    const {
      modalOpen,
      editingUnit,
      modalLoading,
      selectedRowKeys,
      setSelectedRowKeys,
      handleCreate,
      handleEdit,
      handleDelete,
      handleToggleActive,
      handleBatchDelete,
      handleBatchToggleActive,
      handleModalOk,
      handleModalCancel,
    } = useUnitActions({ fetchData, onDataChange });

    const form = useForm<UnitFormData>({
      resolver: yupResolver(unitSchema) as any,
      defaultValues: { code: "", name: "", isActive: true },
    });

    const unitColumns = useMemo(
      () =>
        getUnitColumns(
          (record) => handleEdit(record, form),
          handleDelete,
          handleToggleActive,
          currentPage,
          pageSize
        ),
      [handleEdit, handleDelete, handleToggleActive, form, currentPage, pageSize]
    );

    useImperativeHandle(ref, () => ({
      handleCreate: () => handleCreate(form),
    }));

    return (
      <>
        <UnitTable
          loading={loading}
          data={filteredUnits}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          columns={unitColumns}
          searchText={searchText}
          onSearchChange={setSearchText}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={setSelectedRowKeys}
          onBatchDelete={handleBatchDelete}
          onBatchToggleActive={handleBatchToggleActive}
          onPaginationChange={handlePageChange}
        />

        <UnitModal
          open={modalOpen}
          loading={modalLoading}
          editingUnit={editingUnit}
          form={form}
          onOk={(data) => handleModalOk(data, form)}
          onCancel={() => handleModalCancel(form)}
        />
      </>
    );
  }
);

UnitList.displayName = "UnitList";
export default UnitList;
