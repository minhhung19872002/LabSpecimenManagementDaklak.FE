import { useState } from "react";
import { message, Modal } from "antd";
import { UseFormReturn } from "react-hook-form";
import { sampleTypeCategoryService } from "../../../../services/masterDataService";
import { SampleTypeCategoryDto } from "../types";
import { SampleTypeCategoryFormData } from "../schemas";

interface UseSampleTypeCategoriesActionsProps {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
}

/**
 * Extract error message from API error response
 * API response interceptor unwraps errors, so error.response.data is directly the errors object
 * Format: { "general": ["message1"], "fieldName": ["message2"] } or { message: "..." }
 */
const extractErrorMessage = (error: any, defaultMessage: string): string => {
  const data = error.response?.data;

  if (!data) return defaultMessage;

  // If data is an object with arrays (field errors format)
  if (typeof data === 'object' && !Array.isArray(data)) {
    // Check for direct message property
    if (data.message) return data.message;

    // Try to get first error from field errors (e.g., { "general": ["..."], "name": ["..."] })
    const keys = Object.keys(data);
    for (const key of keys) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        return data[key][0];
      }
    }
  }

  return defaultMessage;
};

export const useSampleTypeCategoriesActions = ({
  fetchData,
  onDataChange,
}: UseSampleTypeCategoriesActionsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SampleTypeCategoryDto | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Create category
  const handleCreate = (form: UseFormReturn<SampleTypeCategoryFormData>) => {
    setEditingCategory(null);
    form.reset({ name: "", description: "", isActive: true });
    setModalOpen(true);
  };

  // Edit category
  const handleEdit = (
    category: SampleTypeCategoryDto,
    form: UseFormReturn<SampleTypeCategoryFormData>
  ) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setModalOpen(true);
  };

  // Delete category
  const handleDelete = async (id: string) => {
    if (id === "uncategorized") {
      message.warning("Không thể xóa nhóm này");
      return;
    }

    try {
      await sampleTypeCategoryService.delete(id);
      message.success("Đã xóa danh mục loại mẫu");
      await fetchData();
      onDataChange?.();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, "Không thể xóa danh mục. Vui lòng kiểm tra lại.");
      message.error(errorMessage);
    }
  };

  // Toggle active with cascade
  const handleToggleActive = async (category: SampleTypeCategoryDto) => {
    if (category.id === "uncategorized") {
      message.warning("Không thể thay đổi trạng thái nhóm này");
      return;
    }

    const newStatus = !category.isActive;
    const statusText = newStatus ? "kích hoạt" : "hủy kích hoạt";

    const warningText = category.specimenTypeCount > 0
      ? `\n\nLưu ý: ${category.specimenTypeCount} loại mẫu trong danh mục này cũng sẽ được ${statusText}.`
      : "";

    Modal.confirm({
      title: `Xác nhận ${statusText} danh mục`,
      content: `Bạn có chắc chắn muốn ${statusText} danh mục "${category.name}"?${warningText}`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await sampleTypeCategoryService.toggleActive(category.id);
          message.success(`Đã ${statusText} danh mục và các loại mẫu bên trong`);
          await fetchData();
          onDataChange?.();
        } catch (error: any) {
          const errorMessage = extractErrorMessage(error, `Không thể ${statusText} danh mục. Vui lòng thử lại.`);
          message.error(errorMessage);
        }
      },
    });
  };

  // Modal OK handler
  const handleModalOk = async (
    data: SampleTypeCategoryFormData,
    form: UseFormReturn<SampleTypeCategoryFormData>
  ) => {
    setModalLoading(true);
    try {
      if (editingCategory) {
        await sampleTypeCategoryService.update(editingCategory.id, {
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
        });
        message.success("Đã cập nhật danh mục loại mẫu");
      } else {
        await sampleTypeCategoryService.create({
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
        });
        message.success("Đã tạo danh mục loại mẫu mới");
      }
      setModalOpen(false);
      form.reset();
      await fetchData();
      onDataChange?.();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, "Không thể lưu danh mục. Vui lòng thử lại.");
      message.error(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  // Modal cancel handler
  const handleModalCancel = (form: UseFormReturn<SampleTypeCategoryFormData>) => {
    setModalOpen(false);
    form.reset();
  };

  return {
    modalOpen,
    editingCategory,
    modalLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  };
};
