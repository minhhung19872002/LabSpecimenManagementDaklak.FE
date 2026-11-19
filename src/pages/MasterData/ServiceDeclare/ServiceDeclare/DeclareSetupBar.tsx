import React from "react";
import { AutoComplete, Checkbox, Popover, Select, Tag } from "antd";
import type { ServiceGroupDto } from "../../../../services/serviceCatalogService";
import StepLabel, { type StepState } from "./StepLabel";
import SpecimenPickerPanel, { type SpecimenPickerPanelProps } from "./SpecimenPickerPanel";
import { filterServiceGroups, normalizeSearch } from "./utils";

export interface DeclareSetupBarProps {
  /** ① Tên dịch vụ: gõ tên mới hoặc chọn dịch vụ có sẵn */
  serviceName: string;
  serviceGroups: ServiceGroupDto[];
  onServiceNameChange: (name: string) => void;
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
  step3: StepState;
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

const optionRowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const newOptionStyle: React.CSSProperties = { color: "#096dd9" };
const hintStyle: React.CSSProperties = { fontSize: 12, lineHeight: "18px", color: "#595959" };

/** Bước ① Tên dịch vụ + ② Phương pháp + ③ Nền mẫu */
const DeclareSetupBar: React.FC<DeclareSetupBarProps> = ({
  serviceName,
  serviceGroups,
  onServiceNameChange,
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
  step3,
}) => {
  const specimenOk = allSpecimens || selectedSpecimens.length > 0;
  const trimmedName = serviceName.trim();
  const { items: matchedGroups, exact } = filterServiceGroups(serviceGroups, serviceName);
  const serviceOptions = [
    ...matchedGroups.map((g) => ({
      value: g.name,
      label: (
        <span style={optionRowStyle}>
          <span style={{ flex: 1, minWidth: 0, fontWeight: g === exact ? 500 : undefined }}>{g.name}</span>
          <span style={{ fontSize: 12, color: "#595959" }}>{g.code}</span>
        </span>
      ),
    })),
    ...(trimmedName && !exact
      ? [{ value: trimmedName, label: <span style={newOptionStyle}>+ Dùng tên mới “{trimmedName}”</span> }]
      : []),
  ];
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
      <div style={{ flex: "0 1 320px", minWidth: 260, display: "flex", flexDirection: "column", gap: 6 }}>
        <StepLabel index={1} state={step1} title="Tên dịch vụ" required />
        <AutoComplete
          allowClear
          size="large"
          aria-label="Tên dịch vụ"
          placeholder="Nhập hoặc chọn tên dịch vụ…"
          style={{ width: "100%" }}
          status={trimmedName ? undefined : "error"}
          value={serviceName}
          options={serviceOptions}
          filterOption={false}
          maxLength={256}
          onChange={(v) => onServiceNameChange(v ?? "")}
        />
        {trimmedName && (
          <span style={hintStyle}>{exact ? `Dịch vụ có sẵn · ${exact.code}` : "Tên mới — sẽ tạo nhóm dịch vụ mới"}</span>
        )}
      </div>
      <div style={{ flex: "0 1 320px", minWidth: 260, display: "flex", flexDirection: "column", gap: 6 }}>
        <StepLabel index={2} state={step2} title="Phương pháp" required />
        <Select
          showSearch
          allowClear
          size="large"
          aria-label="Phương pháp"
          placeholder="Chọn phương pháp…"
          style={{ width: "100%" }}
          disabled={!trimmedName}
          value={testMethodId}
          options={methodOptions}
          filterOption={filterMethod}
          onChange={(v) => onTestMethodChange(v ?? undefined)}
        />
      </div>
      <div style={{ flex: "1 1 480px", minWidth: 300, display: "flex", flexDirection: "column", gap: 6 }}>
        <StepLabel
          index={3}
          state={step3}
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
