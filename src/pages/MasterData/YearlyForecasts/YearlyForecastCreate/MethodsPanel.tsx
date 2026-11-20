import React from "react";
import StepLabel, { type StepState } from "../../ServiceDeclare/ServiceDeclare/StepLabel";
import { FoldToggle } from "./icons";
import MethodCard, { type MethodCardHandlers, type MethodCardView } from "./MethodCard";

export interface MethodsPanelProps extends MethodCardHandlers {
  step: StepState;
  /** Nền mẫu & chỉ tiêu đang chọn ở cột trái (null = chưa chọn) */
  current: { specimenName: string; indicatorName: string } | null;
  methods: MethodCardView[];
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

/** ② Số mẫu theo phương pháp & tiêu hao của chỉ tiêu đang chọn */
const MethodsPanel: React.FC<MethodsPanelProps> = ({ step, current, methods, onExpandAll, onCollapseAll, ...handlers }) => (
  <section aria-label="Số mẫu theo phương pháp & tiêu hao" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
    <div
      style={{
        minHeight: 52,
        padding: "10px 16px",
        boxSizing: "border-box",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ flex: 1 }}>
        <StepLabel index={2} state={step} title="Số mẫu theo phương pháp & tiêu hao" />
      </span>
      {methods.length > 0 && <FoldToggle label="Mở / thu gọn phương pháp" onExpand={onExpandAll} onCollapse={onCollapseAll} />}
    </div>
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        background: "#fafbfc",
        padding: "12px 16px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {current ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span
              style={{
                flex: "none",
                fontSize: 12,
                lineHeight: "22px",
                padding: "0 8px",
                borderRadius: 11,
                background: "#fff7e6",
                color: "#873800",
                border: "1px solid #ffd591",
                maxWidth: 260,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={current.specimenName}
            >
              {current.specimenName}
            </span>
            <span aria-hidden="true" style={{ color: "#8c8c8c" }}>
              ›
            </span>
            <strong className="bnc-ellipsis" title={current.indicatorName} style={{ fontSize: 17, fontWeight: 600, color: "#141414" }}>
              {current.indicatorName}
            </strong>
          </div>
          {methods.map((m) => (
            <MethodCard key={m.id} method={m} {...handlers} />
          ))}
        </>
      ) : (
        <p style={{ margin: 0, padding: "48px 20px", textAlign: "center", color: "#595959", fontSize: 13 }}>
          Chọn một chỉ tiêu ở cột bên trái để nhập số mẫu cho từng phương pháp.
        </p>
      )}
    </div>
  </section>
);

export default MethodsPanel;
