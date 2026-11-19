import React from "react";
import { Button } from "antd";
import SaveNormsButton from "./SaveNormsButton";

export interface SummaryChip {
  key: string;
  value: string;
  title: string;
  colors: [bg: string, fg: string, border: string];
}

export interface CreateFooterProps {
  chips: SummaryChip[];
  createCount: number;
  /** Chỉ hiện sau khi đã bấm Tạo */
  problems: string[];
  invalid: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}

const chipStyle = ([bg, fg, border]: SummaryChip["colors"]): React.CSSProperties => ({
  height: 26,
  boxSizing: "border-box",
  padding: "0 10px",
  borderRadius: 13,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  whiteSpace: "nowrap",
  maxWidth: 260,
  background: bg,
  color: fg,
  border: `1px solid ${border}`,
});

/** Chân phiếu: TÓM TẮT + lỗi + Hủy / Tạo N định mức */
const CreateFooter: React.FC<CreateFooterProps> = ({ chips, createCount, problems, invalid, onCancel, onSubmit }) => (
  <div
    style={{
      padding: "12px 20px",
      borderTop: "1px solid #bae0ff",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      boxShadow: "0 -2px 8px rgba(0,0,0,.04)",
    }}
  >
    <div style={{ flex: 1, minWidth: 300, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 8px" }}>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: "#8c8c8c" }}>TÓM TẮT</span>
      {chips.map((c) => (
        <span key={c.key} style={chipStyle(c.colors)} title={c.title}>
          <span style={{ opacity: 0.8 }}>{c.key}</span>
          <strong className="bnc-ellipsis" style={{ fontWeight: 600 }}>
            {c.value}
          </strong>
        </span>
      ))}
      {problems.length > 0 && (
        <span
          role="alert"
          style={{
            fontSize: 13,
            lineHeight: "22px",
            padding: "0 10px",
            borderRadius: 11,
            border: "1px solid #ffa39e",
            background: "#fff1f0",
            color: "#cf1322",
          }}
        >
          {problems.join(" · ")}
        </span>
      )}
    </div>
    <span style={{ display: "inline-flex", gap: 8 }}>
      <Button onClick={onCancel} style={{ height: 38, padding: "0 16px", borderRadius: 8 }}>
        Hủy
      </Button>
      <SaveNormsButton count={createCount} invalid={invalid} onSubmit={onSubmit} />
    </span>
  </div>
);

export default CreateFooter;
