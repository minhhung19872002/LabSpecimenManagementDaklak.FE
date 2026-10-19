import React, { useState, useEffect } from "react";
import { Modal, Table, Tag, Empty, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { testRequestService } from "../../../services/testRequestService";
import {
  TestRequestDeliveryHistoryDto,
  TestRequestStatus,
  TestRequestStatusLabels,
} from "../../../types/testRequest";

interface DeliveryHistoryModalProps {
  open: boolean;
  onClose: () => void;
  testRequestId: string;
}

const DeliveryHistoryModal: React.FC<DeliveryHistoryModalProps> = ({
  open,
  onClose,
  testRequestId,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDeliveryHistoryDto[]>([]);

  useEffect(() => {
    if (open && testRequestId) {
      loadData();
    }
  }, [open, testRequestId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await testRequestService.getDeliveryHistories(testRequestId);
      setData(result);
    } catch (error) {
      console.error("Error loading delivery histories:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<TestRequestDeliveryHistoryDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: TestRequestDeliveryHistoryDto, index: number) =>
        data.length - index,
    },
    {
      title: "Ngày in",
      dataIndex: "printedDate",
      key: "printedDate",
      width: 170,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm:ss") : "-",
    },
    {
      title: "Người in",
      dataIndex: "printedByUserName",
      key: "printedByUserName",
      render: (value: string) => value || "-",
    },
    {
      title: "Trạng thái lúc in",
      dataIndex: "statusAfter",
      key: "statusAfter",
      width: 200,
      render: (status: TestRequestStatus) => (
        <Tag color={status === TestRequestStatus.Completed ? "green" : "blue"}>
          {TestRequestStatusLabels[status] || "-"}
        </Tag>
      ),
    },
  ];

  return (
    <Modal
      title="Lịch sử in phiếu bàn giao"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : data.length === 0 ? (
        <Empty
          description="Chưa in phiếu bàn giao lần nào"
          style={{ padding: "40px 0" }}
        />
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
        />
      )}
    </Modal>
  );
};

export default DeliveryHistoryModal;
