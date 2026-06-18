import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Table, Input, Select, Tag, Row, Col, Pagination, DatePicker } from 'antd';
import { SearchOutlined, SortAscendingOutlined } from '@ant-design/icons';
import ResponsiveSelect from '../../../components/common/ResponsiveSelect';
import type { ColumnOption } from '../../../components/common';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSampleAssignmentLogForLab } from '../hooks/useSampleAssignmentLogForLab';
import { SampleAssignmentLogDto } from '../../../types/qualityManagement';
import {
  TestRequestStatus,
} from '../../../types/testRequest';
import {
  IndicatorApprovalStatus,
  QLKTDisplayStatus,
  QLKTDisplayStatusLabels,
  QLKTDisplayStatusColors,
} from '../../../types/laboratoryTask';

import { useHeaderHeight } from '../../../hooks';
import '../../QualityManagement/components/SampleAssignmentLogTab.css';

const { RangePicker } = DatePicker;

// Helper to format date
const formatDate = (date?: string) => {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY');
};

const getDateKey = (date?: string): string => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
};

// Process data to add rowSpan info for contract, sample-level columns, date columns, and personnel columns
interface ProcessedLogItem extends SampleAssignmentLogDto {
  contractRowSpan: number;
  sampleRowSpan: number;
  transferDateRowSpan: number;
  requestCompletionDateRowSpan: number;
  testDateRowSpan: number;
  technicalManagerRowSpan: number;
  technicianRowSpan: number;
  entryDateRowSpan: number;
  qlktApprovalDateRowSpan: number;
  _rowKey: string;
  _rowIndex: number;
  _contractGroupStart: number;
  _contractGroupEnd: number;
}

