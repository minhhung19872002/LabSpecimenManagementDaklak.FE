import React from "react";
import { Button, Checkbox, Modal } from "antd";
import { ModalHeader, SearchIcon } from "./icons";

export interface ApplySourceView {
  specimenName: string;
  indicatorName: string;
  methodName: string;
  materialCount: number;
  equipmentCount: number;
}

export interface ApplyRowView {
  id: string;
  categoryName: string;
  specimenName: string;
  indicatorName: string;
  methodName: string;
  selected: boolean;
  disabled: boolean;
  statusText: string;
  tone: "muted" | "selected" | "warn" | "normal";
}

export interface ApplyModalProps {
  open: boolean;
  source: ApplySourceView | null;
  query: string;
  sameMethod: boolean;
  rows: ApplyRowView[];
  selectedCount: number;
  /** Số bộ được chọn chưa có trong phiếu (sẽ thêm vào) */
  addCount: number;
  /** Nguồn đang được bộ nào áp dụng chưa (để hiện "Áp dụng" khi bỏ hết) */
  hadTargets: boolean;
  onQuery: (query: string) => void;
  onSameMethod: (on: boolean) => void;
  onToggle: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const TONE: Record<ApplyRowView["tone"], React.CSSProperties> = {
  muted: { color: "#8c8c8c" },
  selected: { color: "#1d39c4", fontWeight: 500 },
  warn: { color: "#ad4e00" },
  normal: { color: "#595959" },
};

/** Popup "Áp dụng tiêu hao cho nền mẫu / chỉ tiêu khác" */
const ApplyModal: React.FC<ApplyModalProps> = ({
  open,
  source,
  query,
  sameMethod,
  rows,
  selectedCount,
  addCount,
  hadTargets,
  onQuery,
  onSameMethod,
  onToggle,
  onClose,
  onConfirm,
}) => (
  <Modal
    open={open}
    onCancel={onClose}
    footer={null}
    closable={false}
    width={980}
    centered
    destroyOnHidden
    rootClassName="bnc-modal"
    styles={{ body: { padding: 0 } }}
  >
    <div
      role="document"
      aria-labelledby="yfc-apply-title"
      style={{ height: 660, maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}
    >
      <ModalHeader id="yfc-apply-title" title="Áp dụng tiêu hao cho nền mẫu / chỉ tiêu khác" onClose={onClose} />
      {source && (
        <div style={{ flex: "none", padding: "12px 20px 0" }}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#f5faff",
              border: "1px solid #bae0ff",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 13,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: "#8c8c8c" }}>NGUỒN</span>
              <span
                style={{
                  fontSize: 12,
                  lineHeight: "20px",
                  padding: "0 8px",
                  borderRadius: 10,
                  background: "#fff7e6",
                  color: "#873800",
                  border: "1px solid #ffd591",
                }}
              >
                {source.specimenName}
              </span>
              <span aria-hidden="true" style={{ color: "#8c8c8c" }}>
                ›
              </span>
              <strong style={{ fontWeight: 600 }}>{source.indicatorName}</strong>
              <span aria-hidden="true" style={{ color: "#8c8c8c" }}>
                ›
              </span>
              <span
                style={{
                  fontSize: 12,
                  lineHeight: "20px",
                  padding: "0 8px",
                  borderRadius: 10,
                  background: "#e6f4ff",
                  color: "#0958d9",
                  border: "1px solid #91caff",
                  fontWeight: 500,
                }}
              >
                {source.methodName}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#595959" }}>
                {source.materialCount} vật tư · {source.equipmentCount} thiết bị
              </span>
            </span>
            <span style={{ fontSize: 12, color: "#595959" }}>
              Các bộ được chọn sẽ dùng chung danh sách vật tư, thiết bị và lượng tiêu hao / mẫu của nguồn. Số mẫu / năm vẫn nhập riêng
              từng bộ; sửa tiêu hao ở nguồn sẽ áp dụng ngay cho các bộ này.
            </span>
          </div>
        </div>
      )}

