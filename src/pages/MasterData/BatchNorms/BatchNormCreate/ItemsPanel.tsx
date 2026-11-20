import React from "react";
import StepLabel, { type StepState } from "../../ServiceDeclare/ServiceDeclare/StepLabel";
import EquipmentSection, { type EquipmentSectionProps } from "./EquipmentSection";
import MaterialSection, { type MaterialSectionProps } from "./MaterialSection";
import type { NormFormMode } from "./utils";

export interface ItemsPanelProps {
  mode: NormFormMode;
  step: StepState;
  /** "cho 1 mẫu, dùng chung cho 3 định mức" / "cho 1 mẫu · áp dụng cho bộ đang sửa và 2 bộ khác" */
  scopeText: string;
  /** "2 vật tư chưa nhập lượng · 1 thiết bị chưa nhập công suất" — rỗng thì ẩn */
  missingText: string;
  /** Năm dự trù đang mở (ghi chú khi sửa) */
  forecastYear: number;
  onOpenCopy: () => void;
  materials: MaterialSectionProps;
  equipments: EquipmentSectionProps;
}

const CopyIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="8" y="8" width="13" height="13" rx="2" />
    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
  </svg>
);

const copyButtonStyle: React.CSSProperties = {
  height: 30,
  padding: "0 10px",
  border: "1px solid #adc6ff",
  borderRadius: 8,
  background: "#f0f5ff",
  color: "#1d39c4",
  font: "inherit",
  fontSize: 13,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const missingBadgeStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: "22px",
  padding: "0 10px",
  borderRadius: 11,
  background: "#fff7e6",
  color: "#ad4e00",
  border: "1px solid #ffd591",
  whiteSpace: "nowrap",
};

/** ② Vật tư & thiết bị — dùng chung cho mọi bộ áp dụng */
const ItemsPanel: React.FC<ItemsPanelProps> = ({
  mode,
  step,
  scopeText,
  missingText,
  forecastYear,
  onOpenCopy,
  materials,
  equipments,
}) => (
  <section aria-label="Vật tư và thiết bị" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", background: "#fafcff" }}>
      <StepLabel
        index={2}
        state={step}
        title="Vật tư & thiết bị"
        hint={scopeText}
        extra={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={onOpenCopy}
              title="Dùng khi 2 nền mẫu có quy trình phá mẫu gần giống nhau, giúp tạo nhanh và chỉ sửa lại vật tư khác biệt."
              style={copyButtonStyle}
            >
              <CopyIcon />
              Sao chép định mức từ bộ khác
            </button>
            {missingText && <span style={missingBadgeStyle}>{missingText}</span>}
          </span>
        }
      />
    </div>
    {mode === "edit" && (
      <div
        role="note"
        style={{
          margin: "10px 16px 0",
          padding: "8px 12px",
          borderRadius: 8,
          background: "#fffbe6",
          border: "1px solid #ffe58f",
          color: "#614700",
          fontSize: 13,
          display: "flex",
          gap: 8,
          flex: "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d48806" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: 3 }}>
          <path d="M12 3 2 20h20z" />
          <path d="M12 10v4M12 17h.01" />
        </svg>
        <span>
          Thay đổi định mức sẽ áp dụng cho các lần tính giá thành mới và tự động cập nhật lại bảng dự trù vật tư năm {forecastYear} đang
          mở. Các năm đã khóa sổ không bị ảnh hưởng.
        </span>
      </div>
    )}
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14, background: "#fafcff" }}>
      <MaterialSection {...materials} />
      <EquipmentSection {...equipments} />
    </div>
  </section>
);

export default ItemsPanel;
