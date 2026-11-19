import React from "react";
import { Input, Select } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { FilterOption, ServiceQuickFilter } from "./utils";

export interface ServiceCatalogToolbarProps {
  keyword: string;
  testMethodId?: string;
  specimenKey?: string;
  quickFilter: ServiceQuickFilter;
  methodOptions: FilterOption[];
  specimenOptions: FilterOption[];
  /** Số dịch vụ chờ định giá / có HĐ phụ theo bộ lọc hiện tại (hiện trên nút lọc nhanh) */
  pendingCount: number;
  subcontractCount: number;
  hasFilter: boolean;
  onKeywordChange: (value: string) => void;
  onTestMethodChange: (value?: string) => void;
  onSpecimenChange: (value?: string) => void;
  onQuickFilterChange: (value: ServiceQuickFilter) => void;
  onClearFilter: () => void;
}

const QUICK_FILTERS: { key: ServiceQuickFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ định giá" },
  { key: "subcontract", label: "Có HĐ phụ" },
];

/** Thanh lọc: tìm kiếm · phương pháp · nền mẫu · lọc nhanh */
const ServiceCatalogToolbar: React.FC<ServiceCatalogToolbarProps> = ({
  keyword,
  testMethodId,
  specimenKey,
  quickFilter,
  methodOptions,
  specimenOptions,
  pendingCount,
  subcontractCount,
  hasFilter,
  onKeywordChange,
  onTestMethodChange,
  onSpecimenChange,
  onQuickFilterChange,
  onClearFilter,
}) => {
  const badgeOf = (key: ServiceQuickFilter) =>
    key === "pending" ? (
      <span className="svc-seg-badge is-pending">{pendingCount}</span>
    ) : key === "subcontract" ? (
      <span className="svc-seg-badge">{subcontractCount}</span>
    ) : null;

  return (
    <div className="svc-filterbar">
      <Input
        className="svc-filterbar-search"
        prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
        placeholder="Tìm chỉ tiêu, tên dịch vụ, mã DV, đơn vị HĐ phụ…"
        aria-label="Tìm chỉ tiêu, tên dịch vụ, mã DV"
        allowClear
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
      />
      <Select
        className="svc-filterbar-select"
        aria-label="Lọc phương pháp"
        placeholder={`Mọi phương pháp (${methodOptions.length})`}
        allowClear
        showSearch={{ optionFilterProp: "label" }}
        options={methodOptions}
        value={testMethodId}
        onChange={(v) => onTestMethodChange(v ?? undefined)}
        popupMatchSelectWidth={360}
      />
      <Select
        className="svc-filterbar-select"
        aria-label="Lọc nền mẫu"
        placeholder={`Tất cả nền mẫu (${specimenOptions.length})`}
        allowClear
        showSearch={{ optionFilterProp: "label" }}
        options={specimenOptions}
        value={specimenKey}
        onChange={(v) => onSpecimenChange(v ?? undefined)}
        popupMatchSelectWidth={360}
      />
      <div className="svc-seg" role="group" aria-label="Lọc nhanh">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`svc-seg-btn${quickFilter === f.key ? " is-on" : ""}`}
            aria-pressed={quickFilter === f.key}
            onClick={() => onQuickFilterChange(f.key)}
          >
            {f.label}
            {badgeOf(f.key)}
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
};

export default ServiceCatalogToolbar;
