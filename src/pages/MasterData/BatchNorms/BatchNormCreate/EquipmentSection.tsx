import React from "react";
import { Input, Select } from "antd";
import { NumericFormat } from "react-number-format";
import { ProductType } from "../../../../services/productService";
import type { BatchNormProductOptionDto } from "../../../../services/serviceCatalogService";
import ItemGroup, { AddItemButton } from "./ItemGroup";
import { RemoveButton } from "./MaterialSection";
import { equipmentTypeName, isPositive, productNameOf, typeTagStyle, type PickedEquipment } from "./utils";

export interface EquipmentSectionProps {
  picked: PickedEquipment[];
  productById: ReadonlyMap<string, BatchNormProductOptionDto>;
  capacityUnits: string[];
  missingCount: number;
  open: boolean;
  tried: boolean;
  onToggleOpen: () => void;
  onOpenAdd: () => void;
  onCapacity: (productId: string, capacity: number | null) => void;
  onCapacityUnit: (productId: string, unit: string) => void;
  onRemove: (productId: string) => void;
}

const GRID = "130px minmax(0, 1fr) 290px 40px";
const headCell: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#006d75" };
const EQUIPMENT_TAG = typeTagStyle(ProductType.Equipment);

/** Nhóm Thiết bị: nút thêm + bảng công suất sử dụng */
const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  picked,
  productById,
  capacityUnits,
  missingCount,
  open,
  tried,
  onToggleOpen,
  onOpenAdd,
  onCapacity,
  onCapacityUnit,
  onRemove,
}) => (
  <ItemGroup
    title="Thiết bị"
    count={picked.length}
    open={open}
    theme={{ border: "#87e8de", headBg: "linear-gradient(90deg, #e6fffb, #ffffff)", fg: "#006d75", countBg: "#13a8a8" }}
    missingText={missingCount > 0 ? `${missingCount} thiếu công suất` : undefined}
    onToggle={onToggleOpen}
    addBox={<AddItemButton label="Thêm thiết bị" color="#13a8a8" onClick={onOpenAdd} />}
  >
    <div role="table" aria-label="Thiết bị sử dụng" style={{ padding: 12 }}>
      <div
        role="row"
        style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "8px 10px", background: "#f0fffd", borderRadius: 8 }}
      >
        <span role="columnheader" style={headCell}>
          Loại thiết bị
        </span>
        <span role="columnheader" style={headCell}>
          Tên thiết bị
        </span>
        <span role="columnheader" style={headCell}>
          Công suất sử dụng <span style={{ color: "#cf1322" }}>*</span>
        </span>
        <span />
      </div>
      {picked.map((e) => {
        const p = productById.get(e.productId);
        if (!p) return null;
        const name = productNameOf(p);
        const capBad = tried && !isPositive(e.capacity);
        return (
          <div
            key={e.productId}
            role="row"
            className="bnc-row"
            style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "6px 10px", borderBottom: "1px solid #f5f5f5" }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={EQUIPMENT_TAG}>{equipmentTypeName()}</span>
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="bnc-ellipsis" style={{ display: "block", fontWeight: 500 }} title={name}>
                {name}
              </span>
              <span className="bnc-code">{p.code}</span>
            </span>
            <span style={{ display: "flex", gap: 8 }}>
              <NumericFormat
                value={e.capacity ?? ""}
                onValueChange={(values) => onCapacity(e.productId, values.floatValue ?? null)}
                allowNegative={false}
                decimalScale={4}
                thousandSeparator="."
                decimalSeparator=","
                customInput={Input}
                className={`bnc-qty${e.capacity == null ? " bnc-input-empty" : ""}`}
                status={capBad ? "error" : undefined}
                placeholder="0"
                aria-label={`Công suất sử dụng – ${name}`}
                style={{ width: 120, flex: "none" }}
              />
              <Select
                aria-label={`Đơn vị công suất – ${name}`}
                value={e.capacityUnit || undefined}
                options={capacityUnits.map((u) => ({ value: u, label: u }))}
                onChange={(v) => onCapacityUnit(e.productId, v)}
                status={tried && !e.capacityUnit ? "error" : undefined}
                style={{ width: 150, flex: "none" }}
              />
            </span>
            <RemoveButton label={`Xóa ${name}`} onClick={() => onRemove(e.productId)} />
          </div>
        );
      })}
      {picked.length === 0 && (
        <p style={{ margin: 0, padding: "18px 10px", textAlign: "center", fontSize: 13, color: "#595959" }}>
          Chưa có thiết bị. Bấm “+ Thêm thiết bị” hoặc “Sao chép định mức từ bộ khác”.
        </p>
      )}
    </div>
  </ItemGroup>
);

export default EquipmentSection;
