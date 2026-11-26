// @ts-nocheck
import React from "react";
import { Modal, Button, Checkbox, Input } from "antd";
import { Icon } from "@iconify/react";
import { IndicatorGroupDto, IndicatorDto } from "../../../../services/masterDataService";
import { withUngroupedGroup } from "../../../../utils/indicatorGroups";

interface GroupSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  groupSearchText: string;
  setGroupSearchText: (text: string) => void;
  indicatorGroups: IndicatorGroupDto[];
  indicators: IndicatorDto[];
  expandedGroupsInSelector: string[];
  setExpandedGroupsInSelector: React.Dispatch<React.SetStateAction<string[]>>;
  selectedGroupFilter: string;
  getFilteredGroupsWithIndicators: () => any[];
  handleGroupSelect: (groupId: string) => void;
  setSelectedGroupFilter: (filter: string) => void;
}

const GroupSelectorModal: React.FC<GroupSelectorModalProps> = ({
  visible,
  onClose,
  groupSearchText,
  setGroupSearchText,
  indicatorGroups: masterGroups,
  expandedGroupsInSelector,
  setExpandedGroupsInSelector,
  selectedGroupFilter,
  getFilteredGroupsWithIndicators,
  handleGroupSelect,
  setSelectedGroupFilter,
}) => {
  // Gồm cả nhánh "Chưa phân nhóm" để nút mở/thu gọn tất cả đếm đúng
  const indicatorGroups = withUngroupedGroup(masterGroups);

  const handleClose = () => {
    onClose();
    setGroupSearchText("");
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Nhóm chỉ tiêu</span>
          <Input.Search
            placeholder="Tìm kiếm nhóm chỉ tiêu..."
            value={groupSearchText}
            onChange={(e) => setGroupSearchText(e.target.value)}
            onSearch={(value) => setGroupSearchText(value)}
            allowClear
            enterButton="Tìm"
            style={{ width: "100%" }}
          />
        </div>
      }
      open={visible}
      onCancel={handleClose}
      closeIcon={null}
      footer={[
        <Button key="close" type="primary" onClick={handleClose}>
          Đóng
        </Button>,
        <Button
          key="clear"
          onClick={(e) => {
            e.stopPropagation();
            setGroupSearchText("");
            setSelectedGroupFilter("all");
            handleClose();
          }}
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
          onClick={() => {
            if (expandedGroupsInSelector.length === indicatorGroups.length) {
              setExpandedGroupsInSelector([]);
            } else {
              setExpandedGroupsInSelector(indicatorGroups.map((g) => g.id));
            }
          }}
        >
          <Checkbox
            checked={expandedGroupsInSelector.length === indicatorGroups.length}
            indeterminate={
              expandedGroupsInSelector.length > 0 &&
              expandedGroupsInSelector.length < indicatorGroups.length
            }
          />
          <Icon
            icon="mdi:unfold-more-horizontal"
            width={20}
            style={{ color: "#1890ff" }}
          />
          <span style={{ color: "#1890ff" }}>Hiển thị tất cả</span>
        </div>
        {getFilteredGroupsWithIndicators().map((group, groupIndex) => {
          const isExpandedInSelector = expandedGroupsInSelector.includes(group.id);
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
                  icon={isExpandedInSelector ? "mdi:chevron-down" : "mdi:chevron-right"}
                  width={20}
                  style={{ color: "#595959", flexShrink: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedGroupsInSelector((prev) =>
                      prev.includes(group.id)
                        ? prev.filter((id) => id !== group.id)
                        : [...prev, group.id]
                    );
                  }}
                />
                <span
                  style={{ flex: 1 }}
                  onClick={() => {
                    handleGroupSelect(group.id);
                    handleClose();
                  }}
                >
                  {groupIndex + 1}. {group.name}
                </span>
                <span style={{ fontSize: 13, color: "#888", fontWeight: 400 }}>
                  ({group.indicators.length})
                </span>
              </div>
              {isExpandedInSelector &&
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
