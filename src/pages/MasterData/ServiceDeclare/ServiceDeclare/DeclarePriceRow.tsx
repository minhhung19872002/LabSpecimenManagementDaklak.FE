import React from "react";
import { Button, Checkbox, Input, Select } from "antd";
import { NumericFormat } from "react-number-format";
import { IndicatorName } from "../../../../components/common";
import { CopyOutlined } from "../../../../components/common/Icon";
import type { IndicatorDto } from "../../../../services/masterDataService";
import { PENDING_PRICE_LABEL, formatPrice } from "../../ServiceCatalog/ServiceCatalog/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface DeclarePriceRowProps {
  cellKey: string;
  /** Tên nền mẫu của khối — dùng cho aria-label */
  columnName: string;
  indicator: IndicatorDto;
  /** undefined = chưa có dịch vụ; number/null = đã có (null = Chờ định giá) → bỏ qua */
  existingPrice: number | null | undefined;
  price: number | null;
  isSubcontract: boolean;
  subcontractorId: string | null;
  /** Có ≥ 2 cột nền mẫu → cho chép giá sang nền mẫu khác */
  canCopy: boolean;
  subcontractorOptions: SelectOption[];
  onPriceChange: (cellKey: string, value: number | null) => void;
  onCopyPrice: (indicatorId: string, value: number) => void;
  onSubcontractChange: (cellKey: string, checked: boolean) => void;
  onSubcontractorChange: (cellKey: string, subcontractorId: string | null) => void;
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) 150px 34px 130px",
  alignItems: "center",
  gap: 10,
  minHeight: 44,
  padding: "4px 16px 4px 38px",
};
const ellipsis: React.CSSProperties = { display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const groupStyle: React.CSSProperties = { ...ellipsis, fontSize: 12, lineHeight: "18px", color: "#595959" };
const priceBase: React.CSSProperties = { width: "100%", height: 32, borderRadius: 8 };
const emptyInputStyle: React.CSSProperties = { ...priceBase, border: "1px dashed #ffd591", background: "#fffbe6" };
const filledInputStyle: React.CSSProperties = { ...priceBase, border: "1px solid #b7eb8f", background: "#f6ffed" };
const copyBase: React.CSSProperties = { width: 34, height: 32, borderRadius: 8, background: "#fff", padding: 0 };
const copyOn: React.CSSProperties = { ...copyBase, border: "1px solid #91caff", color: "#096dd9" };
const copyOff: React.CSSProperties = { ...copyBase, border: "1px solid #f0f0f0", color: "rgba(0,0,0,.25)" };

const filterOption = (input: string, option?: SelectOption) =>
  (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

/** 1 dòng chỉ tiêu trong khối giá của 1 nền mẫu — memo theo ô */
const DeclarePriceRow = React.memo<DeclarePriceRowProps>(function DeclarePriceRow({
  cellKey,
  columnName,
  indicator,
  existingPrice,
  price,
  isSubcontract,
  subcontractorId,
  canCopy,
  subcontractorOptions,
  onPriceChange,
  onCopyPrice,
  onSubcontractChange,
  onSubcontractorChange,
}) {
  const name = (
    <span style={{ minWidth: 0 }}>
      <span style={ellipsis} title={indicator.name}>
        <IndicatorName name={indicator.name} formattedName={indicator.formattedName} />
      </span>
      {indicator.indicatorGroupName && <span style={groupStyle}>{indicator.indicatorGroupName}</span>}
    </span>
  );

  if (existingPrice !== undefined) {
    return (
      <div className="svc-declare-price-row" style={{ borderTop: "1px solid #fafafa", background: "#fafafa" }}>
        <div style={gridStyle}>
          {name}
          <span style={{ gridColumn: "span 3", textAlign: "right", fontSize: 13, color: "#595959" }}>
            Đã có dịch vụ · {existingPrice == null ? PENDING_PRICE_LABEL : `${formatPrice(existingPrice)} đ`} — bỏ qua
          </span>
        </div>
      </div>
    );
  }

  const copyEnabled = canCopy && price != null;
  const copyTitle = `Dùng giá này cho ${indicator.name} ở mọi nền mẫu`;
  return (
    <div
      className="svc-declare-price-row"
      style={{ borderTop: "1px solid #fafafa", background: isSubcontract ? "#fcf7ff" : undefined }}
    >
      <div style={gridStyle}>
        {name}
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
      {isSubcontract && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 10px 38px" }}>
          <span style={{ fontSize: 13, color: "#531dab" }}>Đơn vị nhận thầu</span>
          <Select<string, SelectOption>
            allowClear
            showSearch
            placeholder="Chọn đơn vị nhận thầu…"
            aria-label={`Đơn vị nhận thầu cho ${indicator.name} – ${columnName}`}
            className="svc-declare-vendor"
            style={{ width: 260, height: 32 }}
            value={subcontractorId ?? undefined}
            options={subcontractorOptions}
            filterOption={filterOption}
            onChange={(v) => onSubcontractorChange(cellKey, v ?? null)}
          />
        </div>
      )}
    </div>
  );
});

export default DeclarePriceRow;
