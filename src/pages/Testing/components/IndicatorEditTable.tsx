import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Input,
  Button,
  Typography,
  Tooltip,
  Space,
  Checkbox,
  AutoComplete,
  DatePicker,
} from "antd";
import StatusTag from "../../../components/common/StatusTag";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  WarningOutlined,
  SyncOutlined,
  SendOutlined,
  StopOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "../../../utils/formatters";
import {
  TestingIndicatorDto,
  SaveIndicatorResultDto,
  IndicatorTestingStatus,
  IndicatorTestingStatusLabels,
  IndicatorTestingStatusColors,
  IndicatorImageDto,
} from "../../../types/testing";
import IndicatorImageCell from "../../../components/common/IndicatorImageCell";
import { IndicatorName } from "../../../components/common";
import dayjs from "dayjs";

const { Text } = Typography;

interface ResultOption {
  value: string;
  label: string;
}

interface IndicatorEditTableProps {
  indicators: TestingIndicatorDto[];
  selectedIndicatorIds: string[];
  isUrgent?: boolean;
  submitting?: boolean;
  resultOptions?: ResultOption[];
  /** Có quyền thực hiện thao tác (nhập/sửa/gửi kết quả) theo Permission Matrix */
  canPerformActions?: boolean;
  onResultsChange: (results: SaveIndicatorResultDto[]) => void;
  onSelectionChange: (indicatorIds: string[]) => void;
  onShowRejectionHistory: (indicatorId: string, indicatorName: string) => void;
  onSaveIndicator: (
    indicatorId: string,
    result?: SaveIndicatorResultDto,
  ) => void;
  onSubmitIndicator?: (indicatorId: string) => void;
  onUploadIndicatorImages?: (
    indicatorId: string,
    files: File[],
  ) => Promise<IndicatorImageDto[]>;
  onDeleteIndicatorImage?: (imageId: string) => Promise<void>;
  /** Callback khi click button "Không TN được" */
  onShowCannotTestModal?: (indicatorId: string, indicatorName: string) => void;
}

// Extended indicator with parent-child metadata
interface ProcessedIndicator extends TestingIndicatorDto {
  _isParentWithChildren: boolean; // Parent có children -> chỉ hiển thị tên + PP
  _isSubIndicator: boolean; // Sub-indicator -> hiển thị đầy đủ với thụt lề
  _isLastSubIndicator: boolean; // Last sub-indicator trong group (để vẽ tree line đúng)
  _rowKey: string; // Unique row key
}

// Helper: tạo composite key từ indicatorId + methodId
const makeGroupKey = (
  indicatorId: string,
  methodId: string | null | undefined,
) => `${indicatorId}_${methodId || "no-method"}`;

// Group và flatten indicators theo quan hệ parent-child
const processIndicatorsForDisplay = (
  indicators: TestingIndicatorDto[],
): ProcessedIndicator[] => {
  const result: ProcessedIndicator[] = [];
  const parentMap = new Map<
    string,
    { parent: TestingIndicatorDto; children: TestingIndicatorDto[] }
  >();
  const orphans: TestingIndicatorDto[] = [];

  // Step 1: Find all parents (parentIndicatorId = null/undefined)
  indicators.forEach((ind) => {
    if (!ind.parentIndicatorId) {
      const key = makeGroupKey(ind.indicatorId, ind.methodId);
      parentMap.set(key, { parent: ind, children: [] });
    }
  });

  // Step 2: Assign children to parents
  indicators.forEach((ind) => {
    if (ind.parentIndicatorId) {
      const key = makeGroupKey(ind.parentIndicatorId, ind.methodId);
      const group = parentMap.get(key);
      if (group) {
        group.children.push(ind);
      } else {
        // Parent không có trong list -> hiển thị như indicator độc lập
        orphans.push(ind);
      }
    }
  });

  // Step 3: Flatten với metadata
  parentMap.forEach(({ parent, children }) => {
    const hasChildren = children.length > 0;

    // Add parent
    result.push({
      ...parent,
      _isParentWithChildren: hasChildren,
      _isSubIndicator: false,
      _isLastSubIndicator: false,
      _rowKey: parent.id,
    });

    // Add children (if any)
    children.forEach((child, idx) => {
      result.push({
        ...child,
        _isParentWithChildren: false,
        _isSubIndicator: true,
        _isLastSubIndicator: idx === children.length - 1, // Last child in group
        _rowKey: `${parent.id}_sub_${idx}`,
      });
    });
  });

  // Step 4: Add orphans as standalone indicators
  orphans.forEach((ind) => {
    result.push({
      ...ind,
      _isParentWithChildren: false,
      _isSubIndicator: true, // Hiển thị như sub vì có parentIndicatorId
      _isLastSubIndicator: true, // Orphan luôn là "last" trong group của nó
      _rowKey: `orphan_${ind.id}`,
    });
  });

  return result;
};

