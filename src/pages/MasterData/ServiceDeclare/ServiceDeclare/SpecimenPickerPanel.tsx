import React from "react";
import { Button, Checkbox, Empty, Input } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { SpecimenCategoryGroup } from "./utils";

export interface SpecimenPickerPanelProps {
  query: string;
  groups: SpecimenCategoryGroup[];
  selectedIds: Set<string>;
  onQueryChange: (value: string) => void;
  onToggleSpecimen: (id: string) => void;
  /** Chọn / bỏ chọn cả nhóm (theo kết quả đang lọc) */
  onToggleCategory: (ids: string[], select: boolean) => void;
  onDone: () => void;
}

const groupHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 8px 2px",
  fontSize: 12,
  fontWeight: 500,
  color: "#595959",
};
const itemStyle: React.CSSProperties = { display: "flex", padding: "6px 8px", borderRadius: 6, width: "100%" };

/** Popover chọn nền mẫu: gom theo Nhóm nền mẫu, có tìm kiếm + chọn cả nhóm */
const SpecimenPickerPanel: React.FC<SpecimenPickerPanelProps> = ({
  query,
  groups,
  selectedIds,
  onQueryChange,
  onToggleSpecimen,
  onToggleCategory,
  onDone,
}) => (
  <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 6 }}>
    <Input
      allowClear
      autoFocus
      prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
      placeholder="Tìm nền mẫu…"
      aria-label="Tìm nền mẫu"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
    />
    <div style={{ maxHeight: 300, overflowY: "auto" }}>
      {groups.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có nền mẫu phù hợp" />}
      {groups.map((g) => {
        const ids = g.items.map((s) => s.id);
        const allOn = ids.every((id) => selectedIds.has(id));
        return (
          <div key={g.name}>
            <div style={groupHeadStyle}>
              {g.name}
              <Button type="link" size="small" style={{ fontSize: 12, padding: 0, height: "auto" }} onClick={() => onToggleCategory(ids, !allOn)}>
                {allOn ? "Bỏ chọn nhóm" : "Chọn cả nhóm"}
              </Button>
            </div>
            {g.items.map((s) => (
              <Checkbox
                key={s.id}
                className="svc-declare-row"
                style={itemStyle}
                checked={selectedIds.has(s.id)}
                onChange={() => onToggleSpecimen(s.id)}
              >
                {s.name}
              </Checkbox>
            ))}
          </div>
        );
      })}
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <Button type="primary" size="small" onClick={onDone}>
        Xong
      </Button>
    </div>
  </div>
);

export default SpecimenPickerPanel;
