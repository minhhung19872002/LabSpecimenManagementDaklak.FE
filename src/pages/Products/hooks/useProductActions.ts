import { useState } from "react";
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

  const handleCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = async (product: ProductDto) => {
    // Load full product with attachments and conversions
    try {
      const fullProduct = await productService.get(product.id);
      setEditingProduct(fullProduct);
      setModalOpen(true);
    } catch (error: any) {
      message.error("Không thể tải thông tin sản phẩm");
    }
  };

  const handleToggleActive = (product: ProductDto) => {
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
  };

  const handleModalOk = async (data: CreateUpdateProductDto) => {
    setModalLoading(true);
    try {
      if (editingProduct) {
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
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  return {
    modalOpen,
    editingProduct,
    modalLoading,
    handleCreate,
    handleEdit,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  };
};
