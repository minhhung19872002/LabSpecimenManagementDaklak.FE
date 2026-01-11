import React, { useState, useEffect } from "react";
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
  onSaveIndicator: (indicatorId: string, result?: SaveIndicatorResultDto) => void;
  onSubmitIndicator?: (indicatorId: string) => void;
  onUploadIndicatorImages?: (indicatorId: string, files: File[]) => Promise<IndicatorImageDto[]>;
  onDeleteIndicatorImage?: (imageId: string) => Promise<void>;
}

const IndicatorEditTable: React.FC<IndicatorEditTableProps> = ({
  indicators,
  selectedIndicatorIds,
  isUrgent = false,
  submitting = false,
  resultOptions = [],
  canPerformActions = true,
  onResultsChange,
  onSelectionChange,
  onShowRejectionHistory,
  onSaveIndicator,
  onSubmitIndicator,
  onUploadIndicatorImages,
  onDeleteIndicatorImage,
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

  const handleFieldChange = (
    indicatorId: string,
    field: keyof SaveIndicatorResultDto,
    value: string | undefined
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
    date: dayjs.Dayjs | null
  ) => {
    const dateStr = date ? date.format("YYYY-MM-DD") : undefined;

    // Build the updated result with new testDate
    const current = editedResults.get(indicatorId) || {
      indicatorId,
      methodId: undefined,
      unit: undefined,
      result: undefined,
      testDate: undefined,
    };
    const updatedResult: SaveIndicatorResultDto = { ...current, testDate: dateStr };

    // Update local state
    const newResults = new Map(editedResults);
    newResults.set(indicatorId, updatedResult);
    setEditedResults(newResults);

    // Notify parent of changes
    onResultsChange(Array.from(newResults.values()));

    // Auto-save with the new value directly (don't rely on state)
    onSaveIndicator(indicatorId, updatedResult);
  };

  // Handle checkbox selection
  const handleCheckboxChange = (indicatorId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIndicatorIds, indicatorId]);
    } else {
      onSelectionChange(
        selectedIndicatorIds.filter((id) => id !== indicatorId)
      );
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all indicators that are not Done, PendingApproval, or Cancelled
      const selectableIds = indicators
        .filter(
          (ind) =>
            ind.testingStatus !== IndicatorTestingStatus.Done &&
            ind.testingStatus !== IndicatorTestingStatus.PendingApproval &&
            ind.testingStatus !== IndicatorTestingStatus.Cancelled
        )
        .map((ind) => ind.id);
      onSelectionChange(selectableIds);
    } else {
      onSelectionChange([]);
    }
  };

  // Check if indicator can be selected (not Done, PendingApproval, or Cancelled)
  const canSelectIndicator = (indicator: TestingIndicatorDto) => {
    return (
      indicator.testingStatus !== IndicatorTestingStatus.Done &&
      indicator.testingStatus !== IndicatorTestingStatus.PendingApproval &&
      indicator.testingStatus !== IndicatorTestingStatus.Cancelled
    );
  };

  // Check if all selectable are selected
  const selectableIndicators = indicators.filter(canSelectIndicator);
  const allSelected =
    selectableIndicators.length > 0 &&
    selectableIndicators.every((ind) => selectedIndicatorIds.includes(ind.id));
  const someSelected = selectableIndicators.some((ind) =>
    selectedIndicatorIds.includes(ind.id)
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
    };

    return (
      <StatusTag color={color} icon={iconMap[status]}>
        {label}
      </StatusTag>
    );
  };

  const columns: ColumnsType<TestingIndicatorDto> = [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
          disabled={selectableIndicators.length === 0}
        />
      ),
      key: "select",
      width: 40,
      fixed: "left" as const,
      render: (_, record) => {
        // Disable checkbox cho chỉ tiêu đã Done hoặc đang chờ duyệt
        const isDisabled = !canSelectIndicator(record);
        return (
          <Checkbox
            checked={selectedIndicatorIds.includes(record.id)}
            onChange={(e) => handleCheckboxChange(record.id, e.target.checked)}
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
      render: (value: string) => value || "-",
    },
    {
      title: "Phương pháp",
      dataIndex: "methodName",
      key: "method",
      width: 180,
      render: (value: string) => value || <Text type="secondary">-</Text>,
    },
    {
      title: "ĐVT",
      key: "unit",
      width: 100,
      render: (_, record) => {
        // ĐVT lấy từ phương pháp thử, không cho sửa
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
      render: (value: string | undefined) => (
        <Tooltip title={value}>
          <Text ellipsis style={{ maxWidth: 140 }}>
            {value || <Text type="secondary">-</Text>}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Giới hạn",
      key: "allowedLimit",
      width: 120,
      render: (_, record) => {
        // Hiển thị giới hạn với ký hiệu so sánh nếu có (giống TaskManagement)
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
      width: 120,
      render: (_, record) => {
        const currentValue =
          editedResults.get(record.id)?.result ?? record.result ?? "";
        // Cho phép nhập kết quả khi:
        // - Có quyền từ Permission Matrix (canPerformActions)
        // - Có quyền edit từ server (canEdit)
        // - Trạng thái = Todo, Testing hoặc Rejected (cho phép nhập ngay, không cần check-in)

        const isDisabled =
          !canPerformActions ||
          !record.canEdit ||
          (record.testingStatus !== IndicatorTestingStatus.Todo &&
            record.testingStatus !== IndicatorTestingStatus.Testing &&
            record.testingStatus !== IndicatorTestingStatus.Rejected);

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
        // Cho phép upload khi có quyền + trạng thái = Todo, Testing hoặc Rejected
        const canUpload =
          canPerformActions &&
          record.canEdit &&
          (record.testingStatus === IndicatorTestingStatus.Todo ||
            record.testingStatus === IndicatorTestingStatus.Testing ||
            record.testingStatus === IndicatorTestingStatus.Rejected) &&
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
      render: (date: string) => formatDate(date),
    },
    {
      title: "Ngày thử nghiệm",
      key: "testDate",
      width: 140,
      render: (_, record) => {
        // Chỉ cho chọn ngày khi có quyền thao tác và trạng thái cho phép
        const isDisabled =
          !canPerformActions ||
          !record.canEdit ||
          record.testingStatus === IndicatorTestingStatus.Done ||
          record.testingStatus === IndicatorTestingStatus.PendingApproval ||
          record.testingStatus === IndicatorTestingStatus.Cancelled;

        // Nếu indicator bị từ chối, không cho chọn ngày trước hôm nay
        const disabledDate =
          record.testingStatus === IndicatorTestingStatus.Rejected
            ? (current: dayjs.Dayjs) =>
                current && current < dayjs().startOf("day")
            : undefined;

        // Lấy giá trị testDate từ editedResults hoặc từ record
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
      render: (date: string) => formatDate(date),
    },
    {
      title: "Trạng thái",
      key: "testingStatus",
      width: 130,
      render: (_, record) => getTestingStatusTag(record.testingStatus),
    },
    {
      title: "Lý do từ chối",
      key: "rejectionReason",
      width: 180,
      render: (_, record) => {
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
        // Nếu không có quyền thao tác, hiện dấu "-"
        if (!canPerformActions) {
          return <Text type="secondary">-</Text>;
        }

        const status = record.testingStatus;
        const currentResult =
          editedResults.get(record.id)?.result ?? record.result;
        const hasResult = currentResult && currentResult.trim() !== "";
        const currentTestDate = editedResults.get(record.id)?.testDate;
        const hasTestDate = !!currentTestDate;

        // Có thể gửi duyệt khi: có kết quả + có ngày thử nghiệm + trạng thái cho phép
        const canSubmit =
          (status === IndicatorTestingStatus.Todo ||
            status === IndicatorTestingStatus.Testing ||
            status === IndicatorTestingStatus.Rejected) &&
          hasResult &&
          hasTestDate;

        // Không hiện gì nếu đã Done, PendingApproval, hoặc Cancelled
        if (
          status === IndicatorTestingStatus.Done ||
          status === IndicatorTestingStatus.PendingApproval ||
          status === IndicatorTestingStatus.Cancelled
        ) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Space size={4}>
            {canSubmit && onSubmitIndicator && (
              <Tooltip title="Gửi kết quả cho QLKT duyệt">
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
                  Gửi duyệt
                </Button>
              </Tooltip>
            )}
            {!hasResult && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Nhập KQ để gửi
              </Text>
            )}
            {hasResult && !hasTestDate && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chọn ngày TN
              </Text>
            )}
          </Space>
        );
      },
    },
  ];

  // Sort indicators theo thứ tự ưu tiên trạng thái, sau đó theo id
  // Ưu tiên: Bị từ chối > Chờ phê duyệt > Đang TN > Cần làm > Đã xong > KH hủy
  const getStatusPriority = (status: IndicatorTestingStatus): number => {
    switch (status) {
      case IndicatorTestingStatus.Rejected:
        return 0; // Cao nhất
      case IndicatorTestingStatus.PendingApproval:
        return 1;
      case IndicatorTestingStatus.Testing:
        return 2;
      case IndicatorTestingStatus.Todo:
        return 3;
      case IndicatorTestingStatus.Done:
        return 4;
      case IndicatorTestingStatus.Cancelled:
        return 5; // Thấp nhất - KH hủy hiển thị cuối cùng
      default:
        return 6;
    }
  };

  const sortedIndicators = [...indicators].sort((a, b) => {
    const priorityA = getStatusPriority(a.testingStatus);
    const priorityB = getStatusPriority(b.testingStatus);

    // Nếu cùng priority thì sort theo id
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.id.localeCompare(b.id);
  });

  // Row class name for urgent highlighting
  const getRowClassName = (record: TestingIndicatorDto) => {
    if (isUrgent && record.testingStatus !== IndicatorTestingStatus.Done) {
      return "urgent-indicator-row";
    }
    return "";
  };

  return (
    <div>
      <style>
        {`
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
        rowKey="id"
        pagination={false}
        scroll={{ x: 2270 }}
        size="small"
        rowClassName={getRowClassName}
      />
    </div>
  );
};

export default IndicatorEditTable;
