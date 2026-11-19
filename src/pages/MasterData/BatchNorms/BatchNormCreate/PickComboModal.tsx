import React from "react";
import { Button, Checkbox, Input, Modal, Select } from "antd";
import { Link } from "react-router-dom";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { BatchNormComboDto } from "../../../../services/serviceCatalogService";
import {
  SERVICE_DECLARE_URL,
  comboCategoryNameOf,
  comboIndicatorNameOf,
  comboMethodNameOf,
  comboSpecimenNameOf,
  type PickFilter,
  type PickFilterOptions,
  type PickTab,
} from "./utils";

export interface PickComboModalProps {
  open: boolean;
  serviceGroupName: string;
  filter: PickFilter;
  filterOptions: PickFilterOptions;
  tab: PickTab;
  tabCounts: Readonly<Record<PickTab, number>>;
  /** Đã lọc + theo tab, đã sắp xếp */
  rows: BatchNormComboDto[];
  /** Bộ chưa có định mức đang hiển thị (cho "Chọn tất cả") */
  visibleFreeIds: string[];
  selected: ReadonlySet<string>;
  /** Mã định mức sẽ tạo cho từng bộ đã chọn */
  codeById: ReadonlyMap<string, string>;
  codeRange: string;
  onFilterChange: (patch: Partial<PickFilter>) => void;
  onClearFilter: () => void;
  onTabChange: (tab: PickTab) => void;
  onToggle: (testMethodIndicatorId: string) => void;
  onSelectAll: (ids: string[], select: boolean) => void;
  onClearSelected: () => void;
  onClose: () => void;
}

const TABS: { key: PickTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "free", label: "Chưa chọn" },
  { key: "sel", label: "Đã chọn" },
];

const filterLabelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12,
  color: "#595959",
  minWidth: 0,
};

const tabStyle = (on: boolean): React.CSSProperties => ({
  height: 28,
  padding: "0 10px",
  border: 0,
  borderRadius: 6,
  font: "inherit",
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
  ...(on
    ? { background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.12)", color: "#096dd9", fontWeight: 500 }
    : { background: "transparent", color: "#595959" }),
});

const statusOf = (
  c: BatchNormComboDto,
  isSelected: boolean,
  code: string | undefined
): { text: string; style: React.CSSProperties } => {
  if (c.existingNormCode) return { text: `Đã có ${c.existingNormCode}`, style: { color: "#8c8c8c" } };
  if (isSelected) return { text: `Sẽ tạo ${code ?? ""}`.trim(), style: { color: "#237804", fontWeight: 500 } };
  return { text: "Chưa có định mức", style: { color: "#ad4e00" } };
};

const FilterSelect: React.FC<{
  label: string;
  value?: string;
  options: PickFilterOptions["categories"];
  onChange: (value?: string) => void;
}> = ({ label, value, options, onChange }) => (
  <label style={filterLabelStyle}>
    {label}
    <Select
      aria-label={label}
      className={`bnc-filter-select${value ? " is-on" : ""}`}
      value={value}
      options={options}
      allowClear
      placeholder="Tất cả"
      showSearch={{ optionFilterProp: "label" }}
      onChange={(v) => onChange(v ?? undefined)}
      style={{ width: "100%" }}
      notFoundContent="Không có lựa chọn"
    />
  </label>
);

