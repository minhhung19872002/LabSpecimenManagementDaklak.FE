import { useState, useCallback } from "react";
import { message, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import {
  goodsReceiptService,
  GoodsReceiptListDto,
  GoodsReceiptType,
} from "../../../services/goodsReceiptService";
import { getApiErrorMessage } from "../../../utils/errorHandler";

interface UseGoodsReceiptActionsProps {
  fetchData: () => Promise<void>;
}

export const useGoodsReceiptActions = ({ fetchData }: UseGoodsReceiptActionsProps) => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleCreate = useCallback((type: GoodsReceiptType = GoodsReceiptType.Goods) => {
    if (type === GoodsReceiptType.Equipment) {
      navigate("/goods-receipts/create-equipment");
    } else {
      navigate("/goods-receipts/create");
    }
  }, [navigate]);

  const handleView = useCallback((record: GoodsReceiptListDto) => {
    navigate(`/goods-receipts/${record.id}`);
  }, [navigate]);

  const handleEdit = useCallback((record: GoodsReceiptListDto) => {
    if (record.receiptType === GoodsReceiptType.Equipment) {
      navigate(`/goods-receipts/edit-equipment/${record.id}`);
    } else {
      navigate(`/goods-receipts/edit/${record.id}`);
    }
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
    handleBatchDelete,
  };
};
