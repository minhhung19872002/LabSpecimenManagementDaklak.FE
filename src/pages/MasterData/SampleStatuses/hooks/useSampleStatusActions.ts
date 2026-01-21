import { useState } from "react";
import { message, Modal } from "antd";
import { UseFormReturn } from "react-hook-form";
import { sampleConditionService, SampleConditionDto } from "../../../../services/masterDataService";
import { SampleConditionFormData } from "../schemas";
import { getApiErrorMessage } from "../../../../utils/errorHandler";

interface UseSampleConditionActionsProps {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
}

export const useSampleConditionActions = ({
  fetchData,
  onDataChange,
}: UseSampleConditionActionsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<SampleConditionDto | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Create condition
  const handleCreate = (form: UseFormReturn<SampleConditionFormData>) => {
    setEditingCondition(null);
    form.reset({ name: "", description: "", isActive: true });
    setModalOpen(true);
  };

  // Edit condition
  const handleEdit = (
    condition: SampleConditionDto,
    form: UseFormReturn<SampleConditionFormData>
  ) => {
    setEditingCondition(condition);
    form.reset({
      name: condition.name,
      description: condition.description || "",
      isActive: condition.isActive,
    });
    setModalOpen(true);
  };

  // Delete condition
  const handleDelete = async (id: string) => {
    try {
      await sampleConditionService.delete(id);
      message.success("Đã xóa tình trạng mẫu");
      await fetchData();
      onDataChange?.();
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, "Không thể xóa tình trạng mẫu. Vui lòng kiểm tra lại.");
      message.error(errorMessage);
    }
  };

  // Toggle active
  const handleToggleActive = async (condition: SampleConditionDto) => {
    const newStatus = !condition.isActive;
    const statusText = newStatus ? "kích hoạt" : "hủy kích hoạt";

    Modal.confirm({
      title: `Xác nhận ${statusText} tình trạng mẫu`,
      content: `Bạn có chắc chắn muốn ${statusText} tình trạng "${condition.name}"?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await sampleConditionService.toggleActive(condition.id);
          message.success(`Đã ${statusText} tình trạng mẫu`);
          await fetchData();
          onDataChange?.();
        } catch (error: any) {
          const errorMessage = getApiErrorMessage(error, `Không thể ${statusText} tình trạng mẫu. Vui lòng thử lại.`);
          message.error(errorMessage);
        }
      },
    });
  };

  // Modal OK handler
  const handleModalOk = async (
    data: SampleConditionFormData,
    form: UseFormReturn<SampleConditionFormData>
  ) => {
    setModalLoading(true);
    try {
      if (editingCondition) {
        await sampleConditionService.update(editingCondition.id, {
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
        });
        message.success("Đã cập nhật tình trạng mẫu");
      } else {
        await sampleConditionService.create({
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
        });
        message.success("Đã tạo tình trạng mẫu mới");
      }
      setModalOpen(false);
      form.reset();
      await fetchData();
      onDataChange?.();
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, "Không thể lưu tình trạng mẫu. Vui lòng thử lại.");
      message.error(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  // Modal cancel handler
  const handleModalCancel = (form: UseFormReturn<SampleConditionFormData>) => {
    setModalOpen(false);
    form.reset();
  };

  return {
    modalOpen,
    editingCondition,
    modalLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  };
};
