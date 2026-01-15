import React, { useMemo, useEffect, useRef } from "react";
import { Button, Row, Col } from "antd";
import { PlusOutlined } from "../../../components/common/Icon";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSpecimenTypesData, useSpecimenTypesActions } from "./hooks";
import { SpecimenTypesTable, SpecimenTypeModal, AddIndicatorsModal } from "./components";
import { getSpecimenTypeColumns, getIndicatorColumns } from "./constants";
import { SpecimenTypesTabProps } from "./types";
import { specimenTypeSchema, SpecimenTypeFormData } from "./schemas/specimenTypeSchema";

const SpecimenTypesList: React.FC<SpecimenTypesTabProps> = ({ onDataChange, refreshKey }) => {
  const {
    loading,
    searchText,
    groupedData,
    expandedRowKeys,
    indicatorGroups,
    indicatorsByGroup,
    setSearchText,
    setExpandedRowKeys,
    fetchData,
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
    modalOpen,
    editingItem,
    modalLoading,
    addIndicatorsModalOpen,
    addIndicatorsLoading,
    selectedSpecimenTypeId,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleModalCancel,
    handleOpenAddIndicators,
    handleAddIndicatorsOk,
    handleAddIndicatorsCancel,
    handleRemoveIndicator,
    handleToggleIndicatorActive,
  } = useSpecimenTypesActions({
    fetchData,
    onDataChange,
    expandedRowKeys,
    setExpandedRowKeys,
  });

  const form = useForm<SpecimenTypeFormData>({
    resolver: yupResolver(specimenTypeSchema) as any,
    defaultValues: { code: "", name: "", description: "", isActive: true },
  });

  // Get existing indicator IDs for the selected specimen type
  const existingIndicatorIds = useMemo(() => {
    if (!selectedSpecimenTypeId) return [];
    const type = groupedData.find((t) => t.id === selectedSpecimenTypeId);
    return type?.indicators?.map((ind) => ind.indicatorId) || [];
  }, [selectedSpecimenTypeId, groupedData]);

  // Memoized columns for specimen types
  const specimenTypeColumns = useMemo(
    () =>
      getSpecimenTypeColumns(
        (record) => handleEdit(record, form),
        handleDelete
      ),
    [handleEdit, handleDelete, form]
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleCreate(form)}
          >
            Thêm loại mẫu
          </Button>
        </Col>
      </Row>

      {/* Expandable Table */}
      <SpecimenTypesTable
        loading={loading}
        groupedData={groupedData}
        specimenTypeColumns={specimenTypeColumns}
        indicatorColumns={indicatorColumns}
        expandedRowKeys={expandedRowKeys}
        searchText={searchText}
        onSearchChange={setSearchText}
        onExpandedRowsChange={setExpandedRowKeys}
        onAddIndicators={handleOpenAddIndicators}
      />

      {/* Create/Edit SpecimenType Modal */}
      <SpecimenTypeModal
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
