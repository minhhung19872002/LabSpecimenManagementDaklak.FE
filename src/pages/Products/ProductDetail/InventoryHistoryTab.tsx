import React, { useState, useCallback, useEffect } from "react";
import { Table, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  stockAdjustmentService,
  StockAdjustmentListDto,
  StockAdjustmentStatus,
  StockAdjustmentStatusColors,
  StockAdjustmentStatusLabels,
} from "../../../services/stockAdjustmentService";
import { PATH_ROUTES } from "../../../constants/routes";
import { QUANTITY_FORMAT } from "../../../utils/formatters";

const { Link } = Typography;

export interface InventoryHistoryTabProps {
  warehouseId?: string;
  productId?: string;
}

const formatSigned = (value: number, unit?: string | null) => {
  const text = Math.abs(value).toLocaleString("vi-VN", QUANTITY_FORMAT);
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${text}${unit ? ` ${unit}` : ""}`;
};

const renderAdjustment = (record: StockAdjustmentListDto) => {
  if (record.status !== StockAdjustmentStatus.Confirmed || record.adjustmentDiffBase == null) return "—";
  const volume = record.adjustmentDiffVolume;
  const sign = volume ?? record.adjustmentDiffBase;
  const color = sign > 0 ? "#389e0d" : sign < 0 ? "#cf1322" : undefined;
  const parts = record.adjustmentDiffByUnit?.length
    ? record.adjustmentDiffByUnit
    : [{ quantity: record.adjustmentDiffBase, unitName: record.storageUnitName }];
  return (
    <span style={{ color }}>
      {parts.map((part) => formatSigned(part.quantity, part.unitName)).join(", ")}
      {volume != null && record.volumeUnitName ? ` / ${formatSigned(volume, record.volumeUnitName)}` : ""}
    </span>
  );
};

const InventoryHistoryTab: React.FC<InventoryHistoryTabProps> = ({ warehouseId, productId }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<StockAdjustmentListDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const result = await stockAdjustmentService.getList({
        page,
        limit: pageSize,
        warehouseId,
        productId,
      });
      setData(result.items || []);
      setTotal(result.totalCount || 0);
    } catch {
      // silent — parent page already has error handling context
    } finally {
      setLoading(false);
    }
  }, [warehouseId, productId, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    {
      title: "STT",
      width: 55,
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "ID phiếu kiểm kê",
      dataIndex: "code",
      width: 180,
      render: (code: string, record: StockAdjustmentListDto) => (
        <Link
          onClick={() =>
            navigate(PATH_ROUTES.stockAdjustments.detail(record.id), {
              state: { mode: "view" },
            })
          }
        >
          {code}
        </Link>
      ),
    },
    {
      title: "Ngày kiểm kê",
      dataIndex: "inventoryDate",
      width: 130,
      render: (val: string) => (val ? dayjs(val).format("DD/MM/YYYY") : "—"),
    },
    ...(productId
      ? [{
          title: "Lượng điều chỉnh",
          key: "adjustment",
          width: 200,
          render: (_: unknown, record: StockAdjustmentListDto) => renderAdjustment(record),
        }]
      : []),
    {
      title: "Nhân viên kiểm kê",
      dataIndex: "inventoryUserName",
      width: 180,
      render: (val: string) => val || "—",
    },
    {
      title: "Người tạo phiếu",
      dataIndex: "creatorName",
      width: 180,
      render: (val: string) => val || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      render: (status: number) => (
        <Tag color={StockAdjustmentStatusColors[status]}>
          {StockAdjustmentStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo phiếu",
      dataIndex: "creationTime",
      width: 160,
      render: (val: string) => dayjs(val).format("DD/MM/YYYY HH:mm"),
    },
  ];

  if (!warehouseId) {
    return (
      <div style={{ padding: "16px 0", color: "#8c8c8c" }}>
        Vui lòng chọn kho để xem lịch sử kiểm kê.
      </div>
    );
  }

  return (
    <Table
      loading={loading}
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      scroll={{ x: 900 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t) => `Tổng ${t} phiếu`,
        onChange: (p, ps) => {
          setPage(p);
          setPageSize(ps);
        },
      }}
    />
  );
};

export default InventoryHistoryTab;
