import React from "react";
import { Button, Checkbox, Input, Modal } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import { ProductType } from "../../../../services/productService";
import type { BatchNormProductOptionDto } from "../../../../services/serviceCatalogService";
import { MATERIAL_TYPES, equipmentTypeName, materialTypeName, productNameOf, typeTagStyle } from "./utils";

export type AddKind = "material" | "equipment";

export interface AddProductModalProps {
  /** null = đóng */
  kind: AddKind | null;
  /** "Cà phê hạt › Aflatoxin B1 › LC-MS/MS" / "3 bộ đã chọn" */
  contextText: string;
  query: string;
  /** Chỉ dùng cho vật tư — null = tất cả */
  typeFilter: ProductType | null;
  /** Đã lọc (bỏ mục đã có trên phiếu) */
  rows: BatchNormProductOptionDto[];
  selected: ReadonlySet<string>;
  onQueryChange: (query: string) => void;
  onTypeFilter: (type: ProductType | null) => void;
  onToggle: (productId: string) => void;
  onClear: () => void;
  onClose: () => void;
  onConfirm: () => void;
}

const THEME: Record<AddKind, { title: string; noun: string; gradient: string; color: string; selectedBg: string; placeholder: string }> = {
  material: {
    title: "Thêm vật tư",
    noun: "vật tư",
    gradient: "linear-gradient(90deg, #1d39c4, #2f54eb)",
    color: "#2f54eb",
    selectedBg: "#f0f5ff",
    placeholder: "Tìm vật tư theo tên hoặc loại…",
  },
  equipment: {
    title: "Thêm thiết bị",
    noun: "thiết bị",
    gradient: "linear-gradient(90deg, #08979c, #13c2c2)",
    color: "#13a8a8",
    selectedBg: "#e6fffb",
    placeholder: "Tìm thiết bị theo tên…",
  },
};

const GRID = "44px 150px minmax(0, 1fr) 80px";

const rowStyle = (bg: string): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: GRID,
  gap: 10,
  alignItems: "center",
  minHeight: 38,
  padding: "0 12px",
  borderBottom: "1px solid #f5f5f5",
  fontSize: 13,
  cursor: "pointer",
  background: bg,
});

const typeChipStyle = (on: boolean): React.CSSProperties => ({
  height: 28,
  padding: "0 10px",
  borderRadius: 14,
  font: "inherit",
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
  ...(on
    ? { background: "#2f54eb", color: "#fff", border: "1px solid #2f54eb", fontWeight: 500 }
    : { background: "#fff", color: "#10239e", border: "1px solid #adc6ff" }),
});

const defaultUnitName = (p: BatchNormProductOptionDto): string =>
  p.units.find((u) => u.id === p.defaultUnitId)?.name ?? p.units[0]?.name ?? "";

/** Popup chọn nhiều vật tư / thiết bị để thêm vào định mức */
const AddProductModal: React.FC<AddProductModalProps> = ({
  kind,
  contextText,
  query,
  typeFilter,
  rows,
  selected,
  onQueryChange,
  onTypeFilter,
  onToggle,
  onClear,
  onClose,
  onConfirm,
}) => {
  const theme = THEME[kind ?? "material"];
  const isMaterial = kind !== "equipment";
  const count = selected.size;
  const typeTabs: { type: ProductType | null; name: string }[] = [
    { type: null, name: "Tất cả" },
    ...MATERIAL_TYPES.map((t) => ({ type: t, name: materialTypeName(t) })),
  ];
  return (
    <Modal
      open={kind != null}
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
        aria-labelledby="bnc-add-title"
        style={{ height: 580, maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            height: 54,
            flex: "none",
            padding: "0 12px 0 20px",
            background: theme.gradient,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <h2 id="bnc-add-title" style={{ margin: 0, flex: 1, fontSize: 16, lineHeight: "24px", fontWeight: 500, color: "#fff" }}>
            {theme.title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="bnc-modal-close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div style={{ flex: "none", padding: "10px 20px", background: "#fafafa", borderBottom: "1px solid #f0f0f0", fontSize: 13, color: "#595959" }}>
          Cho bộ <strong style={{ fontWeight: 600, color: "#141414" }}>{contextText}</strong>
        </div>
        <div style={{ flex: "none", padding: "12px 20px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
            placeholder={theme.placeholder}
            aria-label="Tìm"
            allowClear
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            style={{ height: 36, borderRadius: 8 }}
          />
          {isMaterial && (
            <div role="tablist" aria-label="Lọc loại vật tư" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {typeTabs.map((t) => {
                const on = typeFilter === t.type;
                return (
                  <button key={t.name} type="button" role="tab" aria-selected={on} style={typeChipStyle(on)} onClick={() => onTypeFilter(t.type)}>
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div
          role="table"
          aria-label="Danh sách có thể thêm"
          style={{ flex: 1, minHeight: 0, overflowY: "auto", margin: "0 20px", border: "1px solid #f0f0f0", borderRadius: 10 }}
        >
          <div
            role="row"
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
            <span>{isMaterial ? "Loại vật tư" : "Loại thiết bị"}</span>
            <span>{isMaterial ? "Tên vật tư" : "Tên thiết bị"}</span>
            <span>{isMaterial ? "Đơn vị" : ""}</span>
          </div>
          {rows.map((p) => {
            const on = selected.has(p.id);
            const name = productNameOf(p);
            const typeName = isMaterial ? materialTypeName(p.productType) : equipmentTypeName();
            const tag = typeTagStyle(isMaterial ? p.productType : ProductType.Equipment);
            return (
              <label key={p.id} role="row" className={on ? undefined : "bnc-row"} style={rowStyle(on ? theme.selectedBg : "#fff")}>
                <span style={{ display: "flex", justifyContent: "center" }}>
                  <Checkbox checked={on} aria-label={name} onChange={() => onToggle(p.id)} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ ...tag, fontSize: 11 }}>{typeName}</span>
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="bnc-ellipsis" style={{ display: "block" }} title={name}>
                    {name}
                  </span>
                  <span className="bnc-code">{p.code}</span>
                </span>
                <span className="bnc-ellipsis" style={{ fontSize: 12, color: "#8c8c8c" }}>
                  {isMaterial ? defaultUnitName(p) : ""}
                </span>
              </label>
            );
          })}
          {rows.length === 0 && (
            <p style={{ margin: 0, padding: "32px 12px", textAlign: "center", fontSize: 13, color: "#595959" }}>Không có mục phù hợp.</p>
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
            Đã chọn{" "}
            <strong style={{ color: "#096dd9", fontWeight: 500 }}>
              {count} {theme.noun}
            </strong>
          </span>
          {count > 0 && (
            <button type="button" className="bnc-btn-link" style={{ fontSize: 13, color: "#cf1322" }} onClick={onClear}>
              Bỏ chọn
            </button>
          )}
          <Button onClick={onClose} style={{ marginLeft: "auto", height: 38, padding: "0 16px", borderRadius: 8 }}>
            Hủy
          </Button>
          <Button
            type="primary"
            disabled={count === 0}
            onClick={onConfirm}
            style={{
              height: 38,
              padding: "0 18px",
              borderRadius: 8,
              fontWeight: 500,
              ...(count > 0 ? { background: theme.color, borderColor: theme.color } : {}),
            }}
          >
            {count > 0 ? `Thêm ${count} ${theme.noun}` : theme.title}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddProductModal;
