import React, { useState, useCallback, useEffect, useRef } from "react";
import { Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import {
  productService,
  ProductLotStockDto,
  ProductUsageLogItemDto,
} from "../../../services/productService";
import {
  getLotStatus,
  getLotCountdownText,
  formatLotBaseQty,
  getLotVolumeQty,
  getLotVolumeUnit,
  formatLotUsagePercent,
  LOT_STATUS_CONFIG,
  LOT_BAR_COLORS,
} from "./utils";
import type { TimeRange } from "./LotStockFilterBar";
import { QUANTITY_FORMAT } from "../../../utils/formatters";

const { Text } = Typography;

export interface LotStockCardProps {
  lot: ProductLotStockDto;
  productId: string;
  warehouseId?: string;
  timeRange: TimeRange;
  isNextFEFO: boolean;
}

function buildDateRange(range: TimeRange): [Dayjs, Dayjs] | null {
  if (range === "7d") return [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")];
  if (range === "30d") return [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")];
  return null;
}

const LotStockCard: React.FC<LotStockCardProps> = ({
  lot,
  productId,
  warehouseId,
  timeRange,
  isNextFEFO,
}) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [items, setItems] = useState<ProductUsageLogItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const status = getLotStatus(lot);
  const statusCfg = LOT_STATUS_CONFIG[status];
  const barColor = LOT_BAR_COLORS[status];
  const volumeUnit = getLotVolumeUnit(lot);
  const remainingVolume = getLotVolumeQty(lot);

  const loadUsage = useCallback(
    (currentPage: number) => {
      const lotNumber = lot.lotNumber;
      if (!lotNumber) return;
      const range = buildDateRange(timeRange);
      setLoading(true);
      productService
        .getUsageLog(productId, {
          lotNumber,
          warehouseId,
          skipCount: (currentPage - 1) * pageSize,
          maxResultCount: pageSize,
          dateFrom: range?.[0]?.toISOString(),
          dateTo: range?.[1]?.toISOString(),
        })
        .then((result) => {
          setItems(result.items);
          setTotalCount(result.totalCount);
        })
        .catch(() => { setItems([]); setTotalCount(0); })
        .finally(() => setLoading(false));
    },
    [productId, warehouseId, lot.lotNumber, timeRange]
  );

  const prevTimeRange = useRef(timeRange);
  useEffect(() => {
    if (detailOpen && prevTimeRange.current !== timeRange) {
      setPage(1);
      loadUsage(1);
    }
    prevTimeRange.current = timeRange;
  }, [timeRange, detailOpen, loadUsage]);

  const handleDetailToggle = () => {
    if (!detailOpen) {
      setPage(1);
      loadUsage(1);
    }
    setDetailOpen((v) => !v);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    loadUsage(p);
  };

  const columns: ColumnsType<ProductUsageLogItemDto> = [
    {
      title: "Thời gian",
      dataIndex: "resultSubmissionDate",
      width: 130,
      render: (v) => (v ? dayjs(v).format("DD/MM/YY HH:mm") : "—"),
    },
    { title: "Mã mẫu", dataIndex: "sampleCode", width: 110, render: (v) => v || "—" },
    { title: "Barcode", dataIndex: "barcodeCode", width: 220, ellipsis: true, render: (v) => v || "—" },
    { title: "Chỉ tiêu", dataIndex: "indicatorName", ellipsis: true, render: (v) => v || "—" },
    { title: "Người TH", dataIndex: "technicianName", width: 130, render: (v) => v || "—" },
    {
      title: "Tiêu hao",
      dataIndex: "consumptionAmount",
      width: 100,
      align: "right",
      render: (_, r) =>
        r.consumptionAmount != null
          ? <Text type="danger">{`-${r.consumptionAmount} ${r.consumptionUnitName || ""}`.trim()}</Text>
          : "—",
    },
    {
      title: "Tồn của lô",
      dataIndex: "consumableStockBefore",
      width: 120,
      align: "right",
      render: (_, r) =>
        r.consumableStockBefore != null
          ? <Text strong>{`${r.consumableStockBefore.toLocaleString("vi-VN", QUANTITY_FORMAT)} ${r.consumableStockUnitName || ""}`.trim()}</Text>
          : "—",
    },
  ];

  const theoreticalVol = lot.volumePerUnit && lot.volumePerUnit > 0
    ? lot.theoreticalConsumption * lot.volumePerUnit
    : lot.theoreticalConsumption;
  const openingBaseQty = lot.openingBaseQuantity;
  const openingVolume = lot.volumePerUnit && lot.volumePerUnit > 0
    ? openingBaseQty * lot.volumePerUnit
    : openingBaseQty;
  // Tồn cuối kỳ dự kiến = đầu kỳ - tiêu hao (có thể âm nếu tiêu hao vượt quá tồn)
  const closingBaseQty = openingBaseQty - lot.theoreticalConsumption;
  const closingVolume = openingVolume - theoreticalVol;
  const usedPct = openingVolume > 0
    ? Math.min(100, (theoreticalVol / openingVolume) * 100)
    : 0;
  const usagePct = formatLotUsagePercent(usedPct);

  return (
    <div
      className={`lot-card lot-card--${status}`}
      style={{ borderColor: statusCfg.border }}
    >
      <div className="lot-card__header" onClick={handleDetailToggle} style={{ cursor: "pointer" }}>
        <div className="lot-card__title-row">
          <div className="lot-card__title-left">
            <div className="lot-card__badges">
              <span className="lot-card__lot-number">{lot.lotNumber || "Không có số lô"}</span>
              <span
                className="lot-card__status-badge"
                style={{ background: statusCfg.bg, color: statusCfg.color }}
              >
                {statusCfg.label}
              </span>
              {isNextFEFO && (status === "ok" || status === "near") && (
                <span className="lot-card__fefo-badge">Lô tiếp theo &middot; FEFO</span>
              )}
            </div>
            {lot.manufacturerName && (
              <div className="lot-card__manufacturer">{lot.manufacturerName}</div>
            )}
          </div>

          <div className="lot-card__title-right">
            <div className="lot-card__meta-block">
              <div className="lot-card__meta-label">Hạn sử dụng</div>
              <div className="lot-card__meta-value">
                {lot.lotExpiryDate ? dayjs(lot.lotExpiryDate).format("DD/MM/YYYY") : "—"}
              </div>
              {lot.lotExpiryDate && (
                <div className="lot-card__meta-sub" style={{ color: statusCfg.color }}>
                  {getLotCountdownText(lot.lotExpiryDate)}
                </div>
              )}
            </div>
            <div className="lot-card__meta-block">
              <div className="lot-card__meta-label">Tồn của lô</div>
              <div className="lot-card__qty-display">
                <span className="lot-card__qty-number" style={{ color: status === "ok" ? "#096DD9" : statusCfg.color }}>
                  {remainingVolume.toLocaleString("vi-VN", QUANTITY_FORMAT)}
                </span>
                <span className="lot-card__qty-unit">{volumeUnit}</span>
              </div>
              <div className="lot-card__meta-sub">
                {formatLotBaseQty(lot.remainingBaseQuantity, lot.packagingUnitName, lot.volumePerUnit, lot.volumeUnitName)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lot-card__progress">
        <div className="lot-card__progress-bar">
          <div
            className="lot-card__progress-fill"
            style={{ width: `${usedPct}%`, background: barColor }}
          />
        </div>
        <div className="lot-card__progress-text">
          Đã dùng <strong>{usagePct.used}%</strong> &middot; còn {usagePct.remain}%
        </div>
      </div>

      <div className="lot-card__footer">
        <span>
          <span className="lot-card__footer-label">Quy cách</span> &middot;{" "}
          {lot.volumePerUnit && lot.volumeUnitName
            ? `${lot.volumePerUnit} ${lot.volumeUnitName}/${lot.packagingUnitName || lot.baseUnitName || ""}`
            : "—"}
        </span>
        <span>
          <span className="lot-card__footer-label">Nhập</span> &middot;{" "}
          {formatLotBaseQty(lot.receivedBaseQuantity, lot.packagingUnitName, lot.volumePerUnit, lot.volumeUnitName)}
        </span>
      </div>

      {detailOpen && (
        <>
          <div className="lot-card__stock-breakdown">
            <div className="lot-card__stock-item">
              <div className="lot-card__stock-label">Tồn kho đầu kỳ</div>
              <div className="lot-card__stock-value">
                <span className="lot-card__stock-number">
                  {openingVolume.toLocaleString("vi-VN", QUANTITY_FORMAT)}
                </span>
                <span className="lot-card__stock-unit">{volumeUnit}</span>
              </div>
              <div className="lot-card__stock-sub">
                {formatLotBaseQty(openingBaseQty, lot.packagingUnitName, lot.volumePerUnit, lot.volumeUnitName)}
              </div>
            </div>
            <div className="lot-card__stock-operator">&minus;</div>
            <div className="lot-card__stock-item">
              <div className="lot-card__stock-label">Tiêu hao trong kỳ</div>
              <div className="lot-card__stock-value">
                <span className="lot-card__stock-number" style={{ color: "#CF1322" }}>
                  {theoreticalVol.toLocaleString("vi-VN", QUANTITY_FORMAT)}
                </span>
                <span className="lot-card__stock-unit">{volumeUnit}</span>
              </div>
            </div>
            <div className="lot-card__stock-operator">=</div>
            <div className="lot-card__stock-item lot-card__stock-item--result">
              <div className="lot-card__stock-label" style={{ color: "#096DD9" }}>Tồn cuối kỳ</div>
              <div className="lot-card__stock-value">
                <span className="lot-card__stock-number" style={{ color: "#096DD9" }}>
                  {closingVolume.toLocaleString("vi-VN", QUANTITY_FORMAT)}
                </span>
                <span className="lot-card__stock-unit" style={{ color: "#40a9ff" }}>{volumeUnit}</span>
              </div>
              <div className="lot-card__stock-sub" style={{ color: "#40a9ff" }}>
                {formatLotBaseQty(closingBaseQty, lot.packagingUnitName, lot.volumePerUnit, lot.volumeUnitName)}
              </div>
            </div>
          </div>

          <div className="lot-card__usage">
            <div className="lot-card__usage-header">
              <Text strong style={{ fontSize: 13 }}>Lịch sử sử dụng của riêng lô này</Text>
            </div>
            {!lot.lotNumber ? (
              <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
                Lô không có số lô — không thể truy vết lịch sử sử dụng
              </div>
            ) : (
              <Table
                size="small"
                rowKey={(r, i) => `${r.sampleCode}-${r.indicatorName}-${r.barcodeCode || ''}-${i}`}
                dataSource={items}
                columns={columns}
                loading={loading}
                locale={{ emptyText: "Không có dữ liệu" }}
                pagination={
                  totalCount > pageSize
                    ? {
                        current: page,
                        pageSize,
                        total: totalCount,
                        showSizeChanger: false,
                        size: "small",
                        onChange: handlePageChange,
                      }
                    : false
                }
                scroll={{ x: 840 }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LotStockCard;
