// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Collapse,
  Checkbox,
  DatePicker,
  Select,
  Button,
  Space,
  Typography,
  Tooltip,
  message,
  Spin,
} from "antd";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import {
  TestRequestDto,
  TestRequestSampleDto,
  TestRequestSampleIndicatorDto,
  UpdateIndicatorLaboratoryInput,
} from "../../../types/testRequest";
import {
  LaboratoryDto,
  laboratoryService,
} from "../../../services/masterDataService";
import { testRequestService } from "../../../services/testRequestService";
import { IndicatorName } from "../../../components/common";

const { Text } = Typography;
const { Panel } = Collapse;

interface SendToQLKTModalProps {
  visible: boolean;
  testRequest: TestRequestDto;
  onCancel: () => void;
  onSuccess: () => void;
}

// Local state for each indicator
interface IndicatorState {
  sampleIndicatorId: string;
  laboratoryId?: string;
  requestDate?: dayjs.Dayjs;
  isChecked: boolean;
}

// Extended indicator with parent-child metadata
interface ProcessedIndicator extends TestRequestSampleIndicatorDto {
  _isParentWithChildren: boolean;
  _isSubIndicator: boolean;
  _isFirstSubIndicator: boolean;
  _isLastSubIndicator: boolean;
}

// Helper: tạo composite key từ indicatorId + methodId
const makeGroupKey = (indicatorId: string, methodId: string | null | undefined) =>
  `${indicatorId}_${methodId || 'no-method'}`;

// Group và flatten indicators theo quan hệ parent-child
const processIndicatorsWithHierarchy = (
  indicators: TestRequestSampleIndicatorDto[]
): ProcessedIndicator[] => {
  if (!indicators?.length) return [];

  // Step 1: Tách thành parents và subs
  const parents: TestRequestSampleIndicatorDto[] = [];
  const subs: TestRequestSampleIndicatorDto[] = [];

  indicators.forEach((ind) => {
    if (ind.parentIndicatorId) {
      subs.push(ind);
    } else {
      parents.push(ind);
    }
  });

  // Step 2: Xây dựng map parent -> children
  // Key = parentIndicatorId_methodId
  const parentMap = new Map<
    string,
    { parent: TestRequestSampleIndicatorDto; children: TestRequestSampleIndicatorDto[] }
  >();
  const orphans: TestRequestSampleIndicatorDto[] = [];

  // Initialize parents
  parents.forEach((parent) => {
    const key = makeGroupKey(parent.indicatorId, parent.testMethodId);
    parentMap.set(key, { parent, children: [] });
  });

  // Assign subs to their parents
  subs.forEach((sub) => {
    const parentKey = makeGroupKey(sub.parentIndicatorId!, sub.testMethodId);
    if (parentMap.has(parentKey)) {
      parentMap.get(parentKey)!.children.push(sub);
    } else {
      orphans.push(sub);
    }
  });

  // Step 3: Flatten với metadata
  const result: ProcessedIndicator[] = [];

  parentMap.forEach(({ parent, children }) => {
    const hasChildren = children.length > 0;

    result.push({
      ...parent,
      _isParentWithChildren: hasChildren,
      _isSubIndicator: false,
      _isFirstSubIndicator: false,
      _isLastSubIndicator: false,
    });

    children.forEach((child, idx) => {
      result.push({
        ...child,
        _isParentWithChildren: false,
        _isSubIndicator: true,
        _isFirstSubIndicator: idx === 0,
        _isLastSubIndicator: idx === children.length - 1,
      });
    });
  });

  // Add orphans
  orphans.forEach((ind) => {
    result.push({
      ...ind,
      _isParentWithChildren: false,
      _isSubIndicator: true,
      _isFirstSubIndicator: true,
      _isLastSubIndicator: true,
    });
  });

  return result;
};

