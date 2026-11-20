import React from "react";
import { Input, Select } from "antd";
import { NumericFormat } from "react-number-format";
import { ForecastQuantityMode } from "../../../../services/serviceCatalogService";
import { typeTagStyle } from "../../BatchNorms/BatchNormCreate/utils";
import { TrashIcon } from "./icons";
import { delButtonStyle, fmt, type MaterialRowView } from "./utils";

export interface MaterialTableProps {
  comboId: string;
  methodName: string;
  rows: MaterialRowView[];
  /** Bộ đang áp dụng tiêu hao theo bộ khác → chỉ xem */
  readOnly: boolean;
  onQuantity: (comboId: string, productId: string, quantity: number | null) => void;
  onUnit: (comboId: string, productId: string, unitId: string) => void;
  onMode: (comboId: string, productId: string, mode: ForecastQuantityMode) => void;
  onRemove: (comboId: string, productId: string, isExtra: boolean) => void;
}

const MODE_OPTIONS = [
  { value: ForecastQuantityMode.PerSample, label: "/ mẫu" },
  { value: ForecastQuantityMode.PerYear, label: "/ năm" },
];

const extraTagStyle: React.CSSProperties = {
  flex: "none",
  fontSize: 10,
  lineHeight: "16px",
  padding: "0 5px",
  borderRadius: 8,
  whiteSpace: "nowrap",
  background: "#f9f0ff",
  color: "#531dab",
  border: "1px solid #d3adf7",
};

const perText = (r: MaterialRowView): string =>
  r.quantity != null && r.quantity > 0
    ? `${fmt(r.quantity)} ${r.unitName}${r.mode === ForecastQuantityMode.PerYear ? " / năm" : ""}`.trim()
    : "—";

/** Bảng vật tư của 1 phương pháp: định mức (chỉ xem) + bổ sung (nhập lượng) */
const MaterialTable: React.FC<MaterialTableProps> = ({ comboId, methodName, rows, readOnly, onQuantity, onUnit, onMode, onRemove }) => (
  <>
    <div
      className="yfc-mat-grid"
      style={{
        height: 30,
        padding: "0 10px",
        background: "#f5f8ff",
        borderTop: "1px solid #d6e4ff",
        fontSize: 12,
        fontWeight: 600,
        color: "#1d39c4",
      }}
    >
      <span>Loại vật tư</span>
      <span>Tên vật tư</span>
      <span style={{ textAlign: "right" }}>Tiêu hao / mẫu</span>
      <span title={`Tiêu hao / mẫu ÷ Số mẫu / năm của ${methodName}`} style={{ textAlign: "right", cursor: "help" }}>
        Tiêu hao TB / mẫu ⓘ
      </span>
      <span style={{ textAlign: "right" }}>Ước tính tiêu hao trong năm</span>
      <span />
    </div>
    {rows.map((r) => {
      const editable = r.isExtra && !readOnly;
      return (
        <div
          key={r.productId}
          className="yfc-mat-grid yfc-row"
          style={{
            minHeight: 36,
            padding: "2px 10px",
            boxSizing: "border-box",
            fontSize: 13,
            borderTop: "1px solid #f5f5f5",
            background: r.isExtra ? "#fcf8ff" : undefined,
          }}
        >
          <span>
            <span
              style={{
                ...typeTagStyle(r.productType),
                fontSize: 11,
                lineHeight: "18px",
                width: 96,
                boxSizing: "border-box",
                textAlign: "center",
              }}
              title={r.typeName}
            >
              {r.typeName}
            </span>
          </span>
          <span style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="bnc-ellipsis" title={r.code ? `${r.code} · ${r.name}` : r.name}>
              {r.name}
            </span>
            {r.isExtra && <span style={extraTagStyle}>Bổ sung</span>}
          </span>
          {editable ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, minWidth: 0 }}>
              <NumericFormat
                value={r.quantity ?? ""}
                onValueChange={(v) => onQuantity(comboId, r.productId, v.floatValue ?? null)}
                allowNegative={false}
                decimalScale={6}
                thousandSeparator="."
                decimalSeparator=","
                customInput={Input}
                className={`yfc-qty${r.quantity ? "" : " is-empty"}`}
                placeholder="Lượng"
                aria-label={`Lượng – ${r.name}`}
              />
              {r.unitOptions.length > 1 ? (
                <Select
                  size="small"
                  value={r.unitId ?? undefined}
                  options={r.unitOptions}
                  onChange={(v: string) => onUnit(comboId, r.productId, v)}
                  aria-label={`Đơn vị – ${r.name}`}
                  popupMatchSelectWidth={false}
                  style={{ width: 58 }}
                />
              ) : (
                <span style={{ fontSize: 12, color: "#595959", whiteSpace: "nowrap" }}>{r.unitName}</span>
              )}
              <Select
                size="small"
                value={r.mode}
                options={MODE_OPTIONS}
                onChange={(v: ForecastQuantityMode) => onMode(comboId, r.productId, v)}
                aria-label={`Cách tính – ${r.name}`}
                popupMatchSelectWidth={false}
                style={{ width: 66 }}
              />
            </span>
          ) : (
            <span style={{ textAlign: "right", color: "#595959", whiteSpace: "nowrap" }}>{perText(r)}</span>
          )}
          <span
            title="Tiêu hao / mẫu ÷ Số mẫu / năm"
            style={{ textAlign: "right", color: "#595959", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
          >
            {r.avgText}
          </span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: "17px", padding: "3px 0" }}>
            <strong style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap", color: r.hasTotal ? "#10239e" : "#bfbfbf" }}>
              {r.totalText}
            </strong>
            {r.packText && (
              <span title="Quy cách đơn vị lưu kho" style={{ fontSize: 11, color: "#8c8c8c", whiteSpace: "nowrap" }}>
                {r.packText}
              </span>
            )}
          </span>
          <button
            type="button"
            className="yfc-del"
            aria-label={`Bỏ ${r.name}`}
            title="Bỏ khỏi dự toán của phương pháp này"
            style={delButtonStyle(readOnly)}
            disabled={readOnly}
            onClick={() => onRemove(comboId, r.productId, r.isExtra)}
          >
            <TrashIcon size={12} />
          </button>
        </div>
      );
    })}
  </>
);

export default MaterialTable;
