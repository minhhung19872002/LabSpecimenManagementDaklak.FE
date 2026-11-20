import React from "react";
import { DeleteOutlined, DownOutlined, EditOutlined, UpOutlined } from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";
import {
  FORECAST_PREVIEW_LIMIT,
  formatSamples,
  hasForecast,
  methodNameOf,
  percentChange,
  samplesOf,
  trendOf,
  type ForecastIndicatorBlock as IndicatorBlockData,
} from "./utils";

export interface ForecastIndicatorBlockProps {
  block: IndicatorBlockData;
  /** Đã bấm "Xem thêm" */
  expanded: boolean;
  /** Hiện nút "Xem thêm/Thu gọn" — ẩn khi đang tìm từ khóa / lọc phương pháp (luôn hiện đủ) */
  collapsible: boolean;
  /** Có quyền sửa và năm chưa khóa */
  editable: boolean;
  onToggleMore: (blockKey: string, expanded: boolean) => void;
  onDelete: (row: YearlyForecastRowDto) => void;
}

const TREND_CLASS = { new: "yf-new", up: "yf-up", down: "yf-down", flat: "yf-flat" } as const;

const ForecastRow: React.FC<{
  row: YearlyForecastRowDto;
  separated: boolean;
  editable: boolean;
  onDelete: (row: YearlyForecastRowDto) => void;
}> = ({ row, separated, editable, onDelete }) => {
  const has = hasForecast(row);
  const method = methodNameOf(row);
  const trend = trendOf(percentChange(samplesOf(row), row.previousYearSamples));
  return (
    <div className={`yf-row-grid yf-row${separated ? " is-sep" : ""}`} role="row">
      <span className="yf-method-cell">
        <span className="yf-method-tag" title={row.serviceCode ? `${method} · ${row.serviceCode}` : method}>
          {method}
        </span>
      </span>
      <span className="yf-qty-cell">
        {has ? (
          <>
            <span className="yf-qty">{formatSamples(row.estimatedSamples)}</span>
            <span
              className={`yf-trend ${TREND_CLASS[trend.kind]}`}
              title={
                row.previousYearSamples != null
                  ? `Năm trước: ${formatSamples(row.previousYearSamples)} mẫu`
                  : "Năm trước chưa có dự toán"
              }
            >
              {trend.text}
            </span>
          </>
        ) : (
          <>
            <span className="yf-tag-missing">Chưa có dự toán</span>
            <span className="yf-qty is-empty">—</span>
          </>
        )}
      </span>
      <span className="yf-actions">
        {editable && (
          <>
            {/* Giữ chỗ — sửa số mẫu làm ở task sau */}
            <button type="button" className="bn-icon-btn" title="Sửa" aria-label={`Sửa dự toán ${method}`}>
              <EditOutlined style={{ fontSize: 14 }} />
            </button>
            {has && (
              <button
                type="button"
                className="bn-icon-btn is-danger"
                title="Xóa"
                aria-label={`Xóa dự toán ${method}`}
                onClick={() => onDelete(row)}
              >
                <DeleteOutlined style={{ fontSize: 14 }} />
              </button>
            )}
          </>
        )}
      </span>
    </div>
  );
};

/** Cấp 3: 1 chỉ tiêu (cột trái) × các phương pháp + số mẫu năm (cột phải) */
const ForecastIndicatorBlock: React.FC<ForecastIndicatorBlockProps> = ({
  block,
  expanded,
  collapsible,
  editable,
  onToggleMore,
  onDelete,
}) => {
  const hidden = block.rows.length - FORECAST_PREVIEW_LIMIT;
  const rows = expanded || hidden <= 0 ? block.rows : block.rows.slice(0, FORECAST_PREVIEW_LIMIT);
  return (
    <div className="yf-block" role="rowgroup">
      <div className="yf-indicator">
        <IndicatorName
          className="yf-indicator-name"
          name={block.indicatorName}
          formattedName={block.indicatorFormattedName}
        />
        {block.rows.length > 1 && <span className="yf-indicator-sub">{block.rows.length} phương pháp</span>}
      </div>
      <div className="yf-rows">
        {rows.map((row, i) => (
          <ForecastRow
            key={row.testMethodIndicatorId}
            row={row}
            separated={i > 0}
            editable={editable}
            onDelete={onDelete}
          />
        ))}
        {collapsible && hidden > 0 && (
          <button
            type="button"
            className="yf-more-btn"
            aria-expanded={expanded}
            onClick={() => onToggleMore(block.key, !expanded)}
          >
            {expanded ? (
              <>
                <UpOutlined style={{ fontSize: 10 }} />
                Thu gọn
              </>
            ) : (
              <>
                <DownOutlined style={{ fontSize: 10 }} />
                Xem thêm {hidden} phương pháp
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ForecastIndicatorBlock);