      <div style={{ flex: "none", padding: "12px 20px 8px", display: "flex", alignItems: "center", gap: 14, fontSize: 13 }}>
        <label className="bnc-addbox-input" style={{ width: 320, height: 34 }}>
          <SearchIcon />
          <input
            value={query}
            placeholder="Tìm nền mẫu, chỉ tiêu, phương pháp…"
            aria-label="Tìm nền mẫu, chỉ tiêu, phương pháp"
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        <Checkbox checked={sameMethod} onChange={(e) => onSameMethod(e.target.checked)}>
          <span style={{ color: "#595959" }}>
            Chỉ hiện cùng phương pháp <strong style={{ fontWeight: 600, color: "#262626" }}>{source?.methodName}</strong>
          </span>
        </Checkbox>
        <span style={{ marginLeft: "auto", color: "#595959" }}>{rows.length} bộ đang hiển thị</span>
      </div>

      <div
        role="table"
        aria-label="Bộ áp dụng tiêu hao"
        style={{ flex: 1, minHeight: 0, overflowY: "auto", margin: "0 20px", border: "1px solid #f0f0f0", borderRadius: 10 }}
      >
        <div role="row" className="yfc-apply-row is-head">
          <span />
          <span>Nhóm nền mẫu</span>
          <span>Nền mẫu</span>
          <span>Chỉ tiêu</span>
          <span>Phương pháp</span>
          <span>Trạng thái</span>
        </div>
        {rows.map((r) => (
          <label
            key={r.id}
            role="row"
            className={`yfc-apply-row${r.disabled ? " is-disabled" : r.selected ? " is-selected" : " yfc-row"}`}
          >
            <span style={{ display: "flex", justifyContent: "center" }}>
              <Checkbox
                checked={r.selected}
                disabled={r.disabled}
                aria-label={`${r.specimenName} – ${r.indicatorName} – ${r.methodName}`}
                onChange={() => onToggle(r.id)}
              />
            </span>
            <span className="bnc-ellipsis" style={{ fontSize: 12, color: "#595959" }} title={r.categoryName}>
              {r.categoryName}
            </span>
            <span className="bnc-ellipsis" title={r.specimenName}>
              {r.specimenName}
            </span>
            <span className="bnc-ellipsis" style={{ fontWeight: 500 }} title={r.indicatorName}>
              {r.indicatorName}
            </span>
            <span className="bnc-ellipsis" title={r.methodName}>
              {r.methodName}
            </span>
            <span className="bnc-ellipsis" style={{ fontSize: 12, ...TONE[r.tone] }} title={r.statusText}>
              {r.statusText}
            </span>
          </label>
        ))}
        {rows.length === 0 && (
          <p style={{ margin: 0, padding: "32px 12px", textAlign: "center", fontSize: 13, color: "#595959" }}>
            Không có bộ nào khớp. Bỏ tích “Chỉ hiện cùng phương pháp” để xem thêm.
          </p>
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
        <span style={{ fontSize: 13, color: "#595959" }}>
          Đã chọn <strong style={{ color: "#1d39c4", fontWeight: 600 }}>{selectedCount}</strong> bộ ·{" "}
          {addCount > 0 ? `${addCount} bộ sẽ được thêm vào phiếu` : "số mẫu / năm nhập riêng từng bộ"}
        </span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
          <Button onClick={onClose} style={{ height: 38, padding: "0 16px", borderRadius: 8 }}>
            Hủy
          </Button>
          <Button
            type="primary"
            disabled={selectedCount === 0 && !hadTargets}
            onClick={onConfirm}
            style={{ height: 38, padding: "0 18px", borderRadius: 8, fontWeight: 500 }}
          >
            {selectedCount > 0 ? `Áp dụng cho ${selectedCount} bộ` : "Áp dụng"}
          </Button>
        </span>
      </div>
    </div>
  </Modal>
);

export default ApplyModal;
