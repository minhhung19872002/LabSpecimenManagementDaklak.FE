import React, { useMemo } from 'react';
import { Table, Input, Select, Button, Tag, Card, Row, Col } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSampleAssignmentLog } from '../hooks/useSampleAssignmentLog';
import {
  SampleAssignmentLogDto,
  QualityIndicatorApprovalStatus,
} from '../../../types/qualityManagement';
import {
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestStatusColors,
} from '../../../types/testRequest';
import { IndicatorApprovalStatus } from '../../../types/laboratoryTask';
import { TestingStatus } from '../../../types/testing';

import './SampleAssignmentLogTab.css';

// Helper to format date
const formatDate = (date?: string) => {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY');
};

// Process data to add rowSpan info for sample-level columns
interface ProcessedLogItem extends SampleAssignmentLogDto {
  sampleRowSpan: number;
  _rowKey: string;
}

const processDataForRowSpan = (data: SampleAssignmentLogDto[]): ProcessedLogItem[] => {
  // Group by sampleId and count rows per sample
  const sampleRowCounts = new Map<string, number>();
  data.forEach(item => {
    sampleRowCounts.set(
      item.sampleId,
      (sampleRowCounts.get(item.sampleId) || 0) + 1
    );
  });

  // Mark first row of each sample group
  const seen = new Set<string>();
  return data.map((item, index) => {
    const isFirst = !seen.has(item.sampleId);
    seen.add(item.sampleId);
    return {
      ...item,
      sampleRowSpan: isFirst ? (sampleRowCounts.get(item.sampleId) || 1) : 0,
      _rowKey: `${item.indicatorId}_${index}`,
    };
  });
};

// Determine row class based on highlighting rules
const getRowClassName = (record: ProcessedLogItem): string => {
  // Skip if report published or completed
  if (record.isReportPublished || record.testRequestStatus === TestRequestStatus.Completed) {
    return '';
  }

  // Purple: QLCL pending approval
  if (record.qualityApprovalStatus === QualityIndicatorApprovalStatus.PendingApproval) {
    return 'row-purple';
  }

  // Yellow: Waiting for result approval (Entered)
  if (record.indicatorApprovalStatus === IndicatorApprovalStatus.Entered) {
    return 'row-yellow';
  }

  // Red: New/UnderReview OR Pending OR TestingStatus=InProgress
  if (
    record.testRequestStatus === TestRequestStatus.New ||
    record.testRequestStatus === TestRequestStatus.UnderReview ||
    record.indicatorApprovalStatus === IndicatorApprovalStatus.Pending ||
    record.testingStatus === TestingStatus.InProgress
  ) {
    return 'row-red';
  }

  return '';
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

  // Build columns with rowSpan support
  const columns: ColumnsType<ProcessedLogItem> = useMemo(() => [
    {
      title: 'Số hợp đồng',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 130,
      fixed: 'left',
      render: (text: string) => text || '-',
    },
    {
      title: 'Mã số mẫu',
      dataIndex: 'sampleCode',
      key: 'sampleCode',
      width: 120,
      onCell: (record) => ({
        rowSpan: record.sampleRowSpan,
      }),
      render: (text: string) => text || '-',
    },
    {
      title: 'Tên mẫu',
      dataIndex: 'sampleName',
      key: 'sampleName',
      width: 150,
      onCell: (record) => ({
        rowSpan: record.sampleRowSpan,
      }),
      render: (text: string) => text || '-',
    },
    {
      title: 'Lượng mẫu gửi',
      dataIndex: 'sampleQuantity',
      key: 'sampleQuantity',
      width: 100,
      onCell: (record) => ({
        rowSpan: record.sampleRowSpan,
      }),
      render: (text: string) => text || '-',
    },
    {
      title: 'Tình trạng mẫu',
      dataIndex: 'sampleStatusText',
      key: 'sampleStatusText',
      width: 120,
      onCell: (record) => ({
        rowSpan: record.sampleRowSpan,
      }),
      render: (text: string) => text || '-',
    },
    {
      title: 'Ngày chuyển',
      dataIndex: 'transferDate',
      key: 'transferDate',
      width: 100,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Ngày YC xong',
      dataIndex: 'requestCompletionDate',
      key: 'requestCompletionDate',
      width: 100,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Thời gian TN',
      dataIndex: 'testDate',
      key: 'testDate',
      width: 100,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Tên chỉ tiêu',
      dataIndex: 'indicatorName',
      key: 'indicatorName',
      width: 180,
      render: (text: string, record) => (
        record.indicatorFormattedName ? (
          <span dangerouslySetInnerHTML={{ __html: record.indicatorFormattedName }} />
        ) : (text || '-')
      ),
    },
    {
      title: 'Phương pháp',
      dataIndex: 'methodName',
      key: 'methodName',
      width: 150,
      render: (text: string, record) => (
        record.methodFormattedName ? (
          <span dangerouslySetInnerHTML={{ __html: record.methodFormattedName }} />
        ) : (text || '-')
      ),
    },
    {
      title: 'ĐVT',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (text: string) => text || '-',
    },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (text: string) => <strong>{text || '-'}</strong>,
    },
    {
      title: 'QL kỹ thuật',
      dataIndex: 'technicalManagerName',
      key: 'technicalManagerName',
      width: 130,
      render: (text: string) => text || '-',
    },
    {
      title: 'Kỹ thuật viên',
      dataIndex: 'technicianName',
      key: 'technicianName',
      width: 130,
      render: (text: string) => text || '-',
    },
    {
      title: 'Ngày nhập',
      dataIndex: 'entryDate',
      key: 'entryDate',
      width: 100,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Ngày QL duyệt',
      dataIndex: 'qlktApprovalDate',
      key: 'qlktApprovalDate',
      width: 100,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Tình trạng',
      dataIndex: 'testRequestStatus',
      key: 'testRequestStatus',
      width: 130,
      fixed: 'right',
      render: (status: TestRequestStatus) => (
        <Tag color={TestRequestStatusColors[status] || 'default'}>
          {TestRequestStatusLabels[status] || 'Không xác định'}
        </Tag>
      ),
    },
  ], []);

  // Status filter options
  const statusOptions = useMemo(() => [
    { value: undefined, label: 'Tất cả' },
    { value: TestRequestStatus.New, label: TestRequestStatusLabels[TestRequestStatus.New] },
    { value: TestRequestStatus.UnderReview, label: TestRequestStatusLabels[TestRequestStatus.UnderReview] },
    { value: TestRequestStatus.InProgress, label: TestRequestStatusLabels[TestRequestStatus.InProgress] },
    { value: TestRequestStatus.Completed, label: TestRequestStatusLabels[TestRequestStatus.Completed] },
  ], []);

  return (
    <div className="sample-assignment-log-tab">
      {/* Toolbar */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
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
              style={{ width: '100%' }}
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
      </Card>

      {/* Table */}
      <Card size="small">
        <Table<ProcessedLogItem>
          columns={columns}
          dataSource={processedData}
          loading={loading}
          rowKey="_rowKey"
          rowClassName={getRowClassName}
          onRow={(record) => ({
            onDoubleClick: () => handleRowDoubleClick(record),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} chỉ tiêu`,
            pageSizeOptions: ['20', '50', '100'],
          }}
          onChange={(pag) => handleTableChange({
            current: pag.current,
            pageSize: pag.pageSize,
          })}
          scroll={{ x: 2200 }}
          size="small"
          bordered
        />
      </Card>
    </div>
  );
};

export default SampleAssignmentLogTab;
