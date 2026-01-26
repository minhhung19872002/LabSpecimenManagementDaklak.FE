import { useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSampleTypeCategoriesData, useSampleTypeCategoriesActions } from "./hooks";
import { CategoriesTable, CategoryModal } from "./components";
import { getCategoryColumns, getSpecimenTypeColumns } from "./constants";
import { SampleTypeCategoriesTabProps, SampleTypeCategoriesActions } from "./types";
import { sampleTypeCategorySchema, SampleTypeCategoryFormData } from "./schemas";

const SampleTypeCategoriesList = forwardRef<SampleTypeCategoriesActions, SampleTypeCategoriesTabProps>(({
  onDataChange,
  refreshKey,
}, ref) => {
  const {
    loading,
    searchText,
    groupedData,
    expandedRowKeys,
    setSearchText,
    setExpandedRowKeys,
    fetchData,
  } = useSampleTypeCategoriesData();

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
    editingCategory,
    modalLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  } = useSampleTypeCategoriesActions({
    fetchData,
    onDataChange,
  });

  const form = useForm<SampleTypeCategoryFormData>({
    resolver: yupResolver(sampleTypeCategorySchema) as any,
    defaultValues: { name: "", description: "", isActive: true },
  });

  // Memoized columns
  const categoryColumns = useMemo(
    () =>
      getCategoryColumns(
        (record) => handleEdit(record, form),
        handleDelete,
        handleToggleActive
      ),
    [handleEdit, handleDelete, handleToggleActive, form]
  );

  const specimenTypeColumns = useMemo(() => getSpecimenTypeColumns(), []);

  // Expose actions to parent
  useImperativeHandle(ref, () => ({
    handleCreate: () => handleCreate(form),
  }));

  return (
    <>

      {/* Categories Table with nested SpecimenTypes */}
      <CategoriesTable
        loading={loading}
        groupedData={groupedData}
        categoryColumns={categoryColumns}
        specimenTypeColumns={specimenTypeColumns}
        expandedRowKeys={expandedRowKeys}
        searchText={searchText}
        onSearchChange={setSearchText}
        onExpandedRowsChange={setExpandedRowKeys}
      />

      {/* Category Modal */}
      <CategoryModal
        open={modalOpen}
        loading={modalLoading}
        editingCategory={editingCategory}
        form={form}
        onOk={(data) => handleModalOk(data, form)}
        onCancel={() => handleModalCancel(form)}
      />
    </>
  );
});

SampleTypeCategoriesList.displayName = "SampleTypeCategoriesList";

export default SampleTypeCategoriesList;
