import React from "react";
import { Button, Checkbox, Modal } from "antd";
import type { ProductType } from "../../../../services/productService";
import { typeTagStyle } from "../../BatchNorms/BatchNormCreate/utils";
import { ModalHeader, SearchIcon } from "./icons";

export type AddItemKind = "material" | "equipment";

export interface AddItemRowView {
  id: string;
  code: string;
  name: string;
  productType: ProductType;
  typeName: string;
  unitText: string;
}

export interface AddItemTypeTab {
  type: ProductType | null;
  label: string;
  count: number;
}

export interface AddItemModalProps {
  open: boolean;
  kind: AddItemKind;
  /** "Nền › Chỉ tiêu › Phương pháp" của bộ đang thêm */
  contextPath: string;
  query: string;
  typeFilter: ProductType | null;
  /** Chỉ dùng cho vật tư */
  typeTabs: AddItemTypeTab[];
  rows: AddItemRowView[];
  selected: ReadonlySet<string>;
  onQuery: (query: string) => void;
  onTypeFilter: (type: ProductType | null) => void;
  onToggle: (id: string) => void;
  onClearSelected: () => void;
  onClose: () => void;
  onConfirm: () => void;
}

const THEME: Record<AddItemKind, { noun: string; header: string; accent: string; selectedBg: string; placeholder: string }> = {
  material: {
    noun: "vật tư",
    header: "linear-gradient(90deg, #1d39c4, #2f54eb)",
    accent: "#2f54eb",
    selectedBg: "#f0f5ff",
    placeholder: "Tìm vật tư theo tên, mã hoặc loại…",
  },
  equipment: {
    noun: "thiết bị",
    header: "linear-gradient(90deg, #08979c, #13c2c2)",
    accent: "#13a8a8",
    selectedBg: "#e6fffb",
    placeholder: "Tìm thiết bị theo tên hoặc mã…",
  },
};

const typePillStyle = (on: boolean): React.CSSProperties => ({
  height: 28,
  padding: "0 12px",
  borderRadius: 14,
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
  ...(on
    ? { background: "#2f54eb", color: "#fff", border: "1px solid #2f54eb" }
    : { background: "#fff", color: "#10239e", border: "1px solid #adc6ff" }),
});

/** Popup bổ sung vật tư / thiết bị (ngoài định mức) cho 1 bộ */
const AddItemModal: React.FC<AddItemModalProps> = ({
  open,
  kind,
  contextPath,
  query,
  typeFilter,
  typeTabs,
  rows,
  selected,
  onQuery,
  onTypeFilter,
  onToggle,
  onClearSelected,
  onClose,
  onConfirm,
}) => {
  const theme = THEME[kind];
  const isMaterial = kind === "material";
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={760}
      centered
      destroyOnHidden
      rootClassName="bnc-modal"
      styles={{ body: { padding: 0 } }}
    >
      <div
        role="document"
        aria-labelledby="yfc-add-title"
        style={{ height: 580, maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}
      >
        <ModalHeader id="yfc-add-title" title={isMaterial ? "Thêm vật tư" : "Thêm thiết bị"} background={theme.header} onClose={onClose} />
        <div style={{ flex: "none", padding: "12px 20px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="bnc-ellipsis" style={{ fontSize: 13, color: "#595959" }} title={contextPath}>
            Cho bộ <strong style={{ fontWeight: 600, color: "#141414" }}>{contextPath}</strong>
          </span>
          <label
            className="bnc-addbox-input"
            style={{ height: 36 }}
          >
            <SearchIcon />
            <input
              autoFocus
              value={query}
              placeholder={theme.placeholder}
              aria-label={theme.placeholder}
              onChange={(e) => onQuery(e.target.value)}
            />
          </label>
          {isMaterial && typeTabs.length > 0 && (
            <div role="group" aria-label="Loại vật tư" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {typeTabs.map((t) => (
                <button
                  key={t.type ?? "all"}
                  type="button"
                  aria-pressed={typeFilter === t.type}
                  style={typePillStyle(typeFilter === t.type)}
                  onClick={() => onTypeFilter(t.type)}
                >
                  {t.label} {t.count}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          role="table"
          aria-label={`Danh sách ${theme.noun}`}
          style={{ flex: 1, minHeight: 0, overflowY: "auto", margin: "0 20px", border: "1px solid #f0f0f0", borderRadius: 10 }}
        >
          <div role="row" className="yfc-add-row is-head">
            <span />
            <span>{isMaterial ? "Loại vật tư" : "Mã thiết bị"}</span>
            <span>{isMaterial ? "Tên vật tư" : "Tên thiết bị"}</span>
            <span>{isMaterial ? "Đơn vị" : ""}</span>
          </div>
          {rows.map((r) => {
            const isSelected = selected.has(r.id);
            return (
              <label
                key={r.id}
                role="row"
                className={`yfc-add-row${isSelected ? "" : " yfc-row"}`}
                style={isSelected ? { background: theme.selectedBg } : undefined}
              >
                <span style={{ display: "flex", justifyContent: "center" }}>
                  <Checkbox checked={isSelected} aria-label={r.name} onChange={() => onToggle(r.id)} />
                </span>
                {isMaterial ? (
                  <span>
                    <span style={{ ...typeTagStyle(r.productType), fontSize: 11 }} title={r.typeName}>
                      {r.typeName}
                    </span>
                  </span>
                ) : (
                  <span className="bnc-ellipsis" style={{ fontSize: 12, color: "#595959" }} title={r.code}>
                    {r.code}
                  </span>
                )}
                <span style={{ minWidth: 0 }}>
                  <span className="bnc-ellipsis" style={{ display: "block", fontWeight: 500 }} title={r.name}>
                    {r.name}
                  </span>
                  {isMaterial && r.code && <span className="bnc-code">{r.code}</span>}
                </span>
                <span className="bnc-ellipsis" style={{ fontSize: 12, color: "#595959" }} title={r.unitText}>
                  {r.unitText}
                </span>
              </label>
            );
          })}
          {rows.length === 0 && (
            <p style={{ margin: 0, padding: "32px 12px", textAlign: "center", fontSize: 13, color: "#595959" }}>
              Không còn {theme.noun} nào phù hợp.
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
            Đã chọn <strong style={{ color: theme.accent, fontWeight: 600 }}>{selected.size}</strong> {theme.noun}
          </span>
          {selected.size > 0 && (
            <button type="button" className="bnc-btn-link" style={{ fontSize: 13, color: "#cf1322" }} onClick={onClearSelected}>
              Bỏ chọn
            </button>
          )}
          <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
            <Button onClick={onClose} style={{ height: 38, padding: "0 16px", borderRadius: 8 }}>
              Hủy
            </Button>
            <Button
              type="primary"
              disabled={selected.size === 0}
              onClick={onConfirm}
              style={{
                height: 38,
                padding: "0 18px",
                borderRadius: 8,
                fontWeight: 500,
                ...(selected.size > 0 ? { background: theme.accent, borderColor: theme.accent } : {}),
              }}
            >
              {selected.size > 0 ? `Thêm ${selected.size} ${theme.noun}` : `Thêm ${theme.noun}`}
            </Button>
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default AddItemModal;
