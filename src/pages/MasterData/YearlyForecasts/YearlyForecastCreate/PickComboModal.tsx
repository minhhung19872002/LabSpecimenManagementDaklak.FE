import React from "react";
import { Button, Checkbox, Input, Modal, Select } from "antd";
import { Link } from "react-router-dom";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { ForecastComboDto } from "../../../../services/serviceCatalogService";
import {
  SERVICE_DECLARE_URL,
  comboCategoryNameOf,
  comboIndicatorNameOf,
  comboMethodNameOf,
  comboSpecimenNameOf,
  hasPickFilter,
  type PickFilterOptions,
} from "../../BatchNorms/BatchNormCreate/utils";
import { ModalHeader } from "./icons";
import { hasNorm, hasSavedForecast, type PickFilter, type PickTab } from "./utils";

export interface PickComboModalProps {
  open: boolean;
  year: number;
  filter: PickFilter;
  filterOptions: PickFilterOptions;
  tab: PickTab;
  tabCounts: Readonly<Record<PickTab, number>>;
  rows: ForecastComboDto[];
  /** Bộ chọn được đang hiển thị (cho "Chọn tất cả") */
  visibleFreeIds: string[];
  selected: ReadonlySet<string>;
  /** Bộ không chọn được (phiếu tạo: đã có dự toán) */
  lockedIds: ReadonlySet<string>;
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

const statusOf = (c: ForecastComboDto, year: number, isSelected: boolean): { text: string; style: React.CSSProperties } => {
  if (isSelected) return { text: "Đã chọn", style: { color: "#237804", fontWeight: 500 } };
  if (hasSavedForecast(c)) return { text: `Đã có dự toán ${year}`, style: { color: "#8c8c8c" } };
  if (!hasNorm(c)) return { text: "Chưa có định mức", style: { color: "#ad4e00" } };
  return { text: "Chưa có dự toán", style: { color: "#595959" } };
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

/** Popup chọn các bộ Nền mẫu × Chỉ tiêu × Phương pháp cho dự toán năm */
const PickComboModal: React.FC<PickComboModalProps> = ({
  open,
  year,
  filter,
  filterOptions,
  tab,
  tabCounts,
  rows,
  visibleFreeIds,
  selected,
  lockedIds,
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
        aria-labelledby="yfc-pick-title"
        style={{ height: 680, maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}
      >
        <ModalHeader
          id="yfc-pick-title"
          title={
            <>
              Chọn nền mẫu · chỉ tiêu · phương pháp <span style={{ fontWeight: 400, opacity: 0.9 }}>· dự toán {year}</span>
            </>
          }
          onClose={onClose}
        />

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
            <span style={{ color: "#595959" }}>Ẩn bộ đã có dự toán {year}</span>
          </Checkbox>
          {hasPickFilter(filter) && (
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
            const locked = lockedIds.has(id);
            const isSelected = !locked && selected.has(id);
            const status = statusOf(c, year, isSelected);
            const specimen = comboSpecimenNameOf(c);
            const indicator = comboIndicatorNameOf(c);
            const method = comboMethodNameOf(c);
            return (
              <label
                key={id}
                role="row"
                className={`bnc-pick-row${locked ? " is-has" : isSelected ? " is-selected" : " bnc-row"}`}
              >
                <span style={{ display: "flex", justifyContent: "center" }}>
                  <Checkbox
                    checked={isSelected || locked}
                    disabled={locked}
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
            Đã chọn <strong style={{ color: "#096dd9", fontWeight: 500 }}>{selected.size}</strong> bộ
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
