import { useState } from "react";
import { message } from "antd";
import type { UseFormReturn } from "react-hook-form";
import {
  testMethodService,
  CreateTestMethodDto,
  UpdateTestMethodDto,
  AddIndicatorsToTestMethodDto,
  TestMethodIndicatorDto,
  TestMethodDto,
} from "../../../../services/masterDataService";
import { TestMethodFormData } from "../schemas/testMethodSchema";
import { getApiErrorMessage } from "../../../../utils/errorHandler";

interface UseTestMethodsActionsParams {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
}

export const useTestMethodsActions = ({
  fetchData,
  onDataChange,
}: UseTestMethodsActionsParams) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestMethodDto | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [addIndicatorsModalOpen, setAddIndicatorsModalOpen] = useState(false);
  const [addIndicatorsLoading, setAddIndicatorsLoading] = useState(false);
  const [selectedTestMethodId, setSelectedTestMethodId] = useState<string | null>(null);

  // Edit Indicator modal state
  const [editIndicatorModalOpen, setEditIndicatorModalOpen] = useState(false);
  const [editIndicatorLoading, setEditIndicatorLoading] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<TestMethodIndicatorDto | null>(null);

  // TestMethod CRUD
  const handleCreate = (form: UseFormReturn<TestMethodFormData>) => {
    setEditingItem(null);
    form.reset({ name: "", formattedName: "", unit: null, formattedUnit: null, isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (
    record: TestMethodDto,
    form: UseFormReturn<TestMethodFormData>
  ) => {
    setEditingItem(record);
    form.reset({
      name: record.name,
      formattedName: record.formattedName || record.name,
      unit: record.unit ?? null,
      formattedUnit: record.formattedUnit ?? null,
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
    } catch (error: unknown) {
      console.error("Failed to delete:", error);
      message.error(getApiErrorMessage(error, "Không thể xóa phương pháp thử"));
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
    } catch (error: unknown) {
      console.error("Failed to save:", error);
      message.error(getApiErrorMessage(error, "Không thể lưu phương pháp thử"));
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = (form: UseFormReturn<TestMethodFormData>) => {
    setModalOpen(false);
    form.reset();
  };

  // Add Indicators to TestMethod
  const handleOpenAddIndicators = (testMethodId: string) => {
    setSelectedTestMethodId(testMethodId);
    setAddIndicatorsModalOpen(true);
  };

  const handleAddIndicatorsOk = async (
    indicators: Array<{ indicatorId: string; specimenTypeId: string; unitPrice: number }>
  ) => {
    if (!selectedTestMethodId) return;

    try {
      setAddIndicatorsLoading(true);

      const data: AddIndicatorsToTestMethodDto = {
        indicators,
      };

      await testMethodService.addIndicators(selectedTestMethodId, data);
      message.success(`Thêm ${indicators.length} chỉ tiêu thành công!`);

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
    setSelectedTestMethodId(null);
  };

  // Remove Indicator from TestMethod
  const handleRemoveIndicator = async (testMethodId: string, indicatorId: string, specimenTypeId?: string) => {
    try {
      await testMethodService.removeIndicator(testMethodId, indicatorId, specimenTypeId);
      message.success("Xóa chỉ tiêu khỏi phương pháp thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to remove indicator:", error);
      message.error(getApiErrorMessage(error, "Không thể xóa chỉ tiêu"));
    }
  };

  // Edit Indicator in TestMethod
  const handleOpenEditIndicator = (indicator: TestMethodIndicatorDto) => {
    setEditingIndicator(indicator);
    setEditIndicatorModalOpen(true);
  };

  const handleEditIndicatorOk = async (data: { unitPrice: number; unit?: string; formattedUnit?: string }) => {
    if (!editingIndicator) return;

    try {
      setEditIndicatorLoading(true);
      await testMethodService.updateIndicator(
        editingIndicator.testMethodId,
        editingIndicator.indicatorId,
        editingIndicator.specimenTypeId || undefined,
        data
      );
      message.success("Cập nhật chỉ tiêu thành công!");
      setEditIndicatorModalOpen(false);
      setEditingIndicator(null);
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to update indicator:", error);
      message.error(getApiErrorMessage(error, "Không thể cập nhật chỉ tiêu"));
    } finally {
      setEditIndicatorLoading(false);
    }
  };

  const handleEditIndicatorCancel = () => {
    setEditIndicatorModalOpen(false);
    setEditingIndicator(null);
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
    } catch (error: unknown) {
      console.error("Failed to toggle active:", error);
      message.error(getApiErrorMessage(error, "Không thể thay đổi trạng thái"));
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

    // Edit indicator modal
    editIndicatorModalOpen,
    editIndicatorLoading,
    editingIndicator,
    handleOpenEditIndicator,
    handleEditIndicatorOk,
    handleEditIndicatorCancel,

    // Toggle active
    handleToggleActive,
  };
};
