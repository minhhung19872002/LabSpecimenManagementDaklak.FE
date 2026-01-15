import React, { useMemo, useEffect, useRef } from "react";
import { Button, Row, Col } from "antd";
import { PlusOutlined } from "../../../components/common/Icon";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSampleTypeCategoriesData, useSampleTypeCategoriesActions } from "./hooks";
import { CategoriesTable, CategoryModal } from "./components";
import { getCategoryColumns, getSpecimenTypeColumns } from "./constants";
import { SampleTypeCategoriesTabProps } from "./types";
import { sampleTypeCategorySchema, SampleTypeCategoryFormData } from "./schemas";

const SampleTypeCategoriesList: React.FC<SampleTypeCategoriesTabProps> = ({
  onDataChange,
  refreshKey,
}) => {
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

  return (
    <>
      {/* Header Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="auto" />
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleCreate(form)}
          >
            Thêm danh mục
          </Button>
        </Col>
      </Row>

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
};

export default SampleTypeCategoriesList;