const IndicatorEditTable: React.FC<IndicatorEditTableProps> = ({
  indicators,
  selectedIndicatorIds,
  isUrgent = false,
  submitting = false,
  resultOptions = [],
  canPerformActions = false,
  onResultsChange,
  onSelectionChange,
  onShowRejectionHistory,
  onSaveIndicator,
  onSubmitIndicator,
  onUploadIndicatorImages,
  onDeleteIndicatorImage,
  onShowCannotTestModal,
}) => {
  const [editedResults, setEditedResults] = useState<
    Map<string, SaveIndicatorResultDto>
  >(new Map());

  // Track indicator data to detect actual changes (IDs + testDates)
  const indicatorDataKey = indicators
    .map((ind) => `${ind.id}:${ind.testDate || ""}`)
    .join(",");

  // Initialize edited results from indicators - when indicator list or testDate changes
  useEffect(() => {
    const initialResults = new Map<string, SaveIndicatorResultDto>();
    indicators.forEach((ind) => {
      initialResults.set(ind.id, {
        indicatorId: ind.id,
        methodId: ind.methodId,
        unit: ind.unit,
        result: ind.result,
        note: ind.note,
        testDate: ind.testDate,
      });
    });
    setEditedResults(initialResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorDataKey]);

  // Process indicators for display (group parent-child)
  const processedIndicators = useMemo(() => {
    return processIndicatorsForDisplay(indicators);
  }, [indicators]);

  // Get status priority for sorting
  const getStatusPriority = (status: IndicatorTestingStatus): number => {
    switch (status) {
      case IndicatorTestingStatus.Rejected:
        return 0;
      case IndicatorTestingStatus.CannotTest:
        return 1;
      case IndicatorTestingStatus.PendingApproval:
        return 2;
      case IndicatorTestingStatus.Testing:
        return 3;
      case IndicatorTestingStatus.Todo:
        return 4;
      case IndicatorTestingStatus.Done:
        return 5;
      case IndicatorTestingStatus.Cancelled:
        return 6;
      default:
        return 7;
    }
  };

  // Sort processed indicators - keep parent-child grouping, sort by status within groups
  const sortedIndicators = useMemo(() => {
    // Group by parent first
    const groups: ProcessedIndicator[][] = [];
    let currentGroup: ProcessedIndicator[] = [];

    processedIndicators.forEach((ind) => {
      if (!ind._isSubIndicator) {
        // New parent starts a new group
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [ind];
      } else {
        // Sub-indicator belongs to current group
        currentGroup.push(ind);
      }
    });
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // Sort groups by parent's status priority
    groups.sort((a, b) => {
      const priorityA = getStatusPriority(a[0].testingStatus);
      const priorityB = getStatusPriority(b[0].testingStatus);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a[0].id.localeCompare(b[0].id);
    });

    // Flatten back
    return groups.flat();
  }, [processedIndicators]);

  const handleFieldChange = (
    indicatorId: string,
    field: keyof SaveIndicatorResultDto,
    value: string | undefined,
  ) => {
    const newResults = new Map(editedResults);
    const current = newResults.get(indicatorId) || {
      indicatorId,
      methodId: undefined,
      unit: undefined,
      result: undefined,
      testDate: undefined,
    };
    newResults.set(indicatorId, { ...current, [field]: value });
    setEditedResults(newResults);

    // Notify parent of changes
    onResultsChange(Array.from(newResults.values()));
  };

  const handleTestDateChange = (
    indicatorId: string,
    date: dayjs.Dayjs | null,
  ) => {
    const dateStr = date ? date.format("YYYY-MM-DD") : undefined;

    const current = editedResults.get(indicatorId) || {
      indicatorId,
      methodId: undefined,
      unit: undefined,
      result: undefined,
      testDate: undefined,
    };
    const updatedResult: SaveIndicatorResultDto = {
      ...current,
      testDate: dateStr,
    };

    const newResults = new Map(editedResults);
    newResults.set(indicatorId, updatedResult);
    setEditedResults(newResults);

    onResultsChange(Array.from(newResults.values()));
    onSaveIndicator(indicatorId, updatedResult);
  };

  // Handle checkbox selection - không cho chọn parent có children
  const handleCheckboxChange = (
    record: ProcessedIndicator,
    checked: boolean,
  ) => {
    if (!canPerformActions) return;
    if (record._isParentWithChildren) return; // Parent có children -> không cho chọn

    if (checked) {
      onSelectionChange([...selectedIndicatorIds, record.id]);
    } else {
      onSelectionChange(selectedIndicatorIds.filter((id) => id !== record.id));
    }
  };

  // Handle select all - chỉ chọn các indicator có thể select (không phải parent có children)
  const handleSelectAll = (checked: boolean) => {
    if (!canPerformActions) return;

    if (checked) {
      const selectableIds = sortedIndicators
        .filter(
          (ind) =>
            !ind._isParentWithChildren && // Không phải parent có children
            ind.testingStatus !== IndicatorTestingStatus.Done &&
            ind.testingStatus !== IndicatorTestingStatus.Cancelled,
        )
        .map((ind) => ind.id);
      onSelectionChange(selectableIds);
    } else {
      onSelectionChange([]);
    }
  };

  // Check if indicator can be selected
  const canSelectIndicator = (record: ProcessedIndicator) => {
    if (record._isParentWithChildren) return false; // Parent có children -> không cho chọn
    return (
      record.testingStatus !== IndicatorTestingStatus.Done &&
      record.testingStatus !== IndicatorTestingStatus.Cancelled
    );
  };

  // Selectable indicators (không phải parent có children)
  const selectableIndicators = sortedIndicators.filter(canSelectIndicator);
  const allSelected =
    selectableIndicators.length > 0 &&
    selectableIndicators.every((ind) => selectedIndicatorIds.includes(ind.id));
  const someSelected = selectableIndicators.some((ind) =>
    selectedIndicatorIds.includes(ind.id),
  );

  // Get testing status tag
  const getTestingStatusTag = (status: IndicatorTestingStatus) => {
    const label = IndicatorTestingStatusLabels[status];
    const color = IndicatorTestingStatusColors[status];

    const iconMap: Record<IndicatorTestingStatus, React.ReactNode> = {
      [IndicatorTestingStatus.Todo]: <ClockCircleOutlined />,
      [IndicatorTestingStatus.Testing]: <SyncOutlined spin />,
      [IndicatorTestingStatus.PendingApproval]: <ClockCircleOutlined />,
      [IndicatorTestingStatus.Rejected]: <WarningOutlined />,
      [IndicatorTestingStatus.Done]: <CheckCircleOutlined />,
      [IndicatorTestingStatus.Cancelled]: <StopOutlined />,
      [IndicatorTestingStatus.CannotTest]: <StopOutlined />,
    };

    return (
      <StatusTag color={color} icon={iconMap[status]}>
        {label}
      </StatusTag>
    );
  };

  const columns: ColumnsType<ProcessedIndicator> = [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
          disabled={!canPerformActions || selectableIndicators.length === 0}
        />
      ),
      key: "select",
      width: 40,
      fixed: "left" as const,
      render: (_, record) => {
        // Parent có children -> không hiện checkbox
        if (record._isParentWithChildren) {
          return null;
        }
        const isDisabled = !canPerformActions || !canSelectIndicator(record);
        return (
          <Checkbox
            checked={selectedIndicatorIds.includes(record.id)}
            onChange={(e) => handleCheckboxChange(record, e.target.checked)}
            disabled={isDisabled}
          />
        );
      },
    },
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 200,
      fixed: "left" as const,
      render: (value: string, record) => {
        const content = value ? (
          <IndicatorName
            name={value}
            formattedName={record.indicatorFormattedName}
          />
        ) : (
          "-"
        );

        const isSubIndicator = record._isSubIndicator;
        const isLastSub = record._isLastSubIndicator;

        // Sử dụng wrapper div với CSS class cho tree line (giống TaskManagement)
        return (
          <div
            className={`indicator-name-wrapper ${isSubIndicator ? "has-tree-line" : ""} ${isLastSub ? "is-last-sub" : ""}`}
            style={{
              paddingLeft: isSubIndicator ? 24 : 0,
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
      key: "method",
      width: 180,
      render: (value: string, record) =>
        value ? (
          <IndicatorName
            name={value}
            formattedName={record.methodFormattedName}
          />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "ĐVT",
      key: "unit",
      width: 100,
      render: (_, record) => {
        // Parent có children -> không hiển thị
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }
        const unitValue = record.unit ?? "";
        return (
          <Input
            value={unitValue}
            disabled
            style={{ backgroundColor: "#f5f5f5" }}
            placeholder="-"
          />
        );
      },
    },
    {
      title: "So với",
      dataIndex: "standardName",
      key: "standardName",
      width: 150,
      render: (value: string | undefined, record) => {
        // Parent có children -> không hiển thị
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Tooltip title={value}>
            <Text ellipsis style={{ maxWidth: 140 }}>
              {value || <Text type="secondary">-</Text>}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Giới hạn",
      key: "allowedLimit",
      width: 120,
      render: (_, record) => {
        // Parent có children -> không hiển thị
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }
        if (record.comparisonOperator && record.allowedLimit) {
          return (
            <Text>
              {record.comparisonOperator} {record.allowedLimit}
            </Text>
          );
        }
        return "-";
      },
    },
    {
      title: "Kết quả",
      key: "result",
      width: 190,
      render: (_, record) => {
        // Parent có children -> không hiển thị input
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }

        const currentValue =
          editedResults.get(record.id)?.result ?? record.result ?? "";

        const isDisabled =
          !canPerformActions ||
          !record.canEdit ||
          record.testingStatus === IndicatorTestingStatus.Done ||
          record.testingStatus === IndicatorTestingStatus.Cancelled;

        return (
          <AutoComplete
            value={currentValue}
            options={resultOptions}
            onChange={(value) => {
              handleFieldChange(record.id, "result", value);
            }}
            onBlur={() => {
              onSaveIndicator(record.id);
            }}
            disabled={isDisabled}
            placeholder={isDisabled ? "-" : "Nhập KQ"}
            style={{
              width: "100%",
              backgroundColor: isDisabled ? "#f5f5f5" : undefined,
            }}
            filterOption={(inputValue, option) =>
              option?.value.toUpperCase().includes(inputValue.toUpperCase()) ??
              false
            }
          />
        );
      },
    },
    {
      title: "Hình ảnh",
      key: "images",
      width: 120,
      render: (_, record) => {
        // Parent có children -> không hiển thị
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }

        const canUpload =
          canPerformActions &&
          record.canEdit &&
          record.testingStatus !== IndicatorTestingStatus.Done &&
          record.testingStatus !== IndicatorTestingStatus.Cancelled &&
          !!onUploadIndicatorImages;

        return (
          <IndicatorImageCell
            images={record.images || []}
            canUpload={canUpload}
            maxImages={5}
            onUpload={
              canUpload && onUploadIndicatorImages
                ? (files) => onUploadIndicatorImages(record.id, files)
                : undefined
            }
            onDelete={onDeleteIndicatorImage}
          />
        );
      },
    },
    {
      title: "Ngày giao việc",
      dataIndex: "assignedDate",
      key: "assignedDate",
      width: 110,
      render: (date: string, record) => {
        // Parent có children -> không hiển thị
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }
        return formatDate(date);
      },
    },
    {
      title: "Ngày thử nghiệm",
      key: "testDate",
      width: 140,
      render: (_, record) => {
        // Parent có children -> không hiển thị
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }

        const isDisabled =
          !canPerformActions ||
          !record.canEdit ||
          record.testingStatus === IndicatorTestingStatus.Done ||
          record.testingStatus === IndicatorTestingStatus.Cancelled;

        const disabledDate =
          record.testingStatus === IndicatorTestingStatus.Rejected ||
          record.testingStatus === IndicatorTestingStatus.PendingApproval
            ? (current: dayjs.Dayjs) =>
                current && current < dayjs().startOf("day")
            : undefined;

        const currentTestDate = editedResults.get(record.id)?.testDate;
        const dateValue = currentTestDate ? dayjs(currentTestDate) : null;

        return (
          <DatePicker
            value={dateValue}
            onChange={(date) => handleTestDateChange(record.id, date)}
            disabled={isDisabled}
            disabledDate={disabledDate}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
            style={{ width: "100%" }}
          />
        );
      },
    },
    {
      title: "Ngày gửi KQ",
      dataIndex: "submitDate",
      key: "submitDate",
      width: 110,
      render: (date: string, record) => {
        // Parent có children -> không hiển thị
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }
        return formatDate(date);
      },
    },
    {
      title: "Trạng thái",
      key: "testingStatus",
      width: 130,
      render: (_, record) => {
        // Parent có children -> không hiển thị status
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }
        return getTestingStatusTag(record.testingStatus);
      },
    },
    {
      title: "Lý do từ chối",
      key: "rejectionReason",
      width: 180,
      render: (_, record) => {
        // Parent có children -> không hiển thị
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }

        const hasHistory = record.rejectionHistoryCount > 0;
        const latestReason = record.latestRejectionReason;

        if (!hasHistory && !latestReason) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            {latestReason && (
              <Tooltip title={latestReason}>
                <Text
                  type="danger"
                  ellipsis
                  style={{ maxWidth: 150, display: "block" }}
                >
                  {latestReason}
                </Text>
              </Tooltip>
            )}
            {hasHistory && (
              <Button
                type="link"
                size="small"
                icon={<HistoryOutlined />}
                onClick={() =>
                  onShowRejectionHistory(record.id, record.indicatorName || "")
                }
                style={{ padding: 0, height: "auto" }}
              >
                Xem lịch sử ({record.rejectionHistoryCount})
              </Button>
            )}
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_, record) => {
        // Parent có children -> không hiển thị actions
        if (record._isParentWithChildren) {
          return <Text type="secondary">-</Text>;
        }

        if (!canPerformActions) {
          return <Text type="secondary">-</Text>;
        }

        const status = record.testingStatus;
        const currentResult =
          editedResults.get(record.id)?.result ?? record.result;
        const hasResult = currentResult && currentResult.trim() !== "";
        const currentTestDate = editedResults.get(record.id)?.testDate;
        const hasTestDate = !!currentTestDate;

        const canSubmit =
          (status === IndicatorTestingStatus.Todo ||
            status === IndicatorTestingStatus.Testing ||
            status === IndicatorTestingStatus.Rejected ||
            status === IndicatorTestingStatus.PendingApproval) &&
          hasResult &&
          hasTestDate;

        if (
          status === IndicatorTestingStatus.Done ||
          status === IndicatorTestingStatus.Cancelled ||
          status === IndicatorTestingStatus.CannotTest
        ) {
          return <Text type="secondary">-</Text>;
        }

        const canMarkCannotTest =
          status === IndicatorTestingStatus.Todo ||
          status === IndicatorTestingStatus.Testing ||
          status === IndicatorTestingStatus.Rejected ||
          status === IndicatorTestingStatus.PendingApproval;

        return (
          <Space size={4}>
            {canSubmit && onSubmitIndicator && (
              <Tooltip
                title={
                  status === IndicatorTestingStatus.PendingApproval
                    ? "Gửi lại kết quả cho QLKT duyệt"
                    : "Gửi kết quả cho QLKT duyệt"
                }
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubmitIndicator(record.id);
                  }}
                  disabled={submitting}
                >
                  {status === IndicatorTestingStatus.PendingApproval
                    ? "Gửi lại"
                    : "Gửi duyệt"}
                </Button>
              </Tooltip>
            )}
            {canMarkCannotTest && onShowCannotTestModal && (
              <Tooltip title="Báo không thể thử nghiệm">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowCannotTestModal(
                      record.id,
                      record.indicatorName || "",
                    );
                  }}
                  disabled={submitting}
                />
              </Tooltip>
            )}
            {!hasResult && !canSubmit && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Nhập KQ để gửi
              </Text>
            )}
            {hasResult && !hasTestDate && !canSubmit && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chọn ngày TN
              </Text>
            )}
          </Space>
        );
      },
    },
  ];

  // Check if indicator is overdue
  const isOverdue = (record: ProcessedIndicator): boolean => {
    if (record._isParentWithChildren) return false; // Parent row không check overdue
    if (!record.assignedDate) return false;

    if (
      record.testingStatus === IndicatorTestingStatus.Done ||
      record.testingStatus === IndicatorTestingStatus.PendingApproval ||
      record.testingStatus === IndicatorTestingStatus.Cancelled
    ) {
      return false;
    }

    const assignedDate = dayjs(record.assignedDate).startOf("day");
    const currentDate = dayjs().startOf("day");
    return currentDate.diff(assignedDate, "day") > 1;
  };

  // Check if indicator has no result yet
  const hasNoResult = (record: ProcessedIndicator): boolean => {
    if (record._isParentWithChildren) return false; // Parent row không check

    if (
      record.testingStatus === IndicatorTestingStatus.Done ||
      record.testingStatus === IndicatorTestingStatus.PendingApproval ||
      record.testingStatus === IndicatorTestingStatus.Cancelled ||
      record.testingStatus === IndicatorTestingStatus.CannotTest
    ) {
      return false;
    }

    const editedResult = editedResults.get(record.id)?.result;
    const currentResult = editedResult ?? record.result;
    return !currentResult || currentResult.trim() === "";
  };

  // Row class name for styling
  const getRowClassName = (record: ProcessedIndicator) => {
    const classes: string[] = [];

    // Parent với children -> background xám nhạt
    if (record._isParentWithChildren) {
      classes.push("parent-indicator-row");
    }

    // Sub-indicator -> thụt lề nhẹ
    if (record._isSubIndicator) {
      classes.push("sub-indicator-row");
    }

    // Highlight cho overdue/no-result/urgent (chỉ cho non-parent rows)
    if (!record._isParentWithChildren) {
      if (isOverdue(record)) {
        classes.push("overdue-indicator-row");
      } else if (hasNoResult(record)) {
        classes.push("no-result-indicator-row");
      } else if (
        isUrgent &&
        record.testingStatus !== IndicatorTestingStatus.Done
      ) {
        classes.push("urgent-indicator-row");
      }
    }

    return classes.join(" ");
  };

  return (
    <div className="indicator-edit-table-wrapper">
      <style>
        {`
          /* Tree line styles for sub-indicators (giống TaskManagement) */
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
          .parent-indicator-row:hover > td {
            background-color: #e8e8e8 !important;
          }
          .parent-indicator-row:hover > td.ant-table-cell-fix-left,
          .parent-indicator-row:hover > td.ant-table-cell-fix-right {
            background-color: #e8e8e8 !important;
          }

          /* Sub-indicator row */
          .sub-indicator-row > td {
            background-color: #fafafa !important;
          }
          .sub-indicator-row > td.ant-table-cell-fix-left,
          .sub-indicator-row > td.ant-table-cell-fix-right {
            background-color: #fafafa !important;
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

          /* Overdue indicator - quá hạn (đỏ đậm hơn) */
          .overdue-indicator-row > td {
            background-color: #ffccc7 !important;
          }
          .overdue-indicator-row > td.ant-table-cell-fix-left,
          .overdue-indicator-row > td.ant-table-cell-fix-right {
            background-color: #ffccc7 !important;
          }
          .overdue-indicator-row:hover > td {
            background-color: #ffa39e !important;
          }
          .overdue-indicator-row:hover > td.ant-table-cell-fix-left,
          .overdue-indicator-row:hover > td.ant-table-cell-fix-right {
            background-color: #ffa39e !important;
          }
          /* No result indicator - chưa nhập kết quả (đỏ nhạt) */
          .no-result-indicator-row > td {
            background-color: #fff2f0 !important;
          }
          .no-result-indicator-row > td.ant-table-cell-fix-left,
          .no-result-indicator-row > td.ant-table-cell-fix-right {
            background-color: #fff2f0 !important;
          }
          .no-result-indicator-row:hover > td {
            background-color: #ffebe8 !important;
          }
          .no-result-indicator-row:hover > td.ant-table-cell-fix-left,
          .no-result-indicator-row:hover > td.ant-table-cell-fix-right {
            background-color: #ffebe8 !important;
          }
          /* Urgent indicator - gấp (đỏ nhạt) */
          .urgent-indicator-row > td {
            background-color: #fff2f0 !important;
          }
          .urgent-indicator-row > td.ant-table-cell-fix-left,
          .urgent-indicator-row > td.ant-table-cell-fix-right {
            background-color: #fff2f0 !important;
          }
          .urgent-indicator-row:hover > td {
            background-color: #ffebe8 !important;
          }
          .urgent-indicator-row:hover > td.ant-table-cell-fix-left,
          .urgent-indicator-row:hover > td.ant-table-cell-fix-right {
            background-color: #ffebe8 !important;
          }
        `}
      </style>
      <Table
        columns={columns}
        dataSource={sortedIndicators}
        rowKey="_rowKey"
        pagination={false}
        scroll={{ x: 2340 }}
        size="small"
        rowClassName={getRowClassName}
      />
    </div>
  );
};

export default IndicatorEditTable;
