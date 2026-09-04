import React, { useMemo } from "react";
import { Spin } from "antd";
import { ProductLotStockDto } from "../../../services/productService";
import { getLotStatus, getLotVolumeQty, getLotVolumeUnit, getNextFefoLot } from "./utils";

const LOT_PALETTE = [
  "#1a5fd0", "#2f9e6b", "#e8a83a", "#7c6bd6", "#4aa3c7",
  "#d65b8a", "#8aba5e", "#c77a4a", "#3db5a6", "#c45454",
  "#6a8fd8", "#b5a026", "#9b59b6", "#e67e22", "#1abc9c",
  "#8e44ad", "#2980b9", "#d4a017", "#c0392b", "#27ae60",
];

export interface StockSummaryPanelProps {
  lots: ProductLotStockDto[];
  loading: boolean;
  warehouseId?: string;
}

const StockSummaryPanel: React.FC<StockSummaryPanelProps> = ({
  lots,
  loading,
  warehouseId,
}) => {
  const stats = useMemo(() => {
    let totalAvailable = 0;
    let usableCount = 0;
    let nearCount = 0;
    let expiredCount = 0;
    let expiredVolume = 0;
    let unit = "";
    const usableLots: ProductLotStockDto[] = [];

    const segments: { lotNo: string; volume: number; color: string }[] = [];

    let segIdx = 0;
    lots.forEach((l) => {
      const status = getLotStatus(l);
      const vol = getLotVolumeQty(l);
      if (!unit) unit = getLotVolumeUnit(l);

      if (status === "ok" || status === "near") {
        totalAvailable += vol;
        usableCount++;
        usableLots.push(l);
      }
      if (status === "near") nearCount++;
      if (status === "expired") {
        expiredCount++;
        expiredVolume += vol;
      }

      if (l.remainingBaseQuantity > 0) {
        segments.push({
          lotNo: l.lotNumber || "—",
          volume: vol,
          color: LOT_PALETTE[segIdx % LOT_PALETTE.length],
        });
        segIdx++;
      }
    });

    // "Lô tiếp theo" theo quy tắc BA (xem getNextFefoLot trong utils)
    const nextLot = getNextFefoLot(usableLots);

    const totalVolume = segments.reduce((s, seg) => s + seg.volume, 0);
    const segmentsWithPct = segments.map((seg) => ({
      ...seg,
      pct: totalVolume > 0 ? Math.max(2, (seg.volume / totalVolume) * 100) : 0,
    }));

    return {
      totalAvailable,
      usableCount,
      nearCount,
      expiredCount,
      expiredVolume,
      unit,
      nextLot,
      segments: segmentsWithPct,
      totalLots: lots.length,
    };
  }, [lots]);

  if (!warehouseId) {
    return (
      <div className="detail-section">
        <div className="detail-section-title">Tồn kho tổng hợp</div>
        <div style={{ color: "rgba(0,0,0,0.45)", fontSize: 13, padding: "8px 0" }}>
          Chọn kho để xem tồn kho
        </div>
      </div>
    );
  }

  return (
    <div className="detail-section stock-summary-panel">
      <Spin spinning={loading}>
        <div className="stock-summary__header">
          <span className="stock-summary__label">Tồn kho khả dụng</span>
        </div>

        <div className="stock-summary__value-row">
          <span className="stock-summary__big-number">
            {stats.totalAvailable.toLocaleString("vi-VN")}
          </span>
          <span className="stock-summary__unit">{stats.unit}</span>
        </div>
        <div className="stock-summary__sub-text">
          {stats.totalLots} lô &middot; {stats.usableCount} lô còn tồn
        </div>

        {stats.segments.length > 0 && (
          <>
            <div className="stock-summary__bar">
              {stats.segments.map((seg, i) => (
                <div
                  key={i}
                  style={{ width: `${seg.pct}%`, background: seg.color }}
                />
              ))}
            </div>
            <div className="stock-summary__legend">
              {stats.segments.map((seg, i) => (
                <div key={i} className="stock-summary__legend-item">
                  <span className="stock-summary__legend-dot" style={{ background: seg.color }} />
                  <strong>{seg.lotNo}</strong>
                  <span>{seg.volume.toLocaleString("vi-VN")} {stats.unit}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="stock-summary__counts">
          <div className="stock-summary__count-box">
            <div className="stock-summary__count-label">Lô còn tồn</div>
            <div className="stock-summary__count-value">{stats.usableCount}</div>
          </div>
          <div className="stock-summary__count-box stock-summary__count-box--near">
            <div className="stock-summary__count-label">Sắp hết hạn</div>
            <div className="stock-summary__count-value">{stats.nearCount}</div>
          </div>
        </div>

        {stats.expiredCount > 0 && (
          <div className="stock-summary__expired-row">
            <span>Hết hạn &middot; chờ huỷ</span>
            <span>
              {stats.expiredCount} lô &middot; {stats.expiredVolume.toLocaleString("vi-VN")} {stats.unit}
            </span>
          </div>
        )}

        {stats.nextLot && (
          <div className="stock-summary__fefo-row">
            <span>Lô tiếp theo &middot; FEFO</span>
            <span>{stats.nextLot.lotNumber || "Không có số lô"}</span>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default StockSummaryPanel;
