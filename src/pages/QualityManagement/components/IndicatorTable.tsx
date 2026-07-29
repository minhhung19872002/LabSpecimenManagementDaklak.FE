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
import {
  CheckOutlined,
  CloseOutlined,
  UndoOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import {
  formatDate,
  stripPTags,
  evaluatePassFail,
} from "../../../utils/formatters";
import {
  QualityManagementIndicatorDto,
  QualityIndicatorApprovalStatus,
  QualityManagementStatus,
  QLCLDisplayStatus,
  QLCLDisplayStatusLabels,
  QLCLDisplayStatusColors,
} from "../../../types/qualityManagement";
import IndicatorImageCell from "../../../components/common/IndicatorImageCell";
import { IndicatorName } from "../../../components/common";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { useColumnResize } from "../../../hooks";
import { INDICATOR_TABLE_COLUMN_WIDTHS } from "./constants";

const { Panel } = Collapse;
const { Text } = Typography;

interface IndicatorTableProps {
  indicators: QualityManagementIndicatorDto[];
  taskStatus: QualityManagementStatus;
  onApprove: (indicatorId: string) => void;
  onReject: (indicatorId: string) => void;
  onReturnResult?: (indicatorId: string) => void;
  onIndicatorUpdate: () => void;
  // Bulk action selection props (for pending indicators)
  selectedPendingIds: string[];
  onPendingSelectChange: (ids: string[]) => void;
  // Bulk action selection props (for approved indicators — "Trả lại KQ" hàng loạt)
  selectedApprovedIds: string[];
  onApprovedSelectChange: (ids: string[]) => void;
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
  _isParentWithChildren: boolean; // Parent có children -> chỉ hiển thị tên + PP
  _isSubIndicator: boolean; // Sub-indicator -> hiển thị đầy đủ với thụt lề
  _isLastSubIndicator: boolean; // Last sub-indicator trong group (để vẽ tree line đúng)
  _isFirstSubIndicator: boolean; // First sub-indicator trong group
  _rowKey: string; // Unique row key
}

// Helper: tạo composite key từ indicatorId + methodId
const makeGroupKey = (
  indicatorId: string,
  methodId: string | null | undefined,
) => `${indicatorId}_${methodId || "no-method"}`;

// Group và flatten indicators theo quan hệ parent-child
// FIX: Xử lý trường hợp có nhiều parents cùng indicatorId+methodId
const processIndicatorsWithHierarchy = (
  indicators: QualityManagementIndicatorDto[],
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
  onReturnResult,
  onIndicatorUpdate: _onIndicatorUpdate,
  selectedPendingIds,
  onPendingSelectChange,
  selectedApprovedIds,
  onApprovedSelectChange,
  forceDisableActions = false,
}) => {
  const getReportStatusTag = (isPrinted: boolean) => (
    <StatusTag color={isPrinted ? "success" : "default"}>
      {isPrinted ? "Đã phát hành" : "Chưa phát hành"}
    </StatusTag>
  );

  const getWorkflowStatusTag = (status: QLCLDisplayStatus) => (
    <StatusTag color={QLCLDisplayStatusColors[status]}>
      {QLCLDisplayStatusLabels[status]}
    </StatusTag>
  );

  // Check permissions
  const canApprove = authService.hasPermission(PERMISSIONS.TestResults.Approve);
  const canReject = authService.hasPermission(PERMISSIONS.TestResults.Reject);

  // Check if actions should be disabled based on task status and permissions
  // Allow approving pending indicators even after ResultSent (for partial send scenarios)
  // Also disable when test request is cancelled (forceDisableActions)
  const actionsDisabled = forceDisableActions || (!canApprove && !canReject);

  const { tableComponents, withResize } = useColumnResize(
    INDICATOR_TABLE_COLUMN_WIDTHS,
  );

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
          ind.approvalStatus ===
            QualityIndicatorApprovalStatus.PendingApproval &&
          ind.isInQualityScope &&
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
  const isAllPendingSelectedInGroup = (
    processedIndicators: ProcessedIndicator[],
  ): boolean => {
    const pendingIds = processedIndicators
      .filter(
        (ind) =>
          ind.approvalStatus ===
            QualityIndicatorApprovalStatus.PendingApproval &&
          ind.isInQualityScope &&
          !ind._isParentWithChildren,
      )
      .map((ind) => ind.id);
    if (pendingIds.length === 0) return false;
    return pendingIds.every((id) => selectedPendingIds.includes(id));
  };

  // Generate columns based on whether group has pending/approved indicators
  const getColumns = (
    hasPendingIndicators: boolean,
    hasApprovedIndicators = false,
  ): ColumnsType<ProcessedIndicator> => {
    const cols: ColumnsType<ProcessedIndicator> = [];

    // Show checkbox column for pending (bulk duyệt/từ chối) AND approved (bulk trả lại KQ)
    if ((hasPendingIndicators || hasApprovedIndicators) && !actionsDisabled) {
      cols.push(
        withResize("checkbox", {
          title: () => null,
          dataIndex: "checkbox",
          key: "checkbox",
          width: 50,
          render: (_, record) => {
            if (record._isParentWithChildren) return null;

            const isPending =
              record.approvalStatus ===
                QualityIndicatorApprovalStatus.PendingApproval &&
              record.isInQualityScope;
            const isApproved =
              record.approvalStatus ===
                QualityIndicatorApprovalStatus.Approved &&
              record.isInQualityScope;

            if (isPending) {
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

            if (isApproved && canReject) {
              return (
                <Checkbox
                  checked={selectedApprovedIds.includes(record.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onApprovedSelectChange([
                        ...selectedApprovedIds,
                        record.id,
                      ]);
                    } else {
                      onApprovedSelectChange(
                        selectedApprovedIds.filter((id) => id !== record.id),
                      );
                    }
                  }}
                />
              );
            }

            return null;
          },
        }),
      );
    }

    // Base columns
    cols.push(
      withResize("indicatorName", {
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
      }),
      withResize("methodName", {
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
      }),
      withResize("unit", {
        title: "ĐVT",
        dataIndex: "unit",
        key: "unit",
        width: 80,
        align: "center" as const,
        render: (text: string, record) => {
          if (record._isParentWithChildren) return "-";
          return text ? <IndicatorName name={text} /> : "-";
        },
      }),
      withResize("result", {
        title: "Kết quả",
        dataIndex: "result",
        key: "result",
        width: 100,
        align: "center" as const,
        render: (text: string, record) => {
          if (record._isParentWithChildren) return "-";
          return <Text strong>{text || "-"}</Text>;
        },
      }),
      withResize("images", {
        title: "Hình ảnh",
        key: "images",
        width: 150,
        render: (_, record) => {
          if (record._isParentWithChildren) return null;
          return (
            <IndicatorImageCell
              images={record.images || []}
              canUpload={false}
              maxImages={5}
            />
          );
        },
      }),
      withResize("resultSentDate", {
        title: "Ngày gửi KQ",
        dataIndex: "resultSentDate",
        key: "resultSentDate",
        width: 110,
        render: (date: string, record) => {
          if (record._isParentWithChildren) return "-";
          return formatDate(date);
        },
      }),
      withResize("approvalDate", {
        title: "Ngày duyệt",
        dataIndex: "approvalDate",
        key: "approvalDate",
        width: 110,
        render: (date: string, record) => {
          if (record._isParentWithChildren) return "-";
          return formatDate(date);
        },
      }),
      withResize("standardName", {
        title: "So với",
        dataIndex: "standardName",
        key: "standardName",
        width: 150,
        ellipsis: true,
        render: (text: string, record) => {
          if (record._isParentWithChildren) return "-";
          return text || "-";
        },
      }),
      withResize("limit", {
        title: "Giới hạn",
        key: "limit",
        width: 120,
        render: (_, record) => {
          if (record._isParentWithChildren) return "-";
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
          if (record.comparisonOperator && record.allowedLimit) {
            const limitHtml = stripPTags(record.allowedLimit);
            return (
              <span>
                {record.comparisonOperator}{" "}
                <span dangerouslySetInnerHTML={{ __html: limitHtml }} />
              </span>
            );
          }
          if (record.referenceLimit) {
            const refHtml = stripPTags(record.referenceLimit);
            return <span dangerouslySetInnerHTML={{ __html: refHtml }} />;
          }
          return "-";
        },
      }),
      withResize("passFailStatus", {
        title: "Đạt/Không đạt",
        key: "passFailStatus",
        width: 120,
        align: "center" as const,
        render: (_, record) => {
          if (record._isParentWithChildren) return "-";
          if (!record.result) return null;
          const hasSingleLimit =
            record.comparisonOperator && record.allowedLimit;
          const hasRangeLimit = record.lowerLimit && record.upperLimit;
          if (!hasSingleLimit && !hasRangeLimit) return null;

          const passFailStatus = evaluatePassFail(
            record.result,
            record.comparisonOperator,
            record.allowedLimit,
            record.lowerOperator,
            record.lowerLimit,
            record.upperOperator,
            record.upperLimit,
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
      }),
      withResize("qlclDisplayStatus", {
        title: "Trạng thái",
        dataIndex: "qlclDisplayStatus",
        key: "qlclDisplayStatus",
        width: 150,
        render: (status: QLCLDisplayStatus | undefined, record) => {
          if (record._isParentWithChildren || status === undefined) return "-";
          return getWorkflowStatusTag(status);
        },
      }),
      withResize("reportStatus", {
        title: "Trạng thái báo cáo",
        dataIndex: "isPrinted",
        key: "reportStatus",
        width: 140,
        render: (isPrinted: boolean, record) => {
          if (record._isParentWithChildren) return "-";
          return getReportStatusTag(!!isPrinted);
        },
      }),
    );

    // Show actions column if there are pending or approved (for "Trả lại KQ") indicators
    if ((hasPendingIndicators || hasApprovedIndicators) && !actionsDisabled) {
      cols.push(
        withResize("actions", {
          title: "Thao tác",
          key: "actions",
          width: 180,
          fixed: "right" as const,
          align: "center" as const,
          render: (_, record) => {
            if (record._isParentWithChildren) {
              return null;
            }

            const isPending =
              record.approvalStatus ===
                QualityIndicatorApprovalStatus.PendingApproval &&
              record.isInQualityScope;

            if (isPending) {
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
            }

            const isApproved =
              record.approvalStatus ===
                QualityIndicatorApprovalStatus.Approved &&
              record.isInQualityScope;

            if (isApproved && canReject && onReturnResult) {
              return (
                <Tooltip title="Trả lại KQ">
                  <Button
                    size="small"
                    icon={<UndoOutlined />}
                    onClick={() => onReturnResult(record.id)}
                  >
                    Trả lại KQ
                  </Button>
                </Tooltip>
              );
            }

            return null;
          },
        }),
      );
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
          const processedIndicators = processIndicatorsWithHierarchy(
            group.indicators,
          );

          // Filter out parent indicators with children for counting
          const activeIndicators = processedIndicators.filter(
            (ind) => !ind._isParentWithChildren,
          );
          const approvedCount = activeIndicators.filter(
            (ind) =>
              ind.approvalStatus === QualityIndicatorApprovalStatus.Approved,
          ).length;
          const pendingCount = activeIndicators.filter(
            (ind) =>
              ind.approvalStatus ===
                QualityIndicatorApprovalStatus.PendingApproval &&
              ind.isInQualityScope,
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
                        checked={isAllPendingSelectedInGroup(
                          processedIndicators,
                        )}
                        onChange={(e) =>
                          handleSelectAllPendingInGroup(
                            processedIndicators,
                            e.target.checked,
                          )
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
                  columns={getColumns(pendingCount > 0, approvedCount > 0)}
                  dataSource={processedIndicators}
                  rowKey="_rowKey"
                  rowClassName={getRowClassName}
                  pagination={false}
                  size="small"
                  scroll={{ x: 1440 }}
                  components={tableComponents}
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
