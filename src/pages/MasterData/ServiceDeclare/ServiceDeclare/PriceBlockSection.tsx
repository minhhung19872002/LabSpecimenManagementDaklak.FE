import React from "react";
import { Button, Input } from "antd";
import { NumericFormat } from "react-number-format";
import { DownOutlined } from "../../../../components/common/Icon";
import type { IndicatorDto } from "../../../../services/masterDataService";
import DeclarePriceRow, { PRICE_ROW_COLUMNS } from "./DeclarePriceRow";
import { cellKeyOf, type DeclareColumn, type ExistingServiceInfo } from "./utils";

export interface PriceBlockStats {
  newCount: number;
  pendingCount: number;
  subcontractCount: number;
}

export interface PriceBlockSectionProps {
  column: DeclareColumn;
  indicators: IndicatorDto[];
  stats: PriceBlockStats;
  folded: boolean;
  blockPrice: number | null;
  prices: Record<string, number | null>;
  /** khóa ô → ĐVT đã gõ (không có khóa = theo ĐVT mặc định) */
  units: Record<string, string>;
  /** ĐVT mặc định = ĐVT của phương pháp */
  defaultUnit: string;
  /** khóa ô đã tích Hợp đồng phụ */
  subcontracts: Set<string>;
  existingServices: Map<string, ExistingServiceInfo>;
  canCopy: boolean;
  onToggleFold: (columnKey: string) => void;
  onBlockPriceChange: (columnKey: string, value: number | null) => void;
  onFillBlock: (columnKey: string) => void;
  onPriceChange: (cellKey: string, value: number | null) => void;
  onUnitChange: (cellKey: string, value: string) => void;
  onCopyPrice: (indicatorId: string, value: number) => void;
  onSubcontractChange: (cellKey: string, checked: boolean) => void;
}

const headStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  height: 44,
  padding: "0 12px 0 16px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "#e6f4ff",
  borderBottom: "1px solid #91caff",
};
const foldButtonStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 40,
  border: 0,
  background: "transparent",
  padding: 0,
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
};
const blockNameStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontWeight: 500,
  color: "#0958d9",
};
const tagBase: React.CSSProperties = {
  flex: "none",
  fontSize: 12,
  lineHeight: "18px",
  padding: "0 6px",
  borderRadius: 4,
  border: "1px solid",
};
const pendingTag: React.CSSProperties = { ...tagBase, background: "#fffbe6", color: "#ad4e00", borderColor: "#ffd591" };
const subTag: React.CSSProperties = { ...tagBase, background: "#f9f0ff", color: "#531dab", borderColor: "#d3adf7" };
const columnHeadStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: PRICE_ROW_COLUMNS,
  gap: 10,
  alignItems: "center",
  height: 30,
  padding: "0 16px 0 38px",
  background: "#fafafa",
  borderBottom: "1px solid #f0f0f0",
  fontSize: 12,
  fontWeight: 500,
  color: "#595959",
};

/** Khối giá của 1 nền mẫu: tiêu đề dính + giá chung + các dòng chỉ tiêu */
const PriceBlockSection: React.FC<PriceBlockSectionProps> = ({
  column,
  indicators,
  stats,
  folded,
  blockPrice,
  prices,
  units,
  defaultUnit,
  subcontracts,
  existingServices,
  canCopy,
  onToggleFold,
  onBlockPriceChange,
  onFillBlock,
  onPriceChange,
  onUnitChange,
  onCopyPrice,
  onSubcontractChange,
}) => (
  <section aria-label={`Giá cho ${column.name}`} style={{ borderBottom: "1px solid #f0f0f0" }}>
    <div style={headStyle}>
      <button
        type="button"
        style={foldButtonStyle}
        aria-expanded={!folded}
        title={column.name}
        onClick={() => onToggleFold(column.key)}
      >
        <DownOutlined
          style={{ flex: "none", fontSize: 12, color: "#0958d9", transition: "transform .15s", transform: folded ? "rotate(-90deg)" : undefined }}
        />
        <span style={blockNameStyle}>{column.name}</span>
        <span style={{ flex: "none", fontSize: 13, color: "#595959" }}>{indicators.length} chỉ tiêu</span>
        {stats.pendingCount > 0 && <span style={pendingTag}>{stats.pendingCount} chờ định giá</span>}
        {stats.subcontractCount > 0 && <span style={subTag}>{stats.subcontractCount} hợp đồng phụ</span>}
      </button>
      <span style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#595959" }}>
        Giá cho cả nền mẫu
        <NumericFormat
          value={blockPrice ?? ""}
          onValueChange={(values, info) => {
            if (info.source === "event") onBlockPriceChange(column.key, values.floatValue ?? null);
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") onFillBlock(column.key);
          }}
          allowNegative={false}
          decimalScale={2}
          thousandSeparator="."
          decimalSeparator=","
          customInput={Input}
          placeholder="Nhập giá"
          aria-label={`Giá cho cả ${column.name}`}
          className="svc-declare-price"
          style={{ width: 100, height: 30 }}
        />
        <Button
          color="primary"
          variant="outlined"
          style={{ height: 30, padding: "0 10px", fontSize: 13 }}
          title="Điền vào các ô còn trống của nền mẫu này"
          disabled={blockPrice == null || stats.pendingCount === 0}
          onClick={() => onFillBlock(column.key)}
        >
          Điền ô trống
        </Button>
      </span>
    </div>
    {!folded && (
      <>
        <div role="row" style={columnHeadStyle}>
          <span>Chỉ tiêu</span>
          <span title="Đơn vị tiêu hao của chỉ tiêu">ĐVT (tiêu hao)</span>
          <span style={{ textAlign: "right" }}>Đơn giá (đ)</span>
          <span />
          <span>Hợp đồng phụ</span>
        </div>
        {indicators.map((ind) => {
          const key = cellKeyOf(ind.id, column.specimenTypeId);
          const typed = units[key];
          return (
            <DeclarePriceRow
              key={key}
              cellKey={key}
              columnName={column.name}
              indicator={ind}
              existing={existingServices.get(key)}
              price={prices[key] ?? null}
              unit={typed ?? defaultUnit}
              unitChanged={typed !== undefined && typed.trim() !== "" && typed !== defaultUnit}
              isSubcontract={subcontracts.has(key)}
              canCopy={canCopy}
              onPriceChange={onPriceChange}
              onUnitChange={onUnitChange}
              onCopyPrice={onCopyPrice}
              onSubcontractChange={onSubcontractChange}
            />
          );
        })}
      </>
    )}
  </section>
);

export default PriceBlockSection;
