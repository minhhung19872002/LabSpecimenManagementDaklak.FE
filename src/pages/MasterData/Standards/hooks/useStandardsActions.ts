import { useState } from "react";
import { message, Modal } from "antd";
import type { FormInstance } from "antd";
import type { UseFormReturn } from "react-hook-form";
import {
  standardService,
  CreateStandardDto,
  UpdateStandardDto,
  AddIndicatorsToStandardDto,
  UpdateStandardIndicatorDto,
} from "../../../../services/masterDataService";
import { GroupedStandardData, StandardIndicatorDto } from "../types";
import { StandardFormData } from "../schemas/standardSchema";
import { getApiErrorMessage } from "../../../../utils/errorHandler";

interface UseStandardsActionsParams {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
  expandedRowKeys: string[];
  setExpandedRowKeys: React.Dispatch<React.SetStateAction<string[]>>;
  // Batch selection for indicators
  selectedIndicatorKeys: Record<string, string[]>;
  setSelectedIndicatorKeys: (keys: Record<string, string[]>) => void;
  setBatchLoading: (loading: boolean) => void;
}

export const useStandardsActions = ({
  fetchData,
  onDataChange,
  expandedRowKeys,
  setExpandedRowKeys,
  selectedIndicatorKeys,
  setSelectedIndicatorKeys,
  setBatchLoading,
}: UseStandardsActionsParams) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupedStandardData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [addIndicatorsModalOpen, setAddIndicatorsModalOpen] = useState(false);
  const [addIndicatorsLoading, setAddIndicatorsLoading] = useState(false);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [selectedStandardName, setSelectedStandardName] = useState<string>("");

  const [editIndicatorModalOpen, setEditIndicatorModalOpen] = useState(false);
  const [editIndicatorLoading, setEditIndicatorLoading] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<StandardIndicatorDto | null>(null);
  const [editingIndicatorStandardId, setEditingIndicatorStandardId] = useState<string | null>(null);

  // Standard CRUD
  const handleCreate = (form: UseFormReturn<StandardFormData>) => {
    setEditingItem(null);
    form.reset({ name: "", limitDescription: "", isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (
    record: GroupedStandardData,
    form: UseFormReturn<StandardFormData>
  ) => {
    setEditingItem(record);
    form.reset({
      name: record.name,
      limitDescription: record.limitDescription || "",
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await standardService.delete(id);
      message.success("Xóa tiêu chuẩn thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to delete:", error);
      message.error(getApiErrorMessage(error, "Không thể xóa tiêu chuẩn"));
    }
  };

  const handleModalOk = async (
    data: StandardFormData,
    form: UseFormReturn<StandardFormData>
  ) => {
    try {
      setModalLoading(true);

      if (editingItem) {
        await standardService.update(editingItem.id, data as UpdateStandardDto);
        message.success("Cập nhật tiêu chuẩn thành công!");
      } else {
        await standardService.create(data as CreateStandardDto);
        message.success("Thêm tiêu chuẩn thành công!");
      }

      setModalOpen(false);
      form.reset();
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to save:", error);
      message.error(getApiErrorMessage(error, "Không thể lưu tiêu chuẩn"));
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = (form: UseFormReturn<StandardFormData>) => {
    setModalOpen(false);
    form.reset();
  };

  // Toggle active status for Standard
  const handleToggleActive = async (id: string) => {
    try {
      const result = await standardService.toggleActive(id);
      message.success(
        result.isActive
          ? "Đã kích hoạt tiêu chuẩn!"
          : "Đã ngừng kích hoạt tiêu chuẩn!"
      );
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to toggle active:", error);
      message.error(getApiErrorMessage(error, "Không thể thay đổi trạng thái"));
    }
  };

  // Add Indicators to Standard
  const handleOpenAddIndicators = (
    standardId: string,
    standardName: string,
    form: FormInstance
  ) => {
    setSelectedStandardId(standardId);
    setSelectedStandardName(standardName);
    form.resetFields();
    form.setFieldsValue({
      indicators: [{ indicatorId: undefined, testMethodId: undefined, unit: "", subIndicators: [] }],
    });
    setAddIndicatorsModalOpen(true);
  };

  const handleAddIndicatorsOk = async (
    form: FormInstance,
    selectedIndicators: Record<number, string>,
    selectedMethods: Record<number, { id: string; unit: string }>
  ) => {
    if (!selectedStandardId) return;

    try {
      setAddIndicatorsLoading(true);

      // Get form values directly (don't use validateFields as it has issues with nested Form.List)
      const formIndicators = form.getFieldValue("indicators") || [];

      // Flatten nested structure: parent indicators + their sub-indicators
      const flatIndicators: any[] = [];
      const errors: string[] = [];

      // Iterate through selected indicators (source of truth for parent data)
      Object.keys(selectedIndicators).forEach((indexStr) => {
        const index = parseInt(indexStr, 10);
        const indicatorId = selectedIndicators[index];
        const method = selectedMethods[index];

        // Validate parent fields
        if (!indicatorId) {
          errors.push(`Dòng ${index + 1}: Vui lòng chọn chỉ tiêu`);
          return;
        }
        if (!method) {
          errors.push(`Dòng ${index + 1}: Vui lòng chọn phương pháp`);
          return;
        }

        const formParent = formIndicators[index] || {};
        // Filter only sub-indicators that have actual data (indicatorId selected)
        const subIndicators = (formParent.subIndicators || []).filter(
          (sub: any) => sub && sub.indicatorId
        );
        const hasSubIndicators = subIndicators.length > 0;

        if (hasSubIndicators) {
          // Parent with sub-indicators: only send indicatorId, testMethodId, unit
          flatIndicators.push({
            indicatorId: indicatorId,
            testMethodId: method.id,
            unit: method.unit || "",
          });

          // Add all sub-indicators with full fields
          subIndicators.forEach((sub: any, subIndex: number) => {
            if (!sub.indicatorId) {
              errors.push(`Dòng ${index + 1}, chỉ tiêu phụ ${subIndex + 1}: Vui lòng chọn chỉ tiêu phụ`);
              return;
            }
            if (!sub.comparisonOperator) {
              errors.push(`Dòng ${index + 1}, chỉ tiêu phụ ${subIndex + 1}: Vui lòng chọn phép so sánh`);
              return;
            }

            const isRange = sub.comparisonOperator === "range";

            // Validate limits
            if (isRange) {
              if (!sub.lowerLimit && !sub.upperLimit) {
                errors.push(`Dòng ${index + 1}, chỉ tiêu phụ ${subIndex + 1}: Vui lòng nhập giới hạn`);
                return;
              }
            }

            flatIndicators.push({
              indicatorId: sub.indicatorId,
              testMethodId: method.id, // Inherit from parent
              unit: sub.unit || method.unit || "",
              comparisonOperator: isRange ? undefined : sub.comparisonOperator,
              allowedLimit: isRange ? undefined : sub.allowedLimit || undefined,
              lowerOperator: isRange ? sub.lowerOperator || ">" : undefined,
              lowerLimit: isRange ? sub.lowerLimit || undefined : undefined,
              upperOperator: isRange ? sub.upperOperator || "<" : undefined,
              upperLimit: isRange ? sub.upperLimit || undefined : undefined,
            });
          });
        } else {
          // Parent without sub-indicators: send full fields
          if (!formParent.comparisonOperator) {
            errors.push(`Dòng ${index + 1}: Vui lòng chọn phép so sánh`);
            return;
          }

          const isRange = formParent.comparisonOperator === "range";

          // Validate limits
          if (isRange) {
            if (!formParent.lowerLimit && !formParent.upperLimit) {
              errors.push(`Dòng ${index + 1}: Vui lòng nhập giới hạn`);
              return;
            }
          }

          flatIndicators.push({
            indicatorId: indicatorId,
            testMethodId: method.id,
            unit: method.unit || "",
            comparisonOperator: isRange ? undefined : formParent.comparisonOperator,
            allowedLimit: isRange ? undefined : formParent.allowedLimit || undefined,
            lowerOperator: isRange ? formParent.lowerOperator || ">" : undefined,
            lowerLimit: isRange ? formParent.lowerLimit || undefined : undefined,
            upperOperator: isRange ? formParent.upperOperator || "<" : undefined,
            upperLimit: isRange ? formParent.upperLimit || undefined : undefined,
          });
        }
      });

      // Show first error if any
      if (errors.length > 0) {
        message.warning(errors[0]);
        return;
      }

      if (flatIndicators.length === 0) {
        message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
        return;
      }

      const data: AddIndicatorsToStandardDto = {
        indicators: flatIndicators,
      };

      await standardService.addIndicators(selectedStandardId, data);
      message.success(`Thêm ${flatIndicators.length} chỉ tiêu thành công!`);

      // Keep the standard expanded after adding indicators
      if (!expandedRowKeys.includes(selectedStandardId)) {
        setExpandedRowKeys([...expandedRowKeys, selectedStandardId]);
      }

      setAddIndicatorsModalOpen(false);
      form.resetFields();
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to add indicators:", error);
      message.error(getApiErrorMessage(error, "Không thể thêm chỉ tiêu"));
    } finally {
      setAddIndicatorsLoading(false);
    }
  };

  const handleAddIndicatorsCancel = (form: FormInstance) => {
    setAddIndicatorsModalOpen(false);
    form.resetFields();
    setSelectedStandardId(null);
    setSelectedStandardName("");
  };

  // Edit Indicator
  const handleOpenEditIndicator = (
    standardId: string,
    indicator: StandardIndicatorDto,
    form: FormInstance
  ) => {
    setEditingIndicatorStandardId(standardId);
    setEditingIndicator(indicator);
    form.setFieldsValue({
      comparisonOperator: indicator.comparisonOperator,
      allowedLimit: indicator.allowedLimit,
      isActive: indicator.isActive,
    });
    setEditIndicatorModalOpen(true);
  };

  const handleEditIndicatorOk = async (form: FormInstance) => {
    if (!editingIndicatorStandardId || !editingIndicator) return;

    try {
      setEditIndicatorLoading(true);
      const values = await form.validateFields();

      // Check if this is a range (comparisonOperator === "range")
      const isRange = values.comparisonOperator === "range";

      const data: UpdateStandardIndicatorDto = {
        // For range mode, don't send comparisonOperator and allowedLimit
        comparisonOperator: isRange ? undefined : values.comparisonOperator || undefined,
        allowedLimit: isRange ? undefined : values.allowedLimit || undefined,
        // Range fields
        lowerOperator: isRange ? values.lowerOperator || undefined : undefined,
        lowerLimit: isRange ? values.lowerLimit || undefined : undefined,
        upperOperator: isRange ? values.upperOperator || undefined : undefined,
        upperLimit: isRange ? values.upperLimit || undefined : undefined,
        isActive: values.isActive,
      };

      await standardService.updateIndicator(
        editingIndicatorStandardId,
        editingIndicator.id,
        data
      );
      message.success("Cập nhật chỉ tiêu thành công!");

      setEditIndicatorModalOpen(false);
      form.resetFields();
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to update indicator:", error);
      message.error(getApiErrorMessage(error, "Không thể cập nhật chỉ tiêu"));
    } finally {
      setEditIndicatorLoading(false);
    }
  };

  const handleEditIndicatorCancel = (form: FormInstance) => {
    setEditIndicatorModalOpen(false);
    form.resetFields();
    setEditingIndicator(null);
    setEditingIndicatorStandardId(null);
  };

  // Remove Indicator from Standard
  const handleRemoveIndicator = async (standardId: string, indicatorId: string) => {
    try {
      await standardService.removeIndicator(standardId, indicatorId);
      message.success("Xóa chỉ tiêu khỏi tiêu chuẩn thành công!");
      fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      console.error("Failed to remove indicator:", error);
      message.error(getApiErrorMessage(error, "Không thể xóa chỉ tiêu"));
    }
  };

  // Toggle active status for Indicator
  const handleToggleIndicatorActive = async (standardId: string, indicatorId: string) => {
    try {
      const result = await standardService.toggleIndicatorActive(standardId, indicatorId);
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
  const handleBatchRemoveIndicators = async (standardId: string) => {
    const selectedIds = selectedIndicatorKeys[standardId] || [];
    if (selectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa ${selectedIds.length} chỉ tiêu đã chọn khỏi tiêu chuẩn này?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setBatchLoading(true);
          const count = await standardService.batchRemoveIndicators(standardId, selectedIds);
          message.success(`Đã xóa ${count} chỉ tiêu thành công!`);
          // Clear selection for this standard
          setSelectedIndicatorKeys({
            ...selectedIndicatorKeys,
            [standardId]: [],
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

  // ============= Batch Activate Indicators =============
  const handleBatchActivateIndicators = async (standardId: string) => {
    const selectedIds = selectedIndicatorKeys[standardId] || [];
    if (selectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    try {
      setBatchLoading(true);
      const count = await standardService.batchActivateIndicators(standardId, selectedIds);
      if (count > 0) {
        message.success(`Đã kích hoạt ${count} chỉ tiêu thành công!`);
      } else {
        message.info("Tất cả chỉ tiêu đã được kích hoạt");
      }
      // Clear selection for this standard
      setSelectedIndicatorKeys({
        ...selectedIndicatorKeys,
        [standardId]: [],
      });
      await fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Không thể kích hoạt chỉ tiêu"));
    } finally {
      setBatchLoading(false);
    }
  };

  // ============= Batch Deactivate Indicators =============
  const handleBatchDeactivateIndicators = async (standardId: string) => {
    const selectedIds = selectedIndicatorKeys[standardId] || [];
    if (selectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    try {
      setBatchLoading(true);
      const count = await standardService.batchDeactivateIndicators(standardId, selectedIds);
      if (count > 0) {
        message.success(`Đã ngừng kích hoạt ${count} chỉ tiêu thành công!`);
      } else {
        message.info("Tất cả chỉ tiêu đã ngừng kích hoạt");
      }
      // Clear selection for this standard
      setSelectedIndicatorKeys({
        ...selectedIndicatorKeys,
        [standardId]: [],
      });
      await fetchData();
      onDataChange?.();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Không thể ngừng kích hoạt chỉ tiêu"));
    } finally {
      setBatchLoading(false);
    }
  };

  return {
    // Standard modal
    modalOpen,
    editingItem,
    modalLoading,
    setModalOpen,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleModalCancel,
    handleToggleActive,

    // Add Indicators modal
    addIndicatorsModalOpen,
    addIndicatorsLoading,
    selectedStandardId,
    selectedStandardName,
    handleOpenAddIndicators,
    handleAddIndicatorsOk,
    handleAddIndicatorsCancel,

    // Edit Indicator modal
    editIndicatorModalOpen,
    editIndicatorLoading,
    editingIndicator,
    handleOpenEditIndicator,
    handleEditIndicatorOk,
    handleEditIndicatorCancel,

    // Remove indicator
    handleRemoveIndicator,

    // Toggle indicator active
    handleToggleIndicatorActive,

    // Batch remove indicators
    handleBatchRemoveIndicators,

    // Batch activate/deactivate indicators
    handleBatchActivateIndicators,
    handleBatchDeactivateIndicators,
  };
};