const processDataForRowSpan = (data: SampleAssignmentLogDto[]): ProcessedLogItem[] => {
  if (data.length === 0) return [];

  const result: ProcessedLogItem[] = new Array(data.length);

  // Pre-compute date keys once — avoids repeated dayjs() calls during span calculation
  const dateKeys = data.map(item => ({
    transferDate: getDateKey(item.transferDate),
    requestCompletionDate: getDateKey(item.requestCompletionDate),
    testDate: getDateKey(item.testDate),
    entryDate: getDateKey(item.entryDate),
    qlktApprovalDate: getDateKey(item.qlktApprovalDate),
  }));

  // Calculate contract groups (start and end indices for each contract group)
  const contractGroups: { start: number; end: number }[] = [];
  let i = 0;
  while (i < data.length) {
    const currentContract = data[i].contractNumber || '';
    let j = i + 1;
    while (j < data.length && (data[j].contractNumber || '') === currentContract) {
      j++;
    }
    contractGroups.push({ start: i, end: j - 1 });
    i = j;
  }

  // Helper: calculate consecutive spans for a field within contract boundaries
  const calculateFieldSpansWithinContract = (
    fieldGetter: (item: SampleAssignmentLogDto) => string
  ): number[] => {
    const spans: number[] = new Array(data.length).fill(1);
    for (const group of contractGroups) {
      let idx = group.start;
      while (idx <= group.end) {
        const currentValue = fieldGetter(data[idx]);
        let spanCount = 1;
        while (
          idx + spanCount <= group.end &&
          fieldGetter(data[idx + spanCount]) === currentValue
        ) {
          spanCount++;
        }
        spans[idx] = spanCount;
        for (let k = idx + 1; k < idx + spanCount; k++) {
          spans[k] = 0;
        }
        idx += spanCount;
      }
    }
    return spans;
  };

  // Calculate sample spans within each contract group
  const sampleSpans: number[] = new Array(data.length).fill(0);
  for (const group of contractGroups) {
    let si = group.start;
    while (si <= group.end) {
      const currentSampleId = data[si].sampleId;
      let count = 1;
      while (
        si + count <= group.end &&
        data[si + count].sampleId === currentSampleId
      ) {
        count++;
      }
      sampleSpans[si] = count;
      si += count;
    }
  }

  // Calculate personnel spans within contract
  const technicalManagerSpans = calculateFieldSpansWithinContract(
    (item) => item.technicalManagerName || ''
  );
  const technicianSpans = calculateFieldSpansWithinContract(
    (item) => item.technicianName || ''
  );

  // Process each row within its contract group
  for (const group of contractGroups) {
    const contractSpan = group.end - group.start + 1;

    for (let idx = group.start; idx <= group.end; idx++) {
      const currentItem = data[idx];
      const currentKeys = dateKeys[idx];

      // Date forward-looking: within same sample AND same contract group
      const calcDateSpan = (
        fieldName: keyof typeof currentKeys
      ): number => {
        const currentDate = currentKeys[fieldName];
        let span = 1;
        for (
          let k = idx + 1;
          k <= group.end && data[k].sampleId === currentItem.sampleId;
          k++
        ) {
          if (dateKeys[k][fieldName] === currentDate) span++;
          else break;
        }
        return span;
      };

      let transferDateSpan = calcDateSpan('transferDate');
      let requestDateSpan = calcDateSpan('requestCompletionDate');
      let testDateSpan = calcDateSpan('testDate');
      let entryDateSpan = calcDateSpan('entryDate');
      let qlktApprovalDateSpan = calcDateSpan('qlktApprovalDate');

      // Zero-out if previous row in same sample AND same contract has same date
      const isPrevSameSample =
        idx > group.start &&
        data[idx - 1].sampleId === currentItem.sampleId;

      if (isPrevSameSample) {
        const prevKeys = dateKeys[idx - 1];
        if (currentKeys.transferDate === prevKeys.transferDate)
          transferDateSpan = 0;
        if (currentKeys.requestCompletionDate === prevKeys.requestCompletionDate)
          requestDateSpan = 0;
        if (currentKeys.testDate === prevKeys.testDate)
          testDateSpan = 0;
        if (currentKeys.entryDate === prevKeys.entryDate)
          entryDateSpan = 0;
        if (currentKeys.qlktApprovalDate === prevKeys.qlktApprovalDate)
          qlktApprovalDateSpan = 0;
      }

      result[idx] = {
        ...currentItem,
        contractRowSpan: idx === group.start ? contractSpan : 0,
        sampleRowSpan: sampleSpans[idx],
        transferDateRowSpan: transferDateSpan,
        requestCompletionDateRowSpan: requestDateSpan,
        testDateRowSpan: testDateSpan,
        technicalManagerRowSpan: technicalManagerSpans[idx],
        technicianRowSpan: technicianSpans[idx],
        entryDateRowSpan: entryDateSpan,
        qlktApprovalDateRowSpan: qlktApprovalDateSpan,
        _rowKey: `${currentItem.indicatorId}_${idx}`,
        _rowIndex: idx,
        _contractGroupStart: group.start,
        _contractGroupEnd: group.end,
      };
    }
  }

  return result;
};

// Determine row color class based on highlighting rules (Testing page - không check QLCL)
const getRowColorClass = (record: ProcessedLogItem): string => {
  // Skip if report published or completed
  if (record.isReportPublished || record.testRequestStatus === TestRequestStatus.Completed) {
    return '';
  }

  // Skip if QLKT đã duyệt (Hoàn thành trên trang Testing)
  if (record.qlktDisplayStatus === QLKTDisplayStatus.Completed) {
    return '';
  }

  // Yellow: Waiting for result approval (Entered - chờ QLKT duyệt)
  if (record.indicatorApprovalStatus === IndicatorApprovalStatus.Entered) {
    return 'row-yellow';
  }

  // Red: Testing in progress (Cần làm hoặc Đang thử nghiệm)
  if (
    record.qlktDisplayStatus === QLKTDisplayStatus.ToDo ||
    record.qlktDisplayStatus === QLKTDisplayStatus.Testing
  ) {
    return 'row-red';
  }

  return '';
};

