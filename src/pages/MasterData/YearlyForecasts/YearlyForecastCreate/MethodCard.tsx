import React from "react";
import { Input } from "antd";
import { Link } from "react-router-dom";
import { NumericFormat } from "react-number-format";
import type { ForecastQuantityMode } from "../../../../services/serviceCatalogService";
import { BATCH_NORM_CREATE_PATH } from "../../BatchNorms/BatchNormCreate/utils";
import EquipmentList from "./EquipmentList";
import { ChevronDown, CopyIcon, FlaskIcon, LinkIcon, MonitorIcon, TrashIcon } from "./icons";
import MaterialTable from "./MaterialTable";
import type { EquipmentRowView, MaterialRowView } from "./utils";

export interface MethodCardView {
  id: string;
  methodName: string;
  /** linked = đang áp dụng tiêu hao theo bộ khác */
  status: "linked" | "norm" | "none";
  /** Số bộ trong phiếu đang áp dụng tiêu hao theo bộ này */
  srcCount: number;
  samples: number | null;
  samplesError: boolean;
  sourceId: string;
  sourceLabel: string;
  canApply: boolean;
  open: boolean;
  materialOpen: boolean;
  equipmentOpen: boolean;
  materials: MaterialRowView[];
  equipments: EquipmentRowView[];
  materialExtraCount: number;
  equipmentExtraCount: number;
  hiddenMaterials: number;
  hiddenEquipments: number;
}

export interface MethodCardHandlers {
  onToggle: (id: string) => void;
  onToggleMaterials: (id: string) => void;
  onToggleEquipments: (id: string) => void;
  onSamples: (id: string, samples: number | null) => void;
  onOpenApply: (id: string) => void;
  onRemoveCombo: (id: string) => void;
  onGoSource: (sourceId: string) => void;
  onUnlink: (id: string) => void;
  onAddMaterial: (id: string) => void;
  onAddEquipment: (id: string) => void;
  onExtraQuantity: (id: string, productId: string, quantity: number | null) => void;
  onExtraUnit: (id: string, productId: string, unitId: string) => void;
  onExtraMode: (id: string, productId: string, mode: ForecastQuantityMode) => void;
  onRemoveMaterial: (id: string, productId: string, isExtra: boolean) => void;
  onRemoveEquipment: (id: string, productId: string, isExtra: boolean) => void;
  onRestoreMaterials: (id: string) => void;
  onRestoreEquipments: (id: string) => void;
}

export interface MethodCardProps extends MethodCardHandlers {
  method: MethodCardView;
}

const STATUS: Record<MethodCardView["status"], { text: string; style: React.CSSProperties }> = {
  linked: { text: "🔗 Áp dụng tiêu hao", style: { background: "#f0f5ff", color: "#1d39c4", border: "1px solid #adc6ff" } },
  norm: { text: "✓ Có định mức", style: { background: "#f6ffed", color: "#237804", border: "1px solid #b7eb8f" } },
  none: { text: "Chưa có định mức", style: { background: "#fffbe6", color: "#ad4e00", border: "1px solid #ffd591" } },
};

const linkBtn = (color: string): React.CSSProperties => ({
  border: 0,
  padding: 0,
  background: "transparent",
  color,
  font: "inherit",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
});

