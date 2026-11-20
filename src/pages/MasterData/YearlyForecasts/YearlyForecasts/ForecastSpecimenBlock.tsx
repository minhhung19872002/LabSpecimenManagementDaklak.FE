import React from "react";
import { RightOutlined } from "../../../../components/common/Icon";
import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";
import ForecastIndicatorBlock from "./ForecastIndicatorBlock";
import { formatSamples, isBlockExpanded, type FoldState, type ForecastSpecimenBlock as SpecimenBlockData } from "./utils";

export interface ForecastSpecimenBlockProps {
  block: SpecimenBlockData;
  open: boolean;
  more: FoldState;
  /** "Xem thêm" mặc định mở (đang tìm từ khóa / lọc phương pháp) */
  showAll: boolean;
  editable: boolean;
  onToggle: (foldKey: string, open: boolean) => void;
  onToggleMore: (blockKey: string, expanded: boolean) => void;
  onDelete: (row: YearlyForecastRowDto) => void;
  onEdit: (row: YearlyForecastRowDto) => void;
}

/** Cấp 2: tiêu đề nền mẫu (gập/mở) + các khối chỉ tiêu */
const ForecastSpecimenBlock: React.FC<ForecastSpecimenBlockProps> = ({
  block,
  open,
  more,
  showAll,
  editable,
  onToggle,
  onToggleMore,
  onDelete,
  onEdit,
}) => (
  <>
    <button
      type="button"
      className="yf-specimen-head"
      aria-expanded={open}
      onClick={() => onToggle(block.foldKey, !open)}
    >
      <RightOutlined className={`svc-chev${open ? " is-open" : ""}`} style={{ fontSize: 12 }} />
      <span className="yf-dot" />
      <span className="yf-specimen-name" title={block.name}>
        {block.name}
      </span>
      <span className="yf-specimen-meta">
        {block.indicatorCount} chỉ tiêu · {block.rowCount} dòng
      </span>
      <span className="yf-specimen-total">{block.total > 0 ? formatSamples(block.total) : "—"}</span>
    </button>
    {open &&
      block.indicators.map((b) => (
        <ForecastIndicatorBlock
          key={b.key}
          block={b}
          expanded={isBlockExpanded(more, b.key, showAll)}
          collapsible={!showAll}
          editable={editable}
          onToggleMore={onToggleMore}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
  </>
);

export default ForecastSpecimenBlock;
