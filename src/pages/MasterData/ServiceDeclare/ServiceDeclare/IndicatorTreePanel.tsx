import React from "react";
import { Checkbox, Empty, Input } from "antd";
import { IndicatorName } from "../../../../components/common";
import { DownOutlined, SearchOutlined } from "../../../../components/common/Icon";
import type { IndicatorDto } from "../../../../services/masterDataService";
import StepLabel, { type StepState } from "./StepLabel";

export interface IndicatorTreeGroupView {
  id: string;
  name: string;
  total: number;
  selectedCount: number;
  open: boolean;
  /** Chỉ tiêu hiện ra (đã lọc theo từ khóa); rỗng khi nhóm đang đóng */
  items: IndicatorDto[];
}

export interface IndicatorTreePanelProps {
  step: StepState;
  /** Có = khóa cây + hiện lời nhắc làm bước trước */
  lockMessage?: string;
  query: string;
  groups: IndicatorTreeGroupView[];
  selectedIds: Set<string>;
  selectedCount: number;
  onQueryChange: (value: string) => void;
  onToggleGroupOpen: (groupId: string) => void;
  onToggleGroupSelect: (groupId: string) => void;
  onToggleIndicator: (indicatorId: string) => void;
}

const groupRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minHeight: 34,
  padding: "0 10px 0 12px",
  borderBottom: "1px solid #f0f0f0",
  background: "#fff",
};
const groupButtonStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 32,
  border: 0,
  background: "transparent",
  padding: 0,
  display: "flex",
  alignItems: "center",
  gap: 6,
  font: "inherit",
  fontSize: 13,
  color: "inherit",
  cursor: "pointer",
  textAlign: "left",
};
const groupNameStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontWeight: 500,
};
const metaBase: React.CSSProperties = { flex: "none", fontSize: 12, lineHeight: "18px", padding: "0 6px", borderRadius: 9 };
const metaOn: React.CSSProperties = { ...metaBase, background: "#e6f4ff", color: "#0958d9" };
const metaOff: React.CSSProperties = { ...metaBase, background: "#f0f2f5", color: "#595959" };
const itemBase: React.CSSProperties = { display: "flex", width: "100%", padding: "7px 10px 7px 36px", margin: 0 };
const itemOn: React.CSSProperties = { ...itemBase, background: "#e6f4ff" };
const itemNameStyle: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  fontSize: 13,
  lineHeight: "18px",
};

/** 1 dòng chỉ tiêu — memo: tích 1 chỉ tiêu chỉ vẽ lại đúng dòng đó */
const IndicatorTreeItem = React.memo<{
  indicator: IndicatorDto;
  checked: boolean;
  onToggle: (id: string) => void;
}>(function IndicatorTreeItem({ indicator, checked, onToggle }) {
  return (
    <Checkbox
      className="svc-declare-row"
      style={checked ? itemOn : itemBase}
      checked={checked}
      onChange={() => onToggle(indicator.id)}
      title={indicator.name}
    >
      <span style={itemNameStyle}>
        <IndicatorName name={indicator.name} formattedName={indicator.formattedName} />
      </span>
    </Checkbox>
  );
});

/** Bước ④ Chỉ tiêu: cây Nhóm chỉ tiêu → chỉ tiêu, tìm không dấu */
const IndicatorTreePanel: React.FC<IndicatorTreePanelProps> = ({
  step,
  lockMessage,
  query,
  groups,
  selectedIds,
  selectedCount,
  onQueryChange,
  onToggleGroupOpen,
  onToggleGroupSelect,
  onToggleIndicator,
}) => (
  <div
    style={{
      width: 380,
      flex: "none",
      borderRight: "1px solid #f0f0f0",
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      position: "relative",
    }}
  >
    <div style={{ padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
      <StepLabel
        index={4}
        state={step}
        title="Chỉ tiêu"
        required
        extra={<span style={{ fontSize: 12, color: "#595959" }}>Đã chọn {selectedCount}</span>}
      />
      <Input
        allowClear
        prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
        placeholder="Tìm chỉ tiêu, nhóm…"
        aria-label="Tìm chỉ tiêu hoặc nhóm"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
    </div>
    <div role="tree" aria-label="Nhóm và chỉ tiêu" style={{ flex: 1, minHeight: 0, overflowY: "auto", borderTop: "1px solid #f0f0f0" }}>
      {groups.length === 0 && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có chỉ tiêu phù hợp" style={{ marginTop: 24 }} />
      )}
      {groups.map((g) => (
        <React.Fragment key={g.id}>
          <div className="svc-declare-row" role="treeitem" aria-expanded={g.open} style={groupRowStyle}>
            <Checkbox
              aria-label={`Chọn cả nhóm ${g.name}`}
              checked={g.selectedCount === g.total}
              indeterminate={g.selectedCount > 0 && g.selectedCount < g.total}
              onChange={() => onToggleGroupSelect(g.id)}
            />
            <button type="button" title={g.name} style={groupButtonStyle} onClick={() => onToggleGroupOpen(g.id)}>
              <span style={groupNameStyle}>{g.name}</span>
              <span style={g.selectedCount ? metaOn : metaOff}>
                {g.selectedCount ? `${g.selectedCount}/${g.total}` : g.total}
              </span>
              <DownOutlined
                style={{
                  flex: "none",
                  fontSize: 11,
                  color: "#595959",
                  transition: "transform .15s",
                  transform: g.open ? undefined : "rotate(-90deg)",
                }}
              />
            </button>
          </div>
          {g.items.map((ind) => (
            <IndicatorTreeItem key={ind.id} indicator={ind} checked={selectedIds.has(ind.id)} onToggle={onToggleIndicator} />
          ))}
        </React.Fragment>
      ))}
    </div>
    {lockMessage && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          color: "#595959",
        }}
      >
        {lockMessage}
      </div>
    )}
  </div>
);

export default IndicatorTreePanel;