const addBtnStyle = (color: string): React.CSSProperties => ({
  marginLeft: "auto",
  height: 26,
  padding: "0 8px",
  border: `1px dashed ${color}`,
  borderRadius: 6,
  background: "#fff",
  color,
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

const countBadge = (bg: string): React.CSSProperties => ({
  minWidth: 20,
  height: 18,
  padding: "0 6px",
  boxSizing: "border-box",
  borderRadius: 9,
  background: bg,
  color: "#fff",
  fontSize: 11,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

const HiddenLine: React.FC<{ text: string; onRestore: () => void }> = ({ text, onRestore }) => (
  <p
    style={{
      margin: 0,
      padding: "6px 10px",
      borderTop: "1px dashed #f0f0f0",
      fontSize: 12,
      color: "#8c8c8c",
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}
  >
    {text}
    <button type="button" onClick={onRestore} style={{ ...linkBtn("#096dd9"), fontSize: 12 }}>
      Khôi phục
    </button>
  </p>
);

const EmptyLine: React.FC<{ text: string }> = ({ text }) => (
  <p style={{ margin: 0, padding: "12px 10px", fontSize: 12, color: "#8c8c8c", borderTop: "1px solid #f5f5f5" }}>{text}</p>
);

const SectionBox: React.FC<{
  title: string;
  count: number;
  extraCount: number;
  open: boolean;
  colors: { border: string; from: string; fg: string; badge: string };
  icon: React.ReactNode;
  addLabel: string;
  showAdd: boolean;
  onToggle: () => void;
  onAdd: () => void;
  children: React.ReactNode;
}> = ({ title, count, extraCount, open, colors, icon, addLabel, showAdd, onToggle, onAdd, children }) => (
  <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
    <div
      style={{
        height: 36,
        padding: "0 10px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: `linear-gradient(90deg, ${colors.from}, #ffffff)`,
        color: colors.fg,
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`Thu gọn / mở ${title.toLowerCase()}`}
        style={{
          width: 22,
          height: 22,
          flex: "none",
          marginLeft: -4,
          border: 0,
          borderRadius: 5,
          background: "transparent",
          color: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <ChevronDown open={open} size={13} />
      </button>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          background: colors.badge,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      {title} <span style={countBadge(colors.badge)}>{count}</span>
      {extraCount > 0 && (
        <span style={{ fontSize: 11, fontWeight: 400, color: "#595959", whiteSpace: "nowrap" }}>· {extraCount} bổ sung</span>
      )}
      {showAdd && (
        <button type="button" style={addBtnStyle(colors.badge)} onClick={onAdd}>
          + {addLabel}
        </button>
      )}
    </div>
    {open && children}
  </div>
);

/** Thẻ 1 phương pháp: số mẫu / năm + vật tư & thiết bị dự toán */
const MethodCard: React.FC<MethodCardProps> = ({ method: m, ...h }) => {
  const linked = m.status === "linked";
  const status = STATUS[m.status];
  const empty = !(m.samples && m.samples > 0);
  return (
    <section
      aria-label={`Phương pháp ${m.methodName}`}
      id={`yfc-method-${m.id}`}
      style={{
        flex: "none",
        border: "1px solid #d9d9d9",
        borderRadius: 12,
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          minHeight: 56,
          boxSizing: "border-box",
          padding: "8px 12px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <button
          type="button"
          onClick={() => h.onToggle(m.id)}
          aria-expanded={m.open}
          aria-label={`Thu gọn / mở ${m.methodName}`}
          style={{
            width: 28,
            height: 28,
            flex: "none",
            border: 0,
            borderRadius: 6,
            background: "#f5f5f5",
            color: "#595959",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronDown open={m.open} />
        </button>
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: "0 1 auto", lineHeight: "20px" }}>
          <span style={{ fontSize: 12, color: "#8c8c8c" }}>Phương pháp</span>
          <strong className="bnc-ellipsis" title={m.methodName} style={{ fontSize: 15, fontWeight: 600, color: "#141414" }}>
            {m.methodName}
          </strong>
        </span>
        <span
          style={{ flex: "none", fontSize: 12, lineHeight: "20px", padding: "0 8px", borderRadius: 10, whiteSpace: "nowrap", ...status.style }}
        >
          {status.text}
        </span>
        {m.srcCount > 0 && (
          <span
            style={{
              flex: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              lineHeight: "20px",
              padding: "0 8px",
              borderRadius: 10,
              background: "#f0f5ff",
              color: "#1d39c4",
              border: "1px solid #adc6ff",
              whiteSpace: "nowrap",
            }}
          >
            <LinkIcon />
            Đang áp dụng cho {m.srcCount} bộ khác
          </span>
        )}
        <label
          className="yfc-num"
          style={{
            marginLeft: "auto",
            height: 40,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            borderRadius: 8,
            cursor: "text",
            border: `1px ${m.samplesError ? "solid #ff4d4f" : empty ? "dashed #ffc53d" : "solid #91caff"}`,
            background: empty ? "#fffbe6" : "#f5faff",
          }}
        >
          <span style={{ flex: "none", fontSize: 12, color: "#595959" }}>
            Số mẫu / năm <span style={{ color: "#cf1322" }}>*</span>
          </span>
          <NumericFormat
            value={m.samples ?? ""}
            onValueChange={(v) => h.onSamples(m.id, v.floatValue ?? null)}
            allowNegative={false}
            decimalScale={0}
            thousandSeparator="."
            decimalSeparator=","
            customInput={Input}
            placeholder="Nhập"
            aria-label={`Số mẫu / năm – ${m.methodName}`}
            status={m.samplesError ? "error" : undefined}
          />
          <span style={{ flex: "none", fontSize: 12, color: "#8c8c8c" }}>mẫu</span>
        </label>
        {m.canApply && (
          <button
            type="button"
            className="yfc-btn"
            onClick={() => h.onOpenApply(m.id)}
            title="Dùng tiêu hao của phương pháp này cho nền mẫu / chỉ tiêu khác"
            style={{
              flex: "none",
              height: 32,
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
            }}
          >
            <CopyIcon />
            Áp dụng cho bộ khác
          </button>
        )}
        <button
          type="button"
          className="bnc-del"
          onClick={() => h.onRemoveCombo(m.id)}
          aria-label={`Bỏ phương pháp ${m.methodName}`}
          title="Bỏ phương pháp này khỏi phiếu"
        >
          <TrashIcon />
        </button>
      </div>

      {linked && (
        <div
          style={{
            padding: "8px 12px",
            background: "#f0f5ff",
            borderBottom: "1px solid #d6e4ff",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px 10px",
            fontSize: 13,
            color: "#1d39c4",
          }}
        >
          <LinkIcon />
          <span>
            Tiêu hao đang áp dụng theo <strong style={{ fontWeight: 600 }}>{m.sourceLabel}</strong> · số mẫu / năm nhập riêng cho
            bộ này
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button type="button" style={linkBtn("#096dd9")} onClick={() => h.onGoSource(m.sourceId)}>
              Xem bộ gốc
            </button>
            <button type="button" style={linkBtn("#cf1322")} onClick={() => h.onUnlink(m.id)}>
              Ngắt áp dụng
            </button>
          </span>
        </div>
      )}

      {m.open && (
        <>
          {m.status === "none" && (
            <div
              style={{
                margin: "12px 12px 0",
                padding: "10px 12px",
                borderRadius: 8,
                background: "#fffbe6",
                border: "1px solid #ffe58f",
                color: "#614700",
                fontSize: 13,
              }}
            >
              Phương pháp này chưa có định mức theo mẻ. Bạn có thể bấm “+ Thêm vật tư” bên dưới để dự toán tạm, hoặc khai báo định
              mức tại <Link to={BATCH_NORM_CREATE_PATH}>Phiếu khai báo định mức theo mẻ</Link>.
            </div>
          )}
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionBox
              title="Vật tư"
              count={m.materials.length}
              extraCount={m.materialExtraCount}
              open={m.materialOpen}
              colors={{ border: "#adc6ff", from: "#f0f5ff", fg: "#10239e", badge: "#2f54eb" }}
              icon={<FlaskIcon />}
              addLabel="Thêm vật tư"
              showAdd={!linked}
              onToggle={() => h.onToggleMaterials(m.id)}
              onAdd={() => h.onAddMaterial(m.id)}
            >
              <MaterialTable
                comboId={m.id}
                methodName={m.methodName}
                rows={m.materials}
                readOnly={linked}
                onQuantity={h.onExtraQuantity}
                onUnit={h.onExtraUnit}
                onMode={h.onExtraMode}
                onRemove={h.onRemoveMaterial}
              />
              {!linked && m.hiddenMaterials > 0 && (
                <HiddenLine
                  text={`Đã bỏ ${m.hiddenMaterials} vật tư khỏi dự toán ·`}
                  onRestore={() => h.onRestoreMaterials(m.id)}
                />
              )}
              {m.materials.length === 0 && <EmptyLine text="Chưa có vật tư. Bấm “+ Thêm vật tư” để bổ sung." />}
            </SectionBox>
            <SectionBox
              title="Thiết bị"
              count={m.equipments.length}
              extraCount={m.equipmentExtraCount}
              open={m.equipmentOpen}
              colors={{ border: "#87e8de", from: "#e6fffb", fg: "#00474f", badge: "#13a8a8" }}
              icon={<MonitorIcon />}
              addLabel="Thêm thiết bị"
              showAdd={!linked}
              onToggle={() => h.onToggleEquipments(m.id)}
              onAdd={() => h.onAddEquipment(m.id)}
            >
              <EquipmentList comboId={m.id} rows={m.equipments} readOnly={linked} onRemove={h.onRemoveEquipment} />
              {!linked && m.hiddenEquipments > 0 && (
                <HiddenLine
                  text={`Đã bỏ ${m.hiddenEquipments} thiết bị khỏi dự toán ·`}
                  onRestore={() => h.onRestoreEquipments(m.id)}
                />
              )}
              {m.equipments.length === 0 && <EmptyLine text="Chưa có thiết bị. Bấm “+ Thêm thiết bị” để bổ sung." />}
            </SectionBox>
          </div>
        </>
      )}
    </section>
  );
};

export default MethodCard;
