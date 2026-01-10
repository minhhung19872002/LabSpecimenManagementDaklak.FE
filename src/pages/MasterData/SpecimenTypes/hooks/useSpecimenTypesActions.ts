import { useState } from "react";
import { message } from "antd";
import type { UseFormReturn } from "react-hook-form";
import {
  specimenTypeService,
  CreateUpdateSpecimenTypeDto,
  AddIndicatorsToSpecimenTypeDto,
} from "../../../../services/masterDataService";
import { GroupedSpecimenTypeData } from "../types";
import { SpecimenTypeFormData } from "../schemas/specimenTypeSchema";

interface UseSpecimenTypesActionsParams {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
  expandedRowKeys: string[];
  setExpandedRowKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useSpecimenTypesActions = ({
  fetchData,
  onDataChange,
  expandedRowKeys,
  setExpandedRowKeys,
}: UseSpecimenTypesActionsParams) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupedSpecimenTypeData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [addIndicatorsModalOpen, setAddIndicatorsModalOpen] = useState(false);
  const [addIndicatorsLoading, setAddIndicatorsLoading] = useState(false);
  const [selectedSpecimenTypeId, setSelectedSpecimenTypeId] = useState<string | null>(null);

  // SpecimenType CRUD
  const handleCreate = (form: UseFormReturn<SpecimenTypeFormData>) => {
    setEditingItem(null);
    form.reset({ name: "", description: "", isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (
    record: GroupedSpecimenTypeData,
    form: UseFormReturn<SpecimenTypeFormData>
  ) => {
    setEditingItem(record);
    form.reset({
      name: record.name,
      description: record.description || "",
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await specimenTypeService.delete(id);
      message.success("Xóa loại mẫu thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to delete:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể xóa loại mẫu";
      message.error(errorMsg);
    }
  };

  const handleModalOk = async (
    data: SpecimenTypeFormData,
    form: UseFormReturn<SpecimenTypeFormData>
  ) => {
    try {
      setModalLoading(true);

      const submitData: CreateUpdateSpecimenTypeDto = {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      };

      if (editingItem) {
        await specimenTypeService.update(editingItem.id, submitData);
        message.success("Cập nhật loại mẫu thành công!");
      } else {
        await specimenTypeService.create(submitData);
        message.success("Thêm loại mẫu thành công!");
      }

      setModalOpen(false);
      form.reset();
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to save:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể lưu loại mẫu";
      message.error(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = (form: UseFormReturn<SpecimenTypeFormData>) => {
    setModalOpen(false);
    form.reset();
  };

  // Add Indicators to SpecimenType
  const handleOpenAddIndicators = (specimenTypeId: string) => {
    setSelectedSpecimenTypeId(specimenTypeId);
    setAddIndicatorsModalOpen(true);
  };

  const handleAddIndicatorsOk = async (indicatorIds: string[]) => {
    if (!selectedSpecimenTypeId) return;

    if (!indicatorIds || indicatorIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    try {
      setAddIndicatorsLoading(true);

      const data: AddIndicatorsToSpecimenTypeDto = {
        indicatorIds: indicatorIds,
      };

      await specimenTypeService.addIndicators(selectedSpecimenTypeId, data);
      message.success(`Thêm ${indicatorIds.length} chỉ tiêu thành công!`);

      // Keep the specimen type expanded after adding indicators
      if (!expandedRowKeys.includes(selectedSpecimenTypeId)) {
        setExpandedRowKeys([...expandedRowKeys, selectedSpecimenTypeId]);
      }

      setAddIndicatorsModalOpen(false);
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

  const handleAddIndicatorsCancel = () => {
    setAddIndicatorsModalOpen(false);
    setSelectedSpecimenTypeId(null);
  };

  // Remove Indicator from SpecimenType
  const handleRemoveIndicator = async (specimenTypeId: string, indicatorId: string) => {
    try {
      await specimenTypeService.removeIndicator(specimenTypeId, indicatorId);
      message.success("Xóa chỉ tiêu khỏi loại mẫu thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to remove indicator:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể xóa chỉ tiêu";
      message.error(errorMsg);
    }
  };

  // Toggle indicator active status
  const handleToggleIndicatorActive = async (specimenTypeId: string, indicatorId: string) => {
    try {
      const result = await specimenTypeService.toggleIndicatorActive(specimenTypeId, indicatorId);
      message.success(
        result.isActive
          ? "Đã kích hoạt chỉ tiêu!"
          : "Đã ngừng kích hoạt chỉ tiêu!"
      );
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to toggle indicator active:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể thay đổi trạng thái";
      message.error(errorMsg);
    }
  };

  return {
    // SpecimenType modal
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
    selectedSpecimenTypeId,
    handleOpenAddIndicators,
    handleAddIndicatorsOk,
    handleAddIndicatorsCancel,

    // Remove indicator
    handleRemoveIndicator,

    // Toggle indicator active
    handleToggleIndicatorActive,
  };
};
