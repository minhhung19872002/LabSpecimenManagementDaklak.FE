import React from "react";
import { Select } from "antd";
import StepLabel, { type StepState } from "../../ServiceDeclare/ServiceDeclare/StepLabel";
import { ChevronDown, FoldToggle, PlusIcon } from "./icons";
import { isOpen, type CategoryNodeView, type FoldState } from "./utils";

export interface LeftPanelProps {
  step: StepState;
  year: number;
  yearOptions: { value: number; label: string }[];
  /** Phiếu sửa: năm cố định */
  yearLocked: boolean;
  /** "Năm tài chính hiện tại · Đang mở · …" */
  yearNote: string;
  tree: CategoryNodeView[];
  selectedCount: number;
  currentKey: string;
  fold: FoldState;
  /** Đã bấm lưu mà chưa chọn bộ → viền đỏ nút chọn */
  showError: boolean;
  onYearChange: (year: number) => void;
  onOpenPick: () => void;
  onToggleFold: (key: string, collapse: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSelectIndicator: (key: string) => void;
}

/** ① Nền mẫu · chỉ tiêu: năm dự toán + cây bộ đã chọn */
const LeftPanel: React.FC<LeftPanelProps> = ({
  step,
  year,
  yearOptions,
  yearLocked,
  yearNote,
  tree,
  selectedCount,
  currentKey,
  fold,
  showError,
  onYearChange,
  onOpenPick,
  onToggleFold,
  onExpandAll,
  onCollapseAll,
  onSelectIndicator,
}) => (
  <section
    aria-label="Nền mẫu · chỉ tiêu"
    style={{ width: 340, flex: "none", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", minHeight: 0 }}
  >
    <div
      style={{
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderBottom: "1px solid #bae0ff",
        background: "#f5faff",
      }}
    >
      <StepLabel
        index={1}
        state={step}
        title="Nền mẫu · chỉ tiêu"
        required
        extra={
          <span style={{ fontSize: 12, color: "#595959" }}>
            Đã chọn <strong style={{ color: "#096dd9", fontWeight: 500 }}>{selectedCount}</strong> bộ
          </span>
        }
      />
      <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: "#595959", flex: "none" }}>Năm dự toán</span>
        <Select
          aria-label="Năm dự toán"
          value={year}
          options={yearOptions}
          onChange={onYearChange}
          disabled={yearLocked}
          style={{ flex: 1, height: 34 }}
        />
      </label>
      <span style={{ marginTop: -4, fontSize: 12, color: "#8c8c8c" }}>{yearNote}</span>
      <button
        type="button"
        className={`bnc-pick-btn${showError ? " is-error" : ""}`}
        onClick={onOpenPick}
        aria-haspopup="dialog"
      >
        <PlusIcon />
        Chọn nền mẫu · chỉ tiêu · phương pháp
      </button>
    </div>

    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      {tree.length > 0 ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#595959" }}>
            <span>{tree.length} nhóm nền mẫu</span>
            <FoldToggle label="Mở / thu gọn cây nền mẫu" small onExpand={onExpandAll} onCollapse={onCollapseAll} />
          </div>
          {tree.map((g) => {
            const gOpen = isOpen(fold, g.foldKey);
            return (
              <section
                key={g.foldKey}
                aria-label={`Nhóm ${g.name}`}
                style={{
                  flex: "none",
                  border: `1px solid ${g.color.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                }}
              >
                <button
                  type="button"
                  aria-expanded={gOpen}
                  onClick={() => onToggleFold(g.foldKey, gOpen)}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    padding: "6px 12px",
                    border: 0,
                    background: g.color.bg,
                    color: g.color.fg,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    font: "inherit",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: "18px" }}>
                    <span className="bnc-ellipsis" style={{ fontSize: 14, fontWeight: 600 }} title={g.name}>
                      {g.name}
                    </span>
                    <span style={{ fontSize: 12, opacity: 0.85 }}>{g.meta}</span>
                  </span>
                  <ChevronDown open={gOpen} />
                </button>
                {gOpen &&
                  g.specimens.map((s) => (
                    <React.Fragment key={s.key}>
                      <div
                        style={{
                          minHeight: 34,
                          padding: "0 12px",
                          borderTop: `1px solid ${g.color.border}`,
                          background: "#fafafa",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#262626",
                        }}
                      >
                        <span aria-hidden="true" style={{ width: 8, height: 8, flex: "none", borderRadius: 4, background: g.color.dot }} />
                        <span className="bnc-ellipsis" title={s.name}>
                          {s.name}
                        </span>
                      </div>
                      {s.indicators.map((ind) => {
                        const current = ind.key === currentKey;
                        return (
                          <button
                            key={ind.key}
                            type="button"
                            aria-current={current ? "true" : undefined}
                            className={current ? undefined : "yfc-row"}
                            onClick={() => onSelectIndicator(ind.key)}
                            style={{
                              width: "100%",
                              minHeight: 48,
                              padding: "4px 10px 4px 30px",
                              border: 0,
                              borderTop: "1px solid #f5f5f5",
                              background: current ? "#e6f4ff" : "#fff",
                              boxShadow: current ? "inset 3px 0 0 #096dd9" : undefined,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              font: "inherit",
                              textAlign: "left",
                              cursor: "pointer",
                            }}
                          >
                            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: "20px" }}>
                              <span
                                className="bnc-ellipsis"
                                title={ind.name}
                                style={{ fontSize: 14, fontWeight: 600, color: current ? "#0958d9" : "#141414" }}
                              >
                                {ind.name}
                              </span>
                              <span style={{ fontSize: 12, color: "#8c8c8c" }}>{ind.methodCount} phương pháp</span>
                            </span>
                            {ind.missingCount > 0 && (
                              <span
                                style={{
                                  flex: "none",
                                  fontSize: 11,
                                  lineHeight: "18px",
                                  padding: "0 6px",
                                  borderRadius: 9,
                                  background: "#fffbe6",
                                  color: "#ad4e00",
                                  border: "1px solid #ffd591",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {ind.missingCount} chưa nhập
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
              </section>
            );
          })}
        </>
      ) : (
        <div style={{ padding: "32px 20px", textAlign: "center", color: "#595959", fontSize: 13 }}>
          Chưa chọn bộ nào. Bấm “Chọn nền mẫu · chỉ tiêu · phương pháp” ở trên.
        </div>
      )}
    </div>
  </section>
);

export default LeftPanel;
