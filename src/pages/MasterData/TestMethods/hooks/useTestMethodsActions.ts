import { useState } from "react";
import { message } from "antd";
import type { FormInstance } from "antd";
import {
  testMethodService,
  CreateTestMethodDto,
  UpdateTestMethodDto,
  AddIndicatorsToTestMethodDto,
} from "../../../../services/masterDataService";
import { GroupedTestMethodData } from "../types";

interface UseTestMethodsActionsParams {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
  expandedRowKeys: string[];
  setExpandedRowKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useTestMethodsActions = ({
  fetchData,
  onDataChange,
  expandedRowKeys,
  setExpandedRowKeys,
}: UseTestMethodsActionsParams) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupedTestMethodData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [addIndicatorsModalOpen, setAddIndicatorsModalOpen] = useState(false);
  const [addIndicatorsLoading, setAddIndicatorsLoading] = useState(false);
  const [selectedTestMethodId, setSelectedTestMethodId] = useState<string | null>(null);

  // TestMethod CRUD
  const handleCreate = (form: FormInstance) => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (record: GroupedTestMethodData, form: FormInstance) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
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

  const handleModalOk = async (form: FormInstance) => {
    try {
      setModalLoading(true);
      const values = await form.validateFields();

      if (editingItem) {
        await testMethodService.update(editingItem.id, values as UpdateTestMethodDto);
        message.success("Cập nhật phương pháp thử thành công!");
      } else {
        await testMethodService.create(values as CreateTestMethodDto);
        message.success("Thêm phương pháp thử thành công!");
      }

      setModalOpen(false);
      form.resetFields();
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

  const handleModalCancel = (form: FormInstance) => {
    setModalOpen(false);
    form.resetFields();
  };

  // Add Indicators to TestMethod
  const handleOpenAddIndicators = (testMethodId: string, form: FormInstance) => {
    setSelectedTestMethodId(testMethodId);
    form.resetFields();
    form.setFieldsValue({ indicators: [{ indicatorId: undefined, unitPrice: 0 }] });
    setAddIndicatorsModalOpen(true);
  };

  const handleAddIndicatorsOk = async (form: FormInstance) => {
    if (!selectedTestMethodId) return;

    try {
      setAddIndicatorsLoading(true);
      const values = await form.validateFields();

      const validIndicators = values.indicators?.filter(
        (item: any) => item.indicatorId && item.unitPrice !== undefined
      );

      if (!validIndicators || validIndicators.length === 0) {
        message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
        return;
      }

      const data: AddIndicatorsToTestMethodDto = {
        indicators: validIndicators.map((item: any) => ({
          indicatorId: item.indicatorId,
          unitPrice: item.unitPrice,
        })),
      };

      await testMethodService.addIndicators(selectedTestMethodId, data);
      message.success(`Thêm ${validIndicators.length} chỉ tiêu thành công!`);

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
  };
};
