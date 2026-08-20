import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Table, AutoComplete, Input, Select, Tag, Row, Col, Pagination, DatePicker, Button, Tooltip, message, Typography } from 'antd';
import {
  SearchOutlined,
  SortAscendingOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';

import ResponsiveSelect from '../../../components/common/ResponsiveSelect';
import { EllipsisTooltip } from '../../../components/common';
import type { ColumnOption } from '../../../components/common';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSampleAssignmentLogForLab } from '../hooks/useSampleAssignmentLogForLab';
import { SampleAssignmentLogDto } from '../../../types/qualityManagement';
import { TestRequestStatus } from '../../../types/testRequest';
import {
  QLKTDisplayStatus,
  QLKTDisplayStatusLabels,
  QLKTDisplayStatusColors,
} from '../../../types/laboratoryTask';
import { testingService } from '../../../services/testingService';
import { testResultValueService } from '../../../services/testResultValueService';
import CannotTestModal from './CannotTestModal';
import { useMultipleActionPermissions } from '../../../hooks/useActionPermission';
import { useHeaderHeight } from '../../../hooks';
import ResultFilterControl from './ResultFilterControl';
import { getResultSearchCandidates } from './resultFilterUtils';
import '../../QualityManagement/components/SampleAssignmentLogTab.css';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const formatDate = (date?: string) => {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY');
};

// Statuses where KTV can input result + submit
const ACTIONABLE_STATUSES: QLKTDisplayStatus[] = [
  QLKTDisplayStatus.ToDo,
  QLKTDisplayStatus.Testing,
  QLKTDisplayStatus.WaitingQLKTApproval,
  QLKTDisplayStatus.ResultRejected,
];

const SubmitResultButton = React.memo<{
  label: string;
  onSubmit: () => Promise<void>;
}>(function SubmitResultButton({ label, onSubmit }) {
  const [loading, setLoading] = useState(false);
  return (
    <Tooltip title={label}>
      <Button
        size="small"
        type="primary"
        icon={<SendOutlined />}
        loading={loading}
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            await onSubmit();
          } finally {
            setLoading(false);
          }
        }}
      >
        {label}
      </Button>
    </Tooltip>
  );
});

// ---------- Row types ----------

interface DisplayRow extends Partial<SampleAssignmentLogDto> {
  _rowType: 'contract' | 'sample' | 'indicator';
  _rowKey: string;
  _stt?: number;
  _groupContractNumber?: string;
  _groupCustomerName?: string;
  _groupSampleCode?: string;
  _groupSampleName?: string;
  _groupSampleId?: string;
  _indicatorCount?: number;
}

// ---------- Data processing ----------

const buildDisplayRows = (
  data: SampleAssignmentLogDto[],
  collapsedContracts: Set<string>,
  collapsedSamples: Set<string>,
): DisplayRow[] => {
  if (data.length === 0) return [];

  const rows: DisplayRow[] = [];

  // Group by contract then sample using Map (preserves insertion order, handles non-contiguous rows from any sort)
  const contractMap = new Map<string, SampleAssignmentLogDto[]>();
  for (const item of data) {
    const ck = item.contractNumber || '';
    if (!contractMap.has(ck)) contractMap.set(ck, []);
    contractMap.get(ck)!.push(item);
  }

  for (const [ck, contractItems] of contractMap) {
    rows.push({
      _rowType: 'contract',
      _rowKey: `contract_${ck}`,
      _groupContractNumber: ck,
      _groupCustomerName: contractItems[0]?.customerName || '',
      _indicatorCount: contractItems.length,
    });

    if (collapsedContracts.has(ck)) continue;

    // Group by sample within contract
    const sampleMap = new Map<string, { sampleCode: string; sampleName: string; items: SampleAssignmentLogDto[] }>();
    for (const item of contractItems) {
      const sid = String(item.sampleId);
      if (!sampleMap.has(sid)) {
        sampleMap.set(sid, { sampleCode: item.sampleCode || '', sampleName: item.sampleName || '', items: [] });
      }
      sampleMap.get(sid)!.items.push(item);
    }

    for (const [sid, sg] of sampleMap) {
      rows.push({
        _rowType: 'sample',
        _rowKey: `sample_${sid}`,
        _groupSampleCode: sg.sampleCode,
        _groupSampleName: sg.sampleName,
        _groupSampleId: sid,
        _indicatorCount: sg.items.length,
      });

      if (collapsedSamples.has(sid)) continue;

      sg.items.forEach((item, idx) => {
        rows.push({
          _rowType: 'indicator',
          _rowKey: `ind_${item.laboratoryTaskIndicatorId ?? `${sid}_${String(item.indicatorId)}_${idx}`}`,
          _stt: idx + 1,
          ...item,
        });
      });
    }
  }

  return rows;
};

