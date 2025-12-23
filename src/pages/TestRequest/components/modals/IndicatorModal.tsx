import React from "react";
import { Modal, Checkbox, Button, DatePicker, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import { LaboratoryAssignment, IndicatorDates } from "../../types";

const { Text } = Typography;

interface IndicatorGroup {
  id: string;
  name: string;
}

interface Indicator {
  id: string;
  name: string;
  code?: string;
  unitPrice: number;
  indicatorGroupId: string;
  isActive: boolean;
}

interface IndicatorModalProps {
  visible: boolean;
  indicatorGroups: IndicatorGroup[];
  indicators: Indicator[];
  tempSelectedIndicators: string[];
  checkedIndicators: string[];
  selectedGroupFilter: string;
  expandedGroups: string[];
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
  expandedLabGroups: string[];
  currentSampleKey: string | null;
  selectedIndicatorDates: Record<string, IndicatorDates>;
  onToggleIndicator: (indicatorId: string) => void;
  onToggleChecked: (indicatorId: string) => void;
  onSelectAllChecked: (checked: boolean) => void;
  onToggleGroup: (groupId: string) => void;
  onToggleLabGroup: (labId: string) => void;
  onSendToLaboratory: () => void;
  onOpenGroupSelector: () => void;
  onDateChange: (indicatorId: string, field: "transferDate" | "requestDate", value: dayjs.Dayjs | null) => void;
  onRemoveIndicator: (indicatorId: string) => void;
  onOk: () => void;
  onCancel: () => void;
  getFilteredIndicators: () => Indicator[];
}

const IndicatorModal: React.FC<IndicatorModalProps> = ({
  visible,
  indicatorGroups,
  indicators,
  tempSelectedIndicators,
  checkedIndicators,
  selectedGroupFilter,
  expandedGroups,
  indicatorLaboratoryMap,
  expandedLabGroups,
  currentSampleKey,
  selectedIndicatorDates,
  onToggleIndicator,
  onToggleChecked,
  onSelectAllChecked,
  onToggleGroup,
  onToggleLabGroup,
  onSendToLaboratory,
  onOpenGroupSelector,
  onDateChange,
  onRemoveIndicator,
  onOk,
  onCancel,
  getFilteredIndicators,
}) => {
  // Get unsent indicators
  const unsentIndicators = tempSelectedIndicators.filter(
    (id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]
  );

  // Get sent indicators
  const sentIndicators = tempSelectedIndicators.filter(
    (id) => indicatorLaboratoryMap[`${currentSampleKey}_${id}`]
  );

  // Group sent indicators by laboratory
  const groupedByLab: Record<string, { labName: string; requestDate: dayjs.Dayjs; indicators: string[] }> = {};
  sentIndicators.forEach((id) => {
    const labInfo = indicatorLaboratoryMap[`${currentSampleKey}_${id}`];
    if (labInfo) {
      if (!groupedByLab[labInfo.laboratoryId]) {
        groupedByLab[labInfo.laboratoryId] = {
          labName: labInfo.laboratoryName,
          requestDate: labInfo.requestDate,
          indicators: [],
        };
      }
      groupedByLab[labInfo.laboratoryId].indicators.push(id);
    }
  });

  const getIndicatorInfo = (id: string) => {
    return indicators.find((ind) => ind.id === id);
  };

  // Calculate total price
  const totalPrice = tempSelectedIndicators.reduce((sum, id) => {
    const ind = getIndicatorInfo(id);
    return sum + (ind?.unitPrice || 0);
  }, 0);

  // Render indicator row
  const renderIndicatorRow = (id: string, isInGroup: boolean = false) => {
    const ind = getIndicatorInfo(id);
    if (!ind) return null;
    const dates = selectedIndicatorDates[id] || {};

    return (
      <div
        key={id}
        style={{
          padding: isInGroup ? "8px 12px 8px 36px" : "8px 12px",
          borderBottom: "1px solid #f5f5f5",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
        }}
      >
        <Checkbox
          checked={checkedIndicators.includes(id)}
          onChange={() => onToggleChecked(id)}
          style={{ width: 24 }}
        />
        <span style={{ flex: 1, fontSize: 13 }}>{ind.name}</span>
        <span style={{ fontSize: 12, color: "#888", width: 80, textAlign: "right" }}>
          {ind.unitPrice?.toLocaleString("vi-VN")}đ
        </span>
        <DatePicker
          value={dates.transferDate}
          onChange={(date) => onDateChange(id, "transferDate", date)}
          format="DD/MM/YYYY"
          size="small"
          style={{ width: 110 }}
          placeholder="Chuyển giao"
        />
        <DatePicker
          value={dates.requestDate}
          onChange={(date) => onDateChange(id, "requestDate", date)}
          format="DD/MM/YYYY"
          size="small"
          style={{ width: 110 }}
          placeholder="Yêu cầu"
        />
        <Button
          type="text"
          size="small"
          danger
          icon={<CloseOutlined />}
          style={{ width: 32 }}
          onClick={() => onRemoveIndicator(id)}
        />
      </div>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon icon="mdi:clipboard-check-outline" width={24} height={24} />
          <span>Chọn chỉ tiêu</span>
        </div>
      }
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={1200}
      okText="Chọn"
      cancelText="Thoát"
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: "flex", height: 500 }}>
        {/* Left panel - Indicator list */}
        <div
          style={{
            width: 320,
            borderRight: "1px solid #f0f0f0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Group filter button */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
          >
            <div
              onClick={onOpenGroupSelector}
              style={{
                padding: "6px 12px",
                border: "1px solid #d9d9d9",
                borderRadius: 4,
                cursor: "pointer",
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: selectedGroupFilter === "all" ? "#999" : "#000" }}>
                {selectedGroupFilter === "all"
                  ? "--- Tất cả nhóm chỉ tiêu ---"
                  : indicatorGroups.find((g) => g.id === selectedGroupFilter)?.name || "Chọn nhóm..."}
              </span>
              <Icon icon="mdi:chevron-down" width={16} />
            </div>
          </div>

          {/* Indicator list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {selectedGroupFilter === "all"
              ? // Show grouped by indicator group
                indicatorGroups.map((group) => {
                  const groupIndicators = indicators.filter(
                    (ind) => ind.indicatorGroupId === group.id && ind.isActive
                  );
                  if (groupIndicators.length === 0) return null;

                  const isExpanded = expandedGroups.includes(group.id);

                  return (
                    <div key={group.id}>
                      <div
                        onClick={() => onToggleGroup(group.id)}
                        style={{
                          padding: "8px 12px",
                          background: "#fafafa",
                          borderBottom: "1px solid #f0f0f0",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#000",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e6f7ff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fafafa";
                        }}
                      >
                        <Icon
                          icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
                          width={18}
                          style={{ color: "#595959", flexShrink: 0 }}
                        />
                        <span style={{ flex: 1 }}>{group.name}</span>
                        <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>
                          ({groupIndicators.length})
                        </span>
                      </div>
                      {isExpanded &&
                        groupIndicators.map((ind) => (
                          <div
                            key={ind.id}
                            onClick={() => onToggleIndicator(ind.id)}
                            style={{
                              padding: "6px 12px 6px 36px",
                              borderBottom: "1px solid #f5f5f5",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              cursor: "pointer",
                              background: tempSelectedIndicators.includes(ind.id) ? "#e6f7ff" : "#fff",
                            }}
                            onMouseEnter={(e) => {
                              if (!tempSelectedIndicators.includes(ind.id)) {
                                e.currentTarget.style.background = "#f5f5f5";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = tempSelectedIndicators.includes(ind.id)
                                ? "#e6f7ff"
                                : "#fff";
                            }}
                          >
                            <Checkbox
                              checked={tempSelectedIndicators.includes(ind.id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => onToggleIndicator(ind.id)}
                            />
                            <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ind.name}
                            </span>
                            <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>
                              {ind.unitPrice?.toLocaleString("vi-VN")}
                            </span>
                          </div>
                        ))}
                    </div>
                  );
                })
              : // Show flat list when group is selected
                getFilteredIndicators().map((ind) => (
                  <div
                    key={ind.id}
                    onClick={() => onToggleIndicator(ind.id)}
                    style={{
                      padding: "6px 12px",
                      borderBottom: "1px solid #f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      background: tempSelectedIndicators.includes(ind.id) ? "#e6f7ff" : "#fff",
                    }}
                    onMouseEnter={(e) => {
                      if (!tempSelectedIndicators.includes(ind.id)) {
                        e.currentTarget.style.background = "#f5f5f5";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = tempSelectedIndicators.includes(ind.id)
                        ? "#e6f7ff"
                        : "#fff";
                    }}
                  >
                    <Checkbox
                      checked={tempSelectedIndicators.includes(ind.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleIndicator(ind.id)}
                    />
                    <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ind.name}
                    </span>
                    <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>
                      {ind.unitPrice?.toLocaleString("vi-VN")}
                    </span>
                  </div>
                ))}
          </div>
        </div>

        {/* Right panel - Selected indicators grouped by laboratory */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Text strong>Danh sách đã chọn</Text>
              <Checkbox
                checked={
                  checkedIndicators.length === unsentIndicators.length &&
                  unsentIndicators.length > 0
                }
                indeterminate={
                  checkedIndicators.length > 0 &&
                  checkedIndicators.length < unsentIndicators.length
                }
                onChange={(e) => onSelectAllChecked(e.target.checked)}
              >
                Chọn tất cả
              </Checkbox>
            </div>
            <Button
              type="primary"
              size="small"
              icon={<Icon icon="mdi:send" width={14} />}
              onClick={onSendToLaboratory}
            >
              Gửi khoa phòng
            </Button>
          </div>

          {/* Table content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Table header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "#fafafa",
                borderBottom: "1px solid #f0f0f0",
                fontWeight: 600,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              <span style={{ width: 24 }}>[X]</span>
              <span style={{ flex: 1 }}>Chỉ tiêu</span>
              <span style={{ width: 80, textAlign: "right" }}>Đơn giá</span>
              <span style={{ width: 110, textAlign: "center" }}>Ngày chuyển giao</span>
              <span style={{ width: 110, textAlign: "center" }}>Ngày yêu cầu</span>
              <span style={{ width: 32 }}>Xóa</span>
            </div>

            {/* Table body */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {tempSelectedIndicators.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center" }}>
                  <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
                </div>
              ) : (
                <>
                  {/* Unsent indicators - display normally without group header */}
                  {unsentIndicators.map((id) => renderIndicatorRow(id, false))}

                  {/* Sent indicators grouped by laboratory */}
                  {Object.entries(groupedByLab).map(([labId, { labName, indicators: labIndicators }]) => {
                    const isExpanded = expandedLabGroups.includes(labId);
                    return (
                      <div key={labId}>
                        {/* Group header */}
                        <div
                          onClick={() => onToggleLabGroup(labId)}
                          style={{
                            padding: "8px 12px",
                            background: "#fafafa",
                            borderBottom: "1px solid #f0f0f0",
                            fontWeight: 600,
                            fontSize: 13,
                            color: "#000",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          <Icon
                            icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
                            width={18}
                            style={{ color: "#595959", flexShrink: 0 }}
                          />
                          <span>{labName} ({labIndicators.length})</span>
                        </div>
                        {/* Group items - only show when expanded */}
                        {isExpanded && labIndicators.map((id) => renderIndicatorRow(id, true))}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Footer with totals */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #d9d9d9",
              background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14 }}>
              Số chỉ tiêu: <Text strong>{tempSelectedIndicators.length}</Text>
              {sentIndicators.length > 0 && (
                <span style={{ color: "#52c41a", marginLeft: 8 }}>
                  (Đã gửi: {sentIndicators.length})
                </span>
              )}
            </Text>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 14 }}>Tổng tiền:</Text>
              <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                {totalPrice.toLocaleString("vi-VN")} đ
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IndicatorModal;
