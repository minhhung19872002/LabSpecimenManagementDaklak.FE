// @ts-nocheck
import React, { useState, useEffect } from 'react';
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
  Modal,
  Descriptions,
  Typography,
  Statistic,
  Avatar,
  Tooltip,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  HistoryOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { auditLogService, AuditLogDto } from '../../services/auditLogService';

dayjs.extend(isToday);

const { RangePicker } = DatePicker;
const { Text } = Typography;

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


  const getHttpMethodTag = (method: string) => {
    const config: Record<string, { color: string }> = {
      GET: { color: 'blue' },
      POST: { color: 'green' },
      PUT: { color: 'orange' },
      DELETE: { color: 'red' },
      PATCH: { color: 'purple' },
    };
    const c = config[method] || { color: 'default' };
    return <Tag color={c.color}>{method}</Tag>;
  };

  const getStatusCodeTag = (code: number | undefined) => {
    if (!code) return null;
    let color = 'default';
    if (code >= 200 && code < 300) color = 'green';
    else if (code >= 400 && code < 500) color = 'orange';
    else if (code >= 500) color = 'red';
    return <Tag color={color}>{code}</Tag>;
  };

  const columns: ColumnsType<AuditLogDto> = [
    {
      title: 'Thời gian',
      dataIndex: 'executionTime',
      key: 'executionTime',
      width: 160,
      render: (executionTime: string) => (
        <Tooltip title={dayjs(executionTime).format('DD/MM/YYYY HH:mm:ss')}>
          <Text>{dayjs(executionTime).format('DD/MM/YYYY HH:mm')}</Text>
        </Tooltip>
      ),
      sorter: (a, b) => dayjs(a.executionTime).unix() - dayjs(b.executionTime).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Người dùng',
      key: 'user',
      width: 150,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{record.userName || 'Anonymous'}</Text>
        </Space>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'httpMethod',
      key: 'httpMethod',
      width: 90,
      render: (method: string) => method ? getHttpMethodTag(method) : '-',
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <Text>{url}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'httpStatusCode',
      key: 'httpStatusCode',
      width: 80,
      render: (code: number) => getStatusCodeTag(code),
    },
    {
      title: 'Thời gian (ms)',
      dataIndex: 'executionDuration',
      key: 'executionDuration',
      width: 110,
      render: (duration: number) => (
        <Text type={duration > 1000 ? 'danger' : undefined}>{duration} ms</Text>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'clientIpAddress',
      key: 'clientIpAddress',
      width: 120,
      render: (ip: string) => {
        // Convert localhost addresses to readable format
        if (ip === '::1' || ip === '127.0.0.1') return 'localhost';
        return ip;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
      ),
    },
  ];

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
      <Modal
        title="Chi tiết Audit Log"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        {selectedLog && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Thời gian">
                {dayjs(selectedLog.executionTime).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian xử lý">
                {selectedLog.executionDuration} ms
              </Descriptions.Item>
              <Descriptions.Item label="Người thực hiện">
                {selectedLog.userName || 'Anonymous'}
              </Descriptions.Item>
              <Descriptions.Item label="HTTP Method">
                {selectedLog.httpMethod ? getHttpMethodTag(selectedLog.httpMethod) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="URL" span={2}>
                {selectedLog.url}
              </Descriptions.Item>
              <Descriptions.Item label="HTTP Status">
                {getStatusCodeTag(selectedLog.httpStatusCode)}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ IP">
                {selectedLog.clientIpAddress === '::1' || selectedLog.clientIpAddress === '127.0.0.1'
                  ? 'localhost'
                  : selectedLog.clientIpAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Trình duyệt" span={2}>
                <Text style={{ fontSize: 12 }}>{selectedLog.browserInfo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Application">
                {selectedLog.applicationName}
              </Descriptions.Item>
              <Descriptions.Item label="Correlation ID">
                <Text copyable style={{ fontSize: 12 }}>{selectedLog.correlationId}</Text>
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.entityChanges && selectedLog.entityChanges.length > 0 && (
              <>
                <Text strong>Entity Changes:</Text>
                {selectedLog.entityChanges.map((change, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    <Tag color="blue">{change.changeType}</Tag>
                    <Text type="secondary" style={{ marginLeft: 8 }}>{change.entityTypeFullName}</Text>
                    {change.propertyChanges && change.propertyChanges.length > 0 && (
                      <Table
                        style={{ marginTop: 8 }}
                        dataSource={change.propertyChanges}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: 'Property', dataIndex: 'propertyName', key: 'propertyName' },
                          {
                            title: 'Giá trị cũ',
                            dataIndex: 'originalValue',
                            key: 'originalValue',
                            render: (val) => val ? <Text delete type="danger">{val}</Text> : '-',
                          },
                          {
                            title: 'Giá trị mới',
                            dataIndex: 'newValue',
                            key: 'newValue',
                            render: (val) => val ? <Text type="success">{val}</Text> : '-',
                          },
                        ]}
                      />
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogList;