// ---------- Row color ----------

const getRowColorClass = (record: DisplayRow): string => {
  if (record._rowType !== 'indicator') return '';
  if (record.isReportPublished || record.testRequestStatus === TestRequestStatus.Completed) return '';
  if (record.qlktDisplayStatus === QLKTDisplayStatus.Completed) return '';
  if (record.qlktDisplayStatus === QLKTDisplayStatus.WaitingQLKTApproval) return 'row-yellow';
  if (
    record.qlktDisplayStatus === QLKTDisplayStatus.ToDo ||
    record.qlktDisplayStatus === QLKTDisplayStatus.Testing ||
    record.qlktDisplayStatus === QLKTDisplayStatus.ResultRejected
  ) {
    return 'row-red';
  }
  return '';
};

// ---------- Column options (exported for visibility selector) ----------

export const COLUMN_OPTIONS: ColumnOption[] = [
  { key: 'indicatorName', label: 'Tên chỉ tiêu' },
  { key: 'methodName', label: 'Phương pháp' },
  { key: 'technicianName', label: 'Người thực hiện' },
  { key: 'transferDate', label: 'Ngày giao mẫu' },
  { key: 'testDate', label: 'Ngày TN', disabled: true },
  { key: 'requestCompletionDate', label: 'Hạn trả KQ' },
  { key: 'qlktDisplayStatus', label: 'Trạng thái' },
  { key: 'result', label: 'Kết quả', disabled: true },
  { key: 'actions', label: 'Thao tác', disabled: true },
];
export const ALL_COLUMN_KEYS = COLUMN_OPTIONS.map((c) => c.key);

// ---------- Props ----------

interface LabSampleAssignmentLogTabProps {
  visibleColumns?: string[];
  logData: ReturnType<typeof useSampleAssignmentLogForLab>;
}

// ---------- Component ----------

