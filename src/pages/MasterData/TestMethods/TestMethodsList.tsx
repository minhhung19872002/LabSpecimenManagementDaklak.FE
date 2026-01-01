import React, { useMemo, useEffect, useRef } from "react";
import { Button, Space, Row, Col, Form } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTestMethodsData, useTestMethodsActions } from "./hooks";
import { TestMethodsTable, TestMethodModal, AddIndicatorsModal } from "./components";
import { getTestMethodColumns, getIndicatorColumns } from "./constants";
import { TestMethodsTabProps } from "./types";
import { testMethodSchema, TestMethodFormData } from "./schemas/testMethodSchema";

const TestMethodsList: React.FC<TestMethodsTabProps> = ({ onDataChange, refreshKey }) => {
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
  } = useTestMethodsData();

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
    selectedTestMethodId,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleModalCancel,
    handleOpenAddIndicators,
    handleAddIndicatorsOk,
    handleAddIndicatorsCancel,
    handleRemoveIndicator,
    handleToggleActive,
  } = useTestMethodsActions({
    fetchData,
    onDataChange,
    expandedRowKeys,
    setExpandedRowKeys,
  });

  const form = useForm<TestMethodFormData>({
    resolver: yupResolver(testMethodSchema),
    defaultValues: { name: "", unit: "", isActive: true },
  });
  const [addIndicatorsForm] = Form.useForm();

  // Get existing indicator IDs for the selected test method
  const existingIndicatorIds = useMemo(() => {
    if (!selectedTestMethodId) return [];
    const method = groupedData.find((m) => m.id === selectedTestMethodId);
    return method?.indicators?.map((ind) => ind.indicatorId) || [];
  }, [selectedTestMethodId, groupedData]);

  // Memoized columns for test methods
  const methodColumns = useMemo(
    () =>
      getTestMethodColumns(
        (record) => handleEdit(record, form),
        handleDelete,
        handleToggleActive
      ),
    [handleEdit, handleDelete, handleToggleActive, form]
  );

  // Memoized columns for indicators
  const indicatorColumns = useMemo(
    () => getIndicatorColumns(handleRemoveIndicator),
    [handleRemoveIndicator]
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
              Thêm phương pháp
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Expandable Table */}
      <TestMethodsTable
        loading={loading}
        groupedData={groupedData}
        methodColumns={methodColumns}
        indicatorColumns={indicatorColumns}
        expandedRowKeys={expandedRowKeys}
        searchText={searchText}
        onSearchChange={setSearchText}
        onExpandedRowsChange={setExpandedRowKeys}
        onAddIndicators={(testMethodId) =>
          handleOpenAddIndicators(testMethodId, addIndicatorsForm)
        }
      />

      {/* Create/Edit TestMethod Modal */}
      <TestMethodModal
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
        indicatorGroups={indicatorGroups}
        indicatorsByGroup={indicatorsByGroup}
        existingIndicatorIds={existingIndicatorIds}
        onOk={() => handleAddIndicatorsOk(addIndicatorsForm)}
        onCancel={() => handleAddIndicatorsCancel(addIndicatorsForm)}
      />
    </>
  );
};

export default TestMethodsList;
