import React from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ChevronDown: React.FC<{ open: boolean; size?: number }> = ({ open, size = 14 }) => (
  <svg
    {...base}
    width={size}
    height={size}
    strokeWidth={2.5}
    style={{ flex: "none", transition: "transform .15s", transform: open ? "none" : "rotate(-90deg)" }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronRight: React.FC = () => (
  <svg {...base} width={12} height={12} strokeWidth={2.5} style={{ flex: "none", color: "#8c8c8c" }}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const CloseIcon: React.FC = () => (
  <svg {...base} width={14} height={14} strokeWidth={2.4}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const TrashIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg {...base} width={size} height={size} strokeWidth={2}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
  </svg>
);

export const LinkIcon: React.FC = () => (
  <svg {...base} width={14} height={14} strokeWidth={2} style={{ flex: "none" }}>
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
  </svg>
);

export const CopyIcon: React.FC = () => (
  <svg {...base} width={14} height={14} strokeWidth={2}>
    <rect x="8" y="8" width="13" height="13" rx="2" />
    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
  </svg>
);

export const PlusIcon: React.FC = () => (
  <svg {...base} width={16} height={16} strokeWidth={2.2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SearchIcon: React.FC = () => (
  <svg {...base} width={14} height={14} strokeWidth={2} stroke="#8c8c8c" style={{ flex: "none" }}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const FlaskIcon: React.FC = () => (
  <svg {...base} width={11} height={11} strokeWidth={2.4}>
    <path d="M9 3h6" />
    <path d="M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3" />
  </svg>
);

export const MonitorIcon: React.FC = () => (
  <svg {...base} width={11} height={11} strokeWidth={2.4}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

export const ExpandAllIcon: React.FC = () => (
  <svg {...base} width={12} height={12} strokeWidth={2.4}>
    <path d="m7 6 5 5 5-5" />
    <path d="m7 13 5 5 5-5" />
  </svg>
);

export const CollapseAllIcon: React.FC = () => (
  <svg {...base} width={12} height={12} strokeWidth={2.4}>
    <path d="m7 11 5-5 5 5" />
    <path d="m7 18 5-5 5 5" />
  </svg>
);

/** Cụm nút "Mở tất cả | Thu gọn" */
export const FoldToggle: React.FC<{ label: string; small?: boolean; onExpand: () => void; onCollapse: () => void }> = ({
  label,
  small,
  onExpand,
  onCollapse,
}) => {
  const btn: React.CSSProperties = {
    padding: small ? "0 10px" : "0 12px",
    border: 0,
    background: "transparent",
    color: "#262626",
    font: "inherit",
    fontSize: small ? 12 : 13,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
  };
  return (
    <span
      role="group"
      aria-label={label}
      style={{
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "stretch",
        height: small ? 28 : 30,
        border: "1px solid #d9d9d9",
        borderRadius: 8,
        background: "#fff",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0,0,0,.05)",
      }}
    >
      <button type="button" className="yfc-tg" style={btn} onClick={onExpand}>
        <ExpandAllIcon />
        Mở tất cả
      </button>
      <span aria-hidden="true" style={{ width: 1, background: "#d9d9d9" }} />
      <button type="button" className="yfc-tg" style={btn} onClick={onCollapse}>
        <CollapseAllIcon />
        Thu gọn
      </button>
    </span>
  );
};

/** Header 54px gradient của popup */
export const ModalHeader: React.FC<{ id: string; title: React.ReactNode; background?: string; onClose: () => void }> = ({
  id,
  title,
  background = "linear-gradient(90deg, #1e63f8, #009ae3)",
  onClose,
}) => (
  <div
    style={{
      height: 54,
      flex: "none",
      padding: "0 12px 0 20px",
      background,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    <h2 id={id} className="bnc-ellipsis" style={{ margin: 0, flex: 1, fontSize: 16, lineHeight: "24px", fontWeight: 500, color: "#fff" }}>
      {title}
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
      <CloseIcon />
    </button>
  </div>
);
