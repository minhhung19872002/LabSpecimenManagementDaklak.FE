import React from "react";
import { Select } from "antd";
import StepLabel, { type StepState } from "../../ServiceDeclare/ServiceDeclare/StepLabel";
import { isSelOpen, type FilterOption, type FoldState, type NormFormMode, type SelectedCategoryNode } from "./utils";

/** Bộ đang sửa (chế độ sửa) */
export interface EditingCombo {
  specimenName: string;
  indicatorName: string;
  methodName: string;
}

export interface ApplyPanelProps {
  mode: NormFormMode;
  step: StepState;
  /** Chỉ có ở chế độ sửa */
  editing: EditingCombo | null;
  /** "" = Tất cả dịch vụ (chỉ chế độ tạo) */
  serviceGroupKey: string;
  serviceGroupOptions: FilterOption[];
  tree: SelectedCategoryNode[];
  selectedCount: number;
  fold: FoldState;
  /** Đã bấm tạo mà chưa chọn bộ → viền đỏ nút chọn */
  showError: boolean;
  onServiceGroupChange: (key: string) => void;
  onOpenPick: () => void;
  onToggleFold: (key: string, collapsed: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onRemove: (testMethodIndicatorId: string) => void;
}

const Chevron: React.FC<{ open: boolean; size?: number; color?: string }> = ({ open, size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
    style={{ flex: "none", transition: "transform .15s", transform: `rotate(${open ? 0 : -90}deg)` }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const RemoveIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const editGridLabel: React.CSSProperties = { color: "#8c8c8c" };
const editGridValue: React.CSSProperties = { fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" };

const methodPillStyle: React.CSSProperties = {
  maxWidth: "100%",
  boxSizing: "border-box",
  fontSize: 12,
  lineHeight: "20px",
  padding: "0 8px",
  borderRadius: 10,
  background: "#e6f4ff",
  color: "#0958d9",
  border: "1px solid #91caff",
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

/** ① Áp dụng cho: tên dịch vụ + cây bộ Nền mẫu × Chỉ tiêu × Phương pháp đã chọn */
const ApplyPanel: React.FC<ApplyPanelProps> = ({
  mode,
  step,
  editing,
  serviceGroupKey,
  serviceGroupOptions,
  tree,
  selectedCount,
  fold,
  showError,
  onServiceGroupChange,
  onOpenPick,
  onToggleFold,
  onExpandAll,
  onCollapseAll,
  onRemove,
}) => (
  <section
    aria-label="Áp dụng cho"
    style={{ width: 400, flex: "none", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", minHeight: 0 }}
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
        title={mode === "edit" ? "Bộ đang sửa" : "Áp dụng cho"}
        required={mode === "create"}
        extra={
          mode === "edit" ? (
            selectedCount > 0 ? (
              <span style={{ fontSize: 12, color: "#595959" }}>
                Áp dụng thêm <strong style={{ color: "#096dd9", fontWeight: 500 }}>{selectedCount}</strong> bộ
              </span>
            ) : undefined
          ) : (
            <span style={{ fontSize: 12, color: "#595959" }}>
              Đã chọn <strong style={{ color: "#096dd9", fontWeight: 500 }}>{selectedCount}</strong> bộ
            </span>
          )
        }
      />
      {mode === "edit" && editing && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "#fff",
            border: "1px solid #91caff",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: "#0958d9" }}>Đang sửa định mức của</span>
          <div style={{ display: "grid", gridTemplateColumns: "90px minmax(0, 1fr)", gap: "2px 8px", fontSize: 13, lineHeight: "20px" }}>
            <span style={editGridLabel}>Nền mẫu</span>
            <strong style={editGridValue}>{editing.specimenName}</strong>
            <span style={editGridLabel}>Chỉ tiêu</span>
            <strong style={editGridValue}>{editing.indicatorName}</strong>
            <span style={editGridLabel}>Phương pháp</span>
            <strong style={editGridValue}>{editing.methodName}</strong>
          </div>
          <span style={{ fontSize: 11, lineHeight: "16px", color: "#8c8c8c" }}>
            Dữ liệu kỹ thuật liên kết cố định từ Dịch vụ &amp; Bảng giá (không thay đổi khi điều chỉnh giá bán).
          </span>
        </div>
      )}
      {mode === "create" && (
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 13, color: "#595959" }}>
            Lọc theo dịch vụ <span style={{ color: "#8c8c8c" }}>(không bắt buộc)</span>
          </span>
          <Select
            aria-label="Lọc theo dịch vụ"
            value={serviceGroupKey}
            options={serviceGroupOptions}
            onChange={onServiceGroupChange}
            showSearch={{ optionFilterProp: "label" }}
            style={{ width: "100%", height: 36 }}
            notFoundContent="Không có tên dịch vụ"
          />
        </label>
      )}
      <button
        type="button"
        className={`bnc-pick-btn${showError ? " is-error" : ""}`}
        onClick={onOpenPick}
        aria-haspopup="dialog"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {mode === "edit" ? "Áp dụng thay đổi cho bộ khác" : "Chọn nền mẫu · chỉ tiêu · phương pháp"}
      </button>
    </div>

    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      {tree.length > 0 ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#595959" }}>
            <span>
              {selectedCount} định mức · {tree.length} nhóm nền mẫu
            </span>
            <button type="button" className="bnc-btn-link" style={{ marginLeft: "auto" }} onClick={onExpandAll}>
              Mở tất cả
            </button>
            <span aria-hidden="true" style={{ color: "#d9d9d9" }}>
              |
            </span>
            <button type="button" className="bnc-btn-link" onClick={onCollapseAll}>
              Thu gọn
            </button>
          </div>
          {tree.map((g) => {
            const gOpen = isSelOpen(fold, g.foldKey);
            return (
              <section
                key={g.foldKey}
                aria-label={`Nhóm ${g.name}`}
                style={{
                  border: `1px solid ${g.color.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                  flex: "none",
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
                  <span
                    style={{
                      flex: "none",
                      minWidth: 24,
                      height: 24,
                      padding: "0 8px",
                      boxSizing: "border-box",
                      borderRadius: 12,
                      background: g.color.dot,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {g.count}
                  </span>
                  <Chevron open={gOpen} />
                </button>
                {gOpen &&
                  g.specimens.map((n) => {
                    const nOpen = isSelOpen(fold, n.foldKey);
                    return (
                      <React.Fragment key={n.foldKey}>
                        <button
                          type="button"
                          aria-expanded={nOpen}
                          onClick={() => onToggleFold(n.foldKey, nOpen)}
                          style={{
                            width: "100%",
                            minHeight: 36,
                            padding: "0 10px 0 14px",
                            border: 0,
                            borderTop: `1px solid ${g.color.border}`,
                            background: "#fff",
                            color: "#141414",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            font: "inherit",
                            fontSize: 13,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span aria-hidden="true" style={{ width: 8, height: 8, flex: "none", borderRadius: 4, background: g.color.dot }} />
                          <span className="bnc-ellipsis" title={n.name} style={{ flex: 1, fontWeight: 600 }}>
                            {n.name}
                          </span>
                          <span style={{ fontSize: 12, color: "#595959", flex: "none" }}>{n.rows.length} định mức</span>
                          <Chevron open={nOpen} size={12} color="#595959" />
                        </button>
                        {nOpen &&
                          n.rows.map((r) => (
                            <div
                              key={r.testMethodIndicatorId}
                              className="bnc-row"
                              style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 1fr) 26px",
                                gap: 8,
                                alignItems: "center",
                                padding: "7px 10px 7px 28px",
                                borderTop: "1px solid #f5f5f5",
                                background: "#fff",
                              }}
                            >
                              <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                                <span className="bnc-ellipsis" title={r.indicatorName} style={{ fontSize: 14, fontWeight: 600, color: "#141414" }}>
                                  {r.indicatorName}
                                </span>
                                <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, minWidth: 0 }}>
                                  <span title={r.methodName} style={methodPillStyle}>
                                    {r.methodName}
                                  </span>
                                </span>
                              </span>
                              <button
                                type="button"
                                className="bnc-del is-small"
                                aria-label={`Bỏ ${r.indicatorName} – ${r.methodName}`}
                                title="Bỏ"
                                onClick={() => onRemove(r.testMethodIndicatorId)}
                              >
                                <RemoveIcon />
                              </button>
                            </div>
                          ))}
                      </React.Fragment>
                    );
                  })}
              </section>
            );
          })}
        </>
      ) : (
        <div
          style={{
            padding: "32px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            textAlign: "center",
            color: "#595959",
            fontSize: 13,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8c8c8c" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M9 11l3 3 8-8" />
            <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
          </svg>
          {mode === "edit"
            ? "Định mức đang sửa chỉ áp dụng cho bộ ở trên. Bấm “Áp dụng thay đổi cho bộ khác” nếu muốn dùng chung cho bộ khác."
            : "Chưa chọn bộ nào. Bấm “Chọn nền mẫu · chỉ tiêu · phương pháp” ở trên."}
        </div>
      )}
    </div>
  </section>
);

export default ApplyPanel;
