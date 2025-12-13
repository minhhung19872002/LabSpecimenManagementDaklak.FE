// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Row,
  Col,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Avatar,
  Progress,
  Statistic,
  Timeline,
  Tabs,
  Badge,
  Tooltip,
  List
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { mockTaskAssignments, mockUsers, mockDepartments } from '../../mocks/mockData';

// Types
interface TaskAssignment {
  id: string;
  taskNumber: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'adhoc';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  assignedTo: string;
  assignedBy: string;
  department: string;
  relatedTestRequests: string[];
  relatedSpecimens: string[];
  dueDate: string;
  startDate?: string;
  completedDate?: string;
  progress: number;
  notes?: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  department: string;
  role: string;
  avatar?: string;
  taskCount: number;
  completedCount: number;
}

// Convert centralized mock data to TaskAssignment format
const generateMockTasks = (): TaskAssignment[] => {
  // Start with centralized task assignments
  const baseTasks: TaskAssignment[] = mockTaskAssignments.map(task => ({
    id: task.id,
    taskNumber: task.taskNumber,
    title: task.title,
    description: task.description,
    type: task.type as TaskAssignment['type'],
    priority: task.priority as TaskAssignment['priority'],
    status: task.status as TaskAssignment['status'],
    assignedTo: task.assignedToName,
    assignedBy: task.assignedByName,
    department: task.department,
    relatedTestRequests: task.relatedTestRequests,
    relatedSpecimens: task.relatedSpecimens,
    dueDate: task.dueDate,
    startDate: task.startDate || undefined,
    completedDate: task.completedDate || undefined,
    progress: task.progress,
    notes: task.notes || undefined,
    createdAt: task.createdAt,
  }));

  // Generate additional tasks for demo using centralized users
  const additionalTasks: TaskAssignment[] = [];
  const titles = [
    'Phân tích mẫu nước giếng khoan - Lô 002',
    'Kiểm nghiệm vi sinh thực phẩm - Công ty XYZ',
    'Phân tích dư lượng thuốc BVTV - Mẫu rau',
    'Hiệu chuẩn thiết bị pH - Phòng Hóa học',
    'Báo cáo kết quả tháng 12/2025',
    'Kiểm tra độ ẩm mẫu đất - HTX BMT',
    'Phân tích kim loại nặng - Mẫu phân bón',
  ];
  const types: TaskAssignment['type'][] = ['daily', 'weekly', 'adhoc', 'monthly'];
  const priorities: TaskAssignment['priority'][] = ['high', 'medium', 'low'];
  const statuses: TaskAssignment['status'][] = ['pending', 'accepted', 'in_progress', 'completed', 'in_progress'];

  for (let i = 0; i < 10; i++) {
    const user = mockUsers[(i + 2) % mockUsers.length]; // Start from technicians
    const createdDate = dayjs().subtract(i + baseTasks.length, 'day');
    const dueDate = createdDate.add(3 + Math.floor(Math.random() * 7), 'day');
    const status = statuses[i % statuses.length];
    const progress = status === 'completed' ? 100 : status === 'in_progress' ? 30 + Math.floor(Math.random() * 60) : status === 'accepted' ? 10 : 0;

    additionalTasks.push({
      id: `task-extra-${String(i + 1).padStart(3, '0')}`,
      taskNumber: `TASK-${dayjs().subtract(i, 'day').format('YYYYMMDD')}-${String(baseTasks.length + i + 1).padStart(4, '0')}`,
      title: titles[i % titles.length],
      description: `Mô tả công việc ${i + 1}`,
      type: types[i % types.length],
      priority: priorities[i % priorities.length],
      status: status,
      assignedTo: user.fullName,
      assignedBy: mockUsers[1].fullName, // Lab manager
      department: user.department,
      relatedTestRequests: [`REQ-${dayjs().format('YYYYMMDD')}-${String((i % 5) + 1).padStart(4, '0')}`],
      relatedSpecimens: [`SPE-${dayjs().format('YYYYMMDD')}-${String((i % 8) + 1).padStart(4, '0')}`],
      dueDate: dueDate.toISOString(),
      startDate: status !== 'pending' ? createdDate.add(1, 'day').toISOString() : undefined,
      completedDate: status === 'completed' ? dueDate.subtract(1, 'day').toISOString() : undefined,
      progress: progress,
      notes: i % 3 === 0 ? `Ghi chú công việc ${i + 1}` : undefined,
      createdAt: createdDate.toISOString(),
    });
  }

  return [...baseTasks, ...additionalTasks];
};

