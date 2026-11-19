import React from "react";
import { Checkbox, Popover, Select, Tag } from "antd";
import StepLabel, { type StepState } from "./StepLabel";
import SpecimenPickerPanel, { type SpecimenPickerPanelProps } from "./SpecimenPickerPanel";
import { normalizeSearch } from "./utils";

export interface DeclareSetupBarProps {
  methodOptions: { value: string; label: string }[];
  testMethodId?: string;
  onTestMethodChange: (id: string | undefined) => void;
  allSpecimens: boolean;
  onAllSpecimensChange: (value: boolean) => void;
  selectedSpecimens: { id: string; name: string }[];
  onRemoveSpecimen: (id: string) => void;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  picker: SpecimenPickerPanelProps;
  step1: StepState;
  step2: StepState;
}

const chipStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: "100%",
  height: 26,
  display: "inline-flex",
  alignItems: "center",
  fontSize: 13,
  background: "#e6f4ff",
  borderColor: "#91caff",
  color: "#0958d9",
};
const chipTextStyle: React.CSSProperties = { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const addChipStyle: React.CSSProperties = {
  height: 26,
  padding: "0 8px",
  border: "1px dashed #d9d9d9",
  borderRadius: 4,
  background: "#fff",
  color: "#096dd9",
  font: "inherit",
  fontSize: 13,
  cursor: "pointer",
};

const filterMethod = (input: string, option?: { label?: React.ReactNode }) =>
  normalizeSearch(String(option?.label ?? "")).includes(normalizeSearch(input));

/** Bước ① Phương pháp + ② Nền mẫu */
const DeclareSetupBar: React.FC<DeclareSetupBarProps> = ({
  methodOptions,
  testMethodId,
  onTestMethodChange,
  allSpecimens,
  onAllSpecimensChange,
  selectedSpecimens,
  onRemoveSpecimen,
  pickerOpen,
  onPickerOpenChange,
  picker,
  step1,
  step2,
}) => {
  const specimenOk = allSpecimens || selectedSpecimens.length > 0;
  return (
    <div
      style={{
        padding: "14px 20px",
        borderBottom: "1px solid #bae0ff",
        background: "#f5faff",
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: "0 1 360px", minWidth: 260, display: "flex", flexDirection: "column", gap: 6 }}>
        <StepLabel index={1} state={step1} title="Phương pháp" required />
        <Select
          showSearch
          allowClear
          size="large"
          aria-label="Phương pháp"
          placeholder="Chọn phương pháp…"
          style={{ width: "100%" }}
          value={testMethodId}
          options={methodOptions}
          filterOption={filterMethod}
          onChange={(v) => onTestMethodChange(v ?? undefined)}
        />
      </div>
      <div style={{ flex: "1 1 480px", minWidth: 300, display: "flex", flexDirection: "column", gap: 6 }}>
        <StepLabel
          index={2}
          state={step2}
          title="Nền mẫu"
          required
          extra={
            <Checkbox checked={allSpecimens} onChange={(e) => onAllSpecimensChange(e.target.checked)} style={{ color: "#595959" }}>
              Mọi nền mẫu (1 giá chung)
            </Checkbox>
          }
        />
        <div
          style={{
            minHeight: 40,
            boxSizing: "border-box",
            border: `1px solid ${specimenOk ? "#d9d9d9" : "#ffa39e"}`,
            borderRadius: 8,
            background: "#fff",
            padding: "5px 6px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 4,
          }}
        >
          {allSpecimens ? (
            <Tag style={chipStyle}>Mọi nền mẫu</Tag>
          ) : (
            <>
              {selectedSpecimens.map((s) => (
                <Tag key={s.id} closable title={s.name} style={chipStyle} onClose={() => onRemoveSpecimen(s.id)}>
                  <span style={chipTextStyle}>{s.name}</span>
                </Tag>
              ))}
              <Popover
                open={pickerOpen}
                onOpenChange={onPickerOpenChange}
                trigger="click"
                placement="bottomLeft"
                content={<SpecimenPickerPanel {...picker} />}
              >
                <button type="button" style={addChipStyle} aria-expanded={pickerOpen}>
                  + Chọn nền mẫu
                </button>
              </Popover>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeclareSetupBar;
