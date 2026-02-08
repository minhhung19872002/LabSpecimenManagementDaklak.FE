import React, { useMemo, useCallback, useState } from "react";
import { Table, Input, Select, Button, Tag, Row, Col, Pagination } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useSampleAssignmentLog } from "../hooks/useSampleAssignmentLog";
import {
  SampleAssignmentLogDto,
  QLCLDisplayStatus,
  QLCLDisplayStatusLabels,
  QLCLDisplayStatusColors,
} from "../../../types/qualityManagement";
import {
  TestRequestStatus,
  TestRequestStatusLabels,
} from "../../../types/testRequest";
import { IndicatorApprovalStatus } from "../../../types/laboratoryTask";

import "../../../styles/ListCard.css";
import "./SampleAssignmentLogTab.css";

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

  const result: ProcessedLogItem[] = [];
  const seenSamples = new Set<string>();

  // Calculate sample row counts
  const sampleRowCounts = new Map<string, number>();
  data.forEach((item) => {
    sampleRowCounts.set(
      item.sampleId,
      (sampleRowCounts.get(item.sampleId) || 0) + 1,
    );
  });

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

  // Create a map from index to contract group
  const indexToContractGroup = new Map<
    number,
    { start: number; end: number }
  >();
  contractGroups.forEach((group) => {
    for (let k = group.start; k <= group.end; k++) {
      indexToContractGroup.set(k, group);
    }
  });

  // Calculate contract row spans
  const contractSpans: number[] = new Array(data.length).fill(0);
  contractGroups.forEach((group) => {
    contractSpans[group.start] = group.end - group.start + 1;
  });

  // Helper function to calculate consecutive row spans within contract for a field
  const calculateFieldSpansWithinContract = (
    fieldGetter: (item: SampleAssignmentLogDto) => string,
  ): number[] => {
    const spans: number[] = new Array(data.length).fill(1);
    let idx = 0;

    while (idx < data.length) {
      const currentContract = data[idx].contractNumber || "";
      const currentValue = fieldGetter(data[idx]);
      let spanCount = 1;

      let j = idx + 1;
      while (
        j < data.length &&
        (data[j].contractNumber || "") === currentContract &&
        fieldGetter(data[j]) === currentValue
      ) {
        spanCount++;
        j++;
      }

      spans[idx] = spanCount;
      for (let k = idx + 1; k < j; k++) {
        spans[k] = 0;
      }

      idx = j;
    }

    return spans;
  };

  // Calculate technical manager and technician spans within contract
  const technicalManagerSpans = calculateFieldSpansWithinContract(
    (item) => item.technicalManagerName || "",
  );
  const technicianSpans = calculateFieldSpansWithinContract(
    (item) => item.technicianName || "",
  );

  // Process each row
  for (let idx = 0; idx < data.length; idx++) {
    const currentItem = data[idx];
    const currentSampleId = currentItem.sampleId;
    const isFirstOfSample = !seenSamples.has(currentSampleId);
    seenSamples.add(currentSampleId);

    // Calculate date row spans for this position (within same sample)
    let transferDateSpan = 1;
    const currentTransferDate = getDateKey(currentItem.transferDate);
    for (
      let k = idx + 1;
      k < data.length && data[k].sampleId === currentSampleId;
      k++
    ) {
      if (
        getDateKey(data[k].transferDate) === currentTransferDate &&
        currentTransferDate !== ""
      ) {
        transferDateSpan++;
      } else {
        break;
      }
    }

    let requestCompletionDateSpan = 1;
    const currentRequestDate = getDateKey(currentItem.requestCompletionDate);
    for (
      let k = idx + 1;
      k < data.length && data[k].sampleId === currentSampleId;
      k++
    ) {
      if (
        getDateKey(data[k].requestCompletionDate) === currentRequestDate &&
        currentRequestDate !== ""
      ) {
        requestCompletionDateSpan++;
      } else {
        break;
      }
    }

    let testDateSpan = 1;
    const currentTestDate = getDateKey(currentItem.testDate);
    for (
      let k = idx + 1;
      k < data.length && data[k].sampleId === currentSampleId;
      k++
    ) {
      if (
        getDateKey(data[k].testDate) === currentTestDate &&
        currentTestDate !== ""
      ) {
        testDateSpan++;
      } else {
        break;
      }
    }

    let entryDateSpan = 1;
    const currentEntryDate = getDateKey(currentItem.entryDate);
    for (
      let k = idx + 1;
      k < data.length && data[k].sampleId === currentSampleId;
      k++
    ) {
      if (
        getDateKey(data[k].entryDate) === currentEntryDate &&
        currentEntryDate !== ""
      ) {
        entryDateSpan++;
      } else {
        break;
      }
    }

    let qlktApprovalDateSpan = 1;
    const currentQlktApprovalDate = getDateKey(currentItem.qlktApprovalDate);
    for (
      let k = idx + 1;
      k < data.length && data[k].sampleId === currentSampleId;
      k++
    ) {
      if (
        getDateKey(data[k].qlktApprovalDate) === currentQlktApprovalDate &&
        currentQlktApprovalDate !== ""
      ) {
        qlktApprovalDateSpan++;
      } else {
        break;
      }
    }

    // Check if this row should have rowSpan=0 (merged into previous row) for date columns
    const isPreviousSameSample =
      idx > 0 && data[idx - 1].sampleId === currentSampleId;

    let actualTransferDateSpan = transferDateSpan;
    let actualRequestDateSpan = requestCompletionDateSpan;
    let actualTestDateSpan = testDateSpan;
    let actualEntryDateSpan = entryDateSpan;
    let actualQlktApprovalDateSpan = qlktApprovalDateSpan;

    if (isPreviousSameSample) {
      const prevTransferDate = getDateKey(data[idx - 1].transferDate);
      const prevRequestDate = getDateKey(data[idx - 1].requestCompletionDate);
      const prevTestDate = getDateKey(data[idx - 1].testDate);
      const prevEntryDate = getDateKey(data[idx - 1].entryDate);
      const prevQlktApprovalDate = getDateKey(data[idx - 1].qlktApprovalDate);

      if (
        currentTransferDate === prevTransferDate &&
        currentTransferDate !== ""
      ) {
        actualTransferDateSpan = 0;
      }
      if (currentRequestDate === prevRequestDate && currentRequestDate !== "") {
        actualRequestDateSpan = 0;
      }
      if (currentTestDate === prevTestDate && currentTestDate !== "") {
        actualTestDateSpan = 0;
      }
      if (currentEntryDate === prevEntryDate && currentEntryDate !== "") {
        actualEntryDateSpan = 0;
      }
      if (
        currentQlktApprovalDate === prevQlktApprovalDate &&
        currentQlktApprovalDate !== ""
      ) {
        actualQlktApprovalDateSpan = 0;
      }
    }

    const contractGroup = indexToContractGroup.get(idx) || {
      start: idx,
      end: idx,
    };

    result.push({
      ...currentItem,
      contractRowSpan: contractSpans[idx],
      sampleRowSpan: isFirstOfSample
        ? sampleRowCounts.get(currentSampleId) || 1
        : 0,
      transferDateRowSpan: actualTransferDateSpan,
      requestCompletionDateRowSpan: actualRequestDateSpan,
      testDateRowSpan: actualTestDateSpan,
      technicalManagerRowSpan: technicalManagerSpans[idx],
      technicianRowSpan: technicianSpans[idx],
      entryDateRowSpan: actualEntryDateSpan,
      qlktApprovalDateRowSpan: actualQlktApprovalDateSpan,
      _rowKey: `${currentItem.indicatorId}_${idx}`,
      _rowIndex: idx,
      _contractGroupStart: contractGroup.start,
      _contractGroupEnd: contractGroup.end,
    });
  }

  return result;
};

