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

  // Initialize indicator states when modal opens
  useEffect(() => {
    if (visible && testRequest?.samples) {
      const states: Record<string, IndicatorState> = {};
      const panelKeys: string[] = [];

      testRequest.samples.forEach((sample) => {
        if (sample.isCancelled || sample.isCustomerCancelled) return;
        panelKeys.push(sample.id);

        sample.indicators?.forEach((indicator) => {
          states[indicator.id] = {
            sampleIndicatorId: indicator.id,
            laboratoryId: indicator.laboratoryId || undefined,
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
  }, [visible, testRequest]);

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

  // Check if all indicators have laboratory assigned
  const allHaveLaboratory = useMemo(() => {
    return Object.values(indicatorStates).every(
      (state) => state.laboratoryId && state.laboratoryId !== ""
    );
  }, [indicatorStates]);

  // Get indicators missing laboratory
  const indicatorsMissingLab = useMemo(() => {
    return Object.entries(indicatorStates)
      .filter(([_, state]) => !state.laboratoryId)
      .map(([id]) => id);
  }, [indicatorStates]);

  // Handle checkbox change for individual indicator
  const handleCheckChange = (indicatorId: string) => {
    setIndicatorStates((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        isChecked: !prev[indicatorId]?.isChecked,
      },
    }));
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

  // Handle laboratory change for individual indicator
  const handleLabChange = (indicatorId: string, labId: string) => {
    setIndicatorStates((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        laboratoryId: labId,
      },
    }));
  };

  // Handle request date change for individual indicator
  const handleRequestDateChange = (
    indicatorId: string,
    date: dayjs.Dayjs | null
  ) => {
    setIndicatorStates((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        requestDate: date || undefined,
      },
    }));
  };

  // Apply laboratory to all checked indicators
  const handleApplyLabToChecked = (labId: string) => {
    if (checkedIndicatorIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 chỉ tiêu");
      return;
    }

    setIndicatorStates((prev) => {
      const updated = { ...prev };
      checkedIndicatorIds.forEach((id) => {
        if (updated[id]) {
          updated[id] = { ...updated[id], laboratoryId: labId };
        }
      });
      return updated;
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validate all indicators have laboratory
    if (!allHaveLaboratory) {
      message.error(
        `Còn ${indicatorsMissingLab.length} chỉ tiêu chưa được chọn khoa phòng`
      );
      return;
    }

    setSubmitting(true);
    try {
      // Prepare data for API
      const indicators: UpdateIndicatorLaboratoryInput[] = Object.values(
        indicatorStates
      ).map((state) => ({
        sampleIndicatorId: state.sampleIndicatorId,
        laboratoryId: state.laboratoryId!,
        requestDate: state.requestDate?.toISOString(),
      }));

      // Call API to update indicators laboratory
      await testRequestService.updateIndicatorsLaboratory(
        testRequest.id,
        indicators
      );

      // Call API to send to QLKT
      await testRequestService.sendToQLKT(testRequest.id);

      message.success("Đã gửi QLKT thành công");
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

  // Check if all indicators in a sample are checked
  const isSampleAllChecked = (sample: TestRequestSampleDto) => {
    if (!sample.indicators?.length) return false;
    return sample.indicators.every((ind) => indicatorStates[ind.id]?.isChecked);
  };

  // Check if some (but not all) indicators in a sample are checked
  const isSampleIndeterminate = (sample: TestRequestSampleDto) => {
    if (!sample.indicators?.length) return false;
    const checkedCount = sample.indicators.filter(
      (ind) => indicatorStates[ind.id]?.isChecked
    ).length;
    return checkedCount > 0 && checkedCount < sample.indicators.length;
  };

  // Calculate total cost
  const totalCost = useMemo(() => {
    let sum = 0;
    activeSamples.forEach((sample) => {
      sample.indicators?.forEach((ind) => {
        sum += ind.unitPrice || 0;
      });
    });
    return sum;
  }, [activeSamples]);

  // Render indicator row
  const renderIndicatorRow = (
    indicator: TestRequestSampleIndicatorDto,
    isInGroup: boolean = false
  ) => {
    const state = indicatorStates[indicator.id];
    if (!state) return null;

    return (
      <div
        key={indicator.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          paddingLeft: isInGroup ? 36 : 12,
          borderBottom: "1px solid #f5f5f5",
          background: "#fff",
        }}
      >
        <Checkbox
          checked={state.isChecked}
          onChange={() => handleCheckChange(indicator.id)}
          style={{ width: 24, flexShrink: 0 }}
        />
        <Tooltip title={indicator.indicatorName}>
          <span
            style={{
              flex: 1,
              minWidth: 80,
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {indicator.indicatorName}
          </span>
        </Tooltip>
        <Tooltip title={indicator.testMethodName}>
          <span
            style={{
              width: 100,
              flexShrink: 0,
              fontSize: 12,
              color: "#1890ff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {indicator.testMethodName || "-"}
          </span>
        </Tooltip>
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
        <DatePicker
          value={state.requestDate}
          onChange={(date) => handleRequestDateChange(indicator.id, date)}
          format="DD/MM/YYYY"
          size="small"
          style={{ width: 110, flexShrink: 0 }}
          placeholder="Ngày YC"
          disabledDate={(current) => {
            return current && current.isBefore(dayjs().startOf("day"));
          }}
        />
        <Select
          value={state.laboratoryId}
          onChange={(value) => handleLabChange(indicator.id, value)}
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
      </div>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon icon="mdi:send" width={20} />
          <span>Gửi QLKT - Chọn khoa phòng</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      centered
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Text type="secondary">
              Tổng: <Text strong>{totalCost.toLocaleString("vi-VN")}đ</Text>
            </Text>
            {indicatorsMissingLab.length > 0 && (
              <Text type="danger">
                Còn {indicatorsMissingLab.length} chỉ tiêu chưa chọn khoa phòng
              </Text>
            )}
          </div>
          <Space>
            <Button onClick={onCancel}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!allHaveLaboratory}
            >
              Xác nhận gửi QLKT
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
        <div style={{ maxHeight: "60vh", overflow: "auto" }}>
          {/* Bulk action bar */}
          <div
            style={{
              padding: "8px 12px",
              background: "#fafafa",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Gán khoa phòng cho các chỉ tiêu đã chọn (
              {checkedIndicatorIds.length}):
            </Text>
            <Select
              size="small"
              style={{ width: 200 }}
              placeholder="Chọn khoa phòng"
              onChange={handleApplyLabToChecked}
              options={laboratories.map((lab) => ({
                value: lab.id,
                label: lab.name,
              }))}
              disabled={checkedIndicatorIds.length === 0}
            />
          </div>

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
            <div style={{ width: 100, flexShrink: 0 }}>Phương pháp</div>
            <div style={{ width: 70, flexShrink: 0, textAlign: "right" }}>
              Đơn giá
            </div>
            <div style={{ width: 110, flexShrink: 0 }}>Ngày CG</div>
            <div style={{ width: 110, flexShrink: 0 }}>Ngày YC</div>
            <div style={{ width: 150, flexShrink: 0 }}>Khoa phòng</div>
          </div>

          {/* Samples grouped by Collapse */}
          <Collapse
            activeKey={expandedPanels}
            onChange={(keys) => setExpandedPanels(keys as string[])}
            bordered={false}
            style={{ background: "#fff" }}
          >
            {activeSamples.map((sample) => (
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
                      ({sample.indicators?.length || 0} chỉ tiêu)
                    </Text>
                  </div>
                }
              >
                {sample.indicators?.map((indicator) =>
                  renderIndicatorRow(indicator, false)
                )}
              </Panel>
            ))}
          </Collapse>
        </div>
      )}
    </Modal>
  );
};

export default SendToQLKTModal;