const SendToQLKTModal: React.FC<SendToQLKTModalProps> = ({
  visible,
  testRequest,
  onCancel,
  onSuccess,
}) => {
  const [laboratories, setLaboratories] = useState<LaboratoryDto[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [indicatorStates, setIndicatorStates] = useState<
    Record<string, IndicatorState>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);

  // Load laboratories on mount
  useEffect(() => {
    const loadLaboratories = async () => {
      setLoadingLabs(true);
      try {
        const labs = await laboratoryService.getActive();
        setLaboratories(labs);
      } catch (error) {
        console.error("Error loading laboratories:", error);
        message.error("Không thể tải danh sách khoa phòng");
      } finally {
        setLoadingLabs(false);
      }
    };
    if (visible) {
      loadLaboratories();
    }
  }, [visible]);

  // Initialize indicator states when modal opens and laboratories are loaded
  // Auto-fill laboratoryId from indicator's existing value or from indicator group's default laboratory
  // Chỉ lấy các chỉ tiêu CHƯA gửi QLKT (isSentToQLKT = false)
  // Only auto-fill if laboratory exists in active laboratories list
  useEffect(() => {
    if (visible && testRequest?.samples && laboratories.length > 0) {
      const states: Record<string, IndicatorState> = {};
      const panelKeys: string[] = [];
      const labIds = new Set(laboratories.map((lab) => lab.id));

      testRequest.samples.forEach((sample) => {
        if (sample.isCancelled || sample.isCustomerCancelled) return;

        // Chỉ lấy indicators chưa gửi QLKT
        const unsent = sample.indicators?.filter((ind) => !ind.isSentToQLKT) || [];
        if (unsent.length === 0) return; // Bỏ qua sample không còn indicator chưa gửi

        panelKeys.push(sample.id);

        unsent.forEach((indicator) => {
          // Only use existing laboratoryId if it exists in active list
          const autoFilledLabId =
            indicator.laboratoryId && labIds.has(indicator.laboratoryId)
              ? indicator.laboratoryId
              : undefined;

          states[indicator.id] = {
            sampleIndicatorId: indicator.id,
            laboratoryId: autoFilledLabId,
            requestDate: indicator.requestDate
              ? dayjs(indicator.requestDate)
              : undefined,
            isChecked: false,
          };
        });
      });

      setIndicatorStates(states);
      setExpandedPanels(panelKeys);
    }
  }, [visible, testRequest, laboratories]);

  // Get active samples (not cancelled)
  const activeSamples = useMemo(() => {
    if (!testRequest?.samples) return [];
    return testRequest.samples.filter(
      (s) => !s.isCancelled && !s.isCustomerCancelled
    );
  }, [testRequest?.samples]);

  // Get all indicator IDs that are checked
  const checkedIndicatorIds = useMemo(() => {
    return Object.entries(indicatorStates)
      .filter(([_, state]) => state.isChecked)
      .map(([id]) => id);
  }, [indicatorStates]);

  // Get all parent (non-sub) indicators for validation
  // Sub-indicators inherit from parent, so we only validate parents
  const getParentIndicatorIds = useMemo(() => {
    const parentIds = new Set<string>();
    activeSamples.forEach((sample) => {
      sample.indicators?.forEach((ind) => {
        if (!ind.parentIndicatorId && !ind.isSentToQLKT) {
          parentIds.add(ind.id);
        }
      });
    });
    return parentIds;
  }, [activeSamples]);

  // Check if all SELECTED parent indicators have laboratory AND request date
  // Sub-indicators don't need validation as they inherit from parent
  const selectedIndicatorsValid = useMemo(() => {
    const selectedParentStates = Object.entries(indicatorStates)
      .filter(([id, state]) => state.isChecked && getParentIndicatorIds.has(id));
    if (selectedParentStates.length === 0) return false; // Phải chọn ít nhất 1 parent
    return selectedParentStates.every(
      ([_, state]) => state.laboratoryId && state.laboratoryId !== "" && state.requestDate
    );
  }, [indicatorStates, getParentIndicatorIds]);

  // Get selected PARENT indicators missing laboratory (sub-indicators inherit from parent)
  const selectedMissingLab = useMemo(() => {
    return Object.entries(indicatorStates)
      .filter(([id, state]) => state.isChecked && getParentIndicatorIds.has(id) && !state.laboratoryId)
      .map(([id]) => id);
  }, [indicatorStates, getParentIndicatorIds]);

  // Get selected PARENT indicators missing request date (sub-indicators inherit from parent)
  const selectedMissingDate = useMemo(() => {
    return Object.entries(indicatorStates)
      .filter(([id, state]) => state.isChecked && getParentIndicatorIds.has(id) && !state.requestDate)
      .map(([id]) => id);
  }, [indicatorStates, getParentIndicatorIds]);

  // Count only parent indicators for display
  const checkedParentCount = useMemo(() => {
    return Object.entries(indicatorStates)
      .filter(([id, state]) => state.isChecked && getParentIndicatorIds.has(id))
      .length;
  }, [indicatorStates, getParentIndicatorIds]);

  // Get parent indicator key for a sub-indicator
  const getParentKey = (indicator: TestRequestSampleIndicatorDto, sample: TestRequestSampleDto): string | null => {
    if (!indicator.parentIndicatorId) return null;
    const parentKey = makeGroupKey(indicator.parentIndicatorId, indicator.testMethodId);
    // Find parent in same sample
    const parent = sample.indicators?.find(
      (ind) => makeGroupKey(ind.indicatorId, ind.testMethodId) === parentKey && !ind.parentIndicatorId
    );
    return parent?.id || null;
  };

  // Get sub-indicators of a parent
  const getSubIndicatorIds = (parentIndicator: TestRequestSampleIndicatorDto, sample: TestRequestSampleDto): string[] => {
    const parentKey = makeGroupKey(parentIndicator.indicatorId, parentIndicator.testMethodId);
    return (sample.indicators || [])
      .filter((ind) => {
        if (!ind.parentIndicatorId) return false;
        const subParentKey = makeGroupKey(ind.parentIndicatorId, ind.testMethodId);
        return subParentKey === parentKey;
      })
      .map((ind) => ind.id);
  };

  // Handle checkbox change for individual indicator
  const handleCheckChange = (indicatorId: string, sample: TestRequestSampleDto) => {
    const indicator = sample.indicators?.find((ind) => ind.id === indicatorId);
    if (!indicator) return;

    const newChecked = !indicatorStates[indicatorId]?.isChecked;

    setIndicatorStates((prev) => {
      const updated = { ...prev };

      // Update this indicator
      if (updated[indicatorId]) {
        updated[indicatorId] = { ...updated[indicatorId], isChecked: newChecked };
      }

      // If this is a parent with children, sync check state to children
      if (!indicator.parentIndicatorId) {
        const subIds = getSubIndicatorIds(indicator, sample);
        subIds.forEach((subId) => {
          if (updated[subId]) {
            updated[subId] = { ...updated[subId], isChecked: newChecked };
          }
        });
      }

      return updated;
    });
  };

  // Handle select all in a sample
  const handleSelectAllSample = (sampleId: string, checked: boolean) => {
    const sample = activeSamples.find((s) => s.id === sampleId);
    if (!sample) return;

    setIndicatorStates((prev) => {
      const updated = { ...prev };
      sample.indicators?.forEach((ind) => {
        if (updated[ind.id]) {
          updated[ind.id] = { ...updated[ind.id], isChecked: checked };
        }
      });
      return updated;
    });
  };

  // Handle laboratory change for individual indicator (and sync to sub-indicators)
  const handleLabChange = (indicatorId: string, labId: string, sample: TestRequestSampleDto) => {
    const indicator = sample.indicators?.find((ind) => ind.id === indicatorId);
    if (!indicator) return;

    setIndicatorStates((prev) => {
      const updated = { ...prev };
      updated[indicatorId] = { ...updated[indicatorId], laboratoryId: labId };

      // If this is a parent, sync to sub-indicators
      if (!indicator.parentIndicatorId) {
        const subIds = getSubIndicatorIds(indicator, sample);
        subIds.forEach((subId) => {
          if (updated[subId]) {
            updated[subId] = { ...updated[subId], laboratoryId: labId };
          }
        });
      }

      return updated;
    });
  };

  // Handle request date change for individual indicator (and sync to sub-indicators)
  const handleRequestDateChange = (
    indicatorId: string,
    date: dayjs.Dayjs | null,
    sample: TestRequestSampleDto
  ) => {
    const indicator = sample.indicators?.find((ind) => ind.id === indicatorId);
    if (!indicator) return;

    setIndicatorStates((prev) => {
      const updated = { ...prev };
      updated[indicatorId] = { ...updated[indicatorId], requestDate: date || undefined };

      // If this is a parent, sync to sub-indicators
      if (!indicator.parentIndicatorId) {
        const subIds = getSubIndicatorIds(indicator, sample);
        subIds.forEach((subId) => {
          if (updated[subId]) {
            updated[subId] = { ...updated[subId], requestDate: date || undefined };
          }
        });
      }

      return updated;
    });
  };

  // Apply laboratory to all checked parent indicators (and their sub-indicators)
  const handleApplyLabToChecked = (labId: string) => {
    if (checkedIndicatorIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 chỉ tiêu");
      return;
    }

    setIndicatorStates((prev) => {
      const updated = { ...prev };
      // Apply to all checked indicators (both parent and sub)
      checkedIndicatorIds.forEach((id) => {
        if (updated[id]) {
          updated[id] = { ...updated[id], laboratoryId: labId };
        }
      });
      return updated;
    });
  };

  // Apply request date to all checked parent indicators (and their sub-indicators)
  const handleApplyRequestDateToChecked = (date: dayjs.Dayjs | null) => {
    if (checkedIndicatorIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 chỉ tiêu");
      return;
    }

    setIndicatorStates((prev) => {
      const updated = { ...prev };
      // Apply to all checked indicators (both parent and sub)
      checkedIndicatorIds.forEach((id) => {
        if (updated[id]) {
          updated[id] = { ...updated[id], requestDate: date || undefined };
        }
      });
      return updated;
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    // Phải chọn ít nhất 1 indicator
    if (checkedIndicatorIds.length === 0) {
      message.error("Vui lòng chọn ít nhất 1 chỉ tiêu để gửi QLKT");
      return;
    }

    // Validate selected indicators have laboratory
    if (selectedMissingLab.length > 0) {
      message.error(
        `Còn ${selectedMissingLab.length} chỉ tiêu đã chọn chưa có khoa phòng`
      );
      return;
    }

    // Validate selected indicators have request date
    if (selectedMissingDate.length > 0) {
      message.error(
        `Còn ${selectedMissingDate.length} chỉ tiêu đã chọn chưa có ngày yêu cầu`
      );
      return;
    }

    setSubmitting(true);
    try {
      // Chỉ gửi các indicators ĐÃ CHỌN (isChecked = true)
      const selectedStates = Object.values(indicatorStates).filter(
        (state) => state.isChecked
      );
      const indicators: UpdateIndicatorLaboratoryInput[] = selectedStates.map(
        (state) => ({
          sampleIndicatorId: state.sampleIndicatorId,
          laboratoryId: state.laboratoryId!,
          requestDate: state.requestDate?.toISOString(),
        })
      );

      // Call API to update indicators laboratory
      await testRequestService.updateIndicatorsLaboratory(
        testRequest.id,
        indicators
      );

      // Call API to send to QLKT
      await testRequestService.sendToQLKT(testRequest.id);

      message.success(`Đã gửi ${selectedStates.length} chỉ tiêu đến QLKT thành công`);
      onSuccess();
    } catch (error: any) {
      console.error("Error sending to QLKT:", error);
      message.error(
        error?.response?.data?.general?.[0] ||
          error?.response?.data?.message ||
          "Không thể gửi QLKT. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Lấy danh sách chỉ tiêu chưa gửi của sample
  const getUnsentIndicators = (sample: TestRequestSampleDto) => {
    return sample.indicators?.filter((ind) => !ind.isSentToQLKT) || [];
  };

  // Check if all UNSENT indicators in a sample are checked
  const isSampleAllChecked = (sample: TestRequestSampleDto) => {
    const unsent = getUnsentIndicators(sample);
    if (unsent.length === 0) return false;
    return unsent.every((ind) => indicatorStates[ind.id]?.isChecked);
  };

  // Check if some (but not all) UNSENT indicators in a sample are checked
  const isSampleIndeterminate = (sample: TestRequestSampleDto) => {
    const unsent = getUnsentIndicators(sample);
    if (unsent.length === 0) return false;
    const checkedCount = unsent.filter(
      (ind) => indicatorStates[ind.id]?.isChecked
    ).length;
    return checkedCount > 0 && checkedCount < unsent.length;
  };

  // Samples có ít nhất 1 chỉ tiêu chưa gửi
  const samplesWithUnsentIndicators = useMemo(() => {
    return activeSamples.filter((s) => getUnsentIndicators(s).length > 0);
  }, [activeSamples]);

  // Render indicator row with parent-child hierarchy
  const renderIndicatorRow = (
    indicator: ProcessedIndicator,
    sample: TestRequestSampleDto
  ) => {
    const state = indicatorStates[indicator.id];
    if (!state) return null;

    const isSubIndicator = indicator._isSubIndicator;
    const isLastSub = indicator._isLastSubIndicator;

    // Build tree line CSS classes
    const treeLineClasses = ["indicator-name-cell"];
    if (isSubIndicator) {
      treeLineClasses.push("has-tree-line");
      if (isLastSub) treeLineClasses.push("is-last-sub");
    }

    return (
      <div
        key={indicator.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: isSubIndicator ? "4px 12px" : "8px 12px",
          borderBottom: "1px solid #f5f5f5",
          background: isSubIndicator ? "#fafafa" : "#fff",
          minHeight: isSubIndicator ? 28 : 40,
        }}
      >
        {/* Checkbox - hidden for sub-indicators (they follow parent) */}
        {isSubIndicator ? (
          <div style={{ width: 24, flexShrink: 0 }} />
        ) : (
          <Checkbox
            checked={state.isChecked}
            onChange={() => handleCheckChange(indicator.id, sample)}
            style={{ width: 24, flexShrink: 0 }}
          />
        )}
        {/* Indicator name with tree line */}
        <div
          className={treeLineClasses.join(" ")}
          style={{
            flex: 1,
            minWidth: 80,
            paddingLeft: isSubIndicator ? 24 : 0,
            position: "relative",
          }}
        >
          <Tooltip title={indicator.indicatorName}>
            <IndicatorName
              name={indicator.indicatorName}
              formattedName={indicator.indicatorFormattedName}
              style={{
                fontSize: 13,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: isSubIndicator ? "#666" : undefined,
              }}
            />
          </Tooltip>
        </div>
        {/* Method name - hidden for sub-indicators */}
        {!isSubIndicator && (
          <Tooltip title={indicator.testMethodName}>
            <IndicatorName
              name={indicator.testMethodName || "-"}
              formattedName={indicator.testMethodFormattedName}
              style={{
                width: 140,
                flexShrink: 0,
                fontSize: 12,
                color: "#1890ff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
          </Tooltip>
        )}
        {/* Unit price - hidden for sub-indicators */}
        {!isSubIndicator && (
          <span
            style={{
              fontSize: 12,
              color: "#888",
              width: 70,
              flexShrink: 0,
              textAlign: "right",
            }}
          >
            {indicator.unitPrice?.toLocaleString("vi-VN")}đ
          </span>
        )}
        {/* Transfer date - hidden for sub-indicators */}
        {!isSubIndicator && (
          <DatePicker
            value={
              indicator.transferDate ? dayjs(indicator.transferDate) : undefined
            }
            format="DD/MM/YYYY"
            size="small"
            style={{ width: 110, flexShrink: 0 }}
            placeholder="Ngày CG"
            disabled
          />
        )}
        {/* Request date - hidden for sub-indicators */}
        {!isSubIndicator && (
          <DatePicker
            value={state.requestDate}
            onChange={(date) => handleRequestDateChange(indicator.id, date, sample)}
            format="DD/MM/YYYY"
            size="small"
            style={{ width: 110, flexShrink: 0 }}
            placeholder="Ngày YC"
            disabledDate={(current) => {
              return current && current.isBefore(dayjs().startOf("day"));
            }}
          />
        )}
        {/* Laboratory select - hidden for sub-indicators */}
        {!isSubIndicator && (
          <Select
            value={state.laboratoryId}
            onChange={(value) => handleLabChange(indicator.id, value, sample)}
            size="small"
            style={{ width: 150, flexShrink: 0 }}
            placeholder="Chọn khoa phòng"
            loading={loadingLabs}
            options={laboratories.map((lab) => ({
              value: lab.id,
              label: lab.name,
            }))}
            status={!state.laboratoryId ? "error" : undefined}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          /* Tree line styles for sub-indicators */
          .indicator-name-cell {
            position: relative;
          }

          /* Vertical line connecting sub-indicators */
          .indicator-name-cell.has-tree-line::before {
            content: '';
            position: absolute;
            left: 0;
            top: -100%;
            bottom: -100%;
            width: 1px;
            background-color: #d9d9d9;
          }

          /* Horizontal line from vertical to indicator name */
          .indicator-name-cell.has-tree-line::after {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            width: 16px;
            height: 1px;
            background-color: #d9d9d9;
          }

          /* For last sub-indicator, vertical line ends at the middle */
          .indicator-name-cell.has-tree-line.is-last-sub::before {
            bottom: 50%;
          }
        `}
      </style>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon icon="mdi:send" width={20} />
            <span>Gửi QLKT - Chọn khoa phòng</span>
          </div>
        }
      open={visible}
      onCancel={onCancel}
      width="90vw"
      style={{ maxWidth: 900 }}
      centered
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Text>
              Đã chọn: <Text strong>{checkedParentCount}</Text> chỉ tiêu cha
              {checkedIndicatorIds.length > checkedParentCount && (
                <Text type="secondary"> (+{checkedIndicatorIds.length - checkedParentCount} chỉ tiêu phụ)</Text>
              )}
            </Text>
            {checkedParentCount > 0 && selectedMissingLab.length > 0 && (
              <Text type="danger">
                ({selectedMissingLab.length} chưa có khoa phòng)
              </Text>
            )}
            {checkedParentCount > 0 && selectedMissingDate.length > 0 && (
              <Text type="danger">
                ({selectedMissingDate.length} chưa có ngày YC)
              </Text>
            )}
          </div>
          <Space>
            <Button onClick={onCancel}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!selectedIndicatorsValid}
            >
              Gửi QLKT ({checkedIndicatorIds.length})
            </Button>
          </Space>
        </div>
      }
    >
      {loadingLabs ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {/* Bulk action bar */}
          <div
            style={{
              padding: "8px 12px",
              background: "#fafafa",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Gán cho các chỉ tiêu cha đã chọn ({checkedParentCount}):
            </Text>
            <Select
              size="small"
              style={{ width: 180 }}
              placeholder="Chọn khoa phòng"
              onChange={handleApplyLabToChecked}
              options={laboratories.map((lab) => ({
                value: lab.id,
                label: lab.name,
              }))}
              disabled={checkedParentCount === 0}
            />
            <DatePicker
              size="small"
              style={{ width: 130 }}
              placeholder="Chọn ngày YC"
              format="DD/MM/YYYY"
              onChange={handleApplyRequestDateToChecked}
              disabled={checkedParentCount === 0}
              disabledDate={(current) => {
                return current && current.isBefore(dayjs().startOf("day"));
              }}
            />
          </div>

          {/* Scrollable table container */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 700 }}>
              {/* Table header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: "#f5f5f5",
                  borderBottom: "1px solid #e8e8e8",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <div style={{ width: 24, flexShrink: 0 }}></div>
                <div style={{ flex: 1, minWidth: 80 }}>Chỉ tiêu</div>
                <div style={{ width: 140, flexShrink: 0 }}>Phương pháp</div>
                <div style={{ width: 70, flexShrink: 0, textAlign: "right" }}>
                  Đơn giá
                </div>
                <div style={{ width: 110, flexShrink: 0 }}>Ngày CG</div>
                <div style={{ width: 110, flexShrink: 0 }}>Ngày YC</div>
                <div style={{ width: 150, flexShrink: 0 }}>Khoa phòng</div>
              </div>

              {/* Samples grouped by Collapse - chỉ hiển thị samples có chỉ tiêu chưa gửi */}
              {samplesWithUnsentIndicators.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <Text type="secondary">Tất cả chỉ tiêu đã được gửi QLKT</Text>
                </div>
              ) : (
                <Collapse
                  activeKey={expandedPanels}
                  onChange={(keys) => setExpandedPanels(keys as string[])}
                  bordered={false}
                  style={{ background: "#fff" }}
                >
                  {samplesWithUnsentIndicators.map((sample) => {
                    const unsentIndicators = getUnsentIndicators(sample);
                    return (
                      <Panel
                        key={sample.id}
                        header={
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <Checkbox
                              checked={isSampleAllChecked(sample)}
                              indeterminate={isSampleIndeterminate(sample)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectAllSample(sample.id, e.target.checked);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Text strong>
                              {sample.sampleCode} - {sample.sampleName}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              ({unsentIndicators.length} chỉ tiêu chưa gửi)
                            </Text>
                          </div>
                        }
                      >
                        {processIndicatorsWithHierarchy(unsentIndicators).map((indicator) =>
                          renderIndicatorRow(indicator, sample)
                        )}
                      </Panel>
                    );
                  })}
                </Collapse>
              )}
            </div>
          </div>
        </div>
      )}
      </Modal>
    </>
  );
};

export default SendToQLKTModal;