export const COLUMN_OPTIONS: ColumnOption[] = [
  { key: 'contractNumber', label: 'Số hợp đồng', disabled: true },
  { key: 'sampleCode', label: 'Mã số mẫu', disabled: true },
  { key: 'sampleName', label: 'Tên mẫu' },
  { key: 'sampleQuantity', label: 'Lượng mẫu gửi' },
  { key: 'sampleStatusText', label: 'Tình trạng mẫu' },
  { key: 'transferDate', label: 'Ngày chuyển' },
  { key: 'requestCompletionDate', label: 'Ngày YC xong' },
  { key: 'testDate', label: 'Thời gian TN' },
  { key: 'indicatorName', label: 'Tên chỉ tiêu' },
  { key: 'methodName', label: 'Phương pháp' },
  { key: 'unit', label: 'ĐVT' },
  { key: 'result', label: 'Kết quả' },
  { key: 'technicalManagerName', label: 'QL kỹ thuật' },
  { key: 'technicianName', label: 'Kỹ thuật viên' },
  { key: 'entryDate', label: 'Ngày nhập' },
  { key: 'qlktApprovalDate', label: 'Ngày QL duyệt' },
  { key: 'qlktDisplayStatus', label: 'Tình trạng' },
];
export const ALL_COLUMN_KEYS = COLUMN_OPTIONS.map((c) => c.key);

interface LabSampleAssignmentLogTabProps {
  displayStatusFilter?: QLKTDisplayStatus;
  visibleColumns?: string[];
}

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  contractNumber: 130,
  sampleCode: 120,
  sampleName: 150,
  sampleQuantity: 100,
  sampleStatusText: 120,
  transferDate: 100,
  requestCompletionDate: 100,
  testDate: 100,
  indicatorName: 180,
  methodName: 150,
  unit: 80,
  result: 100,
  technicalManagerName: 130,
  technicianName: 130,
  entryDate: 100,
  qlktApprovalDate: 100,
  qlktDisplayStatus: 150,
};

