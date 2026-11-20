import React from "react";
import { Input, Select } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { FilterOption, ForecastScope } from "./utils";

export interface ForecastToolbarProps {
  keyword: string;
  categoryKey?: string;
  specimenKey?: string;
  testMethodId?: string;
  scope: ForecastScope;
  categoryOptions: FilterOption[];
  specimenOptions: FilterOption[];
  methodOptions: FilterOption[];
  /** Số dòng theo bộ lọc (trừ phạm vi): đã có / chưa có dự toán */
  scopeCounts: Readonly<Record<ForecastScope, number>>;
  hasFilter: boolean;
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value?: string) => void;
  onSpecimenChange: (value?: string) => void;
  onTestMethodChange: (value?: string) => void;
  onScopeChange: (value: ForecastScope) => void;
  onClearFilter: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

const SCOPES: { key: ForecastScope; label: string }[] = [
  { key: "has", label: "Đã có dự toán" },
  { key: "missing", label: "Chưa có dự toán" },
];

const selectClass = (value?: string) => `svc-filterbar-select bn-filter-select${value ? " is-on" : ""}`;

/** Thanh lọc: tìm kiếm · nhóm nền mẫu · nền mẫu · phương pháp · đã có / chưa có dự toán · mở / thu gọn */
const ForecastToolbar: React.FC<ForecastToolbarProps> = ({
  keyword,
  categoryKey,
  specimenKey,
  testMethodId,
  scope,
  categoryOptions,
  specimenOptions,
  methodOptions,
  scopeCounts,
  hasFilter,
  onKeywordChange,
  onCategoryChange,
  onSpecimenChange,
  onTestMethodChange,
  onScopeChange,
  onClearFilter,
  onExpandAll,
  onCollapseAll,
}) => (
  <div className="svc-filterbar">
    <Input
      className="svc-filterbar-search"
      prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
      placeholder="Tìm nền mẫu, chỉ tiêu, phương pháp…"
      aria-label="Tìm nền mẫu, chỉ tiêu, phương pháp"
      allowClear
      value={keyword}
      onChange={(e) => onKeywordChange(e.target.value)}
    />
    <Select
      className={selectClass(categoryKey)}
      aria-label="Lọc nhóm nền mẫu"
      placeholder={`Mọi nhóm nền mẫu (${categoryOptions.length})`}
      allowClear
      showSearch={{ optionFilterProp: "label" }}
      options={categoryOptions}
      value={categoryKey}
      onChange={(v) => onCategoryChange(v ?? undefined)}
      popupMatchSelectWidth={320}
    />
    <Select
      className={selectClass(specimenKey)}
      aria-label="Lọc nền mẫu"
      placeholder={`Mọi nền mẫu (${specimenOptions.length})`}
      allowClear
      showSearch={{ optionFilterProp: "label" }}
      options={specimenOptions}
      value={specimenKey}
      onChange={(v) => onSpecimenChange(v ?? undefined)}
      popupMatchSelectWidth={360}
    />
    <Select
      className={selectClass(testMethodId)}
      aria-label="Lọc phương pháp"
      placeholder={`Mọi phương pháp (${methodOptions.length})`}
      allowClear
      showSearch={{ optionFilterProp: "label" }}
      options={methodOptions}
      value={testMethodId}
      onChange={(v) => onTestMethodChange(v ?? undefined)}
      popupMatchSelectWidth={360}
    />
    <div className="svc-seg" role="group" aria-label="Lọc theo dự toán">
      {SCOPES.map((s) => (
        <button
          key={s.key}
          type="button"
          className={`svc-seg-btn${scope === s.key ? " is-on" : ""}`}
          aria-pressed={scope === s.key}
          onClick={() => onScopeChange(s.key)}
        >
          {s.label}
          <span className="bn-seg-badge">{scopeCounts[s.key]}</span>
        </button>
      ))}
    </div>
    {hasFilter && (
      <button type="button" className="svc-link-btn" onClick={onClearFilter}>
        Xóa lọc
      </button>
    )}
    <div className="yf-filter-actions">
      <button type="button" className="bn-btn" onClick={onExpandAll}>
        Mở tất cả
      </button>
      <button type="button" className="bn-btn" onClick={onCollapseAll}>
        Thu gọn tất cả
      </button>
    </div>
  </div>
);

export default ForecastToolbar;
