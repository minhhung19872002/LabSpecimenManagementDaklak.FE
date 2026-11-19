import React from "react";
import { Button } from "antd";
import CreateServicesButton from "./CreateServicesButton";
import { PILL_STYLE } from "./utils";

export interface DeclareSummary {
  methodName?: string;
  /** "2 nền mẫu" / "Mọi nền mẫu" */
  specimenLabel: string;
  indicatorCount: number;
  newCount: number;
  existingCount: number;
  pendingCount: number;
  subcontractCount: number;
}

export interface DeclareFooterProps {
  summary: DeclareSummary;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}

const newPill: React.CSSProperties = { ...PILL_STYLE, background: "#e6f4ff", color: "#0958d9", borderColor: "#91caff", fontWeight: 500 };
const existPill: React.CSSProperties = { ...PILL_STYLE, background: "#f5f5f5", color: "#595959", borderColor: "#d9d9d9" };
const pendingPill: React.CSSProperties = { ...PILL_STYLE, background: "#fffbe6", color: "#ad4e00", borderColor: "#ffd591" };
const subPill: React.CSSProperties = { ...PILL_STYLE, background: "#f9f0ff", color: "#531dab", borderColor: "#d3adf7" };

/** Chân phiếu: tóm tắt + Hủy / Tạo N dịch vụ */
const DeclareFooter: React.FC<DeclareFooterProps> = ({ summary, canSubmit, onCancel, onSubmit }) => (
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
      <span style={{ color: "#595959" }}>
        {summary.methodName ?? "Chưa chọn phương pháp"} · {summary.specimenLabel} × {summary.indicatorCount} chỉ tiêu
      </span>
      <span aria-hidden="true" style={{ color: "#8c8c8c" }}>→</span>
      <span style={newPill}>{summary.newCount} dịch vụ mới</span>
      {summary.existingCount > 0 && <span style={existPill}>{summary.existingCount} đã có, bỏ qua</span>}
      {summary.pendingCount > 0 && <span style={pendingPill}>{summary.pendingCount} chờ định giá</span>}
      {summary.subcontractCount > 0 && <span style={subPill}>{summary.subcontractCount} hợp đồng phụ</span>}
    </div>
    <span style={{ display: "inline-flex", gap: 8 }}>
      <Button onClick={onCancel} style={{ height: 38, padding: "0 16px", borderRadius: 8 }}>
        Hủy
      </Button>
      <CreateServicesButton count={summary.newCount} disabled={!canSubmit} onSubmit={onSubmit} />
    </span>
  </div>
);

export default DeclareFooter;
