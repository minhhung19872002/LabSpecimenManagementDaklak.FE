// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Space,
  Tag,
  Input,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Statistic,
  message,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import { auditLogService, AuditLogDto } from "../../services/auditLogService";
import { getAuditLogColumns } from "./columns";
import AuditLogDetailModal from "./components/AuditLogDetailModal";

dayjs.extend(isToday);

const { RangePicker } = DatePicker;

const AuditLogList: React.FC = () => {
  const [data, setData] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    gets: 0,
    posts: 0,
    puts: 0,
    deletes: 0,
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Load data when filters or pagination changes
  useEffect(() => {
    loadData();
  }, [methodFilter, dateRange, pagination.current, pagination.pageSize]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const result = await auditLogService.getStatistics();
      setStats(result);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: 'executionTime desc',
      };

      // Apply filters
      if (methodFilter !== 'all') {
        params.httpMethod = methodFilter;
      }
      if (dateRange) {
        params.startTime = dateRange[0].startOf('day').toISOString();
        params.endTime = dateRange[1].endOf('day').toISOString();
      }

      const result = await auditLogService.getList(params);
      setData(result.items || []);
      setPagination(prev => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error('Error loading audit logs:', error);
      message.error('Không thể tải lịch sử thay đổi. Vui lòng kiểm tra kết nối server.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle method filter change
  const handleMethodFilterChange = (value: string) => {
    setMethodFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle date range change
  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle table pagination change
  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchText('');
    setMethodFilter('all');
    setDateRange(null);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Local search filter (for URL search within current page)
  const filteredData = searchText
    ? data.filter(item =>
        item.url?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.userName?.toLowerCase().includes(searchText.toLowerCase())
      )
    : data;

  const handleViewDetail = (record: AuditLogDto) => {
    setSelectedLog(record);
    setIsDetailModalOpen(true);
  };

  const columns = getAuditLogColumns({ onViewDetail: handleViewDetail });

  return (
    <div>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Tổng lịch sử" value={stats.total} prefix={<HistoryOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Hôm nay" value={stats.today} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="GET" value={stats.gets} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="POST" value={stats.posts} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="PUT" value={stats.puts} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="DELETE" value={stats.deletes} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <HistoryOutlined />
            Lịch sử thay đổi dữ liệu (Audit Log)
            <Tag color="blue">ISO/IEC 17025:2017 - 7.11</Tag>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>Làm mới</Button>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm kiếm URL, người dùng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="HTTP Method"
              value={methodFilter}
              onChange={handleMethodFilterChange}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
              <Select.Option value="PUT">PUT</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
              <Select.Option value="PATCH">PATCH</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Từ ngày', 'Đến ngày']}
              value={dateRange}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            pageSizeOptions: [20, 50, 100],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Detail Modal */}
      <AuditLogDetailModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
};

export default AuditLogList;
