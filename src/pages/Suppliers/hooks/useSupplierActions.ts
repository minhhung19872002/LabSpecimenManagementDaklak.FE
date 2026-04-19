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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

  const handleDelete = useCallback((supplier: SupplierDto) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa "${supplier.name}"? Thao tác này không thể hoàn tác.`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await supplierService.delete(supplier.id);
          message.success("Đã xóa nhà cung cấp");
          await fetchData();
        } catch (error: any) {
          message.error(getApiErrorMessage(error, "Không thể xóa nhà cung cấp."));
        }
      },
    });
  }, [fetchData]);

  const handleBatchDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) return;

    Modal.confirm({
      title: "Xác nhận xóa hàng loạt",
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} nhà cung cấp đã chọn?`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          const count = await supplierService.batchDelete(selectedRowKeys.map(String));
          message.success(`Đã xóa ${count} nhà cung cấp`);
          setSelectedRowKeys([]);
          await fetchData();
        } catch (error: any) {
          message.error(getApiErrorMessage(error, "Không thể xóa hàng loạt."));
        }
      },
    });
  }, [selectedRowKeys, fetchData]);

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
    selectedRowKeys,
    setSelectedRowKeys,
    handleCreate,
    handleEdit,
    handleDelete,
    handleBatchDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  };
};
