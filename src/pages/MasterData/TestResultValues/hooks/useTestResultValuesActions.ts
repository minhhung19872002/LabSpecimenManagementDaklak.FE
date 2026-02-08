import { useState } from "react";
import { message, Modal } from "antd";
import type { UseFormReturn } from "react-hook-form";
import testResultValueService, {
  CreateUpdateTestResultValueDto,
  AddIndicatorsDto,
  BatchRemoveIndicatorsDto,
} from "../../../../services/testResultValueService";
import { GroupedTestResultValueData } from "./useTestResultValuesData";
import { getApiErrorMessage } from "../../../../utils/errorHandler";

export interface TestResultValueFormData {
  name: string;
  description?: string;
}

interface UseTestResultValuesActionsParams {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
  expandedKeys: string[];
  setExpandedKeys: React.Dispatch<React.SetStateAction<string[]>>;
  // Batch selection for indicators (composite key: `${indicatorId}_${specimenTypeId}`)
  selectedIndicatorKeys: Record<string, string[]>;
  setSelectedIndicatorKeys: (keys: Record<string, string[]>) => void;
  setBatchLoading: (loading: boolean) => void;
  parseIndicatorCompositeKey: (compositeKey: string) => { indicatorId: string; specimenTypeId: string };
}

export const useTestResultValuesActions = ({
  fetchData,
  onDataChange,
  expandedKeys,
  setExpandedKeys,
  selectedIndicatorKeys,
  setSelectedIndicatorKeys,
  setBatchLoading,
  parseIndicatorCompositeKey,
}: UseTestResultValuesActionsParams) => {
  // TestResultValue modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupedTestResultValueData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Add indicators modal states
  const [addIndicatorsModalOpen, setAddIndicatorsModalOpen] = useState(false);
  const [addIndicatorsLoading, setAddIndicatorsLoading] = useState(false);
  const [selectedTestResultValueId, setSelectedTestResultValueId] = useState<string | null>(null);

  // ============= TestResultValue Actions =============
  const handleCreate = (form: UseFormReturn<TestResultValueFormData>) => {
    setEditingItem(null);
    form.reset({ name: "", description: "" });
    setModalOpen(true);
  };

  const handleEdit = (
    record: GroupedTestResultValueData,
    form: UseFormReturn<TestResultValueFormData>
  ) => {
    setEditingItem(record);
    form.reset({
      name: record.name,
      description: record.description || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await testResultValueService.delete(id);
      message.success("Xóa kết quả thử nghiệm thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to delete:", error);
      message.error(getApiErrorMessage(error, "Không thể xóa kết quả thử nghiệm"));
    }
  };

  const handleModalOk = async (
    data: TestResultValueFormData,
    form: UseFormReturn<TestResultValueFormData>
  ) => {
    try {
      setModalLoading(true);

      const submitData: CreateUpdateTestResultValueDto = {
        name: data.name,
        description: data.description,
      };

      if (editingItem) {
        await testResultValueService.update(editingItem.id, submitData);
        message.success("Cập nhật kết quả thử nghiệm thành công!");
      } else {
        await testResultValueService.create(submitData);
        message.success("Thêm kết quả thử nghiệm thành công!");
      }

      setModalOpen(false);
      form.reset();
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to save:", error);
      message.error(getApiErrorMessage(error, "Không thể lưu kết quả thử nghiệm"));
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = (form: UseFormReturn<TestResultValueFormData>) => {
    setModalOpen(false);
    form.reset();
  };

  // ============= Indicator Actions =============
  const handleOpenAddIndicators = (testResultValueId: string) => {
    setSelectedTestResultValueId(testResultValueId);
    setAddIndicatorsModalOpen(true);
  };

  const handleAddIndicatorsOk = async (
    indicators: { indicatorId: string; specimenTypeId: string }[]
  ) => {
    if (!selectedTestResultValueId) return;

    if (!indicators || indicators.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    try {
      setAddIndicatorsLoading(true);

      const data: AddIndicatorsDto = {
        indicators: indicators,
      };

      await testResultValueService.addIndicators(selectedTestResultValueId, data);
      message.success(`Thêm ${indicators.length} chỉ tiêu thành công!`);

      // Keep the test result value expanded after adding indicators
      if (!expandedKeys.includes(selectedTestResultValueId)) {
        setExpandedKeys([...expandedKeys, selectedTestResultValueId]);
      }

      setAddIndicatorsModalOpen(false);
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to add indicators:", error);
      message.error(getApiErrorMessage(error, "Không thể thêm chỉ tiêu"));
    } finally {
      setAddIndicatorsLoading(false);
    }
  };

  const handleAddIndicatorsCancel = () => {
    setAddIndicatorsModalOpen(false);
    setSelectedTestResultValueId(null);
  };

  const handleRemoveIndicator = async (
    testResultValueId: string,
    indicatorId: string,
    specimenTypeId: string
  ) => {
    try {
      await testResultValueService.removeIndicator(testResultValueId, indicatorId, specimenTypeId);
      message.success("Xóa chỉ tiêu khỏi kết quả thử nghiệm thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to remove indicator:", error);
      message.error(getApiErrorMessage(error, "Không thể xóa chỉ tiêu"));
    }
  };

  const handleToggleIndicatorActive = async (
    testResultValueId: string,
    indicatorId: string,
    specimenTypeId: string
  ) => {
    try {
      const result = await testResultValueService.toggleIndicatorActive(
        testResultValueId,
        indicatorId,
        specimenTypeId
      );
      message.success(
        result.isActive
          ? "Đã kích hoạt chỉ tiêu!"
          : "Đã ngừng kích hoạt chỉ tiêu!"
      );
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to toggle indicator active:", error);
      message.error(getApiErrorMessage(error, "Không thể thay đổi trạng thái"));
    }
  };

  // ============= Batch Remove Indicators =============
  const handleBatchRemoveIndicators = async (testResultValueId: string) => {
    const selectedKeys = selectedIndicatorKeys[testResultValueId] || [];
    if (selectedKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa ${selectedKeys.length} chỉ tiêu đã chọn khỏi kết quả thử nghiệm này?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setBatchLoading(true);

          // Parse composite keys to get indicatorId and specimenTypeId pairs
          const keys = selectedKeys.map((compositeKey) => parseIndicatorCompositeKey(compositeKey));

          const data: BatchRemoveIndicatorsDto = { keys };
          const count = await testResultValueService.batchRemoveIndicators(testResultValueId, data);
          message.success(`Đã xóa ${count} chỉ tiêu thành công!`);

          // Clear selection for this test result value
          setSelectedIndicatorKeys({
            ...selectedIndicatorKeys,
            [testResultValueId]: [],
          });
          await fetchData();
          onDataChange?.();
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, "Không thể xóa chỉ tiêu"));
        } finally {
          setBatchLoading(false);
        }
      },
    });
  };

  return {
    // TestResultValue modal
    modalOpen,
    editingItem,
    modalLoading,
    setModalOpen,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleModalCancel,

    // Add Indicators modal
    addIndicatorsModalOpen,
    addIndicatorsLoading,
    selectedTestResultValueId,
    handleOpenAddIndicators,
    handleAddIndicatorsOk,
    handleAddIndicatorsCancel,

    // Remove indicator
    handleRemoveIndicator,

    // Toggle indicator active
    handleToggleIndicatorActive,

    // Batch remove indicators
    handleBatchRemoveIndicators,
  };
};
