import { useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Modal, Form, Input } from "antd";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTestResultValuesData, useTestResultValuesActions, TestResultValueFormData } from "./hooks";
import { TestResultValuesTable, AddIndicatorsModal } from "./components";
import { getTestResultValueColumns, getIndicatorColumns } from "./constants";
import { TestResultValuesTabProps, TestResultValuesActions } from "./types";

// Form validation schema
const testResultValueSchema = yup.object({
  name: yup
    .string()
    .required("Vui lòng nhập tên kết quả")
    .max(200, "Tên kết quả tối đa 200 ký tự"),
  description: yup.string().max(500, "Mô tả tối đa 500 ký tự"),
});

const TestResultValuesList = forwardRef<TestResultValuesActions, TestResultValuesTabProps>(
  ({ onDataChange, refreshKey }, ref) => {
    const {
      loading,
      searchText,
      groupedData,
      expandedKeys,
      indicatorGroups,
      specimenTypes,
      indicatorsByGroup,
      setSearchText,
      setExpandedKeys,
      fetchData,
      // Batch selection for indicators
      selectedIndicatorKeys,
      setSelectedIndicatorKeys,
      batchLoading,
      setBatchLoading,
      // Helper functions
      getIndicatorCompositeKey,
      parseIndicatorCompositeKey,
      getIndicatorsBySpecimenType,
    } = useTestResultValuesData();

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
      // TestResultValue modal
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
      selectedTestResultValueId,
      handleOpenAddIndicators,
      handleAddIndicatorsOk,
      handleAddIndicatorsCancel,
      handleRemoveIndicator,
      handleToggleIndicatorActive,
      // Batch remove indicators
      handleBatchRemoveIndicators,
    } = useTestResultValuesActions({
      fetchData,
      onDataChange,
      expandedKeys,
      setExpandedKeys,
      selectedIndicatorKeys,
      setSelectedIndicatorKeys,
      setBatchLoading,
      parseIndicatorCompositeKey,
    });

    const form = useForm<TestResultValueFormData>({
      resolver: yupResolver(testResultValueSchema) as any,
      defaultValues: { name: "", description: "" },
    });

    // Get existing indicators for the selected test result value
    const existingIndicators = useMemo(() => {
      if (!selectedTestResultValueId) return [];
      const item = groupedData.find((t) => t.id === selectedTestResultValueId);
      return item?.indicators || [];
    }, [selectedTestResultValueId, groupedData]);

    // Memoized columns for test result values
    const testResultValueColumns = useMemo(
      () =>
        getTestResultValueColumns(
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

    // Expose actions to parent
    useImperativeHandle(ref, () => ({
      handleCreate: () => handleCreate(form),
    }));

    return (
      <>
        {/* TestResultValues Table with nested Indicators */}
        <TestResultValuesTable
          loading={loading}
          batchLoading={batchLoading}
          groupedData={groupedData}
          testResultValueColumns={testResultValueColumns}
          indicatorColumns={indicatorColumns}
          expandedKeys={expandedKeys}
          searchText={searchText}
          // Batch selection for indicators
          selectedIndicatorKeys={selectedIndicatorKeys}
          onSelectedIndicatorKeysChange={setSelectedIndicatorKeys}
          onBatchRemoveIndicators={handleBatchRemoveIndicators}
          // Handlers
          onSearchChange={setSearchText}
          onExpandedKeysChange={setExpandedKeys}
          onAddIndicators={handleOpenAddIndicators}
          getIndicatorCompositeKey={getIndicatorCompositeKey}
        />

        {/* Create/Edit TestResultValue Modal */}
        <Modal
          title={editingItem ? "Chỉnh sửa kết quả" : "Thêm kết quả mới"}
          open={modalOpen}
          onOk={form.handleSubmit((data) => handleModalOk(data, form))}
          onCancel={() => handleModalCancel(form)}
          confirmLoading={modalLoading}
          okText={editingItem ? "Cập nhật" : "Thêm"}
          cancelText="Hủy"
          destroyOnClose
          centered
          width={500}
        >
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              label="Tên kết quả"
              required
              validateStatus={form.formState.errors.name ? "error" : undefined}
              help={form.formState.errors.name?.message}
            >
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Ví dụ: Đạt, Không đạt, Phù hợp..." />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              validateStatus={form.formState.errors.description ? "error" : undefined}
              help={form.formState.errors.description?.message}
            >
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    rows={3}
                    placeholder="Mô tả thêm về kết quả (không bắt buộc)"
                  />
                )}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Indicators Modal */}
        <AddIndicatorsModal
          open={addIndicatorsModalOpen}
          loading={addIndicatorsLoading}
          indicatorGroups={indicatorGroups}
          indicatorsByGroup={indicatorsByGroup}
          specimenTypes={specimenTypes}
          existingIndicators={existingIndicators}
          getIndicatorsBySpecimenType={getIndicatorsBySpecimenType}
          onOk={handleAddIndicatorsOk}
          onCancel={handleAddIndicatorsCancel}
        />
      </>
    );
  }
);

TestResultValuesList.displayName = "TestResultValuesList";

export default TestResultValuesList;
