import React, { useState, useEffect } from "react";
import { Modal, Collapse, Table, Tag, Tooltip, Button, Spin } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  warehouseImportReceiptService,
  WarehouseImportReceiptHistoryDto,
  WarehouseImportReceiptHistoryItemDto,
  WarehouseImportLineStatus,
  WarehouseImportLineStatusLabels,
  WarehouseImportLineStatusColors,
} from "../../../services/warehouseImportReceiptService";
import { truncateMiddle } from "../../../utils/fileUtils";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const formatCurrency = (v?: number) =>
  v != null ? `${new Intl.NumberFormat("vi-VN").format(v)} đ` : "-";

export interface ImportHistoryModalProps {
  open: boolean;
  onClose: () => void;
  goodsReceiptId: string;
}

const ImportHistoryModal: React.FC<ImportHistoryModalProps> = ({
  open,
  onClose,
  goodsReceiptId,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WarehouseImportReceiptHistoryDto[]>([]);

  useEffect(() => {
    if (!open || !goodsReceiptId) return;
    setLoading(true);
    warehouseImportReceiptService
      .getByGoodsReceiptId(goodsReceiptId)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [open, goodsReceiptId]);

  const columns: ColumnsType<WarehouseImportReceiptHistoryItemDto> = [
    {
      title: "STT",
      key: "index",
      width: 50,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "productName",
      key: "productName",
      width: 180,
    },
    {
      title: "ĐVT",
      key: "unitName",
      width: 80,
      render: (_, record) => (
        <div>
          <div>{record.unitName || "-"}</div>
          {record.purchaseUnitName && record.purchaseUnitName !== record.unitName && (
            <div style={{ fontSize: 11, color: "#888" }}>{record.purchaseUnitName}</div>
          )}
        </div>
      ),
    },
    {
      title: "SL đặt",
      dataIndex: "orderedQuantity",
      key: "orderedQuantity",
      width: 80,
      align: "center",
    },
    {
      title: "SL nhận thực tế",
      dataIndex: "actualReceivedQuantity",
      key: "actualReceivedQuantity",
      width: 100,
      align: "center",
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturerName",
      key: "manufacturerName",
      width: 120,
      render: (v?: string) => v || "-",
    },
    {
      title: "Số lô",
      dataIndex: "lotNumber",
      key: "lotNumber",
      width: 110,
      render: (v?: string) => v || "-",
    },
    {
      title: "Hạn sử dụng",
      dataIndex: "lotExpiryDate",
      key: "lotExpiryDate",
      width: 110,
      render: (v?: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Kho lưu trữ",
      dataIndex: "storageWarehouseName",
      key: "storageWarehouseName",
      width: 130,
      render: (v?: string) => v || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: WarehouseImportLineStatus) => (
        <Tag color={WarehouseImportLineStatusColors[status]}>
          {WarehouseImportLineStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: "COA",
      key: "qualityDocument",
      width: 150,
      render: (_, record) =>
        record.qualityDocumentFileId ? (
          <Tooltip title={record.qualityDocumentFileName}>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              style={{ maxWidth: "100%", padding: 0 }}
              onClick={() =>
                window.open(
                  `${baseUrl}/api/v1/files/${record.qualityDocumentFileId}`,
                  "_blank"
                )
              }
            >
              <span style={{ verticalAlign: "middle" }}>
                {truncateMiddle(record.qualityDocumentFileName || "")}
              </span>
            </Button>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      align: "right",
      render: (v?: number) => formatCurrency(v),
    },
    {
      title: "VAT",
      dataIndex: "vatPercent",
      key: "vatPercent",
      width: 60,
      align: "center",
      render: (v?: number) => (v != null ? `${v}%` : "-"),
    },
    {
      title: "Thành tiền",
      dataIndex: "totalLineAmount",
      key: "totalLineAmount",
      width: 140,
      align: "right",
      render: (v?: number) => formatCurrency(v),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 140,
      render: (v?: string) => v || "-",
    },
  ];

  return (
    <Modal
      title="Lịch sử nhập hàng"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
          Chưa có lịch sử nhập hàng
        </div>
      ) : (
        <Collapse
          defaultActiveKey={data.map((r) => r.id)}
          items={data.map((receipt) => ({
            key: receipt.id,
            label: (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Tag color="blue">{receipt.code}</Tag>
                <Tag color="green">{formatCurrency(receipt.totalAmount)}</Tag>
              </div>
            ),
            children: (
              <Table
                columns={columns}
                dataSource={receipt.items}
                rowKey="id"
                pagination={false}
                scroll={{ x: 1800 }}
                size="small"
                bordered
              />
            ),
          }))}
        />
      )}
    </Modal>
  );
};

export default ImportHistoryModal;
