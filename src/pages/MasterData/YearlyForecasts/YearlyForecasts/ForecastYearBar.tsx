import React from "react";
import { LockOutlined } from "../../../../components/common/Icon";
import { formatSamples, trendOf, type ForecastKpis } from "./utils";

export interface ForecastYearBarProps {
  years: number[];
  currentYear: number;
  year: number;
  /** Năm đã qua → chỉ xem */
  isLocked: boolean;
  kpis: ForecastKpis;
  onYearChange: (year: number) => void;
}

/** KPI "So với": tăng / giữ nguyên = xanh, giảm = đỏ, năm trước chưa có = xám */
const CHANGE_CLASS = { new: "yf-flat", up: "yf-up", down: "yf-down", flat: "yf-up" } as const;

/** Năm áp dụng (T-1 khóa · T · T+1) + KPI cả năm */
const ForecastYearBar: React.FC<ForecastYearBarProps> = ({ years, currentYear, year, isLocked, kpis, onYearChange }) => {
  const change = trendOf(kpis.change);
  return (
    <div className="yf-yearbar">
      <div className="yf-year-picker">
        <span className="yf-year-label">Năm áp dụng</span>
        <div className="yf-years" role="radiogroup" aria-label="Năm áp dụng">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={y === year}
              className={`yf-year-btn${y === year ? " is-on" : ""}`}
              title={y < currentYear ? "Năm đã qua — chỉ xem" : undefined}
              onClick={() => onYearChange(y)}
            >
              {y < currentYear && <LockOutlined style={{ fontSize: 12 }} />}
              {y}
            </button>
          ))}
        </div>
        {isLocked && (
          <span className="yf-locked-note">
            <LockOutlined style={{ fontSize: 12 }} />
            Năm đã qua — chỉ xem
          </span>
        )}
      </div>
      <div className="yf-kpis">
        <div className="yf-kpi">
          <span className="yf-kpi-label">Tổng mẫu/năm</span>
          <span className="yf-kpi-value is-primary">{formatSamples(kpis.total)}</span>
        </div>
        <div className="yf-kpi">
          <span className="yf-kpi-label">So với {year - 1}</span>
          <span className={`yf-kpi-value ${CHANGE_CLASS[change.kind]}`}>
            {kpis.change == null ? "—" : change.text}
          </span>
        </div>
        <div className="yf-kpi">
          <span className="yf-kpi-label">Nền mẫu</span>
          <span className="yf-kpi-value">{formatSamples(kpis.specimenCount)}</span>
        </div>
        <div className="yf-kpi">
          <span className="yf-kpi-label">Dòng dự toán</span>
          <span className="yf-kpi-value">{formatSamples(kpis.rowCount)}</span>
        </div>
      </div>
    </div>
  );
};

export default ForecastYearBar;
