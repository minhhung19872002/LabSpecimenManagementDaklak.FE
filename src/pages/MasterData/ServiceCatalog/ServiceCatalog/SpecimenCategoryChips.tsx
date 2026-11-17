import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Dropdown, Tag, Typography } from "antd";
import { DownOutlined } from "../../../../components/common/Icon";
import { ALL_CATEGORY } from "./utils";

export interface SpecimenCategoryChipsProps {
  /** Nhóm nền mẫu (không gồm "Tất cả") */
  categories: string[];
  value: string;
  onChange: (value: string) => void;
}

const CHIP_HEIGHT = 28;

const panelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "6px 10px",
  background: "#FAFAFA",
  border: "1px solid #F0F0F0",
  borderRadius: 8,
  minWidth: 0,
};
const labelStyle: React.CSSProperties = { flexShrink: 0, fontSize: 13 };
// 1 dòng: chip tràn xuống dòng 2 bị cắt (overflow hidden) và gom vào nút "+N"
const listStyle: React.CSSProperties = {
  position: "relative",
  flex: 1,
  minWidth: 0,
  height: CHIP_HEIGHT,
  overflow: "hidden",
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};
// Không dùng shorthand `border`: React bỏ `borderColor` khi đổi style sẽ xóa luôn màu viền
const chipStyle: React.CSSProperties = {
  margin: 0,
  height: CHIP_HEIGHT,
  padding: "2px 12px",
  borderRadius: 999,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#D9D9D9",
  background: "#FFFFFF",
  fontSize: 13,
  lineHeight: "22px",
  whiteSpace: "nowrap",
  cursor: "pointer",
};
const chipCheckedStyle: React.CSSProperties = { ...chipStyle, borderColor: "#096DD9", background: "#096DD9" };
const moreChipStyle: React.CSSProperties = {
  ...chipStyle,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  borderStyle: "dashed",
  color: "#595959",
};
const moreChipCheckedStyle: React.CSSProperties = {
  ...moreChipStyle,
  borderStyle: "solid",
  borderColor: "#096DD9",
  background: "#096DD9",
  color: "#FFFFFF",
};
const menuStyle: React.CSSProperties = { maxHeight: 360, overflowY: "auto" };

const labelOf = (c: string) => (c === ALL_CATEGORY ? "Tất cả" : c);

/**
 * Chip lọc "Nền mẫu" gói gọn 1 dòng: chip nào không vừa dòng → gom vào nút "+N nền mẫu ▾".
 * Nền mẫu đang chọn nằm trong phần ẩn → nút hiện tên + tô xanh để người dùng vẫn thấy đang lọc gì.
 * State ở đây chỉ là đo layout (số chip vừa 1 dòng), không phải dữ liệu nghiệp vụ.
 */
const SpecimenCategoryChips = React.memo<SpecimenCategoryChipsProps>(function SpecimenCategoryChips({
  categories,
  value,
  onChange,
}) {
  const all = useMemo(() => [ALL_CATEGORY, ...categories], [categories]);
  const listRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(all.length);

  // Đếm chip nằm trên dòng đầu; đo lại khi đổi kích thước (resize, thu sidebar...)
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => {
      const kids = Array.from(el.children) as HTMLElement[];
      if (kids.length === 0) return;
      const firstTop = kids[0].offsetTop;
      const n = kids.findIndex((k) => k.offsetTop !== firstTop);
      setVisibleCount(n === -1 ? kids.length : n);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [all]);

  const hidden = all.slice(visibleCount);
  const selectedHidden = hidden.includes(value);

  return (
    <div style={panelStyle}>
      <Typography.Text type="secondary" style={labelStyle}>
        Nền mẫu
      </Typography.Text>
      <div ref={listRef} style={listStyle}>
        {all.map((c) => (
          <Tag.CheckableTag
            key={c}
            checked={c === value}
            style={c === value ? chipCheckedStyle : chipStyle}
            onChange={() => onChange(c)}
          >
            {labelOf(c)}
          </Tag.CheckableTag>
        ))}
      </div>
      {hidden.length > 0 && (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: hidden.map((c) => ({ key: c, label: labelOf(c) })),
            selectable: true,
            selectedKeys: [value],
            onClick: ({ key }) => onChange(key),
            style: menuStyle,
          }}
        >
          <span style={selectedHidden ? moreChipCheckedStyle : moreChipStyle} role="button" tabIndex={0}>
            {selectedHidden ? labelOf(value) : `+${hidden.length} nền mẫu`}
            <DownOutlined style={{ fontSize: 10 }} />
          </span>
        </Dropdown>
      )}
    </div>
  );
});

export default SpecimenCategoryChips;
