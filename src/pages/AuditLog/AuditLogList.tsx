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
  Timeline,
  Typography,
  Statistic,
  Avatar,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  HistoryOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';

dayjs.extend(isToday);

const { RangePicker } = DatePicker;
const { Text } = Typography;

// Types
interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject' | 'submit';
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  changes?: FieldChange[];
}

interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

// Mock data
const generateMockData = (): AuditLog[] => {
  const users = [
    { id: '1', name: 'Nguyễn Văn A', role: 'Kỹ thuật viên' },
    { id: '2', name: 'Trần Thị B', role: 'Trưởng phòng' },
    { id: '3', name: 'Lê Văn C', role: 'Giám đốc' },
    { id: '4', name: 'Admin', role: 'Quản trị viên' },
  ];

  const actions: AuditLog['action'][] = ['create', 'update', 'delete', 'view', 'approve', 'submit'];

  const entityTypes = [
    { type: 'TestRequest', name: 'Yêu cầu thử nghiệm' },
    { type: 'Specimen', name: 'Mẫu thử nghiệm' },
    { type: 'Test', name: 'Phép thử' },
    { type: 'TestResult', name: 'Kết quả thử nghiệm' },
    { type: 'Report', name: 'Báo cáo' },
    { type: 'User', name: 'Người dùng' },
  ];

  return Array.from({ length: 100 }, (_, i) => {
    const user = users[i % users.length];
    const action = actions[i % actions.length];
    const entityType = entityTypes[i % entityTypes.length];
    const timestamp = dayjs().subtract(i * 30, 'minute');

    let description = '';
    let changes: FieldChange[] | undefined;

    switch (action) {
      case 'create':
        description = `Tạo mới ${entityType.name} #${i + 1}`;
        break;
      case 'update':
        description = `Cập nhật ${entityType.name} #${i + 1}`;
        changes = [
          { field: 'Trạng thái', oldValue: 'Chờ xử lý', newValue: 'Đang thực hiện' },
          { field: 'Ghi chú', oldValue: 'Ghi chú cũ', newValue: 'Ghi chú mới đã cập nhật' },
        ];
        break;
      case 'delete':
        description = `Xóa ${entityType.name} #${i + 1}`;
        break;
      case 'view':
        description = `Xem ${entityType.name} #${i + 1}`;
        break;
      case 'approve':
        description = `Phê duyệt ${entityType.name} #${i + 1}`;
        break;
      case 'submit':
        description = `Nộp ${entityType.name} #${i + 1}`;
        break;
    }

    return {
      id: `log-${String(i + 1).padStart(5, '0')}`,
      timestamp: timestamp.toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      entityType: entityType.type,
      entityId: `${entityType.type.toLowerCase()}-${i + 1}`,
      entityName: `${entityType.name} #${i + 1}`,
      description,
      ipAddress: `192.168.1.${100 + (i % 50)}`,
      userAgent: 'Chrome 120.0.0.0',
      changes,
    };
  });
};

