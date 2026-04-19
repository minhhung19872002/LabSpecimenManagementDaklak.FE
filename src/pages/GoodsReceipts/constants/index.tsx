import { Tag, Tooltip, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  GoodsReceiptListDto,
  GoodsReceiptOrderStatus,
  WarehouseStatusLabels,
  WarehouseStatusColors,
  OrderStatusLabels,
  OrderStatusColors,
  PaymentStatusLabels,
  PaymentStatusColors,
} from "../../../services/goodsReceiptService";
import dayjs from "dayjs";

export interface ColumnConfig {
  key: string;
  title: string;
  defaultVisible: boolean;
}

export const ALL_COLUMNS: ColumnConfig[] = [
  { key: "code", title: "ID đặt hàng", defaultVisible: true },
  { key: "supplierName", title: "Tên nhà cung cấp", defaultVisible: true },
  { key: "documentDate", title: "Ngày cấp chứng từ", defaultVisible: true },
  { key: "warehouseStatus", title: "Trạng thái kho", defaultVisible: true },
  { key: "orderStatus", title: "Trạng thái đơn", defaultVisible: true },
  { key: "paymentStatus", title: "Trạng thái thanh toán", defaultVisible: true },
  { key: "totalAmountAfterVat", title: "Tổng tiền sau VAT", defaultVisible: true },
  { key: "creatorName", title: "Người tạo", defaultVisible: true },
  { key: "notes", title: "Ghi chú", defaultVisible: true },
];

const formatCurrency = (value?: number) => {
  if (value == null) return "-";
  return value.toLocaleString("vi-VN") + " VNĐ";
};

export const getGoodsReceiptColumns = (
  visibleKeys: Set<string>,
  handleView: (record: GoodsReceiptListDto) => void,
  handleEdit: (record: GoodsReceiptListDto) => void,
  handleDelete: (record: GoodsReceiptListDto) => void,
  canEdit: boolean,
  canDelete: boolean,
  currentPage: number,
  pageSize: number
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

  if (visibleKeys.has("supplierName")) {
    columns.push({
      title: "Tên nhà cung cấp",
      dataIndex: "supplierName",
      key: "supplierName",
      width: 220,
      ellipsis: true,
      sorter: true,
    });
  }

  if (visibleKeys.has("documentDate")) {
    columns.push({
      title: "Ngày cấp chứng từ",
      dataIndex: "documentDate",
      key: "documentDate",
      width: 150,
      sorter: true,
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "-"),
    });
  }

  if (visibleKeys.has("warehouseStatus")) {
    columns.push({
      title: "Trạng thái kho",
      dataIndex: "warehouseStatus",
      key: "warehouseStatus",
      width: 140,
      align: "center" as const,
      render: (v: number) => (
        <Tag color={WarehouseStatusColors[v]}>{WarehouseStatusLabels[v]}</Tag>
      ),
    });
  }

  if (visibleKeys.has("orderStatus")) {
    columns.push({
      title: "Trạng thái đơn",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 130,
      align: "center" as const,
      render: (v: number) => (
        <Tag color={OrderStatusColors[v]}>{OrderStatusLabels[v]}</Tag>
      ),
    });
  }

  if (visibleKeys.has("paymentStatus")) {
    columns.push({
      title: "Trạng thái thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 170,
      align: "center" as const,
      render: (v: number) => (
        <Tag color={PaymentStatusColors[v]}>{PaymentStatusLabels[v]}</Tag>
      ),
    });
  }

  if (visibleKeys.has("totalAmountAfterVat")) {
    columns.push({
      title: "Tổng tiền sau VAT",
      dataIndex: "totalAmountAfterVat",
      key: "totalAmountAfterVat",
      width: 170,
      align: "right" as const,
      sorter: true,
      render: (v: number) => formatCurrency(v),
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
        {canEdit && record.orderStatus === GoodsReceiptOrderStatus.Draft && (
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        )}
        {canDelete && record.warehouseStatus === 0 && (
          <Tooltip title="Xóa">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        )}
      </Space>
    ),
  });

  return columns;
};

export const COLUMN_VISIBILITY_KEY = "goods-receipt-visible-columns";
