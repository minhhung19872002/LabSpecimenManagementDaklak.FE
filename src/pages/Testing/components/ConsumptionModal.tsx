import React, { useState } from "react";
import {
  Modal,
  Table,
  InputNumber,
  message,
  Tag,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import testBatchService from "../../../services/testBatchService";
import {
  TestBatchConsumptionDto,
  ConfirmConsumptionDto,
} from "../../../types/testBatch";

interface Props {
  open: boolean;
  batchId: string;
  consumptions: TestBatchConsumptionDto[];
  onClose: () => void;
  onConfirmed: () => void;
}

const ConsumptionModal: React.FC<Props> = ({
  open,
  batchId,
  consumptions,
  onClose,
  onConfirmed,
}) => {
  const [loading, setLoading] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState<
    Record<string, number>
  >({});

  const handleQuantityChange = (id: string, value: number | null) => {
    setEditedQuantities((prev) => ({
      ...prev,
      [id]: value ?? 0,
    }));
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const dto: ConfirmConsumptionDto = {
        items: consumptions.map((c) => ({
          consumptionId: c.id,
          actualQuantity:
            editedQuantities[c.id] !== undefined
              ? editedQuantities[c.id]
              : c.actualQuantity,
        })),
      };
      await testBatchService.confirmConsumption(batchId, dto);
      message.success("Xác nhận tiêu hao và trừ kho thành công");
      onConfirmed();
      onClose();
    } catch (err: any) {
      message.error(
        err?.response?.data?.error?.message || "Lỗi xác nhận tiêu hao",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<TestBatchConsumptionDto> = [
    {
      title: "Vật tư / Thiết bị",
      key: "name",
      render: (_, r) => r.productName || r.equipmentName || "-",
    },
    {
      title: "Đơn vị",
      dataIndex: "unitName",
      width: 80,
    },
    {
      title: "Đề xuất",
      dataIndex: "recommendedQuantity",
      width: 100,
      align: "right",
    },
    {
      title: "Thực tế",
      key: "actualQuantity",
      width: 120,
      render: (_, r) =>
        r.isDeducted ? (
          <Tag color="green">{r.actualQuantity}</Tag>
        ) : (
          <InputNumber
            size="small"
            min={0}
            step={0.01}
            value={
              editedQuantities[r.id] !== undefined
                ? editedQuantities[r.id]
                : r.actualQuantity
            }
            onChange={(v) => handleQuantityChange(r.id, v)}
            style={{ width: "100%" }}
          />
        ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 100,
      render: (_, r) =>
        r.isDeducted ? (
          <Tag color="green">Đã trừ</Tag>
        ) : (
          <Tag color="orange">Chưa trừ</Tag>
        ),
    },
  ];

  const allDeducted = consumptions.every((c) => c.isDeducted);

  return (
    <Modal
      title="Xác nhận tiêu hao vật tư"
      open={open}
      onCancel={onClose}
      onOk={handleConfirm}
      confirmLoading={loading}
      okText="Xác nhận & trừ kho"
      cancelText="Đóng"
      okButtonProps={{ disabled: allDeducted || consumptions.length === 0 }}
      width={700}
    >
      {allDeducted && (
        <Alert
          message="Tất cả tiêu hao đã được trừ kho"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Table
        columns={columns}
        dataSource={consumptions}
        rowKey="id"
        size="small"
        pagination={false}
      />
    </Modal>
  );
};

export default ConsumptionModal;
