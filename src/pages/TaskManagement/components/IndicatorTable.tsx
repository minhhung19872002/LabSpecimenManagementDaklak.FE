import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  Select,
  Button,
  Space,
  Modal,
  Form,
  Typography,
  Input,
  Tooltip,
} from "antd";
import StatusTag from "../../../components/common/StatusTag";
import type { TableRowSelection } from "antd/es/table/interface";
import { CheckOutlined, CloseOutlined } from "../../../components/common/Icon";
import { formatDate, parseResultToNumber } from "../../../utils/formatters";
import {
  LaboratoryTaskIndicatorDto,
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
  MethodLookupDto,
  UserLookupDto,
  SampleStatus,
} from "../../../types/laboratoryTask";
import IndicatorImageCell from "../../../components/common/IndicatorImageCell";
import { IndicatorName } from "../../../components/common";
import {
  standardService,
  StandardWithIndicatorsDto,
} from "../../../services/masterDataService";
import "./IndicatorTable.css";

const { Text } = Typography;

// Extended type with position flags for tree line rendering
interface IndicatorWithPosition extends LaboratoryTaskIndicatorDto {
  _isFirstSub?: boolean;
  _isLastSub?: boolean;
  _isParentWithSubs?: boolean;
}

interface IndicatorTableProps {
  indicators: LaboratoryTaskIndicatorDto[];
  methods: MethodLookupDto[];
  technicians: UserLookupDto[];
  isAssigned: boolean; // true khi đã giao việc (lưu DB thành công)
  canEdit: boolean; // true khi task status cho phép edit (NotAssignedTechnician hoặc AssignedTechnician)
  /** Permission theo Permission Matrix - chỉ QLKT có quyền giao KTV */
  canAssignTechnician?: boolean;
  sampleStatus?: SampleStatus; // Sample status to determine selection mode
  /** Sample ID - dùng cho NoteModal callback */
  sampleId?: string;
  onMethodChange: (indicatorId: string, methodId: string) => void;
  onTechnicianChange: (indicatorId: string, technicianId: string) => void;
  onApprove: (
    indicatorId: string,
    approve: boolean,
    reason?: string,
    standardId?: string | null
  ) => void;
  onUpdateNote?: (indicatorId: string, note: string | null) => Promise<void>;
  /** Callback để mở NoteModal cho single indicator */
  onOpenNoteModal?: (
    indicatorId: string,
    currentNote: string,
    sampleId: string
  ) => void;
  /** Callback để cập nhật đơn vị tính (auto-save on blur) */
  onUnitChange?: (indicatorId: string, unit: string | null) => void;
  loading?: boolean;
  // Bulk selection props
  showCheckbox?: boolean;
  selectedIndicatorIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  // Callback để lấy standardIds cho bulk approve
  onGetStandardIds?: () => Record<string, string | null>;
  // Callback để set standardIds từ parent
  standardSelections?: Record<string, string | null>;
  onStandardChange?: (indicatorId: string, standardId: string | null) => void;
}

