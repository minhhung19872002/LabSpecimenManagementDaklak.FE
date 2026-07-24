import React, { useState, useCallback, useRef, useMemo, useEffect, memo } from "react";
import {
  Table,
  AutoComplete,
  DatePicker,
  Tag,
  Checkbox,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  TestBatchItemDto,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
} from "../../../types/testBatch";
import { IndicatorApprovalStatus } from "../../../types/laboratoryTask";
import testBatchService from "../../../services/testBatchService";
import dayjs from "dayjs";

export type EditedValuesMap = Map<string, { result?: string; testDate?: string }>;

interface ResultOption {
  value: string;
  label: string;
}

interface Props {
  batchId: string;
  items: TestBatchItemDto[];
  canEdit: boolean;
  selectedItemIds: string[];
  onSelectionChange: (ids: string[]) => void;
  editedValuesRef?: React.MutableRefObject<EditedValuesMap>;
  resultOptions?: ResultOption[];
  onResultSaved?: () => void;
}

const getItemStatus = (item: TestBatchItemDto, overrides?: { result?: string; testDate?: string }) => {
  const result = overrides?.result ?? item.result;
  const testDate = overrides?.testDate ?? item.testDate;

  if (item.isExternallyCompleted) return { label: "Ngoài", color: "orange" };
  if (item.isSubmitted) {
    return {
      label: IndicatorApprovalStatusLabels[item.approvalStatus] ?? "Đã gửi",
      color: IndicatorApprovalStatusColors[item.approvalStatus] ?? "processing",
    };
  }
  if (item.rejectionReason) return { label: "Từ chối", color: "error" };
  if (result || testDate) return { label: "Đang thử nghiệm", color: "processing" };
  return { label: "Cần làm", color: "default" as const };
};

type StatusUpdater = (field: "result" | "testDate", value: string | undefined) => void;

const StatusCell = memo<{ item: TestBatchItemDto; registerUpdater: (id: string, fn: StatusUpdater) => void }>(
  ({ item, registerUpdater }) => {
    const [overrides, setOverrides] = useState<{ result?: string; testDate?: string }>({});

    useEffect(() => {
      const updater: StatusUpdater = (field, value) => {
        setOverrides((prev) => ({ ...prev, [field]: value }));
      };
      registerUpdater(item.id, updater);
    }, [item.id, registerUpdater]);

    const s = getItemStatus(item, overrides);
    return <Tag color={s.color}>{s.label}</Tag>;
  },
);

interface ResultCellProps {
  itemId: string;
  batchId: string;
  initialValue: string;
  disabled: boolean;
  getEditedValues: () => Map<string, { result?: string; testDate?: string }>;
  options?: ResultOption[];
  onCellSaved?: (itemId: string, field: "result" | "testDate", value: string | undefined) => void;
}

const ResultCell = memo<ResultCellProps>(({ itemId, batchId, initialValue, disabled, getEditedValues, options, onCellSaved }) => {
  const [value, setValue] = useState(initialValue);

  const handleBlur = useCallback(async () => {
    if (value === initialValue) return;

    const map = getEditedValues();
    const existing = map.get(itemId) || {};
    map.set(itemId, { ...existing, result: value });

    try {
      await testBatchService.saveResults(batchId, {
        items: [{
          itemId,
          result: value || undefined,
          testDate: existing.testDate || undefined,
        }],
      });
      onCellSaved?.(itemId, "result", value || undefined);
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi lưu kết quả");
    }
  }, [itemId, batchId, value, initialValue, getEditedValues, onCellSaved]);

  return (
    <AutoComplete
      value={value}
      options={options}
      onChange={setValue}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={disabled ? "-" : "Nhập KQ"}
      style={{
        width: "100%",
        backgroundColor: disabled ? "#f5f5f5" : undefined,
      }}
      filterOption={(inputValue, option) =>
        option?.value.toUpperCase().includes(inputValue.toUpperCase()) ?? false
      }
    />
  );
});

interface DateCellProps {
  itemId: string;
  batchId: string;
  initialValue: string | undefined;
  disabled: boolean;
  getEditedValues: () => Map<string, { result?: string; testDate?: string }>;
  onCellSaved?: (itemId: string, field: "result" | "testDate", value: string | undefined) => void;
}

const DateCell = memo<DateCellProps>(({ itemId, batchId, initialValue, disabled, getEditedValues, onCellSaved }) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback(async (date: dayjs.Dayjs | null) => {
    const dateStr = date?.toISOString();
    setValue(dateStr);

    const map = getEditedValues();
    const existing = map.get(itemId) || {};
    map.set(itemId, { ...existing, testDate: dateStr });

    try {
      await testBatchService.saveResults(batchId, {
        items: [{
          itemId,
          result: existing.result || undefined,
          testDate: dateStr || undefined,
        }],
      });
      onCellSaved?.(itemId, "testDate", dateStr);
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi lưu kết quả");
    }
  }, [itemId, batchId, getEditedValues, onCellSaved]);

  const dateValue = value ? dayjs(value) : null;

  return (
    <DatePicker
      value={dateValue}
      onChange={handleChange}
      disabled={disabled}
      format="DD/MM/YYYY"
      placeholder="Chọn ngày"
      style={{ width: "100%" }}
    />
  );
});