const LabSampleAssignmentLogTab: React.FC<LabSampleAssignmentLogTabProps> = ({
  displayStatusFilter,
  visibleColumns = ALL_COLUMN_KEYS,
}) => {
  const headerHeight = useHeaderHeight();

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(DEFAULT_COLUMN_WIDTHS);
  const columnWidthsRef = useRef(columnWidths);
  columnWidthsRef.current = columnWidths;

  const handleResizeStart = useCallback((e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidthsRef.current[colKey] || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [colKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const ResizableTitle = useCallback(({ width, columnKey, children, ...restProps }: any) => {
    if (!width) {
      return <th {...restProps}>{children}</th>;
    }
    return (
      <th {...restProps} style={{ ...restProps.style, position: 'relative' }}>
        {children}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 8,
            cursor: 'col-resize',
            zIndex: 1,
          }}
          onMouseDown={(e) => handleResizeStart(e, columnKey)}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              position: 'absolute',
              right: 3,
              top: '30%',
              bottom: '30%',
              width: 2,
              background: '#d9d9d9',
              borderRadius: 1,
            }}
          />
        </div>
      </th>
    );
  }, [handleResizeStart]);
  const {
    loading,
    data,
    searchText,
    sorting,
    dateRange,
    selectedIndicatorIds,
    indicators,
    technicianFilter,
    technicians,
    loadingTechnicians,
    pagination,
    handleSearch,
    handleSearchInputChange,
    handleSortChange,
    handleDateRangeChange,
    handleIndicatorChange,
    handleTechnicianFilterChange,
    handleTableChange,
    handleRowDoubleClick,
  } = useSampleAssignmentLogForLab({ displayStatusFilter });

  // Process data for row spanning
  const processedData = useMemo(() => processDataForRowSpan(data), [data]);

  // Count unique contracts in current page for display
  const uniqueContractCount = useMemo(() => {
    const contracts = new Set(data.map((item) => item.contractNumber));
    return contracts.size;
  }, [data]);

  const hoveredRowIndexRef = useRef<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<HTMLElement[]>([]);
  const hoverRafRef = useRef<number>(0);
  const rowElementsRef = useRef<HTMLTableRowElement[]>([]);
  const mergedCellIndexRef = useRef<Map<number, HTMLTableCellElement[]>>(new Map());

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const container = tableContainerRef.current;
      if (!container) return;

      rowElementsRef.current = Array.from(
        container.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-key]')
      );

      const index = new Map<number, HTMLTableCellElement[]>();
      container.querySelectorAll<HTMLTableCellElement>('td[data-row-span]').forEach((td) => {
        const cellIdx = parseInt(td.getAttribute('data-row-idx') || '-1');
        const span = parseInt(td.getAttribute('data-row-span') || '1');
        for (let i = cellIdx; i < cellIdx + span; i++) {
          if (!index.has(i)) index.set(i, []);
          index.get(i)!.push(td);
        }
      });
      mergedCellIndexRef.current = index;
    });
    return () => cancelAnimationFrame(raf);
  }, [processedData]);

  const clearHoverClasses = useCallback(() => {
    cancelAnimationFrame(hoverRafRef.current);
    for (const el of highlightedRef.current) {
      el.classList.remove('row-hover', 'row-in-hover-group', 'cell-hover');
    }
    highlightedRef.current = [];
  }, []);

  const applyHoverClasses = useCallback((rowIndex: number) => {
    cancelAnimationFrame(hoverRafRef.current);
    hoverRafRef.current = requestAnimationFrame(() => {
      const container = tableContainerRef.current;
      if (!container) return;

      clearHoverClasses();

      const record = processedData[rowIndex];
      if (!record) return;

      const rows = rowElementsRef.current;
      if (rows.length === 0) return;

      const start = record._contractGroupStart;
      const end = Math.min(record._contractGroupEnd, rows.length - 1);

      for (let i = start; i <= end; i++) {
        const tr = rows[i];
        if (!tr) continue;
        if (i === rowIndex) {
          tr.classList.add('row-hover');
        } else {
          tr.classList.add('row-in-hover-group');
        }
        highlightedRef.current.push(tr);
      }

      const mergedCells = mergedCellIndexRef.current.get(rowIndex);
      if (mergedCells) {
        for (const td of mergedCells) {
          td.classList.add('cell-hover');
          highlightedRef.current.push(td);
        }
      }
    });
  }, [processedData, clearHoverClasses]);

  const mergedCellProps = useCallback((record: ProcessedLogItem, rowSpan: number) => {
    const props: Record<string, any> = { rowSpan };
    if (rowSpan > 1) {
      props['data-row-idx'] = record._rowIndex;
      props['data-row-span'] = rowSpan;
    }
    return props;
  }, []);

  // Build columns with rowSpan support + dynamic widths from resize
  const columns: ColumnsType<ProcessedLogItem> = useMemo(() => {
    const withResize = (key: string, col: any) => ({
      ...col,
      width: columnWidths[key] || col.width,
      onHeaderCell: () => ({ width: columnWidths[key] || col.width, columnKey: key }),
    });

    return [
      withResize('contractNumber', {
        title: 'Số hợp đồng',
        dataIndex: 'contractNumber',
        key: 'contractNumber',
        fixed: 'left',
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.contractRowSpan),
        render: (text: string) => text || '-',
      }),
      withResize('sampleCode', {
        title: 'Mã số mẫu',
        dataIndex: 'sampleCode',
        key: 'sampleCode',
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.sampleRowSpan),
        render: (text: string) => text || '-',
      }),
      withResize('sampleName', {
        title: 'Tên mẫu',
        dataIndex: 'sampleName',
        key: 'sampleName',
        ellipsis: true,
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.sampleRowSpan),
        render: (text: string) => text || '-',
      }),
      withResize('sampleQuantity', {
        title: 'Lượng mẫu gửi',
        dataIndex: 'sampleQuantity',
        key: 'sampleQuantity',
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.sampleRowSpan),
        render: (text: string) => text || '-',
      }),
      withResize('sampleStatusText', {
        title: 'Tình trạng mẫu',
        dataIndex: 'sampleStatusText',
        key: 'sampleStatusText',
        ellipsis: true,
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.sampleRowSpan),
        render: (text: string) => text || '-',
      }),
      withResize('transferDate', {
        title: 'Ngày chuyển',
        dataIndex: 'transferDate',
        key: 'transferDate',
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.transferDateRowSpan),
        render: (date: string) => formatDate(date),
      }),
      withResize('requestCompletionDate', {
        title: 'Ngày YC xong',
        dataIndex: 'requestCompletionDate',
        key: 'requestCompletionDate',
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.requestCompletionDateRowSpan),
        render: (date: string) => formatDate(date),
      }),
      withResize('testDate', {
        title: 'Thời gian TN',
        dataIndex: 'testDate',
        key: 'testDate',
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.testDateRowSpan),
        render: (date: string) => formatDate(date),
      }),
      withResize('indicatorName', {
        title: 'Tên chỉ tiêu',
        dataIndex: 'indicatorName',
        key: 'indicatorName',
        render: (text: string, record: ProcessedLogItem) => (
          <span
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
            dangerouslySetInnerHTML={{ __html: record.indicatorFormattedName || text || '-' }}
          />
        ),
      }),
      withResize('methodName', {
        title: 'Phương pháp',
        dataIndex: 'methodName',
        key: 'methodName',
        render: (text: string, record: ProcessedLogItem) => (
          <span
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
            dangerouslySetInnerHTML={{ __html: record.methodFormattedName || text || '-' }}
          />
        ),
      }),
      withResize('unit', {
        title: 'ĐVT',
        dataIndex: 'unit',
        key: 'unit',
        render: (text: string) =>
          text ? <span dangerouslySetInnerHTML={{ __html: text }} /> : '-',
      }),
      withResize('result', {
        title: 'Kết quả',
        dataIndex: 'result',
        key: 'result',
        render: (text: string) => <strong>{text || '-'}</strong>,
      }),
      withResize('technicalManagerName', {
        title: 'QL kỹ thuật',
        dataIndex: 'technicalManagerName',
        key: 'technicalManagerName',
        ellipsis: true,
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.technicalManagerRowSpan),
        render: (text: string) => text || '-',
      }),
      withResize('technicianName', {
        title: 'Kỹ thuật viên',
        dataIndex: 'technicianName',
        key: 'technicianName',
        ellipsis: true,
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.technicianRowSpan),
        render: (text: string) => text || '-',
      }),
      withResize('entryDate', {
        title: 'Ngày nhập',
        dataIndex: 'entryDate',
        key: 'entryDate',
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.entryDateRowSpan),
        render: (date: string) => formatDate(date),
      }),
      withResize('qlktApprovalDate', {
        title: 'Ngày QL duyệt',
        dataIndex: 'qlktApprovalDate',
        key: 'qlktApprovalDate',
        onCell: (record: ProcessedLogItem) => mergedCellProps(record, record.qlktApprovalDateRowSpan),
        render: (date: string) => formatDate(date),
      }),
      withResize('qlktDisplayStatus', {
        title: 'Tình trạng',
        dataIndex: 'qlktDisplayStatus',
        key: 'qlktDisplayStatus',
        fixed: 'right',
        render: (status: QLKTDisplayStatus | null | undefined) => {
          const effectiveStatus = status ?? QLKTDisplayStatus.ToDo;
          return (
            <Tag color={QLKTDisplayStatusColors[effectiveStatus] || 'default'}>
              {QLKTDisplayStatusLabels[effectiveStatus]}
            </Tag>
          );
        },
      }),
    ];
  }, [mergedCellProps, columnWidths]);

  const filteredColumns = useMemo(
    () => columns.filter((col) => visibleColumns.includes(col.key as string)),
    [columns, visibleColumns]
  );

  const scrollX = useMemo(
    () => filteredColumns.reduce((sum, col) => sum + ((col.width as number) || 150), 0),
    [filteredColumns]
  );

  const getRowClass = useCallback((record: ProcessedLogItem) => {
    return getRowColorClass(record) || 'row-green';
  }, []);

  const handleRowProps = useCallback((record: ProcessedLogItem) => ({
    onDoubleClick: () => handleRowDoubleClick(record),
    onMouseEnter: () => {
      hoveredRowIndexRef.current = record._rowIndex;
      applyHoverClasses(record._rowIndex);
    },
    onMouseLeave: () => {
      hoveredRowIndexRef.current = null;
      clearHoverClasses();
    },
    style: { cursor: 'pointer' } as React.CSSProperties,
  }), [handleRowDoubleClick, applyHoverClasses, clearHoverClasses]);

  return (
    <div className="sample-assignment-log-tab">
      {/* Toolbar */}
      <Row gutter={[8, 8]} style={{ marginBottom: 0, padding: 16 }} align="middle">
        <Col xs={24} sm={12} lg={5}>
          <Input.Search
            placeholder="Tìm theo số HĐ, mã mẫu, tên mẫu, chỉ tiêu..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onSearch={handleSearch}
            allowClear
            enterButton
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
            format="DD/MM/YY"
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <ResponsiveSelect
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Chọn chỉ tiêu"
            value={selectedIndicatorIds}
            onChange={handleIndicatorChange}
            showSearch
            filterOption={(input, option) =>
              ((option?.label as string) ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={indicators.map((ind) => ({
              value: ind.id,
              label: ind.name,
            }))}
            maxTagCount="responsive"
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <ResponsiveSelect
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Thử nghiệm viên"
            value={technicianFilter}
            onChange={handleTechnicianFilterChange}
            allowClear
            loading={loadingTechnicians}
            maxTagCount="responsive"
            optionFilterProp="children"
            showSearch
          >
            {technicians.map((tech) => (
              <Select.Option key={tech.id} value={tech.id}>
                {tech.displayName || tech.userName}
              </Select.Option>
            ))}
          </ResponsiveSelect>
        </Col>
        <Col flex="auto" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Select
            value={sorting}
            onChange={handleSortChange}
            prefix={<SortAscendingOutlined />}
          >
            <Select.Option value="ContractDate desc">Ngày hợp đồng mới nhất</Select.Option>
            <Select.Option value="RequestCompletionDate desc">Ngày yêu cầu xong mới nhất</Select.Option>
            <Select.Option value="RequestCompletionDate">Ngày yêu cầu xong cũ nhất</Select.Option>
          </Select>
        </Col>
      </Row>

      {/* Table - pagination disabled because we do server-side contract pagination */}
      <div ref={tableContainerRef}>
        <Table<ProcessedLogItem>
          columns={filteredColumns}
          dataSource={processedData}
          loading={loading}
          rowKey="_rowKey"
          rowClassName={getRowClass}
          onRow={handleRowProps}
          components={{ header: { cell: ResizableTitle } }}
          pagination={false}
          sticky={{ offsetHeader: headerHeight }}
          scroll={{ x: scrollX }}
          size="small"
          bordered
        />
      </div>

      {/* Pagination - server-side contract pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            Hiển thị <b>{uniqueContractCount}/{pagination.total}</b> hợp đồng
          </span>
          <Select
            value={pagination.pageSize}
            onChange={(value) => handleTableChange({ current: 1, pageSize: value })}
            options={[
              { value: 20, label: '20 / trang' },
              { value: 50, label: '50 / trang' },
              { value: 100, label: '100 / trang' },
            ]}
            style={{ width: 110 }}
          />
        </div>
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          showSizeChanger={false}
          onChange={(page) => handleTableChange({ current: page, pageSize: pagination.pageSize })}
        />
      </div>
    </div>
  );
};

export default LabSampleAssignmentLogTab;