const IndicatorTable: React.FC<IndicatorTableProps> = ({
  indicators,
  methods,
  technicians,
  isAssigned: _isAssigned,
  canEdit: _canEdit,
  canAssignTechnician = true, // Default true để không break existing usage
  sampleStatus,
  sampleId = "",
  onMethodChange,
  onTechnicianChange,
  onApprove,
  onUpdateNote: _onUpdateNote,
  onOpenNoteModal,
  onUnitChange,
  loading = false,
  showCheckbox = false,
  selectedIndicatorIds = [],
  onSelectionChange,
  standardSelections = {},
  onStandardChange,
}) => {
  // Determine selection mode based on sample status
  // notStarted/assigned/pendingApproval → assignment mode (để chọn indicator giao việc)
  // Cho phép giao việc cho các chỉ tiêu chưa assign ngay cả khi có chỉ tiêu đang chờ duyệt
  const selectionMode: "approval" | "assignment" =
    sampleStatus === "notStarted" ||
    sampleStatus === "assigned" ||
    sampleStatus === "pendingApproval"
      ? "assignment"
      : "approval";

  // State for standards
  const [standardsWithIndicators, setStandardsWithIndicators] = useState<
    StandardWithIndicatorsDto[]
  >([]);
  const [loadingStandards, setLoadingStandards] = useState(false);

  // State for reject modal
  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    indicatorId?: string;
  }>({
    visible: false,
  });
  const [rejectForm] = Form.useForm();

  // State for local unit edits (optimistic update before API call)
  const [unitEdits, setUnitEdits] = useState<Record<string, string>>({});

  // Load standards on mount
  useEffect(() => {
    loadStandards();
  }, []);

  const loadStandards = async () => {
    setLoadingStandards(true);
    try {
      const result = await standardService.getWithIndicators();
      setStandardsWithIndicators(result);
    } catch (error) {
      console.error("Error loading standards:", error);
    } finally {
      setLoadingStandards(false);
    }
  };

  // Get standards that contain a specific indicator AND method
  const getStandardsForIndicator = useMemo(() => {
    return (indicatorId: string, methodId?: string) => {
      return standardsWithIndicators.filter((standard) =>
        standard.indicators.some(
          (si) =>
            si.indicatorId === indicatorId &&
            (!methodId || si.testMethodId === methodId)
        )
      );
    };
  }, [standardsWithIndicators]);

  // Get standard indicator info (comparison operator, allowed limit)
  const getStandardIndicatorInfo = (
    standardId: string,
    indicatorId: string,
    methodId?: string
  ) => {
    const standard = standardsWithIndicators.find((s) => s.id === standardId);
    if (!standard) return null;
    return standard.indicators.find(
      (si) =>
        si.indicatorId === indicatorId &&
        (!methodId || si.testMethodId === methodId)
    );
  };

  // Handle standard change - chỉ lưu local state, không gọi API
  const handleStandardChange = (
    indicatorId: string,
    standardId: string | undefined
  ) => {
    onStandardChange?.(indicatorId, standardId || null);
  };

  // Calculate pass/fail status
  // Text không tính được sẽ được convert sang 0 để vẫn so sánh được
  // Hỗ trợ cả single limit và range
  const calculatePassFail = (
    result: string | undefined,
    comparisonOperator: string | undefined,
    allowedLimit: string | undefined,
    lowerOperator?: string,
    lowerLimit?: string,
    upperOperator?: string,
    upperLimit?: string
  ): "pass" | "fail" | null => {
    if (!result) return null;

    // Parse result to number using parseResultToNumber
    // Supports: scientific notation ("2,0 x 10^2"), math expressions ("10^2*5+4"), plain numbers
    // Text không tính được (như "Âm tính") sẽ trả về 0
    const resultValue = parseResultToNumber(result);
    if (resultValue === null) return null;

    // Check if it's a range comparison (both lowerLimit and upperLimit exist)
    if (lowerLimit && upperLimit) {
      const lowerValue = parseResultToNumber(lowerLimit);
      const upperValue = parseResultToNumber(upperLimit);
      if (lowerValue === null || upperValue === null) return null;

      // Check lower bound
      let passLower = false;
      const lowerOp = lowerOperator || ">";
      switch (lowerOp) {
        case ">":
        case "≥":
          passLower =
            lowerOp === ">"
              ? resultValue > lowerValue
              : resultValue >= lowerValue;
          break;
        case ">=":
          passLower = resultValue >= lowerValue;
          break;
        default:
          passLower = resultValue > lowerValue;
      }

      // Check upper bound
      let passUpper = false;
      const upperOp = upperOperator || "<";
      switch (upperOp) {
        case "<":
        case "≤":
          passUpper =
            upperOp === "<"
              ? resultValue < upperValue
              : resultValue <= upperValue;
          break;
        case "<=":
          passUpper = resultValue <= upperValue;
          break;
        default:
          passUpper = resultValue < upperValue;
      }

      return passLower && passUpper ? "pass" : "fail";
    }

    // Single limit comparison
    if (!comparisonOperator || !allowedLimit) return null;

    // Parse limit to number (also supports scientific notation and math expressions)
    const limitValue = parseResultToNumber(allowedLimit);
    if (limitValue === null) return null;

    // Compare based on operator (support both <= and ≤ formats)
    switch (comparisonOperator) {
      case "<=":
      case "≤":
        return resultValue <= limitValue ? "pass" : "fail";
      case ">=":
      case "≥":
        return resultValue >= limitValue ? "pass" : "fail";
      case "<":
        return resultValue < limitValue ? "pass" : "fail";
      case ">":
        return resultValue > limitValue ? "pass" : "fail";
      case "=":
        return resultValue === limitValue ? "pass" : "fail";
      default:
        return null;
    }
  };

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (rejectModal.indicatorId) {
        // Lấy standardId từ local state hoặc từ indicator
        const indicator = indicators.find(
          (i) => i.id === rejectModal.indicatorId
        );
        const selectedStandardId =
          standardSelections[rejectModal.indicatorId] !== undefined
            ? standardSelections[rejectModal.indicatorId]
            : indicator?.standardId;
        onApprove(
          rejectModal.indicatorId,
          false,
          values.reason,
          selectedStandardId
        );
        setRejectModal({ visible: false });
        rejectForm.resetFields();
      }
    } catch (error) {
      // Validation failed
    }
  };

  // Helper: tạo composite key từ indicatorId + methodId
  const makeGroupKey = (indicatorId: string, methodId: string | null | undefined) =>
    `${indicatorId}_${methodId || 'no-method'}`;

  // Check if parent has sub-indicators in the current list (considering methodId)
  const hasSubIndicatorsInList = useMemo(() => {
    const parentKeys = new Set<string>();
    indicators.forEach((ind) => {
      if (ind.parentIndicatorId) {
        // Sub-indicator references parent by parentIndicatorId + same methodId
        parentKeys.add(makeGroupKey(ind.parentIndicatorId, ind.methodId));
      }
    });
    return (indicatorId: string, methodId: string | null | undefined) =>
      parentKeys.has(makeGroupKey(indicatorId, methodId));
  }, [indicators]);

  // Sort indicators to group parent/sub together and add position flags
  const sortedIndicators = useMemo((): IndicatorWithPosition[] => {
    const sorted = [...indicators].sort((a, b) => {
      // Group by parent/sub relationship + methodId
      // Group key: for parent use indicatorId+methodId, for sub use parentIndicatorId+methodId
      const aGroupKey = a.parentIndicatorId
        ? makeGroupKey(a.parentIndicatorId, a.methodId)
        : makeGroupKey(a.indicatorId, a.methodId);
      const bGroupKey = b.parentIndicatorId
        ? makeGroupKey(b.parentIndicatorId, b.methodId)
        : makeGroupKey(b.indicatorId, b.methodId);

      if (aGroupKey !== bGroupKey) {
        return aGroupKey.localeCompare(bGroupKey);
      }

      // Same group: parent first, then sub-indicators
      if (!a.parentIndicatorId && b.parentIndicatorId) return -1;
      if (a.parentIndicatorId && !b.parentIndicatorId) return 1;

      return 0;
    });

    // Add position flags for tree line rendering
    return sorted.map((item, _index, arr): IndicatorWithPosition => {
      const isParentWithSubs =
        !item.parentIndicatorId && hasSubIndicatorsInList(item.indicatorId, item.methodId);

      if (!item.parentIndicatorId) {
        return { ...item, _isParentWithSubs: isParentWithSubs };
      }

      // Find siblings (sub-indicators with same parent AND same methodId)
      const siblings = arr.filter(
        (i) =>
          i.parentIndicatorId === item.parentIndicatorId &&
          i.methodId === item.methodId
      );
      const siblingIndex = siblings.findIndex((s) => s.id === item.id);

      return {
        ...item,
        _isFirstSub: siblingIndex === 0,
        _isLastSub: siblingIndex === siblings.length - 1,
      };
    });
  }, [indicators, hasSubIndicatorsInList]);

  const columns = [
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 200,
      fixed: "left" as const,
      render: (value: string, record: IndicatorWithPosition) => {
        const isSubIndicator = !!record.parentIndicatorId;
        const isFirstSub = record._isFirstSub || false;
        const isLastSub = record._isLastSub || false;

        return (
          <div
            className={`indicator-table-name-wrapper ${isSubIndicator ? "has-tree-line" : ""} ${isFirstSub ? "is-first-sub" : ""} ${isLastSub ? "is-last-sub" : ""}`}
            style={{
              paddingLeft: isSubIndicator ? 24 : 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div>
              <IndicatorName
                name={value}
                formattedName={record.indicatorFormattedName}
              />
              {record.indicatorGroupName && !isSubIndicator && (
                <div style={{ marginTop: 2 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {record.indicatorGroupName}
                  </Text>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Phương pháp",
      dataIndex: "methodId",
      key: "methodId",
      width: 200,
      render: (value: string, record: LaboratoryTaskIndicatorDto) => {
        // Phương pháp đã được chọn từ TestRequest - hiển thị dạng text, không cho sửa
        if (record.methodName) {
          return (
            <Tooltip title={record.methodName}>
              <IndicatorName
                name={record.methodName}
                formattedName={record.methodFormattedName}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              />
            </Tooltip>
          );
        }
        // Chưa có phương pháp - hiển thị dropdown để chọn
        // Cho phép chỉnh sửa nếu indicator chưa được duyệt hoặc chưa bị hủy
        const canEditMethod =
          record.approvalStatus !== IndicatorApprovalStatus.Approved &&
          record.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled;

        return (
          <Select
            style={{ width: "100%" }}
            size="small"
            value={value}
            placeholder="Chọn PP"
            onChange={(val) => onMethodChange(record.id, val)}
            options={(methods || []).map((m) => ({
              value: m.id,
              label: m.name,
            }))}
            disabled={!canEditMethod}
            allowClear
          />
        );
      },
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      key: "unit",
      width: 120,
      render: (value: string, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        // Cho phép chỉnh sửa nếu chưa duyệt và chưa bị hủy
        const canEditUnit =
          record.approvalStatus !== IndicatorApprovalStatus.Approved &&
          record.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled &&
          onUnitChange;

        // Lấy giá trị từ local state nếu có, nếu không thì từ server
        const displayValue = unitEdits[record.id] !== undefined ? unitEdits[record.id] : (value || "");

        if (!canEditUnit) {
          return <Text>{value || "-"}</Text>;
        }

        return (
          <Input
            size="small"
            value={displayValue}
            placeholder="-"
            onChange={(e) => {
              setUnitEdits((prev) => ({
                ...prev,
                [record.id]: e.target.value,
              }));
            }}
            onBlur={(e) => {
              const newValue = e.target.value.trim();
              // Chỉ gọi API nếu giá trị thay đổi
              if (newValue !== (value || "")) {
                onUnitChange(record.id, newValue || null);
              }
              // Clear local state sau khi save
              setUnitEdits((prev) => {
                const newState = { ...prev };
                delete newState[record.id];
                return newState;
              });
            }}
            style={{ width: "100%" }}
          />
        );
      },
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 200,
      render: (value: string, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        return <Text>{value || "-"}</Text>;
      },
    },
    {
      title: "Ghi chú",
      key: "note",
      width: 150,
      render: (_: unknown, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        // Tổng hợp note từ FreeTextNote và MasterDataNoteContents
        const noteParts: string[] = [];
        if (record.freeTextNote) {
          noteParts.push(record.freeTextNote);
        }
        if (
          record.masterDataNoteContents &&
          record.masterDataNoteContents.length > 0
        ) {
          noteParts.push(...record.masterDataNoteContents.map((c) => `- ${c}`));
        }
        const displayNote = noteParts.join("\n");

        // Chỉ không cho edit khi đã duyệt hoặc KH hủy (không phụ thuộc task status)
        // Nếu chỉ tiêu chưa được QLKT phê duyệt KQ thì vẫn edit ghi chú được
        const isApproved =
          record.approvalStatus === IndicatorApprovalStatus.Approved;
        const isCancelled =
          record.approvalStatus === IndicatorApprovalStatus.CustomerCancelled;
        const canEditNoteCell = !isApproved && !isCancelled && onOpenNoteModal;

        // Read-only mode - vẫn hiển thị dạng input nhưng disabled
        if (!canEditNoteCell) {
          return (
            <div
              style={{ minHeight: 32, display: "flex", alignItems: "center" }}
            >
              <Tooltip
                title={
                  displayNote ? (
                    <div style={{ whiteSpace: "pre-line" }}>{displayNote}</div>
                  ) : undefined
                }
              >
                <div
                  style={{
                    width: "100%",
                    height: 24,
                    padding: "0 7px",
                    border: "1px solid #d9d9d9",
                    borderRadius: 4,
                    backgroundColor: "#f5f5f5",
                    fontSize: 14,
                    lineHeight: "22px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: displayNote
                      ? "rgba(0, 0, 0, 0.65)"
                      : "rgba(0, 0, 0, 0.25)",
                    cursor: "not-allowed",
                  }}
                >
                  {displayNote || "..."}
                </div>
              </Tooltip>
            </div>
          );
        }

        // Edit mode - click to open modal
        return (
          <div
            style={{
              minHeight: 32,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => onOpenNoteModal(record.id, displayNote, sampleId)}
          >
            <Tooltip
              title={
                displayNote ? (
                  <div style={{ whiteSpace: "pre-line" }}>{displayNote}</div>
                ) : undefined
              }
            >
              <div
                style={{
                  width: "100%",
                  height: 24,
                  padding: "0 7px",
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  backgroundColor: "#fff",
                  fontSize: 14,
                  lineHeight: "22px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: displayNote
                    ? "rgba(0, 0, 0, 0.88)"
                    : "rgba(0, 0, 0, 0.25)",
                }}
              >
                {displayNote || "Click để nhập..."}
              </div>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Hình ảnh",
      key: "images",
      width: 120,
      render: (_: unknown, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        return (
          <IndicatorImageCell
            images={record.images || []}
            canUpload={false}
            maxImages={5}
          />
        );
      },
    },
    {
      title: "So với",
      dataIndex: "standardId",
      key: "standardId",
      width: 180,
      render: (_: unknown, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        // Ưu tiên lấy từ local state, nếu không có thì lấy từ DB
        const selectedStandardId =
          standardSelections[record.id] !== undefined
            ? standardSelections[record.id]
            : record.standardId;

        // Lấy danh sách tiêu chuẩn phù hợp với chỉ tiêu và phương pháp
        const availableStandards = getStandardsForIndicator(
          record.indicatorId,
          record.methodId
        );

        // Cho phép chọn tiêu chuẩn ở tất cả trạng thái trừ các trạng thái sau
        const canSelectStandard =
          record.approvalStatus !== IndicatorApprovalStatus.Approved &&
          record.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled &&
          record.approvalStatus !==
            IndicatorApprovalStatus.MethodChangeRequested &&
          record.approvalStatus !== IndicatorApprovalStatus.TestingRejected;

        return (
          <div style={{ minHeight: 32, display: "flex", alignItems: "center" }}>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn tiêu chuẩn"
              allowClear
              value={selectedStandardId || undefined}
              onChange={(value) => handleStandardChange(record.id, value)}
              loading={loadingStandards}
              disabled={!canSelectStandard}
              size="small"
            >
              {availableStandards.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        );
      },
    },
    {
      title: "Giới hạn",
      key: "allowedLimit",
      width: 180,
      render: (_: unknown, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        // Ưu tiên lấy từ local state, nếu không có thì lấy từ DB
        const selectedStandardId =
          standardSelections[record.id] !== undefined
            ? standardSelections[record.id]
            : record.standardId;

        // Nếu đã có standardId được chọn, lấy thông tin từ standardIndicator
        if (selectedStandardId) {
          const standardInfo = getStandardIndicatorInfo(
            selectedStandardId,
            record.indicatorId,
            record.methodId
          );
          if (standardInfo) {
            const {
              comparisonOperator,
              allowedLimit,
              lowerOperator,
              lowerLimit,
              upperOperator,
              upperLimit,
            } = standardInfo;
            // Range case: both lowerLimit and upperLimit have values
            if (lowerLimit && upperLimit) {
              const lower = lowerOperator || ">";
              const upper = upperOperator || "<";
              return (
                <Text>
                  {lower} {lowerLimit} và {upper} {upperLimit}
                </Text>
              );
            }
            // Single limit case
            if (comparisonOperator && allowedLimit) {
              return (
                <Text>
                  {comparisonOperator} {allowedLimit}
                </Text>
              );
            }
          }
          // Fallback to data from API if available (chỉ khi dùng standardId từ DB)
          if (selectedStandardId === record.standardId) {
            // Range case from API
            if (record.lowerLimit && record.upperLimit) {
              const lower = record.lowerOperator || ">";
              const upper = record.upperOperator || "<";
              return (
                <Text>
                  {lower} {record.lowerLimit} và {upper} {record.upperLimit}
                </Text>
              );
            }
            // Single limit case from API
            if (record.comparisonOperator && record.allowedLimit) {
              return (
                <Text>
                  {record.comparisonOperator} {record.allowedLimit}
                </Text>
              );
            }
          }
        }
        return "-";
      },
    },
    {
      title: "Đạt/Không đạt",
      key: "passFailStatus",
      width: 120,
      render: (_: unknown, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        // Ưu tiên lấy từ local state, nếu không có thì lấy từ DB
        const selectedStandardId =
          standardSelections[record.id] !== undefined
            ? standardSelections[record.id]
            : record.standardId;

        // Cần có standardId, kết quả, và thông tin giới hạn
        if (!selectedStandardId || !record.result) return null;

        let comparisonOperator = record.comparisonOperator;
        let allowedLimit = record.allowedLimit;
        let lowerOperator = record.lowerOperator;
        let lowerLimit = record.lowerLimit;
        let upperOperator = record.upperOperator;
        let upperLimit = record.upperLimit;

        // Lấy từ standardIndicator
        const standardInfo = getStandardIndicatorInfo(
          selectedStandardId,
          record.indicatorId,
          record.methodId
        );
        if (standardInfo) {
          comparisonOperator = standardInfo.comparisonOperator;
          allowedLimit = standardInfo.allowedLimit;
          lowerOperator = standardInfo.lowerOperator;
          lowerLimit = standardInfo.lowerLimit;
          upperOperator = standardInfo.upperOperator;
          upperLimit = standardInfo.upperLimit;
        }

        const passFailStatus = calculatePassFail(
          record.result,
          comparisonOperator,
          allowedLimit,
          lowerOperator,
          lowerLimit,
          upperOperator,
          upperLimit
        );

        if (passFailStatus === "pass") {
          return (
            <Text strong style={{ color: "#52c41a" }}>
              Đạt
            </Text>
          );
        } else if (passFailStatus === "fail") {
          return (
            <Text strong style={{ color: "#ff4d4f" }}>
              Không đạt
            </Text>
          );
        }
        return null;
      },
    },
    {
      title: "Thử nghiệm viên",
      dataIndex: "technicianId",
      key: "technicianId",
      width: 150,
      render: (value: string, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        // Cho phép chỉnh sửa KTV nếu:
        // 1. Indicator không đang chờ mẫu chung từ Lab Vi Sinh
        // 2. Indicator đã được chấp nhận TN (AcceptedForTesting) hoặc các trạng thái có thể assign
        //    (Entered, Rejected - cần giao lại cho KTV khác)
        // 3. Indicator chưa được duyệt KQ (Approved) và chưa bị hủy (CustomerCancelled)
        // 4. Có quyền assignTechnician theo Permission Matrix (chỉ QLKT)
        const isAssignableStatus =
          record.approvalStatus === IndicatorApprovalStatus.AcceptedForTesting ||
          record.approvalStatus === IndicatorApprovalStatus.Entered ||
          record.approvalStatus === IndicatorApprovalStatus.Rejected ||
          record.approvalStatus === IndicatorApprovalStatus.CannotTest;

        const canEditIndicator =
          !record.isWaitingForSharedSample &&
          isAssignableStatus &&
          canAssignTechnician;

        return (
          <div style={{ minHeight: 32, display: "flex", alignItems: "center" }}>
            <Select
              style={{ width: "100%" }}
              size="small"
              value={value}
              placeholder="Chọn TNV"
              onChange={(val) => onTechnicianChange(record.id, val)}
              options={(technicians || []).map((t) => ({
                value: t.id,
                label: t.displayName || t.userName,
              }))}
              disabled={!canEditIndicator}
              allowClear
            />
          </div>
        );
      },
    },
    {
      title: "Ngày nhập",
      dataIndex: "entryDate",
      key: "entryDate",
      width: 100,
      render: (date: string, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        return formatDate(date);
      },
    },
    {
      title: "Ngày duyệt",
      dataIndex: "approvalDate",
      key: "approvalDate",
      width: 100,
      render: (date: string, record: IndicatorWithPosition) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        return formatDate(date);
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      width: 180,
      fixed: "right" as const,
      render: (
        status: IndicatorApprovalStatus,
        record: IndicatorWithPosition
      ) => {
        // Hide for parent indicators that have sub-indicators
        if (record._isParentWithSubs) return null;

        // Ưu tiên hiển thị "KH hủy" trước - bất kể đã giao việc hay chưa
        if (status === IndicatorApprovalStatus.CustomerCancelled) {
          return (
            <StatusTag color={IndicatorApprovalStatusColors[status]}>
              {IndicatorApprovalStatusLabels[status]}
            </StatusTag>
          );
        }

        // Hiển thị "Chờ mẫu chung" nếu chỉ tiêu đang đợi mẫu từ Lab Vi Sinh
        if (record.isWaitingForSharedSample) {
          return (
            <Tooltip title="Chỉ tiêu này thuộc mẫu chung, đang chờ Lab Vi Sinh hoàn thành">
              <StatusTag color="gold">Chờ mẫu chung</StatusTag>
            </Tooltip>
          );
        }

        // Kiểm tra indicator đã được giao việc (lưu vào DB) chưa
        // Dựa vào assignedDate - chỉ có khi đã lưu DB thành công
        const indicatorAssigned = !!record.assignedDate;

        // Chưa giao việc thì hiển thị tag "Chưa giao việc"
        if (!indicatorAssigned) {
          return <StatusTag color="default">Chưa giao việc</StatusTag>;
        }

        switch (status) {
          case IndicatorApprovalStatus.Pending:
            return (
              <StatusTag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </StatusTag>
            );

          case IndicatorApprovalStatus.Entered: {
            // Lấy standardId từ local state hoặc DB
            const selectedStandardIdForApprove =
              standardSelections[record.id] !== undefined
                ? standardSelections[record.id]
                : record.standardId;
            return (
              <Space size="small">
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() =>
                    setRejectModal({ visible: true, indicatorId: record.id })
                  }
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() =>
                    onApprove(
                      record.id,
                      true,
                      undefined,
                      selectedStandardIdForApprove
                    )
                  }
                >
                  Duyệt
                </Button>
              </Space>
            );
          }

          case IndicatorApprovalStatus.Approved:
            return (
              <StatusTag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </StatusTag>
            );

          case IndicatorApprovalStatus.Rejected:
            return (
              <StatusTag color={IndicatorApprovalStatusColors[status]}>
                {IndicatorApprovalStatusLabels[status]}
              </StatusTag>
            );

          // CustomerCancelled đã xử lý ở đầu function

          default:
            return null;
        }
      },
    },
  ];

  // Row selection configuration for bulk operations
  // When selecting a parent indicator with subs, auto-select all sub-indicators
  const rowSelection:
    | TableRowSelection<IndicatorWithPosition>
    | undefined = useMemo(() => {
    if (!showCheckbox || !onSelectionChange) return undefined;

    return {
      selectedRowKeys: selectedIndicatorIds,
      onChange: (
        selectedRowKeys: React.Key[],
        selectedRows: IndicatorWithPosition[]
      ) => {
        let newSelection = [...selectedRowKeys] as string[];

        // If selecting a parent with subs, auto-select all its sub-indicators (same methodId)
        selectedRows.forEach((row) => {
          if (row._isParentWithSubs) {
            const subIds = sortedIndicators
              .filter(
                (ind) =>
                  ind.parentIndicatorId === row.indicatorId &&
                  ind.methodId === row.methodId
              )
              .map((ind) => ind.id);
            subIds.forEach((id) => {
              if (!newSelection.includes(id)) {
                newSelection.push(id);
              }
            });
          }
        });

        // If deselecting a parent, auto-deselect all its sub-indicators
        // (Check previously selected parents that are now deselected)
        const deselectedParents = selectedIndicatorIds.filter(
          (id) =>
            !selectedRowKeys.includes(id) &&
            sortedIndicators.find((i) => i.id === id)?._isParentWithSubs
        );
        deselectedParents.forEach((parentId) => {
          const parent = sortedIndicators.find((i) => i.id === parentId);
          if (parent) {
            const subIds = sortedIndicators
              .filter(
                (ind) =>
                  ind.parentIndicatorId === parent.indicatorId &&
                  ind.methodId === parent.methodId
              )
              .map((ind) => ind.id);
            newSelection = newSelection.filter((id) => !subIds.includes(id));
          }
        });

        onSelectionChange(newSelection);
      },
      getCheckboxProps: (record: IndicatorWithPosition) => {
        // Disable selection cho chỉ tiêu đang chờ mẫu chung từ Lab Vi Sinh
        if (record.isWaitingForSharedSample) {
          return {
            disabled: true,
            name: record.id,
          };
        }

        if (selectionMode === "assignment") {
          // Assignment mode: chỉ disable cho Approved và CustomerCancelled
          // Các trạng thái khác (Pending, Entered, Rejected) đều có thể chọn để giao việc
          return {
            disabled:
              record.approvalStatus === IndicatorApprovalStatus.Approved ||
              record.approvalStatus ===
                IndicatorApprovalStatus.CustomerCancelled,
            name: record.id,
          };
        }
        // Approval mode: chỉ cho phép chọn indicators có trạng thái Entered (Chờ phê duyệt) hoặc Rejected
        return {
          disabled:
            record.approvalStatus === IndicatorApprovalStatus.Approved ||
            record.approvalStatus ===
              IndicatorApprovalStatus.CustomerCancelled ||
            record.approvalStatus === IndicatorApprovalStatus.Pending,
          name: record.id,
        };
      },
    };
  }, [
    showCheckbox,
    selectedIndicatorIds,
    onSelectionChange,
    selectionMode,
    sortedIndicators,
  ]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={sortedIndicators}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 2170 }}
        loading={loading}
        rowSelection={rowSelection}
        rowClassName={(record: IndicatorWithPosition) =>
          record.parentIndicatorId ? "sub-indicator-row" : ""
        }
      />

      {/* Reject Reason Modal */}
      <Modal
        title="Lý do từ chối"
        open={rejectModal.visible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModal({ visible: false });
          rejectForm.resetFields();
        }}
        okText="Xác nhận"
        cancelText="Hủy"
        width={600}
        centered
        getContainer={false}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do từ chối kết quả..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default IndicatorTable;
