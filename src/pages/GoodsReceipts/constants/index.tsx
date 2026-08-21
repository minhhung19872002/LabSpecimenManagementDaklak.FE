import { Tag, Tooltip, Button, Space } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  GoodsReceiptListDto,
  GoodsReceiptOrderStatus,
  GoodsReceiptWarehouseStatus,
  OrderStatusLabels,
  OrderStatusColors,
} from "../../../services/goodsReceiptService";
import dayjs from "dayjs";

export interface ColumnConfig {
  key: string;
  title: string;
  defaultVisible: boolean;
}

export const ALL_COLUMNS: ColumnConfig[] = [
  { key: "code", title: "ID đặt hàng", defaultVisible: true },
  { key: "expectedDeliveryDate", title: "Ngày cần hàng", defaultVisible: true },
  { key: "orderStatus", title: "Trạng thái", defaultVisible: true },
  { key: "creatorName", title: "Người tạo", defaultVisible: true },
  { key: "notes", title: "Ghi chú", defaultVisible: true },
];

export const getGoodsReceiptColumns = (
  visibleKeys: Set<string>,
  handleView: (record: GoodsReceiptListDto) => void,
  handleEdit: (record: GoodsReceiptListDto) => void,
  _handleDelete: (record: GoodsReceiptListDto) => void,
  canEdit: boolean,
  _canDelete: boolean,
  currentPage: number,
  pageSize: number,
  handleCancel?: (record: GoodsReceiptListDto) => void,
  canCancel?: boolean
): ColumnsType<GoodsReceiptListDto> => {
  const columns: ColumnsType<GoodsReceiptListDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: any, __: GoodsReceiptListDto, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
  ];

  if (visibleKeys.has("code")) {
    columns.push({
      title: "ID đặt hàng",
      dataIndex: "code",
      key: "code",
      width: 160,
      ellipsis: true,
      sorter: true,
    });
  }

  if (visibleKeys.has("expectedDeliveryDate")) {
    columns.push({
      title: "Ngày cần hàng",
      dataIndex: "expectedDeliveryDate",
      key: "expectedDeliveryDate",
      width: 140,
      sorter: true,
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "-"),
    });
  }

  if (visibleKeys.has("orderStatus")) {
    columns.push({
      title: "Trạng thái",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 160,
      align: "center" as const,
      render: (v: number) => (
        <Tag color={OrderStatusColors[v]} style={{ whiteSpace: "pre-line" }}>
          {v === GoodsReceiptOrderStatus.WaitingReceipt
            ? "Chờ nhận\n& Nghiệm thu"
            : OrderStatusLabels[v]}
        </Tag>
      ),
    });
  }

  if (visibleKeys.has("creatorName")) {
    columns.push({
      title: "Người tạo",
      dataIndex: "creatorName",
      key: "creatorName",
      width: 130,
      render: (v: string) => v || "-",
    });
  }

  if (visibleKeys.has("notes")) {
    columns.push({
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 200,
      ellipsis: true,
      render: (v: string) => v || "-",
    });
  }

  columns.push({
    title: "Thao tác",
    key: "actions",
    width: 120,
    align: "center" as const,
    fixed: "right" as const,
    render: (_: any, record: GoodsReceiptListDto) => (
      <Space size={0}>
        <Tooltip title="Xem">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          />
        </Tooltip>
        {canEdit &&
          record.warehouseStatus === GoodsReceiptWarehouseStatus.NotImported &&
          record.orderStatus !== GoodsReceiptOrderStatus.PendingApproval &&
          record.orderStatus !== GoodsReceiptOrderStatus.Rejected &&
          record.orderStatus !== GoodsReceiptOrderStatus.Cancelled && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
        {canCancel &&
          record.orderStatus !== GoodsReceiptOrderStatus.Cancelled &&
          !(record.orderStatus === GoodsReceiptOrderStatus.Completed &&
            record.warehouseStatus === GoodsReceiptWarehouseStatus.Imported) && (
            <Tooltip title="Hủy đặt hàng">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancel?.(record)}
              />
            </Tooltip>
          )}
      </Space>
    ),
  });

  return columns;
};

export const COLUMN_VISIBILITY_KEY = "goods-receipt-visible-columns";