const AuditLogList: React.FC = () => {
  const [data, setData] = useState<AuditLog[]>([]);
  const [filteredData, setFilteredData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...data];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(search) ||
        item.userName.toLowerCase().includes(search) ||
        item.entityName.toLowerCase().includes(search)
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(item => item.action === actionFilter);
    }

    if (entityFilter !== 'all') {
      filtered = filtered.filter(item => item.entityType === entityFilter);
    }

    if (userFilter !== 'all') {
      filtered = filtered.filter(item => item.userName === userFilter);
    }

    if (dateRange) {
      filtered = filtered.filter(item => {
        const date = dayjs(item.timestamp);
        return date.isAfter(dateRange[0].startOf('day')) && date.isBefore(dateRange[1].endOf('day'));
      });
    }

    setFilteredData(filtered);
  }, [searchText, actionFilter, entityFilter, userFilter, dateRange, data]);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      const mockData = generateMockData();
      setData(mockData);
      setFilteredData(mockData);
      setLoading(false);
    }, 500);
  };

  const handleViewDetail = (record: AuditLog) => {
    setSelectedLog(record);
    setIsDetailModalOpen(true);
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      create: <PlusOutlined />,
      update: <EditOutlined />,
      delete: <DeleteOutlined />,
      view: <EyeOutlined />,
      approve: <CheckCircleOutlined />,
      submit: <FileTextOutlined />,
    };
    return icons[action] || <HistoryOutlined />;
  };

  const getActionTag = (action: string) => {
    const config: Record<string, { color: string; text: string }> = {
      create: { color: 'green', text: 'Tạo mới' },
      update: { color: 'blue', text: 'Cập nhật' },
      delete: { color: 'red', text: 'Xóa' },
      view: { color: 'default', text: 'Xem' },
      approve: { color: 'cyan', text: 'Phê duyệt' },
      reject: { color: 'volcano', text: 'Từ chối' },
      submit: { color: 'purple', text: 'Nộp' },
    };
    const c = config[action] || { color: 'default', text: action };
    return <Tag color={c.color} icon={getActionIcon(action)}>{c.text}</Tag>;
  };

  const getEntityTypeTag = (entityType: string) => {
    const config: Record<string, { color: string; text: string }> = {
      TestRequest: { color: 'blue', text: 'Yêu cầu' },
      Specimen: { color: 'green', text: 'Mẫu' },
      Test: { color: 'purple', text: 'Phép thử' },
      TestResult: { color: 'cyan', text: 'Kết quả' },
      Report: { color: 'orange', text: 'Báo cáo' },
      User: { color: 'red', text: 'Người dùng' },
    };
    const c = config[entityType] || { color: 'default', text: entityType };
    return <Tag color={c.color}>{c.text}</Tag>;
  };

  // Get unique users for filter
  const uniqueUsers = [...new Set(data.map(d => d.userName))];

  // Statistics
  const stats = {
    total: data.length,
    today: data.filter(d => dayjs(d.timestamp).isToday()).length,
    creates: data.filter(d => d.action === 'create').length,
    updates: data.filter(d => d.action === 'update').length,
    deletes: data.filter(d => d.action === 'delete').length,
    approves: data.filter(d => d.action === 'approve').length,
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: string) => (
        <Tooltip title={dayjs(timestamp).format('DD/MM/YYYY HH:mm:ss')}>
          <Text>{dayjs(timestamp).format('DD/MM/YYYY HH:mm')}</Text>
        </Tooltip>
      ),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Người dùng',
      key: 'user',
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{record.userName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.userRole}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => getActionTag(action),
    },
    {
      title: 'Loại dữ liệu',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 120,
      render: (entityType: string) => getEntityTypeTag(entityType),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
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
            <Statistic title="Hôm nay" value={stats.today} styles={{ content: { color: '#1890ff' } }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Tạo mới" value={stats.creates} styles={{ content: { color: '#52c41a' } }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Cập nhật" value={stats.updates} styles={{ content: { color: '#1890ff' } }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Xóa" value={stats.deletes} styles={{ content: { color: '#ff4d4f' } }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Phê duyệt" value={stats.approves} styles={{ content: { color: '#13c2c2' } }} />
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
          <Button icon={<ReloadOutlined />} onClick={loadData}>Làm mới</Button>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="Hành động"
              value={actionFilter}
              onChange={setActionFilter}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="create">Tạo mới</Select.Option>
              <Select.Option value="update">Cập nhật</Select.Option>
              <Select.Option value="delete">Xóa</Select.Option>
              <Select.Option value="view">Xem</Select.Option>
              <Select.Option value="approve">Phê duyệt</Select.Option>
              <Select.Option value="submit">Nộp</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="Loại dữ liệu"
              value={entityFilter}
              onChange={setEntityFilter}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="TestRequest">Yêu cầu</Select.Option>
              <Select.Option value="Specimen">Mẫu</Select.Option>
              <Select.Option value="Test">Phép thử</Select.Option>
              <Select.Option value="TestResult">Kết quả</Select.Option>
              <Select.Option value="Report">Báo cáo</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="Người dùng"
              value={userFilter}
              onChange={setUserFilter}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              {uniqueUsers.map(u => (
                <Select.Option key={u} value={u}>{u}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Từ ngày', 'Đến ngày']}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
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
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            defaultPageSize: 20,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết lịch sử thay đổi"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedLog && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Thời gian">
                {dayjs(selectedLog.timestamp).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Hành động">
                {getActionTag(selectedLog.action)}
              </Descriptions.Item>
              <Descriptions.Item label="Người thực hiện">
                {selectedLog.userName}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                {selectedLog.userRole}
              </Descriptions.Item>
              <Descriptions.Item label="Loại dữ liệu">
                {getEntityTypeTag(selectedLog.entityType)}
              </Descriptions.Item>
              <Descriptions.Item label="ID đối tượng">
                {selectedLog.entityId}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {selectedLog.description}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ IP">
                {selectedLog.ipAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Trình duyệt">
                {selectedLog.userAgent}
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.changes && selectedLog.changes.length > 0 && (
              <>
                <Text strong>Chi tiết thay đổi:</Text>
                <Table
                  style={{ marginTop: 8 }}
                  dataSource={selectedLog.changes}
                  rowKey="field"
                  pagination={false}
                  columns={[
                    { title: 'Trường', dataIndex: 'field', key: 'field' },
                    {
                      title: 'Giá trị cũ',
                      dataIndex: 'oldValue',
                      key: 'oldValue',
                      render: (val) => <Text delete type="danger">{val}</Text>,
                    },
                    {
                      title: 'Giá trị mới',
                      dataIndex: 'newValue',
                      key: 'newValue',
                      render: (val) => <Text type="success">{val}</Text>,
                    },
                  ]}
                />
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogList;
