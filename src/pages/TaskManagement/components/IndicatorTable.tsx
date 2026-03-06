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
import { formatDate, parseResultToNumber, stripPTags, convertHtmlToMathExpression } from "../../../utils/formatters";
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
import { IndicatorName, RichTextEditor } from "../../../components/common";
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
  // Force disable tất cả input/select (khi phiếu yêu cầu bị hủy)
  forceDisableAll?: boolean;
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
  forceDisableAll = false,
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

  // Get standards that contain a specific indicator AND method AND specimenType (if available)
  // Fallback: if no standards match all conditions, return full list
  const getStandardsForIndicator = useMemo(() => {
    return (indicatorId: string, methodId?: string, specimenTypeId?: string) => {
      const filtered = standardsWithIndicators.filter((standard) =>
        standard.indicators.some(
          (si) =>
            si.indicatorId === indicatorId &&
            (!methodId || si.testMethodId === methodId) &&
            (!specimenTypeId || !si.specimenTypeId || si.specimenTypeId === specimenTypeId)
        )
      );
      return filtered.length > 0 ? filtered : standardsWithIndicators;
    };
  }, [standardsWithIndicators]);

  // Get standard indicator info (comparison operator, allowed limit)
  const getStandardIndicatorInfo = (
    standardId: string,
    indicatorId: string,
    methodId?: string,
    specimenTypeId?: string
  ) => {
    const standard = standardsWithIndicators.find((s) => s.id === standardId);
    if (!standard) return null;
    return standard.indicators.find(
      (si) =>
        si.indicatorId === indicatorId &&
        (!methodId || si.testMethodId === methodId) &&
        (!specimenTypeId || !si.specimenTypeId || si.specimenTypeId === specimenTypeId)
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
      // Convert HTML superscript/subscript to math expression before parsing
      const lowerValue = parseResultToNumber(convertHtmlToMathExpression(lowerLimit));
      const upperValue = parseResultToNumber(convertHtmlToMathExpression(upperLimit));
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

    // Convert HTML superscript/subscript to math expression and parse limit to number
    const limitValue = parseResultToNumber(convertHtmlToMathExpression(allowedLimit));
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

  // Compute sub-to-parent mapping: assigns each sub-indicator to a specific parent's unique id
  // This handles the case where multiple parents have the same indicatorId+methodId
  const subToParentMapping = useMemo(() => {
    const mapping: Record<string, string> = {}; // sub.id -> parent.id (unique)

    // Separate parents and subs
    const parents = indicators.filter((ind) => !ind.parentIndicatorId);
    const subs = indicators.filter((ind) => ind.parentIndicatorId);

    // Group parents by indicatorId+methodId -> array of unique parent ids
    const parentsByKey: Record<string, string[]> = {};
    parents.forEach((p) => {
      const key = makeGroupKey(p.indicatorId, p.methodId);
      if (!parentsByKey[key]) {
        parentsByKey[key] = [];
      }
      parentsByKey[key].push(p.id);
    });

    // Group subs by parentIndicatorId+methodId
    const subsByKey: Record<string, LaboratoryTaskIndicatorDto[]> = {};
    subs.forEach((s) => {
      const key = makeGroupKey(s.parentIndicatorId!, s.methodId);
      if (!subsByKey[key]) {
        subsByKey[key] = [];
      }
      subsByKey[key].push(s);
    });

    // Distribute subs to parents evenly
    Object.entries(subsByKey).forEach(([key, subList]) => {
      const parentUniqueIds = parentsByKey[key] || [];
      if (parentUniqueIds.length === 0) {
        // Orphan subs - mark with empty string
        subList.forEach((sub) => {
          mapping[sub.id] = "";
        });
      } else if (parentUniqueIds.length === 1) {
        // Single parent - all subs go to it
        subList.forEach((sub) => {
          mapping[sub.id] = parentUniqueIds[0];
        });
      } else {
        // Multiple parents with same indicatorId+methodId - distribute evenly
        // Example: 4 subs, 2 parents -> sub0,sub1 -> parent0; sub2,sub3 -> parent1
        const subsPerParent = Math.ceil(subList.length / parentUniqueIds.length);
        subList.forEach((sub, idx) => {
          const parentIdx = Math.floor(idx / subsPerParent);
          const safeParentIdx = Math.min(parentIdx, parentUniqueIds.length - 1);
          mapping[sub.id] = parentUniqueIds[safeParentIdx];
        });
      }
    });

    return mapping;
  }, [indicators]);

  // Check if a specific parent (by unique id) has sub-indicators
  const hasSubIndicatorsInList = useMemo(() => {
    const parentIdsWithSubs = new Set<string>();
    Object.values(subToParentMapping).forEach((parentId) => {
      if (parentId) {
        parentIdsWithSubs.add(parentId);
      }
    });
    return (parentUniqueId: string) => parentIdsWithSubs.has(parentUniqueId);
  }, [subToParentMapping]);

  // Sort indicators to group parent/sub together and add position flags
  const sortedIndicators = useMemo((): IndicatorWithPosition[] => {
    const sorted = [...indicators].sort((a, b) => {
      // Use parent's unique id for grouping (handles multiple parents with same indicatorId+methodId)
      const aParentUniqueId = a.parentIndicatorId
        ? subToParentMapping[a.id] || ""
        : a.id;
      const bParentUniqueId = b.parentIndicatorId
        ? subToParentMapping[b.id] || ""
        : b.id;

      if (aParentUniqueId !== bParentUniqueId) {
        return aParentUniqueId.localeCompare(bParentUniqueId);
      }

      // Same parent group: parent first, then sub-indicators
      if (!a.parentIndicatorId && b.parentIndicatorId) return -1;
      if (a.parentIndicatorId && !b.parentIndicatorId) return 1;

      return 0;
    });

    // Add position flags for tree line rendering
    return sorted.map((item, _index, arr): IndicatorWithPosition => {
      // Check using parent's unique id
      const isParentWithSubs =
        !item.parentIndicatorId && hasSubIndicatorsInList(item.id);

      if (!item.parentIndicatorId) {
        return { ...item, _isParentWithSubs: isParentWithSubs };
      }

      // Find siblings - subs that belong to the same parent (by unique id mapping)
      const myParentUniqueId = subToParentMapping[item.id];
      const siblings = arr.filter(
        (i) => i.parentIndicatorId && subToParentMapping[i.id] === myParentUniqueId
      );
      const siblingIndex = siblings.findIndex((s) => s.id === item.id);

      return {
        ...item,
        _isFirstSub: siblingIndex === 0,
        _isLastSub: siblingIndex === siblings.length - 1,
      };
    });
  }, [indicators, hasSubIndicatorsInList, subToParentMapping]);

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
          !forceDisableAll &&
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

        // Cho phép chỉnh sửa trừ khi bị hủy hoặc forceDisable
        const canEditUnit =
          !forceDisableAll &&
          record.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled &&
          onUnitChange;

        if (!canEditUnit) {
          return value ? <IndicatorName name={value} /> : <Text>-</Text>;
        }

        // Lấy giá trị từ local state nếu có, nếu không thì từ server
        const displayValue = unitEdits[record.id] !== undefined ? unitEdits[record.id] : (value || "");

        return (
          <div
            onBlur={(e) => {
              // Only trigger save when focus leaves the entire editor
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                const newValue = unitEdits[record.id];
                if (newValue !== undefined && newValue !== (value || "")) {
                  onUnitChange(record.id, newValue || null);
                }
                // Clear local state sau khi save
                setUnitEdits((prev) => {
                  const newState = { ...prev };
                  delete newState[record.id];
                  return newState;
                });
              }
            }}
          >
            <RichTextEditor
              value={displayValue}
              onChange={(html) => {
                setUnitEdits((prev) => ({
                  ...prev,
                  [record.id]: html,
                }));
              }}
              placeholder="-"
              minHeight={24}
            />
          </div>
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
        // FreeTextNote có thể là HTML (rich text)
        const noteParts: string[] = [];
        if (record.freeTextNote) {
          noteParts.push(stripPTags(record.freeTextNote));
        }
        if (
          record.masterDataNoteContents &&
          record.masterDataNoteContents.length > 0
        ) {
          noteParts.push(...record.masterDataNoteContents);
        }
        const displayNoteHtml = noteParts.join("<br/>");
        // Plain text for tooltip and empty check
        const displayNotePlain = noteParts.join("").replace(/<[^>]*>/g, "").trim();

        // Chỉ không cho edit khi đã duyệt hoặc KH hủy (không phụ thuộc task status)
        // Nếu chỉ tiêu chưa được QLKT phê duyệt KQ thì vẫn edit ghi chú được
        const isApproved =
          record.approvalStatus === IndicatorApprovalStatus.Approved;
        const isCancelled =
          record.approvalStatus === IndicatorApprovalStatus.CustomerCancelled;
        const canEditNoteCell = !forceDisableAll && !isApproved && !isCancelled && onOpenNoteModal;

        // Read-only mode - vẫn hiển thị dạng input nhưng disabled
        if (!canEditNoteCell) {
          return (
            <div
              style={{ minHeight: 32, display: "flex", alignItems: "center" }}
            >
              <Tooltip
                title={
                  displayNotePlain ? (
                    <div dangerouslySetInnerHTML={{ __html: displayNoteHtml }} className="note-tooltip-content" />
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
                    color: displayNotePlain
                      ? "rgba(0, 0, 0, 0.65)"
                      : "rgba(0, 0, 0, 0.25)",
                    cursor: "not-allowed",
                  }}
                  dangerouslySetInnerHTML={{ __html: displayNotePlain ? displayNoteHtml : "..." }}
                />
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
            onClick={() => onOpenNoteModal(record.id, displayNoteHtml, sampleId)}
          >
            <Tooltip
              title={
                displayNotePlain ? (
                  <div dangerouslySetInnerHTML={{ __html: displayNoteHtml }} className="note-tooltip-content" />
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
                  color: displayNotePlain
                    ? "rgba(0, 0, 0, 0.88)"
                    : "rgba(0, 0, 0, 0.25)",
                }}
                dangerouslySetInnerHTML={{ __html: displayNotePlain ? displayNoteHtml : "Click để nhập..." }}
              />
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

        // Lấy danh sách tiêu chuẩn phù hợp với chỉ tiêu, phương pháp và nền mẫu
        const availableStandards = getStandardsForIndicator(
          record.indicatorId,
          record.methodId,
          record.specimenTypeId
        );

        // Nếu standardId hiện tại không nằm trong danh sách options (ví dụ: PP đã đổi), không hiển thị
        const isStandardAvailable = selectedStandardId
          ? availableStandards.some((s) => s.id === selectedStandardId)
          : false;
        const displayStandardId = isStandardAvailable ? selectedStandardId : undefined;

        // Cho phép chọn tiêu chuẩn ở tất cả trạng thái trừ các trạng thái sau
        const canSelectStandard =
          !forceDisableAll &&
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
              value={displayStandardId}
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
            record.methodId,
            record.specimenTypeId
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
              const lowerHtml = stripPTags(lowerLimit);
              const upperHtml = stripPTags(upperLimit);
              return (
                <Text>
                  {lower} <span dangerouslySetInnerHTML={{ __html: lowerHtml }} />
                  {" và "}
                  {upper} <span dangerouslySetInnerHTML={{ __html: upperHtml }} />
                </Text>
              );
            }
            // Single limit case
            if (comparisonOperator && allowedLimit) {
              const limitHtml = stripPTags(allowedLimit);
              return (
                <Text>
                  {comparisonOperator} <span dangerouslySetInnerHTML={{ __html: limitHtml }} />
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
              const lowerHtml = stripPTags(record.lowerLimit);
              const upperHtml = stripPTags(record.upperLimit);
              return (
                <Text>
                  {lower} <span dangerouslySetInnerHTML={{ __html: lowerHtml }} />
                  {" và "}
                  {upper} <span dangerouslySetInnerHTML={{ __html: upperHtml }} />
                </Text>
              );
            }
            // Single limit case from API
            if (record.comparisonOperator && record.allowedLimit) {
              const limitHtml = stripPTags(record.allowedLimit);
              return (
                <Text>
                  {record.comparisonOperator} <span dangerouslySetInnerHTML={{ __html: limitHtml }} />
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
          record.methodId,
          record.specimenTypeId
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
        // For parent with subs: show Select at parent level, hide at sub level
        if (record.parentIndicatorId) return null;

        // For parent with subs: check assignable based on any sub's status
        let isAssignableStatus = false;
        if (record._isParentWithSubs) {
          const subIds = Object.entries(subToParentMapping)
            .filter(([, parentId]) => parentId === record.id)
            .map(([subId]) => subId);
          const subIndicators = indicators.filter((ind) => subIds.includes(ind.id));
          isAssignableStatus = subIndicators.some(
            (sub) =>
              sub.approvalStatus === IndicatorApprovalStatus.AcceptedForTesting ||
              sub.approvalStatus === IndicatorApprovalStatus.Entered ||
              sub.approvalStatus === IndicatorApprovalStatus.Rejected ||
              sub.approvalStatus === IndicatorApprovalStatus.CannotTest ||
              sub.approvalStatus === IndicatorApprovalStatus.MethodChanged
          );
        } else {
          isAssignableStatus =
            record.approvalStatus === IndicatorApprovalStatus.AcceptedForTesting ||
            record.approvalStatus === IndicatorApprovalStatus.Entered ||
            record.approvalStatus === IndicatorApprovalStatus.Rejected ||
            record.approvalStatus === IndicatorApprovalStatus.CannotTest ||
            record.approvalStatus === IndicatorApprovalStatus.MethodChanged;
        }

        const canEditIndicator = !forceDisableAll && isAssignableStatus && canAssignTechnician;

        // For parent with subs: show technician from first sub
        let displayValue = value;
        if (record._isParentWithSubs) {
          const firstSubId = Object.entries(subToParentMapping)
            .find(([, parentId]) => parentId === record.id)?.[0];
          if (firstSubId) {
            const firstSub = indicators.find((ind) => ind.id === firstSubId);
            displayValue = firstSub?.technicianId || value;
          }
        }

        return (
          <div style={{ minHeight: 32, display: "flex", alignItems: "center" }}>
            <Select
              style={{ width: "100%" }}
              size="small"
              value={displayValue}
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
            // Khi phiếu yêu cầu bị hủy, chỉ hiển thị status tag
            if (forceDisableAll) {
              return (
                <StatusTag color={IndicatorApprovalStatusColors[status]}>
                  {IndicatorApprovalStatusLabels[status]}
                </StatusTag>
              );
            }
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

        // If selecting a parent with subs, auto-select all its sub-indicators
        // Use subToParentMapping to find subs that belong to this specific parent
        selectedRows.forEach((row) => {
          if (row._isParentWithSubs) {
            const subIds = sortedIndicators
              .filter(
                (ind) =>
                  ind.parentIndicatorId && subToParentMapping[ind.id] === row.id
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
          const subIds = sortedIndicators
            .filter(
              (ind) =>
                ind.parentIndicatorId && subToParentMapping[ind.id] === parentId
            )
            .map((ind) => ind.id);
          newSelection = newSelection.filter((id) => !subIds.includes(id));
        });

        onSelectionChange(newSelection);
      },
      getCheckboxProps: (record: IndicatorWithPosition) => {
        if (selectionMode === "assignment") {
          // Assignment mode: chỉ enable cho AcceptedForTesting, Entered, MethodChanged (đã đổi PP, cần giao lại KTV)
          return {
            disabled:
              record.approvalStatus !== IndicatorApprovalStatus.AcceptedForTesting &&
              record.approvalStatus !== IndicatorApprovalStatus.Entered &&
              record.approvalStatus !== IndicatorApprovalStatus.MethodChanged,
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
    subToParentMapping,
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

      <style>{`
        .note-tooltip-content p { margin: 0; }
        .note-tooltip-content ol { margin: 4px 0; padding-left: 24px; list-style-type: decimal; }
        .note-tooltip-content ul { margin: 4px 0; padding-left: 24px; list-style-type: disc; }
        .note-tooltip-content li { line-height: 22px; }
      `}</style>

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
