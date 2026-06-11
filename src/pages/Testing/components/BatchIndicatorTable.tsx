import React, { useState, useCallback, useRef, useMemo, memo } from "react";
import {
  Table,
  AutoComplete,
  DatePicker,
  Tag,
  Checkbox,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { TestBatchItemDto } from "../../../types/testBatch";
import testBatchService from "../../../services/testBatchService";
import dayjs from "dayjs";

export type EditedValuesMap = Map<string, { result?: string; testDate?: string }>;

interface Props {
  batchId: string;
  items: TestBatchItemDto[];
  canEdit: boolean;
  onSaved: () => void;
  selectedItemIds: string[];
  onSelectionChange: (ids: string[]) => void;
  editedValuesRef?: React.MutableRefObject<EditedValuesMap>;
}

const getItemStatus = (item: TestBatchItemDto) => {
  if (item.isExternallyCompleted) return { label: "Ngoài", color: "orange" };
  if (item.rejectionReason) return { label: "Từ chối", color: "red" };
  if (item.isSubmitted) return { label: "Đã gửi", color: "green" };
  if (item.result) return { label: "Chờ gửi", color: "blue" };
  return { label: "Cần làm", color: "default" as const };
};

interface ResultCellProps {
  itemId: string;
  batchId: string;
  initialValue: string;
  disabled: boolean;
  getEditedValues: () => Map<string, { result?: string; testDate?: string }>;
}

const ResultCell = memo<ResultCellProps>(({ itemId, batchId, initialValue, disabled, getEditedValues }) => {
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
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi lưu kết quả");
    }
  }, [itemId, batchId, value, initialValue, getEditedValues]);

  return (
    <AutoComplete
      value={value}
      onChange={setValue}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={disabled ? "-" : "Nhập KQ"}
      style={{ width: "100%" }}
    />
  );
});

interface DateCellProps {
  itemId: string;
  batchId: string;
  initialValue: string | undefined;
  disabled: boolean;
  getEditedValues: () => Map<string, { result?: string; testDate?: string }>;
}

const DateCell = memo<DateCellProps>(({ itemId, batchId, initialValue, disabled, getEditedValues }) => {
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
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Lỗi lưu kết quả");
    }
  }, [itemId, batchId, getEditedValues]);

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
}) => {
  const internalRef = useRef<EditedValuesMap>(new Map());
  const editedRef = editedValuesRef || internalRef;
  const getEditedValues = useCallback(() => editedRef.current, [editedRef]);

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
        const isDisabled = !canEdit || item.isSubmitted || item.isExternallyCompleted;
        return (
          <ResultCell
            itemId={item.id}
            batchId={batchId}
            initialValue={item.result ?? ""}
            disabled={isDisabled}
            getEditedValues={getEditedValues}
          />
        );
      },
    },
    {
      title: "Ngày thử nghiệm",
      key: "testDate",
      width: 150,
      render: (_: unknown, item: TestBatchItemDto) => {
        const isDisabled = !canEdit || item.isSubmitted || item.isExternallyCompleted;
        return (
          <DateCell
            itemId={item.id}
            batchId={batchId}
            initialValue={item.testDate}
            disabled={isDisabled}
            getEditedValues={getEditedValues}
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
      render: (_: unknown, item: TestBatchItemDto) => {
        const s = getItemStatus(item);
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: "Lý do từ chối",
      dataIndex: "rejectionReason",
      width: 160,
      ellipsis: true,
      render: (val: string) => val || "-",
    },
  ];
  }, [batchId, canEdit, getEditedValues, selectedItemIds, items, onSelectionChange]);

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

export default BatchIndicatorTable;
