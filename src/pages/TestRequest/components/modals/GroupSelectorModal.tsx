import React from "react";
import { Modal, Input, Button, Checkbox } from "antd";
import { Icon } from "@iconify/react";

interface GroupWithIndicators {
  id: string;
  name: string;
  indicators: Array<{ id: string; name: string }>;
  matchesSearch?: boolean;
}

interface GroupSelectorModalProps {
  visible: boolean;
  searchText: string;
  selectedGroupFilter: string;
  groups: GroupWithIndicators[];
  expandedGroups: string[];
  onSearchChange: (value: string) => void;
  onGroupSelect: (groupId: string) => void;
  onToggleExpand: (groupId: string) => void;
  onToggleExpandAll: () => void;
  onClearFilter: () => void;
  onClose: () => void;
}

const GroupSelectorModal: React.FC<GroupSelectorModalProps> = ({
  visible,
  searchText,
  selectedGroupFilter,
  groups,
  expandedGroups,
  onSearchChange,
  onGroupSelect,
  onToggleExpand,
  onToggleExpandAll,
  onClearFilter,
  onClose,
}) => {
  const allExpanded = expandedGroups.length === groups.length;

  return (
    <Modal
      title={
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Nhóm chỉ tiêu</span>
          <Input.Search
            placeholder="Tìm kiếm nhóm chỉ tiêu..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            onSearch={onSearchChange}
            allowClear
            enterButton="Tìm"
            style={{ width: "100%" }}
          />
        </div>
      }
      open={visible}
      onCancel={onClose}
      closeIcon={null}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="clear"
          onClick={onClearFilter}
          style={{ marginLeft: 8, borderColor: "#faad14", color: "#faad14" }}
        >
          Bỏ lọc
        </Button>,
      ]}
      width={750}
      centered
      styles={{
        body: { padding: 0, maxHeight: 550, overflowY: "auto" },
        wrapper: { maxWidth: "100%" },
      }}
    >
      <div style={{ borderTop: "1px solid #f0f0f0" }}>
        {/* Toggle expand all */}
        <div
          style={{
            padding: "12px 16px",
            cursor: "pointer",
            background: "#fafafa",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 500,
            fontSize: 14,
          }}
          onClick={onToggleExpandAll}
        >
          <Checkbox
            checked={allExpanded}
            indeterminate={expandedGroups.length > 0 && !allExpanded}
          />
          <Icon icon="mdi:unfold-more-horizontal" width={20} style={{ color: "#1890ff" }} />
          <span style={{ color: "#1890ff" }}>Hiển thị tất cả</span>
        </div>

        {/* Groups list */}
        {groups.map((group, groupIndex) => {
          const isExpanded = expandedGroups.includes(group.id);
          return (
            <div key={group.id}>
              <div
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  background: selectedGroupFilter === group.id ? "#e6f7ff" : "#fff",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontWeight: 500,
                  fontSize: 14,
                }}
                onMouseEnter={(e) => {
                  if (selectedGroupFilter !== group.id)
                    e.currentTarget.style.background = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    selectedGroupFilter === group.id ? "#e6f7ff" : "#fff";
                }}
              >
                <Icon
                  icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
                  width={20}
                  style={{ color: "#595959", flexShrink: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(group.id);
                  }}
                />
                <span style={{ flex: 1 }} onClick={() => onGroupSelect(group.id)}>
                  {groupIndex + 1}. {group.name}
                </span>
                <span style={{ fontSize: 13, color: "#888", fontWeight: 400 }}>
                  ({group.indicators.length})
                </span>
              </div>
              {isExpanded &&
                group.indicators.map((ind, indIndex) => (
                  <div
                    key={ind.id}
                    style={{
                      padding: "10px 16px 10px 48px",
                      fontSize: 14,
                      color: "#595959",
                      background: "#fafafa",
                      borderBottom: "1px solid #f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>
                      — {groupIndex + 1}.{indIndex + 1} {ind.name}
                    </span>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default GroupSelectorModal;
