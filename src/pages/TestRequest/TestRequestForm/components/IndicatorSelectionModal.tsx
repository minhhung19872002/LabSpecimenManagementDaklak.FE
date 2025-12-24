// @ts-nocheck
import React, { useEffect } from "react";
import { Modal, Button, Checkbox, Typography } from "antd";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import { IndicatorGroupDto, IndicatorDto } from "../../../../services/masterDataService";
import { IndicatorDateInfo, LaboratoryAssignment } from "../types";
import IndicatorRow from "./IndicatorRow";

const { Text } = Typography;

interface IndicatorSelectionModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  currentSampleKey: string | null;
  tempSelectedIndicators: string[];
  setTempSelectedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  indicatorGroups: IndicatorGroupDto[];
  indicators: IndicatorDto[];
  expandedGroups: string[];
  setExpandedGroups: React.Dispatch<React.SetStateAction<string[]>>;
  selectedGroupFilter: string;
  setGroupSelectorVisible: (visible: boolean) => void;
  indicatorSearchText: string;
  getFilteredIndicators: () => IndicatorDto[];
  getIndicatorInfo: (indicatorId: string) => IndicatorDto | undefined;
  toggleIndicator: (indicatorId: string) => void;
  selectedIndicatorDates: Record<string, IndicatorDateInfo>;
  setSelectedIndicatorDates: React.Dispatch<React.SetStateAction<Record<string, IndicatorDateInfo>>>;
  checkedIndicators: string[];
  setCheckedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  handleIndicatorDateChange: (indicatorId: string, field: "transferDate" | "requestDate", value: dayjs.Dayjs | null) => void;
  toggleCheckedIndicator: (indicatorId: string) => void;
  handleSendToLaboratory: () => void;
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
  setIndicatorLaboratoryMap: React.Dispatch<React.SetStateAction<Record<string, LaboratoryAssignment>>>;
  expandedLabGroups: string[];
  setExpandedLabGroups: React.Dispatch<React.SetStateAction<string[]>>;
}

