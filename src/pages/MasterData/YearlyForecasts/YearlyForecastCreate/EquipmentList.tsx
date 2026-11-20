import React from "react";
import { TrashIcon } from "./icons";
import { delButtonStyle, type EquipmentRowView } from "./utils";

export interface EquipmentListProps {
  comboId: string;
  rows: EquipmentRowView[];
  readOnly: boolean;
  onRemove: (comboId: string, productId: string, isExtra: boolean) => void;
}

/** Danh sách thiết bị của 1 phương pháp (chỉ hiển thị, không tính lượng) */
const EquipmentList: React.FC<EquipmentListProps> = ({ comboId, rows, readOnly, onRemove }) => (
  <>
    <div
      className="yfc-eq-grid"
      style={{
        height: 30,
        padding: "0 10px",
        background: "#f0fffd",
        borderTop: "1px solid #b5f5ec",
        fontSize: 12,
        fontWeight: 600,
        color: "#006d75",
      }}
    >
      <span>Tên thiết bị</span>
      <span />
    </div>
    {rows.map((r) => (
      <div
        key={r.productId}
        className="yfc-eq-grid yfc-row"
        style={{
          minHeight: 36,
          padding: "2px 10px",
          boxSizing: "border-box",
          fontSize: 13,
          borderTop: "1px solid #f5f5f5",
          background: r.isExtra ? "#fcf8ff" : undefined,
        }}
      >
        <span style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="bnc-ellipsis" title={r.code ? `${r.code} · ${r.name}` : r.name}>
            {r.name}
          </span>
          {r.isExtra && (
            <span
              style={{
                flex: "none",
                fontSize: 10,
                lineHeight: "16px",
                padding: "0 5px",
                borderRadius: 8,
                whiteSpace: "nowrap",
                background: "#f9f0ff",
                color: "#531dab",
                border: "1px solid #d3adf7",
              }}
            >
              Bổ sung
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
    ))}
  </>
);

export default EquipmentList;
