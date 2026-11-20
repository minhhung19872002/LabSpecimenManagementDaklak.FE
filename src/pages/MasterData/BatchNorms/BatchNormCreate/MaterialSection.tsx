import React from "react";
import { Input, Select } from "antd";
import { NumericFormat } from "react-number-format";
import type { ProductType } from "../../../../services/productService";
import type { BatchNormProductOptionDto } from "../../../../services/serviceCatalogService";
import ItemGroup, { AddItemButton } from "./ItemGroup";
import {
  MATERIAL_TYPES,
  isPositive,
  materialTypeName,
  productNameOf,
  typeTagStyle,
  type PickedMaterial,
} from "./utils";

export interface MaterialSectionProps {
  /** Vật tư đã thêm, theo thứ tự thêm */
  picked: PickedMaterial[];
  productById: ReadonlyMap<string, BatchNormProductOptionDto>;
  typeFilter: ProductType | null;
  /** Số vật tư đã thêm theo từng loại */
  typeCounts: ReadonlyMap<ProductType, number>;
  missingCount: number;
  open: boolean;
  /** Đã bấm tạo → tô đỏ ô thiếu */
  tried: boolean;
  onToggleOpen: () => void;
  onTypeFilter: (type: ProductType | null) => void;
  onOpenAdd: () => void;
  onQuantity: (productId: string, quantity: number | null) => void;
  onUnit: (productId: string, unitId: string | null) => void;
  onRemove: (productId: string) => void;
}

const GRID = "130px minmax(0, 1fr) 150px 130px 40px";

const chipStyle = (on: boolean): React.CSSProperties => ({
  height: 28,
  padding: "0 10px",
  borderRadius: 14,
  font: "inherit",
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  ...(on
    ? { background: "#2f54eb", color: "#fff", border: "1px solid #2f54eb", fontWeight: 500 }
    : { background: "#fff", color: "#10239e", border: "1px solid #adc6ff" }),
});

const chipCountStyle = (on: boolean): React.CSSProperties => ({
  fontSize: 11,
  lineHeight: "16px",
  padding: "0 6px",
  borderRadius: 8,
  ...(on ? { background: "rgba(255,255,255,.25)", color: "#fff" } : { background: "#f0f5ff", color: "#1d39c4" }),
});

const headCell: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#1d39c4" };

export const RemoveButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button type="button" className="bnc-del" aria-label={label} title="Xóa" onClick={onClick}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  </button>
);

/** Nhóm Vật tư: chip lọc loại, nút thêm, bảng lượng tiêu hao / mẫu + đơn vị */
const MaterialSection: React.FC<MaterialSectionProps> = ({
  picked,
  productById,
  typeFilter,
  typeCounts,
  missingCount,
  open,
  tried,
  onToggleOpen,
  onTypeFilter,
  onOpenAdd,
  onQuantity,
  onUnit,
  onRemove,
}) => {
  const rows = picked.filter((m) => typeFilter == null || productById.get(m.productId)?.productType === typeFilter);
  const chips: { type: ProductType | null; name: string; count: number }[] = [
    { type: null, name: "Tất cả", count: picked.length },
    ...MATERIAL_TYPES.map((t) => ({ type: t, name: materialTypeName(t), count: typeCounts.get(t) ?? 0 })),
  ];
  return (
    <ItemGroup
      title="Vật tư"
      count={picked.length}
      open={open}
      theme={{ border: "#adc6ff", headBg: "linear-gradient(90deg, #f0f5ff, #ffffff)", fg: "#10239e", countBg: "#2f54eb" }}
      missingText={missingCount > 0 ? `${missingCount} thiếu lượng` : undefined}
      onToggle={onToggleOpen}
      addBox={<AddItemButton label="Thêm vật tư" color="#2f54eb" onClick={onOpenAdd} />}
    >
      <div role="group" aria-label="Lọc vật tư theo loại" style={{ padding: "10px 12px 6px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#595959", marginRight: 2 }}>Lọc vật tư:</span>
        {chips.map((c) => {
          const on = typeFilter === c.type;
          return (
            <button key={c.name} type="button" aria-pressed={on} style={chipStyle(on)} onClick={() => onTypeFilter(c.type)}>
              {c.name}
              <span style={chipCountStyle(on)}>{c.count}</span>
            </button>
          );
        })}
      </div>
      <div role="table" aria-label="Vật tư tiêu hao" style={{ padding: "0 12px 12px" }}>
        <div
          role="row"
          style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "8px 10px", background: "#f5f8ff", borderRadius: 8 }}
        >
          <span role="columnheader" style={headCell}>
            Loại vật tư
          </span>
          <span role="columnheader" style={headCell}>
            Tên vật tư
          </span>
          <span role="columnheader" style={{ ...headCell, textAlign: "right" }}>
            Lượng tiêu hao / mẫu <span style={{ color: "#cf1322" }}>*</span>
          </span>
          <span role="columnheader" style={headCell}>
            Đơn vị tiêu hao <span style={{ color: "#cf1322" }}>*</span>
          </span>
          <span />
        </div>
        {rows.map((m) => {
          const p = productById.get(m.productId);
          if (!p) return null;
          const name = productNameOf(p);
          const qtyBad = tried && !isPositive(m.quantity);
          const unitBad = tried && !m.unitId;
          const noUnits = p.units.length === 0;
          return (
            <div
              key={m.productId}
              role="row"
              className="bnc-row"
              style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "6px 10px", borderBottom: "1px solid #f5f5f5" }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={typeTagStyle(p.productType)}>{materialTypeName(p.productType)}</span>
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="bnc-ellipsis" style={{ display: "block", fontWeight: 500 }} title={name}>
                  {name}
                </span>
                <span className="bnc-code">{p.code}</span>
              </span>
              <NumericFormat
                value={m.quantity ?? ""}
                onValueChange={(values) => onQuantity(m.productId, values.floatValue ?? null)}
                allowNegative={false}
                decimalScale={4}
                thousandSeparator="."
                decimalSeparator=","
                customInput={Input}
                className={`bnc-qty${m.quantity == null ? " bnc-input-empty" : ""}`}
                status={qtyBad ? "error" : undefined}
                placeholder="0"
                aria-label={`Lượng tiêu hao / mẫu – ${name}`}
                style={{ width: "100%" }}
              />
              <Select
                aria-label={`Đơn vị tiêu hao – ${name}`}
                value={m.unitId ?? undefined}
                options={p.units.map((u) => ({ value: u.id, label: u.name }))}
                onChange={(v) => onUnit(m.productId, v ?? null)}
                disabled={noUnits}
                placeholder={noUnits ? "Chưa khai báo đơn vị" : "Chọn"}
                title={noUnits ? "Vật tư chưa khai báo đơn vị trong Danh mục vật tư thiết bị" : undefined}
                status={unitBad ? "error" : undefined}
                style={{ width: "100%" }}
              />
              <RemoveButton label={`Xóa ${name}`} onClick={() => onRemove(m.productId)} />
            </div>
          );
        })}
        {rows.length === 0 && (
          <p style={{ margin: 0, padding: "18px 10px", textAlign: "center", fontSize: 13, color: "#595959" }}>
            {picked.length === 0 ? "Chưa có vật tư. Bấm “+ Thêm vật tư” hoặc “Sao chép định mức từ bộ khác”." : "Không có vật tư thuộc loại này."}
          </p>
        )}
      </div>
    </ItemGroup>
  );
};

export default MaterialSection;
