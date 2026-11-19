import React from "react";
import StepLabel, { type StepState } from "../../ServiceDeclare/ServiceDeclare/StepLabel";
import EquipmentSection, { type EquipmentSectionProps } from "./EquipmentSection";
import MaterialSection, { type MaterialSectionProps } from "./MaterialSection";

export interface ItemsPanelProps {
  step: StepState;
  createCount: number;
  /** "2 vật tư chưa nhập lượng · 1 thiết bị chưa nhập công suất" — rỗng thì ẩn */
  missingText: string;
  materials: MaterialSectionProps;
  equipments: EquipmentSectionProps;
}

/** ② Vật tư & thiết bị — dùng chung cho mọi định mức sẽ tạo */
const ItemsPanel: React.FC<ItemsPanelProps> = ({ step, createCount, missingText, materials, equipments }) => (
  <section aria-label="Vật tư và thiết bị" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", background: "#fafcff" }}>
      <StepLabel
        index={2}
        state={step}
        title="Vật tư & thiết bị"
        hint={`cho 1 mẫu, dùng chung cho ${createCount} định mức`}
        extra={
          missingText ? (
            <span
              style={{
                fontSize: 12,
                lineHeight: "22px",
                padding: "0 10px",
                borderRadius: 11,
                background: "#fff7e6",
                color: "#ad4e00",
                border: "1px solid #ffd591",
                whiteSpace: "nowrap",
              }}
            >
              {missingText}
            </span>
          ) : undefined
        }
      />
    </div>
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14, background: "#fafcff" }}>
      <MaterialSection {...materials} />
      <EquipmentSection {...equipments} />
    </div>
  </section>
);

export default ItemsPanel;