const LabSampleAssignmentLogTab: React.FC<LabSampleAssignmentLogTabProps> = ({
  visibleColumns = ALL_COLUMN_KEYS,
  logData,
}) => {
  const headerHeight = useHeaderHeight();
  const permissions = useMultipleActionPermissions('testing', ['inputResult', 'editResult', 'sendResult']);
  const canInputResult = permissions.inputResult?.canAll || permissions.inputResult?.canEdit;
  const canSendResult = permissions.sendResult?.canAll || permissions.sendResult?.canEdit;

  const [collapsedContracts, setCollapsedContracts] = useState<Set<string>>(new Set());
  const [collapsedSamples, setCollapsedSamples] = useState<Set<string>>(new Set());

  const [editedResults, setEditedResults] = useState<Record<string, string>>({});
  const [editedTestDates, setEditedTestDates] = useState<Record<string, string>>({});
  // indicatorId → list of result value options (from master data)
  const [resultValueMap, setResultValueMap] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    testResultValueService.getWithIndicators().then((items) => {
      const map = new Map<string, string[]>();
      const allNames = items.map((i) => i.name).filter(Boolean);
      items.forEach((item) => {
        (item.indicators ?? []).forEach((pair: { indicatorId?: string }) => {
          if (!pair.indicatorId) return;
          const list = map.get(pair.indicatorId) ?? [];
          if (!list.includes(item.name)) list.push(item.name);
          map.set(pair.indicatorId, list);
        });
      });
      // fallback: store all names under empty key for indicators with no specific mapping
      map.set('__all__', allNames);
      setResultValueMap(map);
    }).catch((err) => { console.warn('Result value suggestions unavailable:', err); });
  }, []);

  const [cannotTestModal, setCannotTestModal] = useState<{
    visible: boolean;
    taskId: string;
    indicatorId: string;
    indicatorName: string;
  }>({ visible: false, taskId: '', indicatorId: '', indicatorName: '' });


  const [resultSearchHtml, setResultSearchHtml] = useState('');
  const [resultFilterOpen, setResultFilterOpen] = useState(false);

  const {
    loading,
    data,
    totalCount,
    searchText,
    sorting,
    dateRange,
    selectedIndicatorIds,
    indicators,
    technicianFilter,
    technicians,
    loadingTechnicians,
    resultFilter,
    distinctResults,
    loadingResults,
    pagination,
    handleSearch,
    handleSearchInputChange,
    handleSortChange,
    handleDateRangeChange,
    handleIndicatorChange,
    handleTechnicianFilterChange,
    handleResultFilterChange,
    handleTableChange,
    handleRowDoubleClick,
    reload,
    reloadDistinctResults,
  } = logData;

  const displayRows = useMemo(
    () => buildDisplayRows(data, collapsedContracts, collapsedSamples),
    [data, collapsedContracts, collapsedSamples],
  );

  const uniqueContractCount = useMemo(() => {
    const contracts = new Set(data.map((item) => item.contractNumber));
    return contracts.size;
  }, [data]);

  const filteredDistinctResults = useMemo(() => {
    const searchCandidates = getResultSearchCandidates(resultSearchHtml);
    if (searchCandidates.length === 0) return distinctResults;
    return distinctResults.filter((result) => {
      const optionCandidates = getResultSearchCandidates(result);
      return searchCandidates.some((sc) => optionCandidates.some((oc) => oc.includes(sc)));
    });
  }, [distinctResults, resultSearchHtml]);

  const toggleContract = useCallback((contractNumber: string) => {
    setCollapsedContracts((prev) => {
      const next = new Set(prev);
      if (next.has(contractNumber)) next.delete(contractNumber);
      else next.add(contractNumber);
      return next;
    });
  }, []);

  const toggleSample = useCallback((sampleId: string) => {
    setCollapsedSamples((prev) => {
      const next = new Set(prev);
      if (next.has(sampleId)) next.delete(sampleId);
      else next.add(sampleId);
      return next;
    });
  }, []);

  const handleSubmitResult = useCallback(
    async (record: DisplayRow) => {
      const labIndicatorId = record.laboratoryTaskIndicatorId as string;
      const taskId = record.laboratoryTaskId as string;
      const sampleId = record.sampleId as unknown as string;
      const resultValue = editedResults[labIndicatorId] ?? record.result ?? '';
      const rawTestDate = editedTestDates[labIndicatorId] ?? record.testDate;
      const testDate = rawTestDate
        ? dayjs(rawTestDate).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');

      if (!resultValue.trim()) {
        message.warning('Vui lòng nhập kết quả trước khi gửi');
        return;
      }

      try {
        await testingService.saveResults(taskId, {
          results: [{ indicatorId: labIndicatorId, result: resultValue.trim(), testDate }],
        });
        await testingService.submitResults(taskId, {
          sampleId,
          indicators: [{ indicatorId: labIndicatorId, testDate }],
        });
        setEditedResults((prev) => {
          const next = { ...prev };
          delete next[labIndicatorId];
          return next;
        });
        setEditedTestDates((prev) => {
          const next = { ...prev };
          delete next[labIndicatorId];
          return next;
        });
        message.success('Gửi kết quả thành công');
        reload();
      } catch (err: any) {
        message.error(err?.response?.data?.error?.message || 'Lỗi gửi kết quả');
      }
    },
    [editedResults, editedTestDates, reload],
  );

  const handleCannotTest = useCallback((record: DisplayRow) => {
    setCannotTestModal({
      visible: true,
      taskId: record.laboratoryTaskId as string,
      indicatorId: record.laboratoryTaskIndicatorId as string,
      indicatorName: record.indicatorName || '',
    });
  }, []);

  const handleCannotTestSuccess = useCallback(() => {
    setCannotTestModal((prev) => ({ ...prev, visible: false }));
    reload();
  }, [reload]);

  const columns: ColumnsType<DisplayRow> = useMemo(() => {
    const isVisible = (key: string) => visibleColumns.includes(key);

    // For contract/sample header rows: first cell spans all cols, rest hidden
    const headerSpan = (record: DisplayRow) => {
      if (record._rowType === 'contract' || record._rowType === 'sample') return { colSpan: 0 };
      return {};
    };

    const leafColumns: ColumnsType<DisplayRow> = [];

    leafColumns.push({
      title: 'STT',
      key: 'stt',
      width: 60,
      onCell: (record) => {
        if (record._rowType === 'contract' || record._rowType === 'sample')
          return { colSpan: leafColumns.length };
        return {};
      },
      render: (_: any, record: DisplayRow) => {
        if (record._rowType === 'contract') {
          const collapsed = collapsedContracts.has(record._groupContractNumber || '');
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <span
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                onClick={() => toggleContract(record._groupContractNumber || '')}
              >
                {collapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
              </span>
              <strong>{record._groupContractNumber || '-'}</strong>
              {record._groupCustomerName && (
                <span style={{ color: '#555', marginLeft: 4 }}>{record._groupCustomerName}</span>
              )}
              <span style={{ color: '#999', marginLeft: 8 }}>· {record._indicatorCount} chỉ tiêu</span>
            </div>
          );
        }
        if (record._rowType === 'sample') {
          const collapsed = collapsedSamples.has(record._groupSampleId || '');
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24, whiteSpace: 'nowrap' }}>
              <span
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                onClick={() => toggleSample(record._groupSampleId || '')}
              >
                {collapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
              </span>
              <strong>{record._groupSampleCode || '-'}</strong>
              <span style={{ color: '#555' }}>{record._groupSampleName || ''}</span>
              <span style={{ color: '#999', marginLeft: 8 }}>· {record._indicatorCount} chỉ tiêu</span>
            </div>
          );
        }
        return record._stt;
      },
    });

    if (isVisible('indicatorName')) {
      leafColumns.push({
        title: 'Chỉ tiêu TN',
        dataIndex: 'indicatorName',
        key: 'indicatorName',
        width: 200,
        onCell: (record) => headerSpan(record),
        render: (text: string, record: DisplayRow) => {
          if (record._rowType !== 'indicator') return null;
          return <EllipsisTooltip title={text || '-'} html={record.indicatorFormattedName || text || '-'} />;
        },
      });
    }

    if (isVisible('methodName')) {
      leafColumns.push({
        title: 'Phương pháp',
        dataIndex: 'methodName',
        key: 'methodName',
        width: 180,
        onCell: (record) => headerSpan(record),
        render: (text: string, record: DisplayRow) => {
          if (record._rowType !== 'indicator') return null;
          return <EllipsisTooltip title={text || '-'} html={record.methodFormattedName || text || '-'} />;
        },
      });
    }

    if (isVisible('technicianName')) {
      leafColumns.push({
        title: 'Người thực hiện',
        dataIndex: 'technicianName',
        key: 'technicianName',
        width: 130,
        onCell: (record) => headerSpan(record),
        render: (text: string, record: DisplayRow) => {
          if (record._rowType !== 'indicator') return null;
          return <EllipsisTooltip title={text || '-'}>{text || '-'}</EllipsisTooltip>;
        },
      });
    }

    if (isVisible('transferDate')) {
      leafColumns.push({
        title: 'Ngày giao mẫu',
        dataIndex: 'transferDate',
        key: 'transferDate',
        width: 110,
        onCell: (record) => headerSpan(record),
        render: (date: string, record: DisplayRow) => {
          if (record._rowType !== 'indicator') return null;
          const formatted = formatDate(date);
          return <EllipsisTooltip title={formatted}>{formatted}</EllipsisTooltip>;
        },
      });
    }

    if (isVisible('testDate')) {
      leafColumns.push({
        title: 'Ngày TN',
        dataIndex: 'testDate',
        key: 'testDate',
        width: 130,
        onCell: (record) => headerSpan(record),
        render: (_: any, record: DisplayRow) => {
          if (record._rowType !== 'indicator') return null;

          const status = record.qlktDisplayStatus ?? QLKTDisplayStatus.ToDo;
          const isCancelled = record.testRequestStatus === TestRequestStatus.Cancelled;
          const isActionable = ACTIONABLE_STATUSES.includes(status) && !isCancelled && canInputResult && record.canEdit !== false;
          const labIndicatorId = record.laboratoryTaskIndicatorId as string;

          if (isActionable && labIndicatorId) {
            const rawDate = editedTestDates[labIndicatorId] ?? record.testDate;
            const dateValue = rawDate ? dayjs(rawDate) : null;
            const disabledDate =
              status === QLKTDisplayStatus.ResultRejected ||
              status === QLKTDisplayStatus.WaitingQLKTApproval
                ? (current: dayjs.Dayjs) => current && current < dayjs().startOf('day')
                : undefined;
            return (
              <DatePicker
                size="small"
                value={dateValue}
                onChange={(date) =>
                  setEditedTestDates((prev) => ({
                    ...prev,
                    [labIndicatorId]: date ? date.format('YYYY-MM-DD') : '',
                  }))
                }
                disabledDate={disabledDate}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                style={{ width: '100%' }}
                allowClear={false}
              />
            );
          }

          const formatted = formatDate(record.testDate);
          return <EllipsisTooltip title={formatted}>{formatted}</EllipsisTooltip>;
        },
      });
    }

    if (isVisible('requestCompletionDate')) {
      leafColumns.push({
        title: 'Hạn trả KQ',
        dataIndex: 'requestCompletionDate',
        key: 'requestCompletionDate',
        width: 100,
        onCell: (record) => headerSpan(record),
        render: (date: string, record: DisplayRow) => {
          if (record._rowType !== 'indicator') return null;
          const formatted = formatDate(date);
          return <EllipsisTooltip title={formatted}>{formatted}</EllipsisTooltip>;
        },
      });
    }

    if (isVisible('qlktDisplayStatus')) {
      leafColumns.push({
        title: 'Trạng thái',
        dataIndex: 'qlktDisplayStatus',
        key: 'qlktDisplayStatus',
        width: 150,
        onCell: (record) => headerSpan(record),
        render: (status: QLKTDisplayStatus | null | undefined, record: DisplayRow) => {
          if (record._rowType !== 'indicator') return null;
          const effectiveStatus = status ?? QLKTDisplayStatus.ToDo;
          return (
            <Tag color={QLKTDisplayStatusColors[effectiveStatus] || 'default'}>
              {QLKTDisplayStatusLabels[effectiveStatus]}
            </Tag>
          );
        },
      });
    }

    if (isVisible('result')) {
      leafColumns.push({
        title: 'Kết quả',
        dataIndex: 'result',
        key: 'result',
        width: 200,
        onCell: (record) => headerSpan(record),
        render: (text: string, record: DisplayRow) => {
          if (record._rowType !== 'indicator') return null;

          const status = record.qlktDisplayStatus ?? QLKTDisplayStatus.ToDo;
          const isCancelled = record.testRequestStatus === TestRequestStatus.Cancelled;
          const isActionable = ACTIONABLE_STATUSES.includes(status) && !isCancelled && canInputResult && record.canEdit !== false;
          const labIndicatorId = record.laboratoryTaskIndicatorId as string;

          if (isActionable && labIndicatorId) {
            const value = editedResults[labIndicatorId] ?? record.result ?? '';
            const specificOptions = resultValueMap.get(record.indicatorId as string);
            const options = (specificOptions?.length ? specificOptions : (resultValueMap.get('__all__') ?? []))
              .filter((v) => !value || v.toLowerCase().includes(value.toLowerCase()))
              .map((v) => ({ value: v, label: v }));
            return (
              <AutoComplete
                size="small"
                value={value}
                options={options}
                onChange={(v) => setEditedResults((prev) => ({ ...prev, [labIndicatorId]: v }))}
                placeholder="Nhập KQ"
                style={{ width: '100%' }}
                filterOption={false}
              />
            );
          }

          return (
            <EllipsisTooltip title={text || '-'}>
              <strong>{text || '-'}</strong>
            </EllipsisTooltip>
          );
        },
      });
    }

    if (isVisible('actions')) {
      leafColumns.push({
        title: '',
        key: 'actions',
        width: 180,
        fixed: 'right',
        onCell: (record) => headerSpan(record),
        render: (_: any, record: DisplayRow) => {
          if (record._rowType !== 'indicator') return null;

          const status = record.qlktDisplayStatus ?? QLKTDisplayStatus.ToDo;
          const isCancelled = record.testRequestStatus === TestRequestStatus.Cancelled;
          const isActionable = ACTIONABLE_STATUSES.includes(status) && !isCancelled && record.canEdit !== false && canInputResult;
          const labIndicatorId = record.laboratoryTaskIndicatorId as string;

          if (!isActionable || !labIndicatorId) return null;

          const buttonLabel =
            status === QLKTDisplayStatus.WaitingQLKTApproval ? 'Gửi lại' : 'Gửi KQ';

          const currentResult = editedResults[labIndicatorId] ?? record.result ?? '';
          const hasResult = currentResult.trim() !== '';
          const rawTestDate = editedTestDates[labIndicatorId] ?? record.testDate;
          const hasTestDate = !!rawTestDate;
          const canSubmit = hasResult && hasTestDate;

          return (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              {canSendResult && canSubmit && (
                <SubmitResultButton
                  label={buttonLabel}
                  onSubmit={() => handleSubmitResult(record)}
                />
              )}
              {canInputResult && (
                <Tooltip title="Không TN được">
                  <Button
                    size="small"
                    danger
                    icon={<StopOutlined />}
                    onClick={() => handleCannotTest(record)}
                  />
                </Tooltip>
              )}
              {!hasResult && (
                <Text type="secondary" style={{ fontSize: 11 }}>Nhập KQ để gửi</Text>
              )}
              {hasResult && !hasTestDate && (
                <Text type="secondary" style={{ fontSize: 11 }}>Chọn ngày TN</Text>
              )}
            </div>
          );
        },
      });
    }

    // Wrap leaf columns into 2-row grouped header
    const grouped: ColumnsType<DisplayRow> = [];

    const sttCol = leafColumns.find((c) => c.key === 'stt');
    if (sttCol) grouped.push(sttCol);

    const contentChildren = leafColumns.filter(
      (c) => c.key === 'indicatorName' || c.key === 'methodName',
    );
    if (contentChildren.length > 0) {
      grouped.push({ title: 'Nội dung thử nghiệm', children: contentChildren });
    }

    const progressChildren = leafColumns.filter(
      (c) =>
        c.key === 'technicianName' ||
        c.key === 'transferDate' ||
        c.key === 'testDate' ||
        c.key === 'requestCompletionDate',
    );
    if (progressChildren.length > 0) {
      grouped.push({ title: 'Tiến độ thực hiện', children: progressChildren });
    }

    const resultChildren = leafColumns.filter(
      (c) => c.key === 'qlktDisplayStatus' || c.key === 'result',
    );
    if (resultChildren.length > 0) {
      grouped.push({ title: 'Kết quả & Tình trạng', children: resultChildren });
    }

    const actionsCol = leafColumns.find((c) => c.key === 'actions');
    if (actionsCol) grouped.push(actionsCol);

    return grouped;
  }, [
    visibleColumns,
    collapsedContracts,
    collapsedSamples,
    toggleContract,
    toggleSample,
    editedResults,
    editedTestDates,
    resultValueMap,
    canInputResult,
    canSendResult,
    handleSubmitResult,
    handleCannotTest,
  ]);

  const scrollX = useMemo(() => {
    const sumLeafWidths = (cols: ColumnsType<DisplayRow>): number => {
      let total = 0;
      for (const col of cols) {
        if ('children' in col && col.children) {
          total += sumLeafWidths(col.children as ColumnsType<DisplayRow>);
        } else {
          total += ((col as any).width as number) || 150;
        }
      }
      return total;
    };
    return sumLeafWidths(columns);
  }, [columns]);

  const getRowClass = useCallback((record: DisplayRow) => {
    if (record._rowType === 'contract') return 'row-group-header';
    if (record._rowType === 'sample') return 'row-sample-header';
    return getRowColorClass(record);
  }, []);

  const handleRowProps = useCallback(
    (record: DisplayRow) => ({
      onDoubleClick: () => {
        if (record._rowType === 'indicator') {
          handleRowDoubleClick(record as SampleAssignmentLogDto);
        }
      },
      style: {
        cursor: record._rowType === 'indicator' ? 'pointer' : 'default',
      } as React.CSSProperties,
    }),
    [handleRowDoubleClick],
  );

  return (
    <div className="sample-assignment-log-tab">
      {/* Inline styles for result filter control */}
      <style>{`
        .result-filter-trigger:hover,
        .result-filter-trigger.open,
        .result-filter-trigger:focus-within {
          border-color: #4096ff !important;
        }
        .result-filter-trigger.open,
        .result-filter-trigger:focus-within {
          box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
        }
        .result-filter-editor .limit-input-wrapper {
          display: flex !important;
          align-items: center !important;
          flex: 1 1 0% !important;
          min-width: 0 !important;
          width: auto !important;
          min-height: auto !important;
          height: auto !important;
          padding: 0 !important;
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }
        .result-filter-editor .limit-input-wrapper:hover,
        .result-filter-editor .limit-input-wrapper:focus-within {
          border: none !important;
          box-shadow: none !important;
        }
        .result-filter-editor .limit-input-wrapper .tiptap.ProseMirror,
        .result-filter-editor .limit-input-wrapper .ProseMirror {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          padding: 0 !important;
          height: 32px !important;
          min-height: 32px !important;
          max-height: 32px !important;
          line-height: 32px !important;
          flex: 1 1 auto !important;
          min-width: 4px !important;
          width: auto !important;
          background: transparent !important;
          cursor: text !important;
          font-size: 14px !important;
          caret-color: rgba(0, 0, 0, 0.88) !important;
        }
        .result-filter-editor .limit-input-wrapper .ProseMirror p {
          margin: 0 !important;
          line-height: 32px !important;
          min-width: 1px !important;
        }
        .result-filter-editor .limit-input-wrapper .tiptap.ProseMirror sub,
        .result-filter-editor .limit-input-wrapper .tiptap.ProseMirror sup {
          vertical-align: baseline;
          position: relative;
          font-size: 0.75em;
        }
        .result-filter-editor .limit-input-wrapper .tiptap.ProseMirror sub { top: 0.4em; }
        .result-filter-editor .limit-input-wrapper .tiptap.ProseMirror sup { top: -0.5em; }
        .result-filter-editor .limit-input-wrapper .ProseMirror .is-editor-empty::before {
          display: none !important;
        }
        .result-filter-clear { display: none; }
        .result-filter-trigger:hover .result-filter-clear { display: flex; }
        .result-filter-trigger:hover .result-filter-clear ~ .result-filter-search-icon,
        .result-filter-trigger:hover .result-filter-clear ~ .result-filter-arrow {
          display: none !important;
        }
        .result-filter-selection-item {
          display: flex;
          align-items: center;
          max-width: 100%;
          height: 32px;
          padding: 0 4px 0 8px;
          margin: 2px 0;
          color: rgba(0, 0, 0, 0.88);
          font-size: 14px;
          line-height: 30px;
          background: rgba(0, 0, 0, 0.06);
          border: 1px solid transparent;
          border-radius: 6px;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .result-filter-selection-label {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .result-filter-selection-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          margin-left: 4px;
          font-size: 10px;
          color: rgba(0, 0, 0, 0.45);
          cursor: pointer;
          flex-shrink: 0;
          border-radius: 50%;
          transition: color 0.2s, background 0.2s;
        }
        .result-filter-selection-remove:hover {
          color: rgba(0, 0, 0, 0.88);
          background: rgba(0, 0, 0, 0.12);
        }
        .result-filter-selection-summary { cursor: default; padding: 0 8px; flex-shrink: 0; }
      `}</style>

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
        <Col xs={24} sm={12} lg={3}>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
            format="DD/MM/YY"
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <ResponsiveSelect
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Chọn chỉ tiêu"
            value={selectedIndicatorIds}
            onChange={handleIndicatorChange}
            showSearch
            filterOption={(input, option) =>
              ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={indicators.map((ind) => ({ value: ind.id, label: ind.name }))}
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
        <Col xs={24} sm={12} lg={4}>
          <ResultFilterControl
            open={resultFilterOpen}
            value={resultFilter}
            searchHtml={resultSearchHtml}
            loading={loadingResults}
            options={filteredDistinctResults}
            onOpenChange={(open) => {
              setResultFilterOpen(open);
              if (open && distinctResults.length === 0 && !loadingResults) {
                reloadDistinctResults();
              }
            }}
            onSearchChange={setResultSearchHtml}
            onChange={handleResultFilterChange}
          />
        </Col>
        <Col flex="auto" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Select value={sorting} onChange={handleSortChange} prefix={<SortAscendingOutlined />}>
            <Select.Option value="ContractDate desc">Ngày hợp đồng mới nhất</Select.Option>
            <Select.Option value="RequestCompletionDate desc">
              Ngày yêu cầu xong mới nhất
            </Select.Option>
            <Select.Option value="RequestCompletionDate">Ngày yêu cầu xong cũ nhất</Select.Option>
          </Select>
        </Col>
      </Row>

      {/* Table */}
      <Table<DisplayRow>
        columns={columns}
        dataSource={displayRows}
        loading={loading}
        rowKey="_rowKey"
        rowClassName={getRowClass}
        onRow={handleRowProps}
        pagination={false}
        sticky={{ offsetHeader: headerHeight }}
        scroll={{ x: scrollX }}
        size="small"
        bordered
      />

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            <b>{data.length}</b>/{totalCount} chỉ tiêu · <b>{uniqueContractCount}</b> hợp đồng
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
          onChange={(page) =>
            handleTableChange({ current: page, pageSize: pagination.pageSize })
          }
        />
      </div>

      {/* Cannot Test Modal */}
      <CannotTestModal
        visible={cannotTestModal.visible}
        taskId={cannotTestModal.taskId}
        indicatorId={cannotTestModal.indicatorId}
        indicatorName={cannotTestModal.indicatorName}
        onCancel={() => setCannotTestModal((prev) => ({ ...prev, visible: false }))}
        onSuccess={handleCannotTestSuccess}
      />
    </div>
  );
};

export default LabSampleAssignmentLogTab;
