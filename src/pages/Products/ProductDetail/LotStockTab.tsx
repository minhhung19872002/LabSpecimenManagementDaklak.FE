import React, { useState, useMemo } from "react";
import { Alert, Empty, Spin } from "antd";
import { ProductLotStockDto } from "../../../services/productService";
import { getLotStatus, getLotVolumeQty } from "./utils";
import LotStockFilterBar, {
  StatusFilter,
  SortOrder,
  TimeRange,
} from "./LotStockFilterBar";
import LotStockCard from "./LotStockCard";

export interface LotStockTabProps {
  lots: ProductLotStockDto[];
  lotsLoading: boolean;
  productId: string;
  warehouseId?: string;
}

const LotStockTab: React.FC<LotStockTabProps> = ({
  lots,
  lotsLoading,
  productId,
  warehouseId,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("fefo");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  const filtered = useMemo(() => {
    let result = lots;
    if (statusFilter !== "all") {
      result = result.filter((l) => getLotStatus(l) === statusFilter);
    }
    result = [...result];
    if (sortOrder === "most-stock") {
      result.sort((a, b) => getLotVolumeQty(b) - getLotVolumeQty(a));
    }
    return result;
  }, [lots, statusFilter, sortOrder]);

  const firstUsableLotNumber = useMemo(() => {
    const usable = lots.find(
      (l) => getLotStatus(l) === "ok" || getLotStatus(l) === "near"
    );
    return usable?.lotNumber;
  }, [lots]);

  if (!warehouseId) {
    return (
      <Alert
        type="info"
        showIcon
        message="Chọn kho để xem tồn kho theo lô"
        description="Vui lòng truy cập từ trang danh sách vật tư của một kho cụ thể để xem thông tin tồn kho theo lô."
        style={{ margin: "24px 0" }}
      />
    );
  }

  return (
    <Spin spinning={lotsLoading}>
      <LotStockFilterBar
        lots={lots}
        statusFilter={statusFilter}
        sortOrder={sortOrder}
        timeRange={timeRange}
        onStatusFilterChange={setStatusFilter}
        onSortOrderChange={setSortOrder}
        onTimeRangeChange={setTimeRange}
      />

      <Alert
        type="info"
        showIcon={false}
        message="Tồn của mỗi lô được tính độc lập trong phạm vi lô đó. Bấm vào thẻ lô để xem lịch sử sử dụng."
        className="lot-info-alert"
        style={{ marginBottom: 12 }}
      />

      {filtered.length === 0 && !lotsLoading ? (
        <Empty description="Không có lô nào" style={{ padding: "40px 0" }} />
      ) : (
        <div className="lot-card-list">
          {filtered.map((lot, idx) => (
            <LotStockCard
              key={lot.lotNumber || `lot-${idx}`}
              lot={lot}
              productId={productId}
              warehouseId={warehouseId}
              timeRange={timeRange}
              isNextFEFO={lot.lotNumber === firstUsableLotNumber}
            />
          ))}
        </div>
      )}
    </Spin>
  );
};

export default LotStockTab;
