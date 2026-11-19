import React from "react";
import { Input } from "antd";
import {
  CloseOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  FilterOutlined,
} from "../../../../components/common/Icon";

export interface SidebarCategory {
  key: string;
  label: string;
  /** Không truyền → không hiện số (tab tự quản dữ liệu) */
  count?: number;
}

export interface MasterDataSidebarProps {
  categories: SidebarCategory[];
  activeKey: string;
  filterText: string;
  /** true = sidebar đứng cố định bên trái; false = dải thu gọn 48px */
  inline: boolean;
  /** Danh mục nổi (bật ra từ dải thu gọn) đang mở */
  flyoutOpen: boolean;
  /** Màn đủ rộng → trong danh mục nổi có nút "Ghim mở" */
  isWide: boolean;
  onFilterChange: (value: string) => void;
  onSelect: (key: string) => void;
  onCollapse: () => void;
  onOpenFromRail: () => void;
  onCloseFlyout: () => void;
  onPinOpen: () => void;
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

interface PanelProps {
  categories: SidebarCategory[];
  activeKey: string;
  filterText: string;
  onFilterChange: (value: string) => void;
  onSelect: (key: string) => void;
  actions: React.ReactNode;
  showTotal: boolean;
}

/** Nội dung danh mục dùng chung cho dạng cố định và dạng nổi */
const SidebarPanel: React.FC<PanelProps> = ({
  categories,
  activeKey,
  filterText,
  onFilterChange,
  onSelect,
  actions,
  showTotal,
}) => {
  const q = fold(filterText);
  const matched = q ? categories.filter((c) => fold(c.label).includes(q)) : categories;
  return (
    <>
      <div className="md-sidebar-head">
        <h2 className="md-sidebar-title">Danh mục</h2>
        {showTotal && <span className="md-sidebar-total">{categories.length}</span>}
        {actions}
      </div>
      <Input
        className="md-sidebar-filter"
        prefix={<FilterOutlined style={{ color: "#8C8C8C" }} />}
        placeholder="Lọc danh mục"
        allowClear
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
        aria-label="Lọc danh mục"
      />
      <nav className="md-sidebar-scroll" aria-label="Danh sách danh mục">
        {matched.map((item) => {
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              className={`md-sidebar-item${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(item.key)}
            >
              <span className="md-sidebar-item-label" title={item.label}>
                {item.label}
              </span>
              {item.count !== undefined && <span className="md-sidebar-item-count">{item.count}</span>}
            </button>
          );
        })}
        {matched.length === 0 && <div className="md-sidebar-empty">Không tìm thấy danh mục phù hợp.</div>}
      </nav>
    </>
  );
};

/**
 * Sidebar danh mục theo mockup BA: mở cố định (≥1360px, ghi nhớ) hoặc dải thu gọn 48px;
 * màn hẹp bấm dải → danh mục nổi, chọn 1 mục là tự đóng.
 */
const MasterDataSidebar: React.FC<MasterDataSidebarProps> = ({
  categories,
  activeKey,
  filterText,
  inline,
  flyoutOpen,
  isWide,
  onFilterChange,
  onSelect,
  onCollapse,
  onOpenFromRail,
  onCloseFlyout,
  onPinOpen,
}) => {
  const activeLabel = categories.find((c) => c.key === activeKey)?.label;

  if (inline) {
    return (
      <aside className="md-sidebar" aria-label="Danh mục master data">
        <SidebarPanel
          categories={categories}
          activeKey={activeKey}
          filterText={filterText}
          onFilterChange={onFilterChange}
          onSelect={onSelect}
          showTotal
          actions={
            <button
              type="button"
              className="md-sidebar-icon-btn"
              aria-label="Thu gọn danh mục"
              title="Thu gọn danh mục"
              onClick={onCollapse}
            >
              <DoubleLeftOutlined />
            </button>
          }
        />
      </aside>
    );
  }

  return (
    <>
      <button
        type="button"
        className="md-sidebar-rail"
        aria-label="Mở danh mục master data"
        aria-expanded={flyoutOpen}
        onClick={onOpenFromRail}
      >
        <span className="md-sidebar-rail-icon">
          <DoubleRightOutlined />
        </span>
        <span className="md-sidebar-rail-text">
          Danh mục{activeLabel ? ` · ${activeLabel}` : ""}
        </span>
        <span className="md-sidebar-total">{categories.length}</span>
      </button>
      {flyoutOpen && (
        <>
          <div className="md-sidebar-backdrop" aria-hidden="true" onClick={onCloseFlyout} />
          <aside
            className="md-sidebar md-sidebar-flyout"
            aria-label="Danh mục master data"
            onKeyDown={(e) => e.key === "Escape" && onCloseFlyout()}
          >
            <SidebarPanel
              categories={categories}
              activeKey={activeKey}
              filterText={filterText}
              onFilterChange={onFilterChange}
              onSelect={(key) => {
                onSelect(key);
                onCloseFlyout();
              }}
              showTotal={false}
              actions={
                <>
                  {isWide && (
                    <button type="button" className="md-sidebar-text-btn" onClick={onPinOpen}>
                      Ghim mở
                    </button>
                  )}
                  <button
                    type="button"
                    className="md-sidebar-icon-btn"
                    aria-label="Đóng danh mục"
                    title="Đóng danh mục"
                    onClick={onCloseFlyout}
                  >
                    <CloseOutlined />
                  </button>
                </>
              }
            />
          </aside>
        </>
      )}
    </>
  );
};

export default MasterDataSidebar;
