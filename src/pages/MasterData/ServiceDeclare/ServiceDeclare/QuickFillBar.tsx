import React from "react";
import { Button, Input, Select } from "antd";
import { NumericFormat } from "react-number-format";
import type { QuickFillScope } from "./utils";

export interface QuickFillBarProps {
  price: number | null;
  scope: QuickFillScope;
  emptyCount: number;
  totalCount: number;
  onPriceChange: (value: number | null) => void;
  onScopeChange: (scope: QuickFillScope) => void;
  onApply: () => void;
}

const boxStyle: React.CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 4px 4px 10px",
  borderRadius: 8,
  background: "#e6f4ff",
  border: "1px solid #91caff",
  fontSize: 13,
};

/** "Điền nhanh": 1 giá cho ô còn trống / tất cả ô */
const QuickFillBar: React.FC<QuickFillBarProps> = ({
  price,
  scope,
  emptyCount,
  totalCount,
  onPriceChange,
  onScopeChange,
  onApply,
}) => (
  <div role="group" aria-label="Điền giá nhanh" style={boxStyle}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#096dd9" aria-hidden="true">
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
    <span style={{ color: "#0958d9", fontWeight: 500 }}>Điền nhanh</span>
    <NumericFormat
      value={price ?? ""}
      onValueChange={(values, info) => {
        if (info.source === "event") onPriceChange(values.floatValue ?? null);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") onApply();
      }}
      allowNegative={false}
      decimalScale={2}
      thousandSeparator="."
      decimalSeparator=","
      customInput={Input}
      placeholder="Nhập giá"
      aria-label="Giá điền nhanh"
      className="svc-declare-price"
      style={{ width: 110, height: 30 }}
    />
    <span style={{ color: "#595959" }}>cho</span>
    <Select<QuickFillScope>
      value={scope}
      onChange={onScopeChange}
      style={{ width: 150, height: 30 }}
      aria-label="Phạm vi điền nhanh"
      options={[
        { value: "empty", label: `ô còn trống (${emptyCount})` },
        { value: "all", label: `tất cả ô (${totalCount})` },
      ]}
    />
    <Button
      type="primary"
      style={{ height: 30 }}
      onClick={onApply}
      disabled={price == null || (scope === "empty" ? emptyCount === 0 : totalCount === 0)}
    >
      Áp dụng
    </Button>
  </div>
);

export default QuickFillBar;
