import { useState, useCallback } from "react";
import { message, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import {
  goodsReceiptService,
  GoodsReceiptListDto,
} from "../../../services/goodsReceiptService";
import { getApiErrorMessage } from "../../../utils/errorHandler";

interface UseGoodsReceiptActionsProps {
  fetchData: () => Promise<void>;
  loadStats?: () => Promise<void>;
}

export const useGoodsReceiptActions = ({ fetchData, loadStats }: UseGoodsReceiptActionsProps) => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleCreate = useCallback(() => {
    navigate("/goods-receipts/create");
  }, [navigate]);

  const handleView = useCallback((record: GoodsReceiptListDto) => {
    navigate(`/goods-receipts/${record.id}`);
  }, [navigate]);

  const handleEdit = useCallback((record: GoodsReceiptListDto) => {
    navigate(`/goods-receipts/edit/${record.id}`);
  }, [navigate]);

  const handleDelete = useCallback((record: GoodsReceiptListDto) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa phiếu "${record.code}"? Thao tác này không thể hoàn tác.`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await goodsReceiptService.delete(record.id);
          message.success("Đã xóa phiếu nhập hàng");
          await fetchData();
        } catch (error: any) {
          message.error(getApiErrorMessage(error, "Không thể xóa phiếu nhập hàng."));
        }
      },
    });
  }, [fetchData]);

  const handleCancel = useCallback((record: GoodsReceiptListDto) => {
    Modal.confirm({
      title: "Xác nhận hủy đặt hàng",
      content: `Bạn có chắc chắn muốn hủy đặt hàng "${record.code}"?`,
      okText: "Hủy đặt hàng",
      okButtonProps: { danger: true },
      cancelText: "Đóng",
      centered: true,
      onOk: async () => {
        try {
          await goodsReceiptService.cancel(record.id);
          message.success("Đã hủy đặt hàng");
          await fetchData();
          loadStats?.();
        } catch (error: any) {
          message.error(getApiErrorMessage(error, "Không thể hủy đặt hàng."));
        }
      },
    });
  }, [fetchData]);

  const handleBatchDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) return;

    Modal.confirm({
      title: "Xác nhận xóa hàng loạt",
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} phiếu đã chọn?`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          const count = await goodsReceiptService.batchDelete(selectedRowKeys.map(String));
          message.success(`Đã xóa ${count} phiếu nhập hàng`);
          setSelectedRowKeys([]);
          await fetchData();
        } catch (error: any) {
          message.error(getApiErrorMessage(error, "Không thể xóa hàng loạt."));
        }
      },
    });
  }, [selectedRowKeys, fetchData]);

  return {
    selectedRowKeys,
    setSelectedRowKeys,
    handleCreate,
    handleView,
    handleEdit,
    handleDelete,
    handleCancel,
    handleBatchDelete,
  };
};
