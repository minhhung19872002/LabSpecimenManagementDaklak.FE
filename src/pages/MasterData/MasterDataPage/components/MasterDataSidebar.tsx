import React from "react";
import { Input } from "antd";
import Icon, { FilterOutlined } from "../../../../components/common/Icon";

export interface SidebarCategory {
  key: string;
  label: string;
  /** Không truyền → không hiện số (tab tự quản dữ liệu) */
  count?: number;
}

export interface MasterDataSidebarProps {
  categories: SidebarCategory[];
  activeKey: string;
  pinnedKeys: string[];
  filterText: string;
  onFilterChange: (value: string) => void;
  onSelect: (key: string) => void;
  onTogglePin: (key: string) => void;
}

// So khớp không dấu: "vat tu" khớp "vật tư"
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

interface ItemProps {
  item: SidebarCategory;
  active: boolean;
  pinned: boolean;
  onSelect: (key: string) => void;
  onTogglePin: (key: string) => void;
}

const SidebarItem: React.FC<ItemProps> = ({
  item,
  active,
  pinned,
  onSelect,
  onTogglePin,
}) => (
  <div
    className={`md-sidebar-item${active ? " is-active" : ""}${pinned ? " is-pinned" : ""}`}
  >
    <button
      type="button"
      className="md-sidebar-item-main"
      aria-current={active ? "page" : undefined}
      onClick={() => onSelect(item.key)}
    >
      <span className="md-sidebar-item-label">{item.label}</span>
      {item.count !== undefined && (
        <span className="md-sidebar-item-count">{item.count}</span>
      )}
    </button>
    <button
      type="button"
      className="md-sidebar-pin"
      title={pinned ? "Bỏ ghim" : "Ghim danh mục"}
      aria-label={pinned ? `Bỏ ghim ${item.label}` : `Ghim ${item.label}`}
      aria-pressed={pinned}
      onClick={() => onTogglePin(item.key)}
    >
      <Icon name={pinned ? "pin-angle-fill" : "pin-angle"} />
    </button>
  </div>
);

const MasterDataSidebar: React.FC<MasterDataSidebarProps> = ({
  categories,
  activeKey,
  pinnedKeys,
  filterText,
  onFilterChange,
  onSelect,
  onTogglePin,
}) => {
  const q = fold(filterText);
  const matched = q
    ? categories.filter((c) => fold(c.label).includes(q))
    : categories;
  const pinned = pinnedKeys
    .map((key) => matched.find((c) => c.key === key))
    .filter((c): c is SidebarCategory => !!c);
  const pinnedSet = new Set(pinnedKeys);

  const renderItem = (item: SidebarCategory) => (
    <SidebarItem
      key={item.key}
      item={item}
      active={item.key === activeKey}
      pinned={pinnedSet.has(item.key)}
      onSelect={onSelect}
      onTogglePin={onTogglePin}
    />
  );

  return (
    <aside className="md-sidebar" aria-label="Danh mục dữ liệu">
      <div className="md-sidebar-head">
        <h2 className="md-sidebar-title">Danh mục</h2>
        <span className="md-sidebar-total">{categories.length} danh mục</span>
      </div>

      <Input
        prefix={<FilterOutlined style={{ color: "#8C8C8C" }} />}
        placeholder="Lọc danh mục"
        allowClear
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
        aria-label="Lọc danh mục"
      />

      <div className="md-sidebar-scroll">
        {pinned.length > 0 && (
          <div className="md-sidebar-section">
            <div className="md-sidebar-section-title">Đã ghim</div>
            {pinned.map(renderItem)}
          </div>
        )}

        <div className="md-sidebar-section">
          <div className="md-sidebar-section-title">
            {q ? `Kết quả lọc (${matched.length})` : "Tất cả danh mục"}
          </div>
          {matched.map(renderItem)}
          {matched.length === 0 && (
            <div className="md-sidebar-empty">
              Không tìm thấy danh mục phù hợp.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default MasterDataSidebar;
