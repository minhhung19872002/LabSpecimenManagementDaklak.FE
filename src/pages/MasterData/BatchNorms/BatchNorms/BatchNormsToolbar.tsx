import React from "react";
import { Input, Select } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { FilterOption } from "../../ServiceCatalog/ServiceCatalog/utils";
import type { NormStatusFilter } from "./utils";

export interface BatchNormsToolbarProps {
  keyword: string;
  categoryKey?: string;
  specimenKey?: string;
  testMethodId?: string;
  status: NormStatusFilter;
  categoryOptions: FilterOption[];
  specimenOptions: FilterOption[];
  methodOptions: FilterOption[];
  /** Số định mức theo bộ lọc (trừ trạng thái): tất cả / đang / ngừng */
  statusCounts: Readonly<Record<NormStatusFilter, number>>;
  hasFilter: boolean;
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value?: string) => void;
  onSpecimenChange: (value?: string) => void;
  onTestMethodChange: (value?: string) => void;
  onStatusChange: (value: NormStatusFilter) => void;
  onClearFilter: () => void;
}

const STATUS_FILTERS: { key: NormStatusFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "on", label: "Đang sử dụng" },
  { key: "off", label: "Ngừng sử dụng" },
];

const selectClass = (value?: string) => `svc-filterbar-select bn-filter-select${value ? " is-on" : ""}`;

/** Thanh lọc: tìm kiếm · nhóm nền mẫu · nền mẫu · phương pháp · trạng thái sử dụng */
const BatchNormsToolbar: React.FC<BatchNormsToolbarProps> = ({
  keyword,
  categoryKey,
  specimenKey,
  testMethodId,
  status,
  categoryOptions,
  specimenOptions,
  methodOptions,
  statusCounts,
  hasFilter,
  onKeywordChange,
  onCategoryChange,
  onSpecimenChange,
  onTestMethodChange,
  onStatusChange,
  onClearFilter,
}) => (
  <div className="svc-filterbar">
    <Input
      className="svc-filterbar-search"
      prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
      placeholder="Tìm nhóm nền mẫu, nền mẫu, chỉ tiêu, phương pháp…"
      aria-label="Tìm nhóm nền mẫu, nền mẫu, chỉ tiêu, phương pháp"
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
    <div className="svc-seg" role="group" aria-label="Lọc trạng thái sử dụng">
      {STATUS_FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`svc-seg-btn${status === f.key ? " is-on" : ""}`}
          aria-pressed={status === f.key}
          onClick={() => onStatusChange(f.key)}
        >
          {f.label}
          <span className="bn-seg-badge">{statusCounts[f.key]}</span>
        </button>
      ))}
    </div>
    {hasFilter && (
      <button type="button" className="svc-link-btn" onClick={onClearFilter}>
        Xóa lọc
      </button>
    )}
  </div>
);

export default BatchNormsToolbar;
