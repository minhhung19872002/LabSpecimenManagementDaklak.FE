import React from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Collapse,
  Tooltip,
  Checkbox,
  Typography,
  Card,
} from "antd";
import StatusTag from "../../../components/common/StatusTag";
import { CheckOutlined, CloseOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { formatDate, parseResultToNumber, stripPTags, convertHtmlToMathExpression } from "../../../utils/formatters";
import {
  QualityManagementIndicatorDto,
  QualityIndicatorApprovalStatus,
  QualityIndicatorApprovalStatusLabels,
  QualityIndicatorApprovalStatusColors,
  QualityManagementStatus,
} from "../../../types/qualityManagement";
import IndicatorImageCell from "../../../components/common/IndicatorImageCell";
import { IndicatorName } from "../../../components/common";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

const { Panel } = Collapse;
const { Text } = Typography;

interface IndicatorTableProps {
  indicators: QualityManagementIndicatorDto[];
  taskStatus: QualityManagementStatus;
  onApprove: (indicatorId: string) => void;
  onReject: (indicatorId: string) => void;
  onIndicatorUpdate: () => void;
  // Bulk action selection props (for pending indicators)
  selectedPendingIds: string[];
  onPendingSelectChange: (ids: string[]) => void;
  // Force disable all actions (e.g., when test request is cancelled)
  forceDisableActions?: boolean;
}

// Group indicators by sample
interface SampleGroup {
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  specimenTypeName: string;
  indicators: QualityManagementIndicatorDto[];
}

// Extended indicator with parent-child metadata
interface ProcessedIndicator extends QualityManagementIndicatorDto {
  _isParentWithChildren: boolean;  // Parent có children -> chỉ hiển thị tên + PP
  _isSubIndicator: boolean;        // Sub-indicator -> hiển thị đầy đủ với thụt lề
  _isLastSubIndicator: boolean;    // Last sub-indicator trong group (để vẽ tree line đúng)
  _isFirstSubIndicator: boolean;   // First sub-indicator trong group
  _rowKey: string;                 // Unique row key
}

// Helper: tạo composite key từ indicatorId + methodId
const makeGroupKey = (indicatorId: string, methodId: string | null | undefined) =>
  `${indicatorId}_${methodId || 'no-method'}`;

// Group và flatten indicators theo quan hệ parent-child
// FIX: Xử lý trường hợp có nhiều parents cùng indicatorId+methodId
const processIndicatorsWithHierarchy = (
  indicators: QualityManagementIndicatorDto[]
): ProcessedIndicator[] => {
  const result: ProcessedIndicator[] = [];

  // Separate parents and subs
  const parents = indicators.filter((ind) => !ind.parentIndicatorId);
  const subs = indicators.filter((ind) => ind.parentIndicatorId);

  // Group parents by indicatorId+methodId -> array of parents (handle multiple parents with same key)
  const parentsByKey: Record<string, QualityManagementIndicatorDto[]> = {};
  parents.forEach((p) => {
    const key = makeGroupKey(p.indicatorId, p.methodId);
    if (!parentsByKey[key]) {
      parentsByKey[key] = [];
    }
    parentsByKey[key].push(p);
  });

  // Group subs by parentIndicatorId+methodId
  const subsByKey: Record<string, QualityManagementIndicatorDto[]> = {};
  subs.forEach((s) => {
    const key = makeGroupKey(s.parentIndicatorId!, s.methodId);
    if (!subsByKey[key]) {
      subsByKey[key] = [];
    }
    subsByKey[key].push(s);
  });

  // Create sub-to-parent mapping: distribute subs evenly among parents with same key
  const subToParentMapping: Record<string, string> = {}; // sub.id -> parent.id
  const orphans: QualityManagementIndicatorDto[] = [];

  Object.entries(subsByKey).forEach(([key, subList]) => {
    const parentList = parentsByKey[key] || [];
    if (parentList.length === 0) {
      // Orphan subs - mark for later
      subList.forEach((sub) => {
        subToParentMapping[sub.id] = "";
        orphans.push(sub);
      });
    } else if (parentList.length === 1) {
      // Single parent - all subs go to it
      subList.forEach((sub) => {
        subToParentMapping[sub.id] = parentList[0].id;
      });
    } else {
      // Multiple parents with same indicatorId+methodId - distribute evenly
      const subsPerParent = Math.ceil(subList.length / parentList.length);
      subList.forEach((sub, idx) => {
        const parentIdx = Math.floor(idx / subsPerParent);
        const safeParentIdx = Math.min(parentIdx, parentList.length - 1);
        subToParentMapping[sub.id] = parentList[safeParentIdx].id;
      });
    }
  });

  // Build result: for each parent, add it and its assigned children
  parents.forEach((parent) => {
    // Find children assigned to this specific parent
    const children = subs.filter(
      (sub) => subToParentMapping[sub.id] === parent.id,
    );
    const hasChildren = children.length > 0;

    // Add parent
    result.push({
      ...parent,
      _isParentWithChildren: hasChildren,
      _isSubIndicator: false,
      _isLastSubIndicator: false,
      _isFirstSubIndicator: false,
      _rowKey: parent.id,
    });

    // Add children (if any)
    children.forEach((child, idx) => {
      result.push({
        ...child,
        _isParentWithChildren: false,
        _isSubIndicator: true,
        _isFirstSubIndicator: idx === 0,
        _isLastSubIndicator: idx === children.length - 1,
        _rowKey: `${parent.id}_sub_${idx}`,
      });
    });
  });

  // Add orphan subs as standalone indicators
  orphans.forEach((ind, idx) => {
    if (!result.some((r) => r.id === ind.id)) {
      result.push({
        ...ind,
        _isParentWithChildren: false,
        _isSubIndicator: true,
        _isFirstSubIndicator: true,
        _isLastSubIndicator: true,
        _rowKey: `orphan_${ind.id}_${idx}`,
      });
    }
  });

  return result;
};

const IndicatorTable: React.FC<IndicatorTableProps> = ({
  indicators,
  taskStatus: _taskStatus,
  onApprove,
  onReject,
  onIndicatorUpdate: _onIndicatorUpdate,
  selectedPendingIds,
  onPendingSelectChange,
  forceDisableActions = false,
}) => {
  // Calculate pass/fail status based on result and limits
  // Supports both single limit and range comparisons
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

  const getApprovalStatusTag = (status: QualityIndicatorApprovalStatus) => (
    <StatusTag color={QualityIndicatorApprovalStatusColors[status]}>
      {QualityIndicatorApprovalStatusLabels[status]}
    </StatusTag>
  );

  // Check permissions
  const canApprove = authService.hasPermission(PERMISSIONS.TestResults.Approve);
  const canReject = authService.hasPermission(PERMISSIONS.TestResults.Reject);

  // Check if actions should be disabled based on task status and permissions
  // Allow approving pending indicators even after ResultSent (for partial send scenarios)
  // Also disable when test request is cancelled (forceDisableActions)
  const actionsDisabled = forceDisableActions || (!canApprove && !canReject);

  // Group indicators by sample
  const groupedData: SampleGroup[] = React.useMemo(() => {
    const groups: Record<string, SampleGroup> = {};
    indicators.forEach((ind) => {
      const key = ind.sampleId;
      if (!groups[key]) {
        groups[key] = {
          sampleId: key,
          sampleCode: ind.sampleCode || "",
          sampleName: ind.sampleName || "",
          specimenTypeName: ind.specimenTypeName || "",
          indicators: [],
        };
      }
      groups[key].indicators.push(ind);
    });
    return Object.values(groups);
  }, [indicators]);

  // Handle select all PENDING in a sample group (for bulk approve/reject)
  // Exclude parent indicators with children (they are auto-approved when sub-indicator is approved)
  const handleSelectAllPendingInGroup = (
    processedIndicators: ProcessedIndicator[],
    checked: boolean,
  ) => {
    const pendingIds = processedIndicators
      .filter(
        (ind) =>
          ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval &&
          !ind._isParentWithChildren,
      )
      .map((ind) => ind.id);

    if (checked) {
      const newSelected = [...new Set([...selectedPendingIds, ...pendingIds])];
      onPendingSelectChange(newSelected);
    } else {
      const newSelected = selectedPendingIds.filter(
        (id) => !pendingIds.includes(id),
      );
      onPendingSelectChange(newSelected);
    }
  };

  // Check if all pending indicators in group are selected
  // Exclude parent indicators with children
  const isAllPendingSelectedInGroup = (processedIndicators: ProcessedIndicator[]): boolean => {
    const pendingIds = processedIndicators
      .filter(
        (ind) =>
          ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval &&
          !ind._isParentWithChildren,
      )
      .map((ind) => ind.id);
    if (pendingIds.length === 0) return false;
    return pendingIds.every((id) => selectedPendingIds.includes(id));
  };

  // Generate columns based on whether group has pending indicators
  const getColumns = (
    hasPendingIndicators: boolean,
  ): ColumnsType<ProcessedIndicator> => {
    const cols: ColumnsType<ProcessedIndicator> = [];

    // Only show checkbox column if there are pending indicators
    if (hasPendingIndicators && !actionsDisabled) {
      cols.push({
        title: () => null,
        dataIndex: "checkbox",
        key: "checkbox",
        width: 50,
        render: (_, record) => {
          const isPending =
            record.approvalStatus ===
            QualityIndicatorApprovalStatus.PendingApproval;
          // Don't show checkbox for parent indicators with children
          if (isPending && !record._isParentWithChildren) {
            return (
              <Checkbox
                checked={selectedPendingIds.includes(record.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onPendingSelectChange([...selectedPendingIds, record.id]);
                  } else {
                    onPendingSelectChange(
                      selectedPendingIds.filter((id) => id !== record.id),
                    );
                  }
                }}
              />
            );
          }
          return null;
        },
      });
    }

    // Base columns
    cols.push(
      {
        title: "Tên chỉ tiêu",
        dataIndex: "indicatorName",
        key: "indicatorName",
        width: 200,
        ellipsis: true,
        render: (value: string, record) => {
          const content = value ? (
            <IndicatorName
              name={value}
              formattedName={record.indicatorFormattedName}
            />
          ) : (
            "-"
          );

          // Tree line for sub-indicators
          const classNames = ["indicator-name-wrapper"];
          if (record._isSubIndicator) {
            classNames.push("has-tree-line");
            if (record._isFirstSubIndicator) classNames.push("is-first-sub");
            if (record._isLastSubIndicator) classNames.push("is-last-sub");
          }

          return (
            <div
              className={classNames.join(" ")}
              style={{
                paddingLeft: record._isSubIndicator ? 24 : 0,
                position: "relative",
              }}
            >
              {content}
            </div>
          );
        },
      },
      {
        title: "Phương pháp",
        dataIndex: "methodName",
        key: "methodName",
        width: 150,
        ellipsis: true,
        render: (value: string, record) =>
          value ? (
            <IndicatorName
              name={value}
              formattedName={record.methodFormattedName}
            />
          ) : (
            "-"
          ),
      },
      {
        title: "ĐVT",
        dataIndex: "unit",
        key: "unit",
        width: 80,
        align: "center" as const,
        render: (text: string, record) => {
          // Don't show for parent indicators with children
          if (record._isParentWithChildren) return "-";
          return text ? <IndicatorName name={text} /> : "-";
        },
      },
      {
        title: "Kết quả",
        dataIndex: "result",
        key: "result",
        width: 100,
        align: "center" as const,
        render: (text: string, record) => {
          // Don't show result for parent indicators with children
          if (record._isParentWithChildren) return "-";
          return <Text strong>{text || "-"}</Text>;
        },
      },
      {
        title: "Hình ảnh",
        key: "images",
        width: 120,
        render: (_, record) => {
          // Don't show images for parent indicators with children
          if (record._isParentWithChildren) return null;
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
        title: "Ngày gửi KQ",
        dataIndex: "resultSentDate",
        key: "resultSentDate",
        width: 110,
        render: (date: string, record) => {
          if (record._isParentWithChildren) return "-";
          return formatDate(date);
        },
      },
      {
        title: "Ngày duyệt",
        dataIndex: "approvalDate",
        key: "approvalDate",
        width: 110,
        render: (date: string, record) => {
          if (record._isParentWithChildren) return "-";
          return formatDate(date);
        },
      },
      {
        title: "So với",
        dataIndex: "standardName",
        key: "standardName",
        width: 150,
        ellipsis: true,
        render: (text: string, record) => {
          if (record._isParentWithChildren) return "-";
          return text || "-";
        },
      },
      {
        title: "Giới hạn",
        key: "limit",
        width: 120,
        render: (_, record) => {
          if (record._isParentWithChildren) return "-";
          // Range case: both lowerLimit and upperLimit have values
          if (record.lowerLimit && record.upperLimit) {
            const lower = record.lowerOperator || ">";
            const upper = record.upperOperator || "<";
            const lowerHtml = stripPTags(record.lowerLimit);
            const upperHtml = stripPTags(record.upperLimit);
            return (
              <span>
                {lower} <span dangerouslySetInnerHTML={{ __html: lowerHtml }} />
                {" và "}
                {upper} <span dangerouslySetInnerHTML={{ __html: upperHtml }} />
              </span>
            );
          }
          // Single limit case
          if (record.comparisonOperator && record.allowedLimit) {
            const limitHtml = stripPTags(record.allowedLimit);
            return (
              <span>
                {record.comparisonOperator} <span dangerouslySetInnerHTML={{ __html: limitHtml }} />
              </span>
            );
          }
          if (record.referenceLimit) {
            const refHtml = stripPTags(record.referenceLimit);
            return <span dangerouslySetInnerHTML={{ __html: refHtml }} />;
          }
          return "-";
        },
      },
      {
        title: "Đạt/Không đạt",
        key: "passFailStatus",
        width: 120,
        align: "center" as const,
        render: (_, record) => {
          // Hide for parent indicators with children
          if (record._isParentWithChildren) return "-";

          // Need result to calculate
          if (!record.result) return null;
          // Need either single limit or range limits
          const hasSingleLimit = record.comparisonOperator && record.allowedLimit;
          const hasRangeLimit = record.lowerLimit && record.upperLimit;
          if (!hasSingleLimit && !hasRangeLimit) return null;

          const passFailStatus = calculatePassFail(
            record.result,
            record.comparisonOperator,
            record.allowedLimit,
            record.lowerOperator,
            record.lowerLimit,
            record.upperOperator,
            record.upperLimit
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
        title: "Trạng thái",
        dataIndex: "approvalStatus",
        key: "approvalStatus",
        width: 120,
        render: (status: QualityIndicatorApprovalStatus, record) => {
          if (record._isParentWithChildren) return "-";
          return getApprovalStatusTag(status);
        },
      },
    );

    // Only show actions column if there are pending indicators
    if (hasPendingIndicators && !actionsDisabled) {
      cols.push({
        title: "Thao tác",
        key: "actions",
        width: 180,
        fixed: "right" as const,
        align: "center" as const,
        render: (_, record) => {
          const isPending =
            record.approvalStatus ===
            QualityIndicatorApprovalStatus.PendingApproval;
          // Don't show actions for parent indicators with children (they are auto-approved)
          if (!isPending || record._isParentWithChildren) {
            return null;
          }
          return (
            <Space size="small">
              {canApprove && (
                <Tooltip title="Duyệt">
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => onApprove(record.id)}
                  >
                    Duyệt
                  </Button>
                </Tooltip>
              )}
              {canReject && (
                <Tooltip title="Từ chối">
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => onReject(record.id)}
                  >
                    Từ chối
                  </Button>
                </Tooltip>
              )}
            </Space>
          );
        },
      });
    }

    return cols;
  };

  // Row class for styling
  const getRowClassName = (record: ProcessedIndicator): string => {
    const classes: string[] = [];
    if (record._isParentWithChildren) {
      classes.push("parent-indicator-row");
    } else if (record._isSubIndicator) {
      classes.push("sub-indicator-row");
    }
    return classes.join(" ");
  };

  return (
    <div className="quality-indicator-table-wrapper">
      <style>
        {`
          /* Tree line styles for sub-indicators */
          .indicator-name-wrapper {
            position: relative;
          }

          /* Vertical line connecting sub-indicators */
          .indicator-name-wrapper.has-tree-line::before {
            content: '';
            position: absolute;
            left: 0;
            top: -100%;
            bottom: -100%;
            width: 1px;
            background-color: #d9d9d9;
          }

          /* Horizontal line from vertical to indicator name */
          .indicator-name-wrapper.has-tree-line::after {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            width: 16px;
            height: 1px;
            background-color: #d9d9d9;
          }

          /* For last sub-indicator, vertical line ends at the middle (creates the corner) */
          .indicator-name-wrapper.has-tree-line.is-last-sub::before {
            bottom: 50%;
          }

          /* Parent indicator row - có children, chỉ hiển thị tên + PP */
          .parent-indicator-row > td {
            background-color: #f5f5f5 !important;
            font-weight: 500;
          }
          .parent-indicator-row > td.ant-table-cell-fix-left,
          .parent-indicator-row > td.ant-table-cell-fix-right {
            background-color: #f5f5f5 !important;
          }

          /* Sub-indicator row - hiển thị đầy đủ với thụt lề */
          .sub-indicator-row > td {
            background-color: #fafafa !important;
          }
          .sub-indicator-row > td.ant-table-cell-fix-left,
          .sub-indicator-row > td.ant-table-cell-fix-right {
            background-color: #fafafa !important;
          }

          /* Hover states */
          .parent-indicator-row:hover > td {
            background-color: #e8e8e8 !important;
          }
          .parent-indicator-row:hover > td.ant-table-cell-fix-left,
          .parent-indicator-row:hover > td.ant-table-cell-fix-right {
            background-color: #e8e8e8 !important;
          }

          .sub-indicator-row:hover > td {
            background-color: #f0f0f0 !important;
          }
          .sub-indicator-row:hover > td.ant-table-cell-fix-left,
          .sub-indicator-row:hover > td.ant-table-cell-fix-right {
            background-color: #f0f0f0 !important;
          }

          /* Ensure tree cell overflow is visible */
          .parent-indicator-row > td,
          .sub-indicator-row > td {
            overflow: visible !important;
          }
        `}
      </style>
      <Collapse defaultActiveKey={groupedData.map((g) => g.sampleId)} ghost>
        {groupedData.map((group) => {
          // Process indicators with hierarchy
          const processedIndicators = processIndicatorsWithHierarchy(group.indicators);

          // Filter out parent indicators with children for counting
          const activeIndicators = processedIndicators.filter(ind => !ind._isParentWithChildren);
          const approvedCount = activeIndicators.filter(
            (ind) =>
              ind.approvalStatus === QualityIndicatorApprovalStatus.Approved,
          ).length;
          const pendingCount = activeIndicators.filter(
            (ind) =>
              ind.approvalStatus ===
              QualityIndicatorApprovalStatus.PendingApproval,
          ).length;

          // Build sample display name
          const sampleDisplayName = group.sampleName
            ? `${group.sampleCode} - ${group.sampleName}`
            : group.sampleCode;

          return (
            <Panel
              key={group.sampleId}
              header={
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Checkbox for pending indicators (bulk approve/reject) */}
                  {pendingCount > 0 && !actionsDisabled && (
                    <Tooltip title="Chọn tất cả chỉ tiêu chờ duyệt">
                      <Checkbox
                        checked={isAllPendingSelectedInGroup(processedIndicators)}
                        onChange={(e) =>
                          handleSelectAllPendingInGroup(processedIndicators, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Tooltip>
                  )}
                  <Text strong>{sampleDisplayName}</Text>
                  {group.specimenTypeName && (
                    <Text type="secondary">({group.specimenTypeName})</Text>
                  )}
                  <Space size="small">
                    <Tag color="blue">{activeIndicators.length} chỉ tiêu</Tag>
                    {approvedCount > 0 && (
                      <Tag color="success">{approvedCount} đã duyệt</Tag>
                    )}
                    {pendingCount > 0 && (
                      <Tag color="warning">{pendingCount} chờ duyệt</Tag>
                    )}
                  </Space>
                </div>
              }
            >
              <Card
                size="small"
                style={{ margin: 0, boxShadow: "none", overflow: "hidden" }}
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  columns={getColumns(pendingCount > 0)}
                  dataSource={processedIndicators}
                  rowKey="_rowKey"
                  rowClassName={getRowClassName}
                  pagination={false}
                  size="small"
                  scroll={{ x: 1440 }}
                />
              </Card>
            </Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default IndicatorTable;
