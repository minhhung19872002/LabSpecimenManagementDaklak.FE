import React from "react";
import { Space, Segmented, Select } from "antd";
import { SortAscendingOutlined } from "@ant-design/icons";
import { ProductLotStockDto } from "../../../services/productService";
import { getLotStatus, LotStatus, LOT_STATUS_CONFIG } from "./utils";

export type StatusFilter = "all" | LotStatus;
export type SortOrder = "fefo" | "most-stock";
export type TimeRange = "7d" | "30d" | "all";

export interface LotStockFilterBarProps {
  lots: ProductLotStockDto[];
  statusFilter: StatusFilter;
  sortOrder: SortOrder;
  timeRange: TimeRange;
  onStatusFilterChange: (v: StatusFilter) => void;
  onSortOrderChange: (v: SortOrder) => void;
  onTimeRangeChange: (v: TimeRange) => void;
  nearExpiryDays?: number;
}

const LotStockFilterBar: React.FC<LotStockFilterBarProps> = ({
  lots,
  statusFilter,
  sortOrder,
  timeRange,
  onStatusFilterChange,
  onSortOrderChange,
  onTimeRangeChange,
  nearExpiryDays,
}) => {
  const counts: Record<StatusFilter, number> = { all: lots.length, ok: 0, near: 0, expired: 0, empty: 0 };
  lots.forEach((l) => { counts[getLotStatus(l, nearExpiryDays)]++; });

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `Tất cả (${counts.all})` },
    { value: "ok", label: `${LOT_STATUS_CONFIG.ok.label} (${counts.ok})` },
    { value: "near", label: `${LOT_STATUS_CONFIG.near.label} (${counts.near})` },
    { value: "expired", label: `${LOT_STATUS_CONFIG.expired.label} (${counts.expired})` },
    { value: "empty", label: `${LOT_STATUS_CONFIG.empty.label} (${counts.empty})` },
  ];

  return (
    <div className="lot-filter-bar">
      <div className="lot-filter-bar__status">
        {statusOptions.map((opt) => {
          const active = statusFilter === opt.value;
          const cfg = opt.value === "all"
            ? { color: "#096DD9", bg: "#E6F7FF", border: "#91d5ff" }
            : LOT_STATUS_CONFIG[opt.value];
          return (
            <span
              key={opt.value}
              className={`lot-filter-chip${active ? " lot-filter-chip--active" : ""}`}
              style={active ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : undefined}
              onClick={() => onStatusFilterChange(opt.value)}
            >
              {opt.label}
            </span>
          );
        })}
      </div>
      <Space size={12} wrap>
        <Segmented
          value={timeRange}
          onChange={(v) => onTimeRangeChange(v as TimeRange)}
          options={[
            { label: "7 Ngày", value: "7d" },
            { label: "30 Ngày", value: "30d" },
            { label: "Tất cả", value: "all" },
          ]}
        />
        <Select
          value={sortOrder}
          onChange={onSortOrderChange}
          prefix={<SortAscendingOutlined />}
        >
          <Select.Option value="fefo">HSD gần nhất</Select.Option>
          <Select.Option value="most-stock">Tồn nhiều nhất</Select.Option>
        </Select>
      </Space>
    </div>
  );
};

export default LotStockFilterBar;
