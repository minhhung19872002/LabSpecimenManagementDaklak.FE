import React from "react";

export interface ItemGroupTheme {
  border: string;
  headBg: string;
  fg: string;
  countBg: string;
}

export interface ItemGroupProps {
  title: string;
  count: number;
  open: boolean;
  theme: ItemGroupTheme;
  /** "2 thiếu lượng" — rỗng thì ẩn */
  missingText?: string;
  /** Nút thêm mục — chỉ hiện khi nhóm đang mở */
  addBox: React.ReactNode;
  onToggle: () => void;
  children: React.ReactNode;
}

/** Nút "+ Thêm vật tư / thiết bị" nét đứt ở đầu nhóm */
export const AddItemButton: React.FC<{ label: string; color: string; onClick: () => void }> = ({ label, color, onClick }) => (
  <button
    type="button"
    aria-haspopup="dialog"
    onClick={onClick}
    style={{
      marginLeft: "auto",
      height: 30,
      padding: "0 12px",
      border: `1px dashed ${color}`,
      borderRadius: 8,
      background: "#fff",
      color,
      font: "inherit",
      fontSize: 13,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
    {label}
  </button>
);

/** Khung nhóm Vật tư / Thiết bị: tiêu đề thu gọn được + ô thêm + bảng */
const ItemGroup: React.FC<ItemGroupProps> = ({ title, count, open, theme, missingText, addBox, onToggle, children }) => (
  <section
    aria-label={title}
    style={{ border: `1px solid ${theme.border}`, borderRadius: 12, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.05)", flex: "none" }}
  >
    <div
      style={{
        minHeight: 46,
        boxSizing: "border-box",
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: theme.headBg,
        borderRadius: open ? "12px 12px 0 0" : 12,
        borderBottom: open ? "1px solid rgba(0,0,0,.06)" : undefined,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        style={{
          border: 0,
          background: "transparent",
          padding: "4px 2px",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          font: "inherit",
          color: theme.fg,
          cursor: "pointer",
          flex: "none",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
          style={{ flex: "none", transition: "transform .15s", transform: `rotate(${open ? 0 : -90}deg)` }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        <span
          style={{
            minWidth: 22,
            height: 20,
            padding: "0 7px",
            boxSizing: "border-box",
            borderRadius: 10,
            background: theme.countBg,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {count}
        </span>
      </button>
      {missingText && (
        <span
          style={{
            fontSize: 12,
            lineHeight: "20px",
            padding: "0 8px",
            borderRadius: 10,
            background: "#fff7e6",
            color: "#ad4e00",
            border: "1px solid #ffd591",
            whiteSpace: "nowrap",
          }}
        >
          {missingText}
        </span>
      )}
      {open && addBox}
    </div>
    {open && children}
  </section>
);

export default ItemGroup;
