import { useState } from "react";
import { message } from "antd";
import type { FormInstance } from "antd";
import {
  standardService,
  CreateStandardDto,
  UpdateStandardDto,
  AddIndicatorsToStandardDto,
  UpdateStandardIndicatorDto,
} from "../../../../services/masterDataService";
import { GroupedStandardData, StandardIndicatorDto } from "../types";

interface UseStandardsActionsParams {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
  expandedRowKeys: string[];
  setExpandedRowKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useStandardsActions = ({
  fetchData,
  onDataChange,
  expandedRowKeys,
  setExpandedRowKeys,
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
  const handleCreate = (form: FormInstance) => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (record: GroupedStandardData, form: FormInstance) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      limitDescription: record.limitDescription,
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
    } catch (error: any) {
      console.error("Failed to delete:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể xóa tiêu chuẩn";
      message.error(errorMsg);
    }
  };

  const handleModalOk = async (form: FormInstance) => {
    try {
      setModalLoading(true);
      const values = await form.validateFields();

      if (editingItem) {
        await standardService.update(editingItem.id, values as UpdateStandardDto);
        message.success("Cập nhật tiêu chuẩn thành công!");
      } else {
        await standardService.create(values as CreateStandardDto);
        message.success("Thêm tiêu chuẩn thành công!");
      }

      setModalOpen(false);
      form.resetFields();
      fetchData();
      onDataChange?.();
    } catch (error: any) {
      console.error("Failed to save:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể lưu tiêu chuẩn";
      message.error(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = (form: FormInstance) => {
    setModalOpen(false);
    form.resetFields();
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
    } catch (error: any) {
      console.error("Failed to toggle active:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể thay đổi trạng thái";
      message.error(errorMsg);
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
      indicators: [{ indicatorId: undefined, testMethodId: undefined, unit: "" }],
    });
    setAddIndicatorsModalOpen(true);
  };

  const handleAddIndicatorsOk = async (form: FormInstance) => {
    if (!selectedStandardId) return;

    try {
      setAddIndicatorsLoading(true);
      const values = await form.validateFields();

      const validIndicators = values.indicators?.filter(
        (item: any) => item.indicatorId && item.testMethodId && item.unit
      );

      if (!validIndicators || validIndicators.length === 0) {
        message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
        return;
      }

      const data: AddIndicatorsToStandardDto = {
        indicators: validIndicators.map((item: any) => ({
          indicatorId: item.indicatorId,
          testMethodId: item.testMethodId,
          unit: item.unit,
          comparisonOperator: item.comparisonOperator || undefined,
          allowedLimit: item.allowedLimit || undefined,
        })),
      };

      await standardService.addIndicators(selectedStandardId, data);
      message.success(`Thêm ${validIndicators.length} chỉ tiêu thành công!`);

      // Keep the standard expanded after adding indicators
      if (!expandedRowKeys.includes(selectedStandardId)) {
        setExpandedRowKeys([...expandedRowKeys, selectedStandardId]);
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

      const data: UpdateStandardIndicatorDto = {
        comparisonOperator: values.comparisonOperator || undefined,
        allowedLimit: values.allowedLimit || undefined,
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
    } catch (error: any) {
      console.error("Failed to update indicator:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể cập nhật chỉ tiêu";
      message.error(errorMsg);
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
    } catch (error: any) {
      console.error("Failed to remove indicator:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể xóa chỉ tiêu";
      message.error(errorMsg);
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
    } catch (error: any) {
      console.error("Failed to toggle indicator active:", error);
      const errorMsg =
        error?.response?.data?.error?.message || "Không thể thay đổi trạng thái";
      message.error(errorMsg);
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
  };
};
