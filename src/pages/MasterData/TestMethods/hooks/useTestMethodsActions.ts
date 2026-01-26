import { useState } from "react";
import { message, Modal } from "antd";
import type { FormInstance } from "antd";
import type { UseFormReturn } from "react-hook-form";
import {
  testMethodService,
  CreateTestMethodDto,
  UpdateTestMethodDto,
  AddIndicatorsToTestMethodDto,
} from "../../../../services/masterDataService";
import { GroupedTestMethodData } from "../types";
import { TestMethodFormData } from "../schemas/testMethodSchema";

interface UseTestMethodsActionsParams {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
  expandedRowKeys: string[];
  setExpandedRowKeys: React.Dispatch<React.SetStateAction<string[]>>;
  // Batch selection for indicators
  selectedIndicatorKeys: Record<string, string[]>;
  setSelectedIndicatorKeys: (keys: Record<string, string[]>) => void;
  setBatchLoading: (loading: boolean) => void;
}

export const useTestMethodsActions = ({
  fetchData,
  onDataChange,
  expandedRowKeys,
  setExpandedRowKeys,
  selectedIndicatorKeys,
  setSelectedIndicatorKeys,
  setBatchLoading,
}: UseTestMethodsActionsParams) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupedTestMethodData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [addIndicatorsModalOpen, setAddIndicatorsModalOpen] = useState(false);
  const [addIndicatorsLoading, setAddIndicatorsLoading] = useState(false);
  const [selectedTestMethodId, setSelectedTestMethodId] = useState<string | null>(null);

  // TestMethod CRUD
  const handleCreate = (form: UseFormReturn<TestMethodFormData>) => {
    setEditingItem(null);
    form.reset({ name: "", formattedName: "", unit: "", isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (
    record: GroupedTestMethodData,
    form: UseFormReturn<TestMethodFormData>
  ) => {
    setEditingItem(record);
    form.reset({
      name: record.name,
      formattedName: record.formattedName || record.name,
      unit: record.unit,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await testMethodService.delete(id);
      message.success("Xóa phương pháp thử thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to delete:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể xóa phương pháp thử";
      message.error(errorMsg);
    }
  };

  const handleModalOk = async (
    data: TestMethodFormData,
    form: UseFormReturn<TestMethodFormData>
  ) => {
    try {
      setModalLoading(true);

      if (editingItem) {
        await testMethodService.update(editingItem.id, data as UpdateTestMethodDto);
        message.success("Cập nhật phương pháp thử thành công!");
      } else {
        await testMethodService.create(data as CreateTestMethodDto);
        message.success("Thêm phương pháp thử thành công!");
      }

      setModalOpen(false);
      form.reset();
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to save:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể lưu phương pháp thử";
      message.error(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = (form: UseFormReturn<TestMethodFormData>) => {
    setModalOpen(false);
    form.reset();
  };

  // Add Indicators to TestMethod (still uses Ant Design Form for dynamic fields)
  const handleOpenAddIndicators = (testMethodId: string, form: FormInstance) => {
    setSelectedTestMethodId(testMethodId);
    form.resetFields();
    form.setFieldsValue({ indicators: [{ indicatorId: undefined, unitPrice: 0, subIndicators: [] }] });
    setAddIndicatorsModalOpen(true);
  };

  const handleAddIndicatorsOk = async (form: FormInstance) => {
    if (!selectedTestMethodId) return;

    try {
      setAddIndicatorsLoading(true);
      const values = await form.validateFields();

      // Flatten nested structure: parent + subIndicators -> flat array
      const flatIndicators: Array<{ indicatorId: string; unitPrice: number }> = [];

      (values.indicators || []).forEach((parent: any) => {
        // Add parent indicator
        if (parent.indicatorId && parent.unitPrice !== undefined) {
          flatIndicators.push({
            indicatorId: parent.indicatorId,
            unitPrice: parent.unitPrice,
          });
        }

        // Add sub-indicators
        (parent.subIndicators || []).forEach((sub: any) => {
          if (sub.indicatorId) {
            flatIndicators.push({
              indicatorId: sub.indicatorId,
              unitPrice: sub.unitPrice ?? 0, // Use 0 if unitPrice is null/undefined for sub-indicators
            });
          }
        });
      });

      if (flatIndicators.length === 0) {
        message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
        return;
      }

      const data: AddIndicatorsToTestMethodDto = {
        indicators: flatIndicators,
      };

      await testMethodService.addIndicators(selectedTestMethodId, data);
      message.success(`Thêm ${flatIndicators.length} chỉ tiêu thành công!`);

      // Keep the test method expanded after adding indicators
      if (!expandedRowKeys.includes(selectedTestMethodId)) {
        setExpandedRowKeys([...expandedRowKeys, selectedTestMethodId]);
      }

      setAddIndicatorsModalOpen(false);
      form.resetFields();
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to add indicators:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể thêm chỉ tiêu";
      message.error(errorMsg);
    } finally {
      setAddIndicatorsLoading(false);
    }
  };

  const handleAddIndicatorsCancel = (form: FormInstance) => {
    setAddIndicatorsModalOpen(false);
    form.resetFields();
    setSelectedTestMethodId(null);
  };

  // Remove Indicator from TestMethod
  const handleRemoveIndicator = async (testMethodId: string, indicatorId: string) => {
    try {
      await testMethodService.removeIndicator(testMethodId, indicatorId);
      message.success("Xóa chỉ tiêu khỏi phương pháp thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to remove indicator:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể xóa chỉ tiêu";
      message.error(errorMsg);
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string) => {
    try {
      const result = await testMethodService.toggleActive(id);
      message.success(
        result.isActive
          ? "Đã kích hoạt phương pháp thử!"
          : "Đã ngừng kích hoạt phương pháp thử!"
      );
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to toggle active:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể thay đổi trạng thái";
      message.error(errorMsg);
    }
  };

  // ============= Batch Remove Indicators =============
  const handleBatchRemoveIndicators = async (testMethodId: string) => {
    const selectedIds = selectedIndicatorKeys[testMethodId] || [];
    if (selectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa ${selectedIds.length} chỉ tiêu đã chọn khỏi phương pháp thử này?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setBatchLoading(true);
          const count = await testMethodService.batchRemoveIndicators(testMethodId, selectedIds);
          message.success(`Đã xóa ${count} chỉ tiêu thành công!`);
          // Clear selection for this test method
          setSelectedIndicatorKeys({
            ...selectedIndicatorKeys,
            [testMethodId]: [],
          });
          await fetchData();
          onDataChange?.();
        } catch (error) {
          message.error("Không thể xóa chỉ tiêu");
        } finally {
          setBatchLoading(false);
        }
      },
    });
  };

  return {
    // TestMethod modal
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
    selectedTestMethodId,
    handleOpenAddIndicators,
    handleAddIndicatorsOk,
    handleAddIndicatorsCancel,

    // Remove indicator
    handleRemoveIndicator,

    // Toggle active
    handleToggleActive,

    // Batch remove indicators
    handleBatchRemoveIndicators,
  };
};
