import React from "react";
import { RightOutlined } from "../../../../components/common/Icon";
import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";
import ForecastSpecimenBlock from "./ForecastSpecimenBlock";
import { formatSamples, isFoldOpen, type FoldState, type ForecastGroupCard as GroupCardData } from "./utils";

export interface ForecastGroupCardProps {
  card: GroupCardData;
  fold: FoldState;
  more: FoldState;
  allOpen: boolean;
  /** Đang lọc → mặc định mở để thấy kết quả */
  filtered: boolean;
  showAll: boolean;
  editable: boolean;
  onToggle: (foldKey: string, open: boolean) => void;
  onToggleMore: (blockKey: string, expanded: boolean) => void;
  onDelete: (row: YearlyForecastRowDto) => void;
}

/** Cấp 1: thẻ nhóm nền mẫu (màu theo nhóm) — số liệu + tổng mẫu/năm */
const ForecastGroupCard: React.FC<ForecastGroupCardProps> = ({
  card,
  fold,
  more,
  allOpen,
  filtered,
  showAll,
  editable,
  onToggle,
  onToggleMore,
  onDelete,
}) => {
  const open = isFoldOpen(fold, card.foldKey, allOpen, filtered);
  const style = {
    "--yf-bg": card.palette.bg,
    "--yf-text": card.palette.text,
    "--yf-border": card.palette.border,
    "--yf-dot": card.palette.dot,
  } as React.CSSProperties;
  return (
    <section className="yf-card" style={style} aria-label={`Nhóm nền mẫu ${card.name}`}>
      <button type="button" className="yf-card-head" aria-expanded={open} onClick={() => onToggle(card.foldKey, !open)}>
        <RightOutlined className={`svc-chev${open ? " is-open" : ""}`} style={{ fontSize: 14 }} />
        <span className="yf-card-title">
          <span className="yf-card-name">{card.name}</span>
          <span className="yf-card-meta">
            {card.specimenCount} nền mẫu · {card.indicatorCount} chỉ tiêu · {card.rowCount} dòng dự toán
          </span>
        </span>
        <span className="yf-card-total">
          <span className="yf-card-total-label">Tổng mẫu/năm</span>
          <strong>{card.total > 0 ? formatSamples(card.total) : "—"}</strong>
        </span>
      </button>
      {open && (
        <>
          <div className="yf-colhead" role="row">
            <span className="yf-col-indicator">Chỉ tiêu · tổng mẫu/năm</span>
            <span className="yf-row-grid">
              <span>Phương pháp</span>
              <span className="yf-right">Số lượng mẫu năm</span>
              <span />
            </span>
          </div>
          {card.specimens.map((s) => (
            <ForecastSpecimenBlock
              key={s.foldKey}
              block={s}
              open={isFoldOpen(fold, s.foldKey, allOpen, filtered)}
              more={more}
              showAll={showAll}
              editable={editable}
              onToggle={onToggle}
              onToggleMore={onToggleMore}
              onDelete={onDelete}
            />
          ))}
        </>
      )}
    </section>
  );
};

export default ForecastGroupCard;
