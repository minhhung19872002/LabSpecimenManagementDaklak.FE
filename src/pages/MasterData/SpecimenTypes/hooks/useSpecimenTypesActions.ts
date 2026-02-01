import { useState } from "react";
import { message, Modal } from "antd";
import type { UseFormReturn } from "react-hook-form";
import {
  specimenTypeService,
  CreateUpdateSpecimenTypeDto,
  AddIndicatorsToSpecimenTypeDto,
} from "../../../../services/masterDataService";
import { GroupedSpecimenTypeData } from "../types";
import { SpecimenTypeFormData } from "../schemas/specimenTypeSchema";
import { getApiErrorMessage } from "../../../../utils/errorHandler";

interface UseSpecimenTypesActionsParams {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
  expandedSpecimenTypeKeys: string[];
  setExpandedSpecimenTypeKeys: React.Dispatch<React.SetStateAction<string[]>>;
  // Batch selection for indicators
  selectedIndicatorKeys: Record<string, string[]>;
  setSelectedIndicatorKeys: (keys: Record<string, string[]>) => void;
  setBatchLoading: (loading: boolean) => void;
}

export const useSpecimenTypesActions = ({
  fetchData,
  onDataChange,
  expandedSpecimenTypeKeys,
  setExpandedSpecimenTypeKeys,
  selectedIndicatorKeys,
  setSelectedIndicatorKeys,
  setBatchLoading,
}: UseSpecimenTypesActionsParams) => {
  // SpecimenType modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupedSpecimenTypeData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Add indicators modal states
  const [addIndicatorsModalOpen, setAddIndicatorsModalOpen] = useState(false);
  const [addIndicatorsLoading, setAddIndicatorsLoading] = useState(false);
  const [selectedSpecimenTypeId, setSelectedSpecimenTypeId] = useState<string | null>(null);

  // ============= SpecimenType Actions =============
  const handleCreate = (form: UseFormReturn<SpecimenTypeFormData>) => {
    setEditingItem(null);
    form.reset({ code: "", name: "", description: "", isActive: true, sampleTypeCategoryId: "" });
    setModalOpen(true);
  };

  const handleEdit = (
    record: GroupedSpecimenTypeData,
    form: UseFormReturn<SpecimenTypeFormData>
  ) => {
    setEditingItem(record);
    form.reset({
      code: record.code,
      name: record.name,
      description: record.description || "",
      isActive: record.isActive,
      sampleTypeCategoryId: record.sampleTypeCategoryId || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await specimenTypeService.delete(id);
      message.success("Xóa loại mẫu thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to delete:", error);
      message.error(getApiErrorMessage(error, "Không thể xóa loại mẫu"));
    }
  };

  const handleModalOk = async (
    data: SpecimenTypeFormData,
    form: UseFormReturn<SpecimenTypeFormData>
  ) => {
    try {
      setModalLoading(true);

      const submitData: CreateUpdateSpecimenTypeDto = {
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        sampleTypeCategoryId: data.sampleTypeCategoryId || undefined,
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
    } catch (error: unknown) {
      console.error("Failed to save:", error);
      message.error(getApiErrorMessage(error, "Không thể lưu loại mẫu"));
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = (form: UseFormReturn<SpecimenTypeFormData>) => {
    setModalOpen(false);
    form.reset();
  };

  // ============= Indicator Actions =============
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
      if (!expandedSpecimenTypeKeys.includes(selectedSpecimenTypeId)) {
        setExpandedSpecimenTypeKeys([...expandedSpecimenTypeKeys, selectedSpecimenTypeId]);
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
    setSelectedSpecimenTypeId(null);
  };

  const handleRemoveIndicator = async (specimenTypeId: string, indicatorId: string) => {
    try {
      await specimenTypeService.removeIndicator(specimenTypeId, indicatorId);
      message.success("Xóa chỉ tiêu khỏi loại mẫu thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to remove indicator:", error);
      message.error(getApiErrorMessage(error, "Không thể xóa chỉ tiêu"));
    }
  };

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
    } catch (error: unknown) {
      console.error("Failed to toggle indicator active:", error);
      message.error(getApiErrorMessage(error, "Không thể thay đổi trạng thái"));
    }
  };

  // ============= Batch Remove Indicators =============
  const handleBatchRemoveIndicators = async (specimenTypeId: string) => {
    const selectedIds = selectedIndicatorKeys[specimenTypeId] || [];
    if (selectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa ${selectedIds.length} chỉ tiêu đã chọn khỏi loại mẫu này?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setBatchLoading(true);
          const count = await specimenTypeService.batchRemoveIndicators(specimenTypeId, selectedIds);
          message.success(`Đã xóa ${count} chỉ tiêu thành công!`);
          // Clear selection for this specimen type
          setSelectedIndicatorKeys({
            ...selectedIndicatorKeys,
            [specimenTypeId]: [],
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

    // Batch remove indicators
    handleBatchRemoveIndicators,
  };
};