const IndicatorSelectionModal: React.FC<IndicatorSelectionModalProps> = ({
  visible,
  onOk,
  onCancel,
  currentSampleKey,
  tempSelectedIndicators,
  indicatorGroups,
  indicators,
  expandedGroups,
  setExpandedGroups,
  selectedGroupFilter,
  setGroupSelectorVisible,
  indicatorSearchText,
  getFilteredIndicators,
  getIndicatorInfo,
  toggleIndicator,
  selectedIndicatorDates,
  setSelectedIndicatorDates,
  checkedIndicators,
  setCheckedIndicators,
  handleIndicatorDateChange,
  toggleCheckedIndicator,
  handleSendToLaboratory,
  indicatorLaboratoryMap,
  setIndicatorLaboratoryMap,
  expandedLabGroups,
  setExpandedLabGroups,
}) => {
  // Initialize dates when modal opens
  useEffect(() => {
    if (visible && tempSelectedIndicators.length > 0) {
      const today = dayjs();
      const newDates: Record<string, IndicatorDateInfo> = {};
      tempSelectedIndicators.forEach((id) => {
        if (!selectedIndicatorDates[id]) {
          newDates[id] = { transferDate: today, requestDate: today };
        }
      });
      if (Object.keys(newDates).length > 0) {
        setSelectedIndicatorDates((prev) => ({ ...prev, ...newDates }));
      }
    }
  }, [visible, tempSelectedIndicators]);

  // Handle remove indicator
  const handleRemoveIndicator = (id: string) => {
    toggleIndicator(id);
    const labMapKey = `${currentSampleKey}_${id}`;
    if (indicatorLaboratoryMap[labMapKey]) {
      setIndicatorLaboratoryMap((prev) => {
        const updated = { ...prev };
        delete updated[labMapKey];
        return updated;
      });
    }
  };

  // Separate sent and unsent indicators
  const unsentIndicators = tempSelectedIndicators.filter(
    (id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]
  );
  const sentIndicators = tempSelectedIndicators.filter(
    (id) => indicatorLaboratoryMap[`${currentSampleKey}_${id}`]
  );

  // Group sent indicators by laboratory
  const groupedByLab: Record<
    string,
    { labName: string; requestDate: dayjs.Dayjs; indicators: string[] }
  > = {};
  sentIndicators.forEach((id) => {
    const labInfo = indicatorLaboratoryMap[`${currentSampleKey}_${id}`];
    if (!groupedByLab[labInfo.laboratoryId]) {
      groupedByLab[labInfo.laboratoryId] = {
        labName: labInfo.laboratoryName,
        requestDate: labInfo.requestDate,
        indicators: [],
      };
    }
    groupedByLab[labInfo.laboratoryId].indicators.push(id);
  });

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
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
          >
            <div
              onClick={() => setGroupSelectorVisible(true)}
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
                  : indicatorGroups.find((g) => g.id === selectedGroupFilter)?.name ||
                    "Chọn nhóm..."}
              </span>
              <Icon icon="mdi:chevron-down" width={16} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {selectedGroupFilter === "all"
              ? indicatorGroups.map((group) => {
                  const groupIndicators = indicators.filter(
                    (ind) => ind.indicatorGroupId === group.id && ind.isActive
                  );
                  if (groupIndicators.length === 0) return null;

                  const filteredIndicators = indicatorSearchText.trim()
                    ? groupIndicators.filter(
                        (ind) =>
                          ind.name
                            .toLowerCase()
                            .includes(indicatorSearchText.toLowerCase().trim()) ||
                          ind.code
                            ?.toLowerCase()
                            .includes(indicatorSearchText.toLowerCase().trim())
                      )
                    : groupIndicators;

                  if (filteredIndicators.length === 0) return null;

                  const isExpanded = expandedGroups.includes(group.id);

                  return (
                    <div key={group.id}>
                      <div
                        onClick={() => {
                          setExpandedGroups((prev) =>
                            prev.includes(group.id)
                              ? prev.filter((id) => id !== group.id)
                              : [...prev, group.id]
                          );
                        }}
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
                          ({filteredIndicators.length})
                        </span>
                      </div>
                      {isExpanded &&
                        filteredIndicators.map((ind) => (
                          <div
                            key={ind.id}
                            onClick={() => toggleIndicator(ind.id)}
                            style={{
                              padding: "6px 12px 6px 36px",
                              borderBottom: "1px solid #f5f5f5",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              cursor: "pointer",
                              background: tempSelectedIndicators.includes(ind.id)
                                ? "#e6f7ff"
                                : "#fff",
                            }}
                            onMouseEnter={(e) => {
                              if (!tempSelectedIndicators.includes(ind.id)) {
                                e.currentTarget.style.background = "#f5f5f5";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                tempSelectedIndicators.includes(ind.id) ? "#e6f7ff" : "#fff";
                            }}
                          >
                            <Checkbox
                              checked={tempSelectedIndicators.includes(ind.id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleIndicator(ind.id)}
                            />
                            <span
                              style={{
                                flex: 1,
                                fontSize: 13,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ind.name}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                color: "#888",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ind.unitPrice?.toLocaleString("vi-VN")}
                            </span>
                          </div>
                        ))}
                    </div>
                  );
                })
              : getFilteredIndicators().map((ind) => (
                  <div
                    key={ind.id}
                    onClick={() => toggleIndicator(ind.id)}
                    style={{
                      padding: "6px 12px",
                      borderBottom: "1px solid #f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      background: tempSelectedIndicators.includes(ind.id)
                        ? "#e6f7ff"
                        : "#fff",
                    }}
                    onMouseEnter={(e) => {
                      if (!tempSelectedIndicators.includes(ind.id)) {
                        e.currentTarget.style.background = "#f5f5f5";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        tempSelectedIndicators.includes(ind.id) ? "#e6f7ff" : "#fff";
                    }}
                  >
                    <Checkbox
                      checked={tempSelectedIndicators.includes(ind.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleIndicator(ind.id)}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ind.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#888",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ind.unitPrice?.toLocaleString("vi-VN")}
                    </span>
                  </div>
                ))}
          </div>
        </div>

        {/* Right panel - Selected indicators grouped by laboratory */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
                onChange={(e) => {
                  if (e.target.checked) {
                    setCheckedIndicators(unsentIndicators);
                  } else {
                    setCheckedIndicators([]);
                  }
                }}
              >
                Chọn tất cả
              </Checkbox>
            </div>
            <Button
              type="primary"
              size="small"
              icon={<Icon icon="mdi:send" width={14} />}
              onClick={handleSendToLaboratory}
            >
              Gửi khoa phòng
            </Button>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
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
              {/* Unsent indicators */}
              {unsentIndicators.map((id) => (
                <IndicatorRow
                  key={id}
                  id={id}
                  isInGroup={false}
                  indicator={getIndicatorInfo(id)}
                  isChecked={checkedIndicators.includes(id)}
                  transferDate={selectedIndicatorDates[id]?.transferDate}
                  requestDate={selectedIndicatorDates[id]?.requestDate}
                  onCheckChange={toggleCheckedIndicator}
                  onDateChange={handleIndicatorDateChange}
                  onRemove={handleRemoveIndicator}
                />
              ))}

              {/* Sent indicators grouped by laboratory */}
              {Object.entries(groupedByLab).map(
                ([labId, { labName, indicators: labIndicators }]) => {
                  const isExpanded = expandedLabGroups.includes(labId);
                  return (
                    <div key={labId}>
                      <div
                        onClick={() => {
                          setExpandedLabGroups((prev) =>
                            prev.includes(labId)
                              ? prev.filter((id) => id !== labId)
                              : [...prev, labId]
                          );
                        }}
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
                        <span>
                          {labName} ({labIndicators.length})
                        </span>
                      </div>
                      {isExpanded &&
                        labIndicators.map((id) => (
                          <IndicatorRow
                            key={id}
                            id={id}
                            isInGroup={true}
                            indicator={getIndicatorInfo(id)}
                            isChecked={checkedIndicators.includes(id)}
                            transferDate={selectedIndicatorDates[id]?.transferDate}
                            requestDate={selectedIndicatorDates[id]?.requestDate}
                            onCheckChange={toggleCheckedIndicator}
                            onDateChange={handleIndicatorDateChange}
                            onRemove={handleRemoveIndicator}
                          />
                        ))}
                    </div>
                  );
                }
              )}

              {/* Empty state */}
              {tempSelectedIndicators.length === 0 && (
                <div style={{ padding: 24, textAlign: "center" }}>
                  <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
                </div>
              )}
            </div>
          </div>
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
                {tempSelectedIndicators
                  .reduce((sum, id) => {
                    const ind = getIndicatorInfo(id);
                    return sum + (ind?.unitPrice || 0);
                  }, 0)
                  .toLocaleString("vi-VN")}{" "}
                đ
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IndicatorSelectionModal;
