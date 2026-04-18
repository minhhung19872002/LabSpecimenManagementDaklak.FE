import { useState, useCallback } from "react";
import { message, Modal } from "antd";
import { productService, ProductDto, CreateUpdateProductDto } from "../../../services/productService";
import { getApiErrorMessage } from "../../../utils/errorHandler";

interface UseProductActionsProps {
  fetchData: () => Promise<void>;
}

export const useProductActions = ({ fetchData }: UseProductActionsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleCreate = useCallback(() => {
    setEditingProduct(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback(async (product: ProductDto) => {
    try {
      const fullProduct = await productService.get(product.id);
      setEditingProduct(fullProduct);
      setModalOpen(true);
    } catch {
      message.error("Không thể tải thông tin sản phẩm");
    }
  }, []);

  const handleDelete = useCallback((product: ProductDto) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa "${product.name}"? Thao tác này không thể hoàn tác.`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await productService.delete(product.id);
          message.success("Đã xóa sản phẩm");
          await fetchData();
        } catch (error: any) {
          message.error(getApiErrorMessage(error, "Không thể xóa sản phẩm."));
        }
      },
    });
  }, [fetchData]);

  const handleToggleActive = useCallback((product: ProductDto) => {
    const newStatus = !product.isActive;
    const statusText = newStatus ? "kích hoạt" : "ngừng kích hoạt";

    Modal.confirm({
      title: `Xác nhận ${statusText}`,
      content: `Bạn có chắc chắn muốn ${statusText} "${product.name}"?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await productService.toggleActive(product.id);
          message.success(`Đã ${statusText} sản phẩm`);
          await fetchData();
        } catch (error: any) {
          message.error(getApiErrorMessage(error, `Không thể ${statusText} sản phẩm.`));
        }
      },
    });
  }, [fetchData]);

  const handleModalOk = useCallback(async (data: CreateUpdateProductDto, removedAttachmentIds?: string[]) => {
    setModalLoading(true);
    try {
      if (editingProduct) {
        // Delete removed attachments from server
        if (removedAttachmentIds?.length) {
          await Promise.all(
            removedAttachmentIds.map((attId) =>
              productService.deleteAttachment(editingProduct.id, attId).catch(() => {})
            )
          );
        }
        await productService.update(editingProduct.id, data);
        message.success("Đã cập nhật sản phẩm");
      } else {
        await productService.create(data);
        message.success("Đã tạo sản phẩm mới");
      }
      setModalOpen(false);
      setEditingProduct(null);
      await fetchData();
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể lưu sản phẩm."));
    } finally {
      setModalLoading(false);
    }
  }, [editingProduct, fetchData]);

  const handleModalCancel = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  return {
    modalOpen,
    editingProduct,
    modalLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  };
};
