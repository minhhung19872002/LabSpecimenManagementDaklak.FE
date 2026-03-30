import { useState } from "react";
import { message, Modal } from "antd";
import { UseFormReturn } from "react-hook-form";
import { UnitDto } from "../../../../services/masterDataService";
import { unitService } from "../../../../services/masterDataService";
import { UnitFormData } from "../schemas";
import { getApiErrorMessage } from "../../../../utils/errorHandler";

interface UseUnitActionsProps {
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
}

export const useUnitActions = ({
  fetchData,
  onDataChange,
}: UseUnitActionsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitDto | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleCreate = (form: UseFormReturn<UnitFormData>) => {
    setEditingUnit(null);
    form.reset({ code: "", name: "", isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (
    unit: UnitDto,
    form: UseFormReturn<UnitFormData>
  ) => {
    setEditingUnit(unit);
    form.reset({
      code: unit.code,
      name: unit.name,
      isActive: unit.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await unitService.delete(id);
      message.success("Đã xóa đơn vị hàng hóa");
      await fetchData();
      onDataChange?.();
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(
        error,
        "Không thể xóa đơn vị hàng hóa."
      );
      message.error(errorMessage);
    }
  };

  const handleToggleActive = async (unit: UnitDto) => {
    const newStatus = !unit.isActive;
    const statusText = newStatus ? "kích hoạt" : "ngừng kích hoạt";

    Modal.confirm({
      title: `Xác nhận ${statusText}`,
      content: `Bạn có chắc chắn muốn ${statusText} đơn vị "${unit.name}"?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await unitService.toggleActive(unit.id);
          message.success(`Đã ${statusText} đơn vị hàng hóa`);
          await fetchData();
          onDataChange?.();
        } catch (error: any) {
          const errorMessage = getApiErrorMessage(
            error,
            `Không thể ${statusText} đơn vị hàng hóa.`
          );
          message.error(errorMessage);
        }
      },
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;

    Modal.confirm({
      title: "Xác nhận xóa hàng loạt",
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} đơn vị đã chọn?`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          const count = await unitService.batchDelete(
            selectedRowKeys.map(String)
          );
          message.success(`Đã xóa ${count} đơn vị hàng hóa`);
          setSelectedRowKeys([]);
          await fetchData();
          onDataChange?.();
        } catch (error: any) {
          const errorMessage = getApiErrorMessage(
            error,
            "Không thể xóa hàng loạt."
          );
          message.error(errorMessage);
        }
      },
    });
  };

  const handleBatchToggleActive = async (isActive: boolean) => {
    if (selectedRowKeys.length === 0) return;

    const statusText = isActive ? "kích hoạt" : "ngừng kích hoạt";

    Modal.confirm({
      title: `Xác nhận ${statusText} hàng loạt`,
      content: `Bạn có chắc chắn muốn ${statusText} ${selectedRowKeys.length} đơn vị đã chọn?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          const count = await unitService.batchToggleActive(
            selectedRowKeys.map(String),
            isActive
          );
          message.success(`Đã ${statusText} ${count} đơn vị hàng hóa`);
          setSelectedRowKeys([]);
          await fetchData();
          onDataChange?.();
        } catch (error: any) {
          const errorMessage = getApiErrorMessage(
            error,
            `Không thể ${statusText} hàng loạt.`
          );
          message.error(errorMessage);
        }
      },
    });
  };

  const handleModalOk = async (
    data: UnitFormData,
    form: UseFormReturn<UnitFormData>
  ) => {
    setModalLoading(true);
    try {
      if (editingUnit) {
        await unitService.update(editingUnit.id, {
          code: data.code,
          name: data.name,
          isActive: data.isActive ?? true,
        });
        message.success("Đã cập nhật đơn vị hàng hóa");
      } else {
        await unitService.create({
          code: data.code,
          name: data.name,
          isActive: data.isActive ?? true,
        });
        message.success("Đã tạo đơn vị hàng hóa mới");
      }
      setModalOpen(false);
      form.reset();
      await fetchData();
      onDataChange?.();
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(
        error,
        "Không thể lưu đơn vị hàng hóa."
      );
      message.error(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = (form: UseFormReturn<UnitFormData>) => {
    setModalOpen(false);
    form.reset();
  };

  return {
    modalOpen,
    editingUnit,
    modalLoading,
    selectedRowKeys,
    setSelectedRowKeys,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleBatchDelete,
    handleBatchToggleActive,
    handleModalOk,
    handleModalCancel,
  };
};