const BatchIndicatorTable: React.FC<Props> = ({
  batchId,
  items,
  canEdit,
  selectedItemIds,
  onSelectionChange,
  editedValuesRef,
  resultOptions,
  onResultSaved,
}) => {
  const internalRef = useRef<EditedValuesMap>(new Map());
  const editedRef = editedValuesRef || internalRef;
  const getEditedValues = useCallback(() => editedRef.current, [editedRef]);

  const statusUpdatersRef = useRef(new Map<string, StatusUpdater>());

  const registerUpdater = useCallback((id: string, fn: StatusUpdater) => {
    statusUpdatersRef.current.set(id, fn);
  }, []);

  const handleCellSaved = useCallback((itemId: string, field: "result" | "testDate", value: string | undefined) => {
    statusUpdatersRef.current.get(itemId)?.(field, value);
    onResultSaved?.();
  }, [onResultSaved]);

  const columns: ColumnsType<TestBatchItemDto> = useMemo(() => {
    const canSelectItem = (item: TestBatchItemDto) =>
      !item.isSubmitted && !item.isExternallyCompleted;
    const selectableItems = items.filter(canSelectItem);
    const allSelected =
      selectableItems.length > 0 &&
      selectableItems.every((i) => selectedItemIds.includes(i.id));
    const someSelected = selectableItems.some((i) =>
      selectedItemIds.includes(i.id),
    );

    return [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onChange={(e) => {
            if (e.target.checked) {
              onSelectionChange(selectableItems.map((i) => i.id));
            } else {
              onSelectionChange([]);
            }
          }}
          disabled={!canEdit || selectableItems.length === 0}
        />
      ),
      key: "select",
      width: 40,
      fixed: "left" as const,
      render: (_: unknown, item: TestBatchItemDto) => {
        const selectable = canSelectItem(item);
        return (
          <Checkbox
            checked={selectedItemIds.includes(item.id)}
            onChange={(e) => {
              if (e.target.checked) {
                onSelectionChange([...selectedItemIds, item.id]);
              } else {
                onSelectionChange(selectedItemIds.filter((id) => id !== item.id));
              }
            }}
            disabled={!canEdit || !selectable}
          />
        );
      },
    },
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      width: 160,
      ellipsis: true,
    },
    {
      title: "Phương pháp",
      dataIndex: "methodName",
      width: 160,
      ellipsis: true,
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      width: 80,
      ellipsis: true,
    },
    {
      title: "Kết quả",
      key: "result",
      width: 180,
      render: (_: unknown, item: TestBatchItemDto) => {
        const isDisabled = !canEdit || item.isSubmitted || item.isExternallyCompleted
          || item.approvalStatus === IndicatorApprovalStatus.CustomerCancelled
          || item.approvalStatus === IndicatorApprovalStatus.MethodChangeRequested
          || item.approvalStatus === IndicatorApprovalStatus.TestingRejected
          || item.approvalStatus === IndicatorApprovalStatus.CannotTest
          || item.approvalStatus === IndicatorApprovalStatus.SupplementaryRequested;
        return (
          <ResultCell
            itemId={item.id}
            batchId={batchId}
            initialValue={item.result ?? ""}
            disabled={isDisabled}
            getEditedValues={getEditedValues}
            options={resultOptions}
            onCellSaved={handleCellSaved}
          />
        );
      },
    },
    {
      title: "Ngày thử nghiệm",
      key: "testDate",
      width: 150,
      render: (_: unknown, item: TestBatchItemDto) => {
        const isDisabled = !canEdit || item.isSubmitted || item.isExternallyCompleted
          || item.approvalStatus === IndicatorApprovalStatus.CustomerCancelled
          || item.approvalStatus === IndicatorApprovalStatus.MethodChangeRequested
          || item.approvalStatus === IndicatorApprovalStatus.TestingRejected
          || item.approvalStatus === IndicatorApprovalStatus.CannotTest
          || item.approvalStatus === IndicatorApprovalStatus.SupplementaryRequested;
        return (
          <DateCell
            itemId={item.id}
            batchId={batchId}
            initialValue={item.testDate}
            disabled={isDisabled}
            getEditedValues={getEditedValues}
            onCellSaved={handleCellSaved}
          />
        );
      },
    },
    {
      title: "Ngày gửi KQ",
      key: "submitDate",
      width: 110,
      render: (_: unknown, item: TestBatchItemDto) =>
        item.submitDate ? dayjs(item.submitDate).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 100,
      align: "center" as const,
      render: (_: unknown, item: TestBatchItemDto) => (
        <StatusCell item={item} registerUpdater={registerUpdater} />
      ),
    },
    {
      title: "Lý do từ chối",
      dataIndex: "rejectionReason",
      width: 160,
      ellipsis: true,
      render: (val: string) => val || "-",
    },
  ];
  }, [batchId, canEdit, getEditedValues, selectedItemIds, items, onSelectionChange, resultOptions, handleCellSaved, registerUpdater]);

  return (
    <div className="batch-indicator-table" style={{ overflow: "hidden" }}>
      <Table
        columns={columns}
        dataSource={items}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 1140, y: 450 }}
      />
    </div>
  );
};

export default React.memo(BatchIndicatorTable);
