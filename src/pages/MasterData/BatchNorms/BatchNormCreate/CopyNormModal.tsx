import React, { useState } from "react";
import { Button, Input, Modal } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { BatchNormComboDto } from "../../../../services/serviceCatalogService";
import { comboIndicatorNameOf, comboMethodNameOf, comboPathOf, comboSpecimenNameOf } from "./utils";

export interface CopyNormModalProps {
  open: boolean;
  query: string;
  /** Bộ đã có định mức (đã lọc theo ô tìm, bỏ bộ đang sửa) */
  rows: BatchNormComboDto[];
  /** Bộ nguồn đang chọn */
  pickId: string | null;
  /** Bộ nguồn đang chọn (tra từ toàn bộ danh sách, kể cả khi bị lọc khỏi rows) */
  picked: BatchNormComboDto | null;
  onQueryChange: (query: string) => void;
  onPick: (testMethodIndicatorId: string) => void;
  onClose: () => void;
  /** Handler tự try/catch, không re-throw */
  onCopy: () => Promise<void>;
}

const GRID = "44px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 170px";

const rowStyle = (bg: string): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: GRID,
  gap: 10,
  alignItems: "center",
  minHeight: 40,
  padding: "0 12px",
  borderBottom: "1px solid #f5f5f5",
  fontSize: 13,
  cursor: "pointer",
  background: bg,
});

const CopyButton = React.memo<{ disabled: boolean; onCopy: () => Promise<void> }>(function CopyButton({ disabled, onCopy }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="primary"
      loading={loading}
      disabled={disabled || loading}
      style={{ height: 38, padding: "0 18px", borderRadius: 8, fontWeight: 500 }}
      onClick={async () => {
        setLoading(true);
        try {
          await onCopy();
        } finally {
          setLoading(false);
        }
      }}
    >
      Sao chép định mức
    </Button>
  );
});

/** Popup chọn 1 bộ đã có định mức để sao chép vật tư / thiết bị */
const CopyNormModal: React.FC<CopyNormModalProps> = ({ open, query, rows, pickId, picked, onQueryChange, onPick, onClose, onCopy }) => (
  <Modal
    open={open}
    onCancel={onClose}
    footer={null}
    closable={false}
    width={860}
    centered
    destroyOnHidden
    rootClassName="bnc-modal"
    styles={{ body: { padding: 0 } }}
  >
    <div
      role="document"
      aria-labelledby="bnc-copy-title"
      style={{ height: 600, maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          height: 54,
          flex: "none",
          padding: "0 12px 0 20px",
          background: "linear-gradient(90deg, #1d39c4, #2f54eb)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <h2 id="bnc-copy-title" style={{ margin: 0, flex: 1, fontSize: 16, lineHeight: "24px", fontWeight: 500, color: "#fff" }}>
          Sao chép định mức từ bộ khác
        </h2>
        <button type="button" onClick={onClose} aria-label="Đóng" className="bnc-modal-close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div
        style={{
          flex: "none",
          padding: "10px 20px",
          background: "#f0f5ff",
          borderBottom: "1px solid #d6e4ff",
          fontSize: 13,
          lineHeight: "20px",
          color: "#1d39c4",
        }}
      >
        Chọn 1 bộ đã có định mức. Danh sách vật tư, thiết bị và lượng tiêu hao / mẫu hiện tại sẽ được thay bằng định mức của bộ đã chọn — bạn
        chỉ cần sửa lại phần khác biệt.
      </div>
      <div style={{ flex: "none", padding: "12px 20px 8px" }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
          placeholder="Tìm theo Nền mẫu, Chỉ tiêu hoặc Phương pháp..."
          aria-label="Tìm bộ nguồn"
          allowClear
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{ height: 36, borderRadius: 8 }}
        />
      </div>
      <div
        role="radiogroup"
        aria-label="Bộ nguồn"
        style={{ flex: 1, minHeight: 0, overflowY: "auto", margin: "0 20px", border: "1px solid #f0f0f0", borderRadius: 10 }}
      >
        <div
          aria-hidden="true"
          style={{
            ...rowStyle("#fafafa"),
            height: 36,
            minHeight: 36,
            borderBottom: "1px solid #f0f0f0",
            fontSize: 12,
            fontWeight: 500,
            color: "#595959",
            position: "sticky",
            top: 0,
            zIndex: 1,
            cursor: "default",
          }}
        >
          <span />
          <span>Nền mẫu</span>
          <span>Chỉ tiêu</span>
          <span>Phương pháp</span>
          <span>Định mức</span>
        </div>
        {rows.map((c) => {
          const on = c.testMethodIndicatorId === pickId;
          const specimen = comboSpecimenNameOf(c);
          const indicator = comboIndicatorNameOf(c);
          const method = comboMethodNameOf(c);
          return (
            <label key={c.testMethodIndicatorId} className={on ? undefined : "bnc-row"} style={rowStyle(on ? "#f0f5ff" : "#fff")}>
              <span style={{ display: "flex", justifyContent: "center" }}>
                <input
                  type="radio"
                  name="bnc-copy-source"
                  checked={on}
                  aria-label={comboPathOf(c)}
                  onChange={() => onPick(c.testMethodIndicatorId)}
                  style={{ width: 16, height: 16, margin: 0, accentColor: "#2f54eb", cursor: "pointer" }}
                />
              </span>
              <span className="bnc-ellipsis" title={specimen}>
                {specimen}
              </span>
              <span className="bnc-ellipsis" title={indicator}>
                {indicator}
              </span>
              <span className="bnc-ellipsis" title={method}>
                {method}
              </span>
              <span style={{ fontSize: 12, color: "#595959" }}>
                {c.materialCount} vật tư · {c.equipmentCount} thiết bị
              </span>
            </label>
          );
        })}
        {rows.length === 0 && (
          <p style={{ margin: 0, padding: "32px 12px", textAlign: "center", fontSize: 13, color: "#595959" }}>Không có bộ nào khớp.</p>
        )}
      </div>
      <div
        style={{
          flex: "none",
          padding: "12px 20px",
          marginTop: 12,
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span className="bnc-ellipsis" style={{ minWidth: 0, flex: 1, fontSize: 13, color: "#595959" }}>
          {picked ? (
            <>
              Sao chép từ: <strong style={{ color: "#141414", fontWeight: 500 }}>{comboPathOf(picked)}</strong>
            </>
          ) : (
            "Chưa chọn bộ nguồn"
          )}
        </span>
        <Button onClick={onClose} style={{ height: 38, padding: "0 16px", borderRadius: 8 }}>
          Hủy
        </Button>
        <CopyButton disabled={!picked} onCopy={onCopy} />
      </div>
    </div>
  </Modal>
);

export default CopyNormModal;
