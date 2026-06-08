import React, { useMemo, useCallback, useState } from "react";
import { Table, Input, Select, Tag, Row, Col, Pagination, DatePicker } from "antd";
import { SearchOutlined, SortAscendingOutlined } from "@ant-design/icons";
import ResponsiveSelect from "../../../components/common/ResponsiveSelect";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useSampleAssignmentLogForQLKT } from "../hooks/useSampleAssignmentLogForQLKT";
import {
  SampleAssignmentLogDto,
  QualityIndicatorApprovalStatus,
} from "../../../types/qualityManagement";
import {
  TestRequestStatus,
} from "../../../types/testRequest";
import {
  IndicatorApprovalStatus,
  QLKTDisplayStatus,
  QLKTDisplayStatusLabels,
  QLKTDisplayStatusColors,
} from "../../../types/laboratoryTask";

const { RangePicker } = DatePicker;

import "../../QualityManagement/components/SampleAssignmentLogTab.css";

// Helper to format date
const formatDate = (date?: string) => {
  if (!date) return "-";
  return dayjs(date).format("DD/MM/YYYY");
};

// Helper to get date string for comparison (only date part, not time)
const getDateKey = (date?: string): string => {
  if (!date) return "";
  return dayjs(date).format("YYYY-MM-DD");
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

const processDataForRowSpan = (
  data: SampleAssignmentLogDto[],
): ProcessedLogItem[] => {
  if (data.length === 0) return [];

  const result: ProcessedLogItem[] = new Array(data.length);

  // Calculate contract groups (start and end indices for each contract group)
  const contractGroups: { start: number; end: number }[] = [];
  let i = 0;
  while (i < data.length) {
    const currentContract = data[i].contractNumber || "";
    let j = i + 1;
    while (
      j < data.length &&
      (data[j].contractNumber || "") === currentContract
    ) {
      j++;
    }
    contractGroups.push({ start: i, end: j - 1 });
    i = j;
  }

  // Helper: calculate consecutive spans for a field within contract boundaries
  const calculateFieldSpansWithinContract = (
    fieldGetter: (item: SampleAssignmentLogDto) => string,
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
    (item) => item.technicalManagerName || "",
  );
  const technicianSpans = calculateFieldSpansWithinContract(
    (item) => item.technicianName || "",
  );

  // Process each row within its contract group
  for (const group of contractGroups) {
    const contractSpan = group.end - group.start + 1;

    for (let idx = group.start; idx <= group.end; idx++) {
      const currentItem = data[idx];

      // Date forward-looking: within same sample AND same contract group
      const calcDateSpan = (
        dateGetter: (item: SampleAssignmentLogDto) => string,
      ): number => {
        const currentDate = dateGetter(currentItem);
        let span = 1;
        for (
          let k = idx + 1;
          k <= group.end && data[k].sampleId === currentItem.sampleId;
          k++
        ) {
          if (dateGetter(data[k]) === currentDate) span++;
          else break;
        }
        return span;
      };

      let transferDateSpan = calcDateSpan((d) => getDateKey(d.transferDate));
      let requestDateSpan = calcDateSpan((d) =>
        getDateKey(d.requestCompletionDate),
      );
      let testDateSpan = calcDateSpan((d) => getDateKey(d.testDate));
      let entryDateSpan = calcDateSpan((d) => getDateKey(d.entryDate));
      let qlktApprovalDateSpan = calcDateSpan((d) =>
        getDateKey(d.qlktApprovalDate),
      );

      // Zero-out if previous row in same sample AND same contract has same date
      const isPrevSameSample =
        idx > group.start &&
        data[idx - 1].sampleId === currentItem.sampleId;

      if (isPrevSameSample) {
        const prev = data[idx - 1];
        if (getDateKey(currentItem.transferDate) === getDateKey(prev.transferDate))
          transferDateSpan = 0;
        if (getDateKey(currentItem.requestCompletionDate) === getDateKey(prev.requestCompletionDate))
          requestDateSpan = 0;
        if (getDateKey(currentItem.testDate) === getDateKey(prev.testDate))
          testDateSpan = 0;
        if (getDateKey(currentItem.entryDate) === getDateKey(prev.entryDate))
          entryDateSpan = 0;
        if (getDateKey(currentItem.qlktApprovalDate) === getDateKey(prev.qlktApprovalDate))
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

// Determine row color class based on highlighting rules
const getRowColorClass = (record: ProcessedLogItem): string => {
  // Skip if report published or completed
  if (
    record.isReportPublished ||
    record.testRequestStatus === TestRequestStatus.Completed
  ) {
    return "";
  }

  // Purple: QLCL pending approval
  if (
    record.qualityApprovalStatus ===
    QualityIndicatorApprovalStatus.PendingApproval
  ) {
    return "row-purple";
  }

  // Yellow: Waiting for result approval (Entered)
  if (record.indicatorApprovalStatus === IndicatorApprovalStatus.Entered) {
    return "row-yellow";
  }

  // Red: New/UnderReview OR Pending OR Testing in progress
  if (
    record.testRequestStatus === TestRequestStatus.New ||
    record.testRequestStatus === TestRequestStatus.UnderReview ||
    record.indicatorApprovalStatus === IndicatorApprovalStatus.Pending ||
    record.qlktDisplayStatus === QLKTDisplayStatus.Testing
  ) {
    return "row-red";
  }

  return "";
};

interface LabSampleAssignmentLogTabProps {
  displayStatusFilter?: QLKTDisplayStatus;
  onReloadRef?: React.MutableRefObject<(() => void) | null>;
}

const LabSampleAssignmentLogTab: React.FC<LabSampleAssignmentLogTabProps> = ({ displayStatusFilter, onReloadRef }) => {
  const {
    loading,
    data,
    searchText,
    sorting,
    dateRange,
    selectedIndicatorIds,
    selectedTechnicianIds,
    indicators,
    technicians,
    pagination,
    handleSearchInputChange,
    handleSortChange,
    handleDateRangeChange,
    handleIndicatorChange,
    handleTechnicianChange,
    handleTableChange,
    handleRowDoubleClick,
    handleReload,
  } = useSampleAssignmentLogForQLKT({ displayStatusFilter });

  // Expose reload to parent
  React.useEffect(() => {
    if (onReloadRef) {
      onReloadRef.current = handleReload;
    }
    return () => {
      if (onReloadRef) {
        onReloadRef.current = null;
      }
    };
  }, [onReloadRef, handleReload]);

  // Process data for row spanning
  const processedData = useMemo(() => processDataForRowSpan(data), [data]);

  // Count unique contracts in current page for display
  const uniqueContractCount = useMemo(() => {
    const contracts = new Set(data.map((item) => item.contractNumber));
    return contracts.size;
  }, [data]);

  // State for hover - track which row index is being hovered
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  // Check if a cell with rowSpan should be highlighted
  const isCellHovered = useCallback(
    (cellRowIndex: number, rowSpan: number): boolean => {
      if (hoveredRowIndex === null) return false;
      if (rowSpan <= 1) return false;
      return (
        hoveredRowIndex >= cellRowIndex &&
        hoveredRowIndex < cellRowIndex + rowSpan
      );
    },
    [hoveredRowIndex],
  );

  const handleRowMouseEnter = useCallback((record: ProcessedLogItem) => {
    setHoveredRowIndex(record._rowIndex);
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setHoveredRowIndex(null);
  }, []);

  // Build columns with rowSpan support
  const columns: ColumnsType<ProcessedLogItem> = useMemo(
    () => [
      {
        title: "Số hợp đồng",
        dataIndex: "contractNumber",
        key: "contractNumber",
        width: 130,
        onCell: (record) => ({
          rowSpan: record.contractRowSpan,
          className: isCellHovered(record._rowIndex, record.contractRowSpan)
            ? "cell-hover"
            : undefined,
        }),
        render: (text: string) => text || "-",
      },
      {
        title: "Mã số mẫu",
        dataIndex: "sampleCode",
        key: "sampleCode",
        width: 120,
        onCell: (record) => ({
          rowSpan: record.sampleRowSpan,
          className: isCellHovered(record._rowIndex, record.sampleRowSpan)
            ? "cell-hover"
            : undefined,
        }),
        render: (text: string) => text || "-",
      },
      {
        title: "Tên mẫu",
        dataIndex: "sampleName",
        key: "sampleName",
        width: 150,
        onCell: (record) => ({
          rowSpan: record.sampleRowSpan,
          className: isCellHovered(record._rowIndex, record.sampleRowSpan)
            ? "cell-hover"
            : undefined,
        }),
        render: (text: string) => text || "-",
      },
      {
        title: "Lượng mẫu gửi",
        dataIndex: "sampleQuantity",
        key: "sampleQuantity",
        width: 100,
        onCell: (record) => ({
          rowSpan: record.sampleRowSpan,
          className: isCellHovered(record._rowIndex, record.sampleRowSpan)
            ? "cell-hover"
            : undefined,
        }),
        render: (text: string) => text || "-",
      },
      {
        title: "Tình trạng mẫu",
        dataIndex: "sampleStatusText",
        key: "sampleStatusText",
        width: 120,
        onCell: (record) => ({
          rowSpan: record.sampleRowSpan,
          className: isCellHovered(record._rowIndex, record.sampleRowSpan)
            ? "cell-hover"
            : undefined,
        }),
        render: (text: string) => text || "-",
      },
      {
        title: "Ngày chuyển",
        dataIndex: "transferDate",
        key: "transferDate",
        width: 100,
        onCell: (record) => ({
          rowSpan: record.transferDateRowSpan,
          className: isCellHovered(record._rowIndex, record.transferDateRowSpan)
            ? "cell-hover"
            : undefined,
        }),
        render: (date: string) => formatDate(date),
      },
      {
        title: "Ngày YC xong",
        dataIndex: "requestCompletionDate",
        key: "requestCompletionDate",
        width: 100,
        onCell: (record) => ({
          rowSpan: record.requestCompletionDateRowSpan,
          className: isCellHovered(
            record._rowIndex,
            record.requestCompletionDateRowSpan,
          )
            ? "cell-hover"
            : undefined,
        }),
        render: (date: string) => formatDate(date),
      },
      {
        title: "Thời gian TN",
        dataIndex: "testDate",
        key: "testDate",
        width: 100,
        onCell: (record) => ({
          rowSpan: record.testDateRowSpan,
          className: isCellHovered(record._rowIndex, record.testDateRowSpan)
            ? "cell-hover"
            : undefined,
        }),
        render: (date: string) => formatDate(date),
      },
      {
        title: "Tên chỉ tiêu",
        dataIndex: "indicatorName",
        key: "indicatorName",
        width: 180,
        render: (text: string, record) =>
          record.indicatorFormattedName ? (
            <span
              dangerouslySetInnerHTML={{
                __html: record.indicatorFormattedName,
              }}
            />
          ) : (
            text || "-"
          ),
      },
      {
        title: "Phương pháp",
        dataIndex: "methodName",
        key: "methodName",
        width: 150,
        render: (text: string, record) =>
          record.methodFormattedName ? (
            <span
              dangerouslySetInnerHTML={{ __html: record.methodFormattedName }}
            />
          ) : (
            text || "-"
          ),
      },
      {
        title: "ĐVT",
        dataIndex: "unit",
        key: "unit",
        width: 80,
        render: (text: string) =>
          text ? <span dangerouslySetInnerHTML={{ __html: text }} /> : "-",
      },
      {
        title: "Kết quả",
        dataIndex: "result",
        key: "result",
        width: 100,
        render: (text: string) => <strong>{text || "-"}</strong>,
      },
      {
        title: "QL kỹ thuật",
        dataIndex: "technicalManagerName",
        key: "technicalManagerName",
        width: 130,
        onCell: (record) => ({
          rowSpan: record.technicalManagerRowSpan,
          className: isCellHovered(
            record._rowIndex,
            record.technicalManagerRowSpan,
          )
            ? "cell-hover"
            : undefined,
        }),
        render: (text: string) => text || "-",
      },
      {
        title: "Kỹ thuật viên",
        dataIndex: "technicianName",
        key: "technicianName",
        width: 130,
        onCell: (record) => ({
          rowSpan: record.technicianRowSpan,
          className: isCellHovered(record._rowIndex, record.technicianRowSpan)
            ? "cell-hover"
            : undefined,
        }),
        render: (text: string) => text || "-",
      },
      {
        title: "Ngày nhập",
        dataIndex: "entryDate",
        key: "entryDate",
        width: 100,
        onCell: (record) => ({
          rowSpan: record.entryDateRowSpan,
          className: isCellHovered(record._rowIndex, record.entryDateRowSpan)
            ? "cell-hover"
            : undefined,
        }),
        render: (date: string) => formatDate(date),
      },
      {
        title: "Ngày QL duyệt",
        dataIndex: "qlktApprovalDate",
        key: "qlktApprovalDate",
        width: 100,
        onCell: (record) => ({
          rowSpan: record.qlktApprovalDateRowSpan,
          className: isCellHovered(
            record._rowIndex,
            record.qlktApprovalDateRowSpan,
          )
            ? "cell-hover"
            : undefined,
        }),
        render: (date: string) => formatDate(date),
      },
      {
        title: "Tình trạng",
        dataIndex: "qlktDisplayStatus",
        key: "qlktDisplayStatus",
        width: 150,
        fixed: "right",
        render: (status: QLKTDisplayStatus | null | undefined) => {
          // Default to UnderReview if null/undefined
          const effectiveStatus = status ?? QLKTDisplayStatus.UnderReview;
          return (
            <Tag color={QLKTDisplayStatusColors[effectiveStatus] || "default"}>
              {QLKTDisplayStatusLabels[effectiveStatus]}
            </Tag>
          );
        },
      },
    ],
    [isCellHovered],
  );

  return (
    <div className="sample-assignment-log-tab">
      {/* Toolbar */}
      <Row gutter={[8, 8]} style={{ marginBottom: 0, padding: 16 }} align="middle">
        <Col xs={24} sm={12} lg={5}>
          <Input
            placeholder="Tìm theo Số HĐ, Chỉ tiêu, Phương pháp"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: "100%" }}
            format="DD/MM/YY"
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <ResponsiveSelect
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Chọn chỉ tiêu"
            value={selectedIndicatorIds}
            onChange={handleIndicatorChange}
            showSearch
            filterOption={(input, option) =>
              ((option?.label as string) ?? "")
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
            style={{ width: "100%" }}
            placeholder="Thử nghiệm viên"
            value={selectedTechnicianIds}
            onChange={handleTechnicianChange}
            showSearch
            filterOption={(input, option) =>
              ((option?.label as string) ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={technicians.map((tech) => ({
              value: tech.id,
              label: tech.displayName || `${tech.name || ""} ${tech.surname || ""}`.trim(),
            }))}
            maxTagCount="responsive"
            allowClear
          />
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
      <Table<ProcessedLogItem>
        columns={columns}
        dataSource={processedData}
        loading={loading}
        rowKey="_rowKey"
        rowClassName={(record) => {
          const colorClass = getRowColorClass(record);
          const hoverClass =
            hoveredRowIndex === record._rowIndex ? "row-hover" : "";
          const normalClass = !colorClass ? "row-green" : "";
          const inHoverGroupClass =
            hoveredRowIndex !== null &&
            hoveredRowIndex !== record._rowIndex &&
            record._contractGroupStart <= hoveredRowIndex &&
            hoveredRowIndex <= record._contractGroupEnd
              ? "row-in-hover-group"
              : "";
          return `${colorClass} ${normalClass} ${hoverClass} ${inHoverGroupClass}`.trim();
        }}
        onRow={(record) => ({
          onDoubleClick: () => handleRowDoubleClick(record),
          onMouseEnter: () => handleRowMouseEnter(record),
          onMouseLeave: handleRowMouseLeave,
          style: { cursor: "pointer" },
        })}
        pagination={false}
        sticky={{ offsetHeader: 80 }}
        scroll={{ x: 2200 }}
        size="small"
        bordered
      />

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
