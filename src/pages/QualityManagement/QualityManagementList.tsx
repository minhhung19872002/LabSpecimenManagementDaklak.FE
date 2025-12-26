import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Typography,
  message,
} from 'antd';
import {
  SafetyCertificateOutlined,
  SearchOutlined,
  ReloadOutlined,
  HistoryOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { qualityManagementService } from '../../services/qualityManagementService';
import {
  QualityManagementTaskDto,
  QualityManagementStatus,
  QualityManagementStatusLabels,
  QualityManagementStatusColors,
  QualityManagementStatisticsDto,
  QualityTaskType,
} from '../../types/qualityManagement';
import HistoryModal from './components/HistoryModal';
import ChangeApprovalModal from './components/ChangeApprovalModal';

const { Title } = Typography;

const QualityManagementList: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<QualityManagementTaskDto[]>([]);
  const [statistics, setStatistics] = useState<QualityManagementStatisticsDto | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<QualityManagementStatus | undefined>(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // History Modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<QualityManagementTaskDto | null>(null);

  // Change Approval Modal
  const [changeApprovalModalVisible, setChangeApprovalModalVisible] = useState(false);
  const [selectedChangeApprovalTaskId, setSelectedChangeApprovalTaskId] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksResult, statsResult] = await Promise.all([
        qualityManagementService.getList({
          skipCount: (pagination.current - 1) * pagination.pageSize,
          maxResultCount: pagination.pageSize,
          search: searchText || undefined,
          status: statusFilter,
        }),
        qualityManagementService.getStatistics(),
      ]);

      setTasks(tasksResult.items);
      setPagination((prev) => ({ ...prev, total: tasksResult.totalCount }));
      setStatistics(statsResult);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value: QualityManagementStatus | undefined) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination({
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: pagination.total,
    });
  };

  const handleRowDoubleClick = (record: QualityManagementTaskDto) => {
    // ChangeApproval: show modal, ResultApproval: navigate to detail
    if (record.taskType === QualityTaskType.ChangeApproval) {
      setSelectedChangeApprovalTaskId(record.id);
      setChangeApprovalModalVisible(true);
    } else {
      navigate(`/quality-management/${record.id}`);
    }
  };

  const handleViewHistory = (record: QualityManagementTaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(record);
    setHistoryModalVisible(true);
  };

  // Check if row is urgent (RequestCompletionDate - now <= 2 days)
  const isUrgent = (record: QualityManagementTaskDto): boolean => {
    if (!record.requestCompletionDate) return false;
    if (record.status === QualityManagementStatus.ResultSent) return false;
    const daysRemaining = dayjs(record.requestCompletionDate).diff(dayjs(), 'day');
    return daysRemaining <= 2;
  };

  // Status tag render
  const getStatusTag = (status: QualityManagementStatus) => (
    <Tag color={QualityManagementStatusColors[status]}>
      {QualityManagementStatusLabels[status]}
    </Tag>
  );

  // Columns
  const columns: ColumnsType<QualityManagementTaskDto> = [
    {
      title: 'Số hợp đồng',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 150,
      fixed: 'left' as const,
      render: (text: string, record: QualityManagementTaskDto) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.taskType === QualityTaskType.ChangeApproval && (
            <Tag color="orange" style={{ fontSize: 10 }}>Thay đổi</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Tổng số mẫu',
      dataIndex: 'totalSampleCount',
      key: 'totalSampleCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Tổng số chỉ tiêu',
      dataIndex: 'totalIndicatorCount',
      key: 'totalIndicatorCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: 'Khoa phòng',
      dataIndex: 'laboratoryNames',
      key: 'laboratoryNames',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Ngày chuyển đi',
      dataIndex: 'transferDate',
      key: 'transferDate',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Ngày YC xong',
      dataIndex: 'requestCompletionDate',
      key: 'requestCompletionDate',
      width: 120,
      render: (date: string, record: QualityManagementTaskDto) => {
        if (!date) return '-';
        const formatted = dayjs(date).format('DD/MM/YYYY');
        if (isUrgent(record)) {
          return (
            <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
              <WarningOutlined style={{ marginRight: 4 }} />
              {formatted}
            </span>
          );
        }
        return formatted;
      },
    },
    {
      title: 'Ngày gửi KQ',
      dataIndex: 'resultSentDate',
      key: 'resultSentDate',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      fixed: 'right' as const,
      render: (status: QualityManagementStatus) => getStatusTag(status),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: QualityManagementTaskDto) => (
        <Space size="small">
          {record.taskType === QualityTaskType.ChangeApproval && (
            <Button
              type="text"
              icon={<AuditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedChangeApprovalTaskId(record.id);
                setChangeApprovalModalVisible(true);
              }}
              title="Xem xét thay đổi"
            />
          )}
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={(e) => handleViewHistory(record, e)}
            title="Xem lịch sử"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          Quản lý chất lượng
        </Title>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Hợp đồng chờ phê duyệt"
              value={statistics?.pendingApprovalCount || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Hợp đồng trễ hạn"
              value={statistics?.overdueCount || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Chờ ký"
              value={statistics?.pendingSignatureCount || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Tìm theo hợp đồng, QLKT..."
              prefix={<SearchOutlined />}
              allowClear
              onSearch={handleSearch}
              enterButton
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Lọc theo trạng thái"
              allowClear
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              {Object.entries(QualityManagementStatusLabels).map(([key, label]) => (
                <Select.Option key={key} value={Number(key)}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card size="small">
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            pageSizeOptions: ['20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onDoubleClick: () => handleRowDoubleClick(record),
            style: { cursor: 'pointer' },
            className: isUrgent(record) ? 'urgent-row' : '',
          })}
          size="small"
        />
      </Card>

      {/* History Modal */}
      <HistoryModal
        visible={historyModalVisible}
        task={selectedTask}
        onClose={() => {
          setHistoryModalVisible(false);
          setSelectedTask(null);
        }}
      />

      {/* Change Approval Modal */}
      <ChangeApprovalModal
        visible={changeApprovalModalVisible}
        taskId={selectedChangeApprovalTaskId}
        onClose={() => {
          setChangeApprovalModalVisible(false);
          setSelectedChangeApprovalTaskId(null);
        }}
        onUpdated={loadData}
      />

      <style>{`
        .urgent-row {
          background-color: #fff2f0 !important;
        }
        .urgent-row:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
};

export default QualityManagementList;