// Determine row color class based on highlighting rules (QLCL page)
const getRowColorClass = (record: ProcessedLogItem): string => {
  // Skip if report published or completed
  if (
    record.isReportPublished ||
    record.qlclDisplayStatus === QLCLDisplayStatus.Published ||
    record.qlclDisplayStatus === QLCLDisplayStatus.WaitingForPublishing
  ) {
    return "";
  }

  // Purple: Chờ QLCL duyệt
  if (record.qlclDisplayStatus === QLCLDisplayStatus.WaitingQLCLApproval) {
    return "row-purple";
  }

  // Yellow: Chờ QLKT duyệt hoặc đã nhập KQ chờ duyệt
  if (
    record.qlclDisplayStatus === QLCLDisplayStatus.WaitingQLKTApproval ||
    record.indicatorApprovalStatus === IndicatorApprovalStatus.Entered
  ) {
    return "row-yellow";
  }

  // Red: Đang TN hoặc cần làm
  if (
    record.qlclDisplayStatus === QLCLDisplayStatus.ToDo ||
    record.qlclDisplayStatus === QLCLDisplayStatus.Testing
  ) {
    return "row-red";
  }

  return "";
};

const SampleAssignmentLogTab: React.FC = () => {
  const {
    loading,
    data,
    statusFilter,
    pagination,
    handleSearch,
    handleStatusFilter,
    handleTableChange,
    handleRowDoubleClick,
    handleReload,
  } = useSampleAssignmentLog();

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
  // A cell at rowIndex with rowSpan N covers rows [rowIndex, rowIndex + N - 1]
  // It should be highlighted if hoveredRowIndex is within that range
  const isCellHovered = useCallback(
    (cellRowIndex: number, rowSpan: number): boolean => {
      if (hoveredRowIndex === null) return false;
      if (rowSpan <= 1) return false;
      // Cell covers rows from cellRowIndex to cellRowIndex + rowSpan - 1
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
        fixed: "left",
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
        render: (text: string) => text || "-",
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
        dataIndex: "qlclDisplayStatus",
        key: "qlclDisplayStatus",
        width: 150,
        fixed: "right",
        render: (status: QLCLDisplayStatus | null | undefined) => {
          // Default to New if null/undefined
          const effectiveStatus = status ?? QLCLDisplayStatus.New;
          return (
            <Tag color={QLCLDisplayStatusColors[effectiveStatus] || "default"}>
              {QLCLDisplayStatusLabels[effectiveStatus] || "Không xác định"}
            </Tag>
          );
        },
      },
    ],
    [isCellHovered],
  );

  // Status filter options
  const statusOptions = useMemo(
    () => [
      { value: undefined, label: "Tất cả" },
      {
        value: TestRequestStatus.New,
        label: TestRequestStatusLabels[TestRequestStatus.New],
      },
      {
        value: TestRequestStatus.UnderReview,
        label: TestRequestStatusLabels[TestRequestStatus.UnderReview],
      },
      {
        value: TestRequestStatus.InProgress,
        label: TestRequestStatusLabels[TestRequestStatus.InProgress],
      },
      {
        value: TestRequestStatus.Completed,
        label: TestRequestStatusLabels[TestRequestStatus.Completed],
      },
    ],
    [],
  );

  return (
    <div className="sample-assignment-log-tab">
      {/* Toolbar */}
      <Row gutter={[16, 16]} align="middle" style={{ padding: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm theo số HĐ, mã mẫu, tên mẫu, chỉ tiêu..."
            prefix={<SearchOutlined />}
            allowClear
            onSearch={handleSearch}
            enterButton
          />
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Select
            style={{ width: "100%" }}
            placeholder="Lọc trạng thái"
            allowClear
            value={statusFilter}
            onChange={handleStatusFilter}
            options={statusOptions}
          />
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={handleReload} />
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
            // Add row-green class for rows without color (completed/published)
            const normalClass = !colorClass ? "row-green" : "";
            // Add row-in-hover-group for rows in same contract group when another row is hovered
            // This forces base colors to override Ant Design's inherit hover
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

export default SampleAssignmentLogTab;
