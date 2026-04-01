import { useState, useCallback } from "react";
import { message, Modal } from "antd";
import { supplierService, SupplierDto, CreateUpdateSupplierDto } from "../../../services/supplierService";
import { getApiErrorMessage } from "../../../utils/errorHandler";

interface UseSupplierActionsProps {
  fetchData: () => Promise<void>;
}

export const useSupplierActions = ({ fetchData }: UseSupplierActionsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierDto | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleCreate = useCallback(() => {
    setEditingSupplier(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback(async (supplier: SupplierDto) => {
    try {
      const fullSupplier = await supplierService.get(supplier.id);
      setEditingSupplier(fullSupplier);
      setModalOpen(true);
    } catch {
      message.error("Không thể tải thông tin nhà cung cấp");
    }
  }, []);

  const handleToggleActive = useCallback((supplier: SupplierDto) => {
    const newStatus = !supplier.isActive;
    const statusText = newStatus ? "kích hoạt" : "ngừng kích hoạt";

    Modal.confirm({
      title: `Xác nhận ${statusText}`,
      content: `Bạn có chắc chắn muốn ${statusText} "${supplier.name}"?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await supplierService.toggleActive(supplier.id);
          message.success(`Đã ${statusText} nhà cung cấp`);
          await fetchData();
        } catch (error: any) {
          message.error(getApiErrorMessage(error, `Không thể ${statusText} nhà cung cấp.`));
        }
      },
    });
  }, [fetchData]);

  const handleModalOk = useCallback(async (data: CreateUpdateSupplierDto) => {
    setModalLoading(true);
    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier.id, data);
        message.success("Đã cập nhật nhà cung cấp");
      } else {
        await supplierService.create(data);
        message.success("Đã tạo nhà cung cấp mới");
      }
      setModalOpen(false);
      setEditingSupplier(null);
      await fetchData();
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể lưu nhà cung cấp."));
    } finally {
      setModalLoading(false);
    }
  }, [editingSupplier, fetchData]);

  const handleModalCancel = useCallback(() => {
    setModalOpen(false);
    setEditingSupplier(null);
  }, []);

  return {
    modalOpen,
    editingSupplier,
    modalLoading,
    handleCreate,
    handleEdit,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  };
};