// Generate team members from centralized users
const generateTeamMembers = (): TeamMember[] => {
  // Filter users who can be assigned tasks (Technicians, LabManager)
  const eligibleUsers = mockUsers.filter(u =>
    u.role === 'Technician' || u.role === 'LabManager' || u.role === 'Reviewer'
  );

  return eligibleUsers.map(user => {
    const allTasks = generateMockTasks();
    const userTasks = allTasks.filter(t => t.assignedTo === user.fullName);
    const completedTasks = userTasks.filter(t => t.status === 'completed');

    return {
      id: user.id,
      name: user.fullName,
      department: user.department,
      role: user.role === 'LabManager' ? 'Trưởng phòng' :
            user.role === 'Reviewer' ? 'Người duyệt' : 'Kỹ thuật viên',
      taskCount: userTasks.length || Math.floor(Math.random() * 5) + 3,
      completedCount: completedTasks.length || Math.floor(Math.random() * 3) + 1,
    };
  });
};

const TaskAssignmentList: React.FC = () => {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskAssignment[]>([]);
  const [teamMembers] = useState<TeamMember[]>(generateTeamMembers());
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaskAssignment | null>(null);
  const [form] = Form.useForm();

  // Use centralized departments (filter out non-lab departments)
  const departments = mockDepartments
    .filter(d => d.name.includes('Phòng'))
    .map(d => d.name);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...tasks];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.taskNumber.toLowerCase().includes(search) ||
        item.title.toLowerCase().includes(search) ||
        item.assignedTo.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(item => item.department === departmentFilter);
    }

    setFilteredTasks(filtered);
  }, [searchText, statusFilter, departmentFilter, tasks]);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      const mockData = generateMockTasks();
      setTasks(mockData);
      setFilteredTasks(mockData);
      setLoading(false);
    }, 500);
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      taskNumber: `TASK-${dayjs().format('YYYYMMDD')}-${String(tasks.length + 1).padStart(4, '0')}`,
      status: 'pending',
      priority: 'medium',
      type: 'adhoc',
      dueDate: dayjs().add(3, 'day'),
      progress: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: TaskAssignment) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      dueDate: dayjs(record.dueDate),
      startDate: record.startDate ? dayjs(record.startDate) : null,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(item => item.id !== id));
    message.success('Xóa công việc thành công!');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newItem: TaskAssignment = {
        id: editingItem?.id || `task-${Date.now()}`,
        taskNumber: values.taskNumber,
        title: values.title,
        description: values.description,
        type: values.type,
        priority: values.priority,
        status: values.status,
        assignedTo: values.assignedTo,
        assignedBy: 'Trưởng phòng',
        department: values.department,
        relatedTestRequests: values.relatedTestRequests || [],
        relatedSpecimens: values.relatedSpecimens || [],
        dueDate: values.dueDate.toISOString(),
        startDate: values.startDate?.toISOString(),
        progress: values.progress || 0,
        notes: values.notes,
        createdAt: editingItem?.createdAt || dayjs().toISOString(),
      };

      if (editingItem) {
        setTasks(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
        message.success('Cập nhật công việc thành công!');
      } else {
        setTasks(prev => [newItem, ...prev]);
        message.success('Giao việc thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'default', text: 'Chờ nhận', icon: <ClockCircleOutlined /> },
      accepted: { color: 'blue', text: 'Đã nhận', icon: <CheckCircleOutlined /> },
      in_progress: { color: 'processing', text: 'Đang thực hiện', icon: <ClockCircleOutlined /> },
      completed: { color: 'success', text: 'Hoàn thành', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', text: 'Từ chối', icon: <ExclamationCircleOutlined /> },
    };
    const c = config[status];
    return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const config: Record<string, { color: string; text: string }> = {
      high: { color: 'red', text: 'Cao' },
      medium: { color: 'orange', text: 'Trung bình' },
      low: { color: 'green', text: 'Thấp' },
    };
    return <Tag color={config[priority].color}>{config[priority].text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const config: Record<string, { color: string; text: string }> = {
      daily: { color: 'cyan', text: 'Hàng ngày' },
      weekly: { color: 'blue', text: 'Hàng tuần' },
      monthly: { color: 'purple', text: 'Hàng tháng' },
      adhoc: { color: 'default', text: 'Đột xuất' },
    };
    return <Tag color={config[type].color}>{config[type].text}</Tag>;
  };

  // Statistics
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress' || t.status === 'accepted').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => dayjs(t.dueDate).isBefore(dayjs()) && t.status !== 'completed').length,
  };

  const columns: ColumnsType<TaskAssignment> = [
    {
      title: 'Mã công việc',
      dataIndex: 'taskNumber',
      key: 'taskNumber',
      width: 180,
      fixed: 'left',
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      ellipsis: true,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 150,
      render: (name: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {name}
        </Space>
      ),
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      width: 140,
    },
    {
      title: 'Hạn hoàn thành',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 130,
      render: (date: string) => {
        const d = dayjs(date);
        const isOverdue = d.isBefore(dayjs());
        return (
          <Tooltip title={isOverdue ? 'Quá hạn!' : ''}>
            <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
              {d.format('DD/MM/YYYY')}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Tiến độ',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number) => (
        <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Tổng công việc" value={stats.total} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Chờ nhận" value={stats.pending} styles={{ content: { color: '#8c8c8c' } }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Đang thực hiện" value={stats.inProgress} styles={{ content: { color: '#1890ff' } }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Hoàn thành" value={stats.completed} styles={{ content: { color: '#52c41a' } }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Quá hạn" value={stats.overdue} styles={{ content: { color: '#ff4d4f' } }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành"
              value={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
              suffix="%"
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <TeamOutlined />
            Giao việc & Phân công công việc
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Giao việc mới
            </Button>
          </Space>
        }
      >
        <Tabs
          items={[
            {
              key: 'tasks',
              label: 'Danh sách công việc',
              children: (
                <>
                  {/* Search & Filter */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8}>
                      <Input
                        placeholder="Tìm kiếm theo mã, tiêu đề, người thực hiện..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                      />
                    </Col>
                    <Col xs={24} sm={6} md={4}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Trạng thái"
                        value={statusFilter}
                        onChange={setStatusFilter}
                      >
                        <Select.Option value="all">Tất cả</Select.Option>
                        <Select.Option value="pending">Chờ nhận</Select.Option>
                        <Select.Option value="accepted">Đã nhận</Select.Option>
                        <Select.Option value="in_progress">Đang thực hiện</Select.Option>
                        <Select.Option value="completed">Hoàn thành</Select.Option>
                      </Select>
                    </Col>
                    <Col xs={24} sm={6} md={4}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Phòng ban"
                        value={departmentFilter}
                        onChange={setDepartmentFilter}
                      >
                        <Select.Option value="all">Tất cả phòng</Select.Option>
                        {departments.map(d => (
                          <Select.Option key={d} value={d}>{d}</Select.Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>

                  <Table
                    columns={columns}
                    dataSource={filteredTasks}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      showSizeChanger: true,
                      showTotal: (total) => `Tổng ${total} công việc`,
                    }}
                    scroll={{ x: 1600 }}
                  />
                </>
              ),
            },
            {
              key: 'team',
              label: 'Nhân viên',
              children: (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                  dataSource={teamMembers}
                  renderItem={(member) => (
                    <List.Item>
                      <Card>
                        <Card.Meta
                          avatar={<Avatar size={64} icon={<UserOutlined />} />}
                          title={member.name}
                          description={
                            <Space direction="vertical" size={4}>
                              <Tag color="blue">{member.department}</Tag>
                              <span>{member.role}</span>
                              <Progress
                                percent={Math.round((member.completedCount / member.taskCount) * 100)}
                                size="small"
                                format={() => `${member.completedCount}/${member.taskCount}`}
                              />
                            </Space>
                          }
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa công việc' : 'Giao việc mới'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText={editingItem ? 'Cập nhật' : 'Giao việc'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="taskNumber" label="Mã công việc" rules={[{ required: true }]}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="Loại công việc" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="daily">Hàng ngày</Select.Option>
                  <Select.Option value="weekly">Hàng tuần</Select.Option>
                  <Select.Option value="monthly">Hàng tháng</Select.Option>
                  <Select.Option value="adhoc">Đột xuất</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="Mức ưu tiên" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="high">Cao</Select.Option>
                  <Select.Option value="medium">Trung bình</Select.Option>
                  <Select.Option value="low">Thấp</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="Tiêu đề công việc" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignedTo" label="Người thực hiện" rules={[{ required: true }]}>
                <Select>
                  {teamMembers.map(m => (
                    <Select.Option key={m.id} value={m.name}>{m.name} - {m.department}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Phòng ban" rules={[{ required: true }]}>
                <Select>
                  {departments.map(d => (
                    <Select.Option key={d} value={d}>{d}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="dueDate" label="Hạn hoàn thành" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Select.Option value="pending">Chờ nhận</Select.Option>
                  <Select.Option value="accepted">Đã nhận</Select.Option>
                  <Select.Option value="in_progress">Đang thực hiện</Select.Option>
                  <Select.Option value="completed">Hoàn thành</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="progress" label="Tiến độ (%)">
                <Select>
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                    <Select.Option key={p} value={p}>{p}%</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskAssignmentList;
