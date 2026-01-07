import React, { useState, useEffect } from "react";
import { Modal, Table, Tag, Empty, Spin, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { testRequestService } from "../../../services/testRequestService";
import {
  CostChangeHistoryDto,
  CostChangeType,
  CostChangeTypeLabels,
} from "../../../types/testRequest";

const { Text } = Typography;

interface CostChangeHistoryModalProps {
  open: boolean;
  onClose: () => void;
  testRequestId: string;
}

const CostChangeHistoryModal: React.FC<CostChangeHistoryModalProps> = ({
  open,
  onClose,
  testRequestId,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CostChangeHistoryDto[]>([]);

  useEffect(() => {
    if (open && testRequestId) {
      loadData();
    }
  }, [open, testRequestId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await testRequestService.getCostChangeHistory(testRequestId);
      setData(result);
    } catch (error) {
      console.error("Error loading cost change history:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeColor = (type: CostChangeType): string => {
    switch (type) {
      case CostChangeType.IndicatorCancelled:
        return "red";
      case CostChangeType.MethodChanged:
        return "orange";
      case CostChangeType.SampleCancelled:
        return "volcano";
      case CostChangeType.ManualAdjustment:
        return "blue";
      default:
        return "default";
    }
  };

  const columns: ColumnsType<CostChangeHistoryDto> = [
    {
      title: "Thời gian",
      dataIndex: "creationTime",
      key: "creationTime",
      width: 150,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Loại thay đổi",
      dataIndex: "changeType",
      key: "changeType",
      width: 150,
      render: (type: CostChangeType) => (
        <Tag color={getChangeTypeColor(type)}>
          {CostChangeTypeLabels[type] || "Không xác định"}
        </Tag>
      ),
    },
    {
      title: "Tiền cũ",
      dataIndex: "oldTotalCost",
      key: "oldTotalCost",
      width: 130,
      align: "right",
      render: (value: number) => (
        <Text>{(value || 0).toLocaleString("vi-VN")} đ</Text>
      ),
    },
    {
      title: "Tiền mới",
      dataIndex: "newTotalCost",
      key: "newTotalCost",
      width: 130,
      align: "right",
      render: (value: number) => (
        <Text strong>{(value || 0).toLocaleString("vi-VN")} đ</Text>
      ),
    },
    {
      title: "Chênh lệch",
      dataIndex: "differenceAmount",
      key: "differenceAmount",
      width: 130,
      align: "right",
      render: (value: number) => {
        const isNegative = value < 0;
        return (
          <Text type={isNegative ? "danger" : "success"} strong>
            {isNegative ? "" : "+"}
            {(value || 0).toLocaleString("vi-VN")} đ
          </Text>
        );
      },
    },
    {
      title: "Chỉ tiêu ảnh hưởng",
      dataIndex: "affectedIndicatorName",
      key: "affectedIndicatorName",
      width: 200,
      ellipsis: true,
      render: (name: string, record: CostChangeHistoryDto) => {
        if (!name) return "-";
        return (
          <span>
            {name}
            {record.indicatorUnitPrice && (
              <Text type="secondary" style={{ marginLeft: 4 }}>
                ({record.indicatorUnitPrice.toLocaleString("vi-VN")} đ)
              </Text>
            )}
          </span>
        );
      },
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      render: (value: string) => value || "-",
    },
    {
      title: "Người thực hiện",
      dataIndex: "creatorName",
      key: "creatorName",
      width: 150,
      render: (value: string) => value || "-",
    },
  ];

  return (
    <Modal
      title="Lịch sử thay đổi tiền"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : data.length === 0 ? (
        <Empty
          description="Chưa có lịch sử thay đổi tiền"
          style={{ padding: "40px 0" }}
        />
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1100 }}
          size="small"
          bordered
        />
      )}
    </Modal>
  );
};

export default CostChangeHistoryModal;
