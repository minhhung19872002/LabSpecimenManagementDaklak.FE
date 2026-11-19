import React from "react";
import { Button, Checkbox, Input } from "antd";
import { NumericFormat } from "react-number-format";
import { IndicatorName } from "../../../../components/common";
import { CopyOutlined } from "../../../../components/common/Icon";
import type { IndicatorDto } from "../../../../services/masterDataService";
import { PENDING_PRICE_LABEL, formatPrice } from "../../ServiceCatalog/ServiceCatalog/utils";
import { UNIT_MAX_LENGTH, type ExistingServiceInfo } from "./utils";

export interface DeclarePriceRowProps {
  cellKey: string;
  /** Tên nền mẫu của khối — dùng cho aria-label */
  columnName: string;
  indicator: IndicatorDto;
  /** undefined = chưa có dịch vụ; có = đã có dịch vụ → bỏ qua */
  existing: ExistingServiceInfo | undefined;
  price: number | null;
  /** ĐVT (tiêu hao) đang hiện trong ô */
  unit: string;
  /** ĐVT đã gõ khác mặc định (ĐVT của phương pháp) → tô xanh */
  unitChanged: boolean;
  isSubcontract: boolean;
  /** Có ≥ 2 cột nền mẫu → cho chép giá sang nền mẫu khác */
  canCopy: boolean;
  onPriceChange: (cellKey: string, value: number | null) => void;
  onUnitChange: (cellKey: string, value: string) => void;
  onCopyPrice: (indicatorId: string, value: number) => void;
  onSubcontractChange: (cellKey: string, checked: boolean) => void;
}

/** Chỉ tiêu | ĐVT (tiêu hao) | Đơn giá | chép giá | Hợp đồng phụ */
export const PRICE_ROW_COLUMNS = "minmax(0,1fr) 120px 150px 34px 130px";

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: PRICE_ROW_COLUMNS,
  alignItems: "center",
  gap: 10,
  minHeight: 44,
  padding: "4px 16px 4px 38px",
};
const ellipsis: React.CSSProperties = { display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const groupStyle: React.CSSProperties = { ...ellipsis, fontSize: 12, lineHeight: "18px", color: "#595959" };
const existTagStyle: React.CSSProperties = {
  flex: "none",
  fontSize: 12,
  lineHeight: "18px",
  padding: "0 6px",
  borderRadius: 4,
  background: "#f5f5f5",
  color: "#595959",
  border: "1px solid #d9d9d9",
};
const existCellStyle: React.CSSProperties = { padding: "0 8px", fontSize: 13, color: "rgba(0,0,0,.85)" };
const inputBase: React.CSSProperties = { width: "100%", height: 32, borderRadius: 8 };
const emptyInputStyle: React.CSSProperties = { ...inputBase, border: "1px dashed #ffd591", background: "#fffbe6" };
const filledInputStyle: React.CSSProperties = { ...inputBase, border: "1px solid #b7eb8f", background: "#f6ffed" };
const unitEmptyStyle: React.CSSProperties = { ...inputBase, fontSize: 13, border: "1px solid #ffa39e", background: "#fff1f0" };
const unitChangedStyle: React.CSSProperties = { ...inputBase, fontSize: 13, border: "1px solid #91caff", background: "#e6f4ff" };
const unitDefaultStyle: React.CSSProperties = { ...inputBase, fontSize: 13 };
const copyBase: React.CSSProperties = { width: 34, height: 32, borderRadius: 8, background: "#fff", padding: 0 };
const copyOn: React.CSSProperties = { ...copyBase, border: "1px solid #91caff", color: "#096dd9" };
const copyOff: React.CSSProperties = { ...copyBase, border: "1px solid #f0f0f0", color: "rgba(0,0,0,.25)" };

/** 1 dòng chỉ tiêu trong khối giá của 1 nền mẫu — memo theo ô */
const DeclarePriceRow = React.memo<DeclarePriceRowProps>(function DeclarePriceRow({
  cellKey,
  columnName,
  indicator,
  existing,
  price,
  unit,
  unitChanged,
  isSubcontract,
  canCopy,
  onPriceChange,
  onUnitChange,
  onCopyPrice,
  onSubcontractChange,
}) {
  const name = (
    <span style={{ minWidth: 0 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span style={{ ...ellipsis, minWidth: 0 }} title={indicator.name}>
          <IndicatorName name={indicator.name} formattedName={indicator.formattedName} />
        </span>
        {existing && <span style={existTagStyle}>Đã có dịch vụ · bỏ qua</span>}
      </span>
      {indicator.indicatorGroupName && <span style={groupStyle}>{indicator.indicatorGroupName}</span>}
    </span>
  );

  if (existing) {
    return (
      <div className="svc-declare-price-row" style={{ borderTop: "1px solid #fafafa", background: "#fafafa" }}>
        <div style={gridStyle}>
          {name}
          <span style={{ ...existCellStyle, ...ellipsis }} title={existing.unit ?? undefined}>
            {existing.unit || "—"}
          </span>
          <span style={{ ...existCellStyle, textAlign: "right", fontWeight: 500 }}>
            {existing.price == null ? PENDING_PRICE_LABEL : `${formatPrice(existing.price)} đ`}
          </span>
          <span aria-hidden="true" />
          <span style={{ ...ellipsis, fontSize: 13, color: existing.isSubcontract ? "#531dab" : "#595959" }}>
            {existing.isSubcontract ? "Có HĐ phụ" : "Không có HĐ phụ"}
          </span>
        </div>
      </div>
    );
  }

  const unitEmpty = !unit.trim();
  const copyEnabled = canCopy && price != null;
  const copyTitle = `Dùng giá này cho ${indicator.name} ở mọi nền mẫu`;
  return (
    <div
      className="svc-declare-price-row"
      style={{ borderTop: "1px solid #fafafa", background: isSubcontract ? "#fcf7ff" : undefined }}
    >
      <div style={gridStyle}>
        {name}
        <Input
          value={unit}
          maxLength={UNIT_MAX_LENGTH}
          placeholder="Nhập ĐVT"
          aria-label={`Đơn vị tính (tiêu hao) của ${indicator.name} – ${columnName}`}
          status={unitEmpty ? "error" : undefined}
          style={unitEmpty ? unitEmptyStyle : unitChanged ? unitChangedStyle : unitDefaultStyle}
          onChange={(e) => onUnitChange(cellKey, e.target.value)}
        />
        <NumericFormat
          value={price ?? ""}
          onValueChange={(values, info) => {
            if (info.source === "event") onPriceChange(cellKey, values.floatValue ?? null);
          }}
          allowNegative={false}
          decimalScale={2}
          thousandSeparator="."
          decimalSeparator=","
          customInput={Input}
          placeholder={PENDING_PRICE_LABEL}
          aria-label={`Giá ${indicator.name} – ${columnName}`}
          className={price == null ? "svc-declare-price" : "svc-declare-price svc-declare-price-filled"}
          style={price == null ? emptyInputStyle : filledInputStyle}
        />
        <Button
          aria-label={copyTitle}
          title={copyEnabled ? copyTitle : undefined}
          icon={<CopyOutlined />}
          disabled={!copyEnabled}
          style={copyEnabled ? copyOn : copyOff}
          onClick={() => price != null && onCopyPrice(indicator.id, price)}
        />
        <Checkbox
          checked={isSubcontract}
          onChange={(e) => onSubcontractChange(cellKey, e.target.checked)}
          style={{ fontSize: 13, color: "#595959" }}
        >
          Hợp đồng phụ
        </Checkbox>
      </div>
    </div>
  );
});

export default DeclarePriceRow;