/** Popup chọn các bộ Nền mẫu × Chỉ tiêu × Phương pháp (đã khai báo trong tên dịch vụ) */
const PickComboModal: React.FC<PickComboModalProps> = ({
  open,
  serviceGroupName,
  filter,
  filterOptions,
  tab,
  tabCounts,
  rows,
  visibleFreeIds,
  selected,
  codeById,
  codeRange,
  onFilterChange,
  onClearFilter,
  onTabChange,
  onToggle,
  onSelectAll,
  onClearSelected,
  onClose,
}) => {
  const allVisibleSelected = visibleFreeIds.length > 0 && visibleFreeIds.every((id) => selected.has(id));
  const someVisibleSelected = visibleFreeIds.some((id) => selected.has(id));
  const hasFilter = Boolean(filter.categoryKey || filter.specimenKey || filter.indicatorId || filter.method.trim());
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={1000}
      centered
      destroyOnHidden
      rootClassName="bnc-modal"
      styles={{ body: { padding: 0 } }}
    >
      <div
        role="document"
        aria-labelledby="bnc-pick-title"
        style={{ height: 680, maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            height: 54,
            flex: "none",
            padding: "0 12px 0 20px",
            background: "linear-gradient(90deg, #1e63f8, #009ae3)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <h2 id="bnc-pick-title" className="bnc-ellipsis" style={{ margin: 0, flex: 1, fontSize: 16, lineHeight: "24px", fontWeight: 500, color: "#fff" }}>
            Chọn nền mẫu · chỉ tiêu · phương pháp <span style={{ fontWeight: 400, opacity: 0.9 }}>· {serviceGroupName}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              width: 32,
              height: 32,
              border: 0,
              borderRadius: 8,
              background: "rgba(255,255,255,.16)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div
          style={{
            flex: "none",
            padding: "12px 20px",
            borderBottom: "1px solid #f0f0f0",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <FilterSelect
            label="Nhóm nền mẫu"
            value={filter.categoryKey}
            options={filterOptions.categories}
            onChange={(v) => onFilterChange({ categoryKey: v, specimenKey: undefined, indicatorId: undefined })}
          />
          <FilterSelect
            label="Nền mẫu"
            value={filter.specimenKey}
            options={filterOptions.specimens}
            onChange={(v) => onFilterChange({ specimenKey: v, indicatorId: undefined })}
          />
          <FilterSelect
            label="Chỉ tiêu"
            value={filter.indicatorId}
            options={filterOptions.indicators}
            onChange={(v) => onFilterChange({ indicatorId: v })}
          />
          <label style={filterLabelStyle}>
            Phương pháp
            <Input
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              placeholder="Tìm phương pháp…"
              aria-label="Tìm phương pháp"
              allowClear
              value={filter.method}
              onChange={(e) => onFilterChange({ method: e.target.value })}
            />
          </label>
        </div>

        <div style={{ flex: "none", padding: "8px 20px", display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
          <div role="tablist" aria-label="Xem" style={{ display: "flex", padding: 2, background: "#f0f2f5", borderRadius: 8, gap: 2 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                style={tabStyle(tab === t.key)}
                onClick={() => onTabChange(t.key)}
              >
                {t.label} {tabCounts[t.key]}
              </button>
            ))}
          </div>
          <Checkbox checked={filter.onlyFree} onChange={(e) => onFilterChange({ onlyFree: e.target.checked })}>
            <span style={{ color: "#595959" }}>Ẩn bộ đã có định mức</span>
          </Checkbox>
          {hasFilter && (
            <button type="button" className="bnc-btn-link" style={{ fontSize: 13 }} onClick={onClearFilter}>
              Xóa lọc
            </button>
          )}
          <span style={{ marginLeft: "auto", color: "#595959" }}>{rows.length} bộ đang hiển thị</span>
        </div>

        <div
          role="table"
          aria-label="Bộ nền mẫu × chỉ tiêu × phương pháp"
          style={{ flex: 1, minHeight: 0, overflowY: "auto", margin: "0 20px", border: "1px solid #f0f0f0", borderRadius: 10 }}
        >
          <div role="row" className="bnc-pick-row is-head">
            <span style={{ display: "flex", justifyContent: "center" }}>
              <Checkbox
                aria-label="Chọn tất cả kết quả đang lọc"
                checked={allVisibleSelected}
                indeterminate={!allVisibleSelected && someVisibleSelected}
                disabled={visibleFreeIds.length === 0}
                onChange={() => onSelectAll(visibleFreeIds, !allVisibleSelected)}
              />
            </span>
            <span>Nhóm nền mẫu</span>
            <span>Nền mẫu</span>
            <span>Chỉ tiêu</span>
            <span>Phương pháp</span>
            <span>Trạng thái</span>
          </div>
          {rows.map((c) => {
            const id = c.testMethodIndicatorId;
            const has = Boolean(c.existingNormCode);
            const isSelected = !has && selected.has(id);
            const status = statusOf(c, isSelected, codeById.get(id));
            const specimen = comboSpecimenNameOf(c);
            const indicator = comboIndicatorNameOf(c);
            const method = comboMethodNameOf(c);
            return (
              <label
                key={id}
                role="row"
                className={`bnc-pick-row${has ? " is-has" : isSelected ? " is-selected" : " bnc-row"}`}
              >
                <span style={{ display: "flex", justifyContent: "center" }}>
                  <Checkbox
                    checked={isSelected || has}
                    disabled={has}
                    aria-label={`${specimen} – ${indicator} – ${method}`}
                    onChange={() => onToggle(id)}
                  />
                </span>
                <span className="bnc-ellipsis" style={{ fontSize: 12, color: "#595959" }} title={comboCategoryNameOf(c)}>
                  {comboCategoryNameOf(c)}
                </span>
                <span className="bnc-ellipsis" title={specimen}>
                  {specimen}
                </span>
                <span className="bnc-ellipsis" style={{ fontWeight: 500 }} title={indicator}>
                  {indicator}
                </span>
                <span className="bnc-ellipsis" title={method}>
                  {method}
                </span>
                <span style={{ fontSize: 12, whiteSpace: "nowrap", ...status.style }}>{status.text}</span>
              </label>
            );
          })}
          {rows.length === 0 && (
            <p style={{ margin: 0, padding: "32px 12px", textAlign: "center", fontSize: 13, color: "#595959" }}>
              {tab === "sel" ? "Chưa chọn bộ nào trong phạm vi lọc." : "Không có bộ nào khớp bộ lọc."}
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
            Đã chọn <strong style={{ color: "#096dd9", fontWeight: 500 }}>{selected.size}</strong> bộ · {codeRange}
          </span>
          {selected.size > 0 && (
            <button type="button" className="bnc-btn-link" style={{ fontSize: 13, color: "#cf1322" }} onClick={onClearSelected}>
              Bỏ chọn tất cả
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#595959" }}>
            Không tìm thấy? Khai báo ở <Link to={SERVICE_DECLARE_URL}>Phiếu khai báo dịch vụ</Link>
          </span>
          <Button type="primary" style={{ height: 38, padding: "0 18px", borderRadius: 8, fontWeight: 500 }} onClick={onClose}>
            Xong
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PickComboModal;
