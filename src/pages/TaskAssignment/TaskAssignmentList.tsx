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
  Tabs,
  Tooltip,
  List
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
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
import {
  taskAssignmentService,
  TaskAssignmentDto,
  CreateTaskAssignmentDto,
  UpdateTaskAssignmentDto,
  TaskType,
  TaskPriority,
  TaskStatus,
  GetTaskAssignmentListInput
} from '../../services/taskAssignmentService';
import { departmentService, DepartmentDto } from '../../services/masterDataService';
import { userService, UserLookupDto } from '../../services/userService';

// Types
interface TaskDisplay extends TaskAssignmentDto {
  assignedToName?: string;
  assignedByName?: string;
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

const TaskAssignmentList: React.FC = () => {
  const [tasks, setTasks] = useState<TaskDisplay[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [users, setUsers] = useState<UserLookupDto[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaskDisplay | null>(null);
  const [form] = Form.useForm();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  useEffect(() => {
    loadDepartments();
    loadUsers();
    loadTeamMembers();
  }, []);

  // Load data when filters or pagination changes
  useEffect(() => {
    loadData();
  }, [searchText, statusFilter, departmentFilter, pagination.current, pagination.pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: GetTaskAssignmentListInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        filter: searchText || undefined,
        status: statusFilter,
        department: departmentFilter,
      };

      const response = await taskAssignmentService.getList(params);
      setTasks(response.items);
      setPagination(prev => ({ ...prev, total: response.totalCount }));
    } catch (error) {
      console.error('Failed to load task assignments:', error);
      message.error('Không thể tải danh sách công việc. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getActive();
      setDepartments(response.items);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const userList = await userService.getLookup();
      setUsers(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  // Load team members with task statistics
  const loadTeamMembers = async () => {
    setTeamLoading(true);
    try {
      // Load users first - this is the critical part
      const userList = await userService.getLookup();

      if (userList.length === 0) {
        console.warn('No users found from lookup API');
        setTeamMembers([]);
        return;
      }

      // Load all tasks to calculate statistics (can fail without blocking user list)
      // ABP limits MaxResultCount to 1000, so we need to load in batches
      let allTasks: TaskAssignmentDto[] = [];
      try {
        const pageSize = 1000;
        let skipCount = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await taskAssignmentService.getList({
            maxResultCount: pageSize,
            skipCount: skipCount,
          });
          const items = response.items || [];
          allTasks = [...allTasks, ...items];

          // Check if there are more items to load
          if (items.length < pageSize || allTasks.length >= response.totalCount) {
            hasMore = false;
          } else {
            skipCount += pageSize;
          }
        }
      } catch (taskError) {
        console.warn('Failed to load tasks for statistics, showing users without stats:', taskError);
      }

      // Calculate statistics for each user
      // Note: Compare IDs case-insensitively since GUIDs may have different casing
      const members: TeamMember[] = userList.map(user => {
        const normalizedUserId = user.id.toLowerCase();
        const userTasks = allTasks.filter(t => t.assignedToId?.toLowerCase() === normalizedUserId);
        const completedTasks = userTasks.filter(t => t.status === TaskStatus.Completed);

        return {
          id: user.id,
          name: user.displayName || user.name || user.userName,
          department: user.departmentName || 'Chưa phân phòng',
          role: user.position || 'Nhân viên',
          avatar: undefined,
          taskCount: userTasks.length,
          completedCount: completedTasks.length,
        };
      });

      // Sort: users with tasks first (by task count desc), then users without tasks
      const sortedMembers = members.sort((a, b) => {
        if (a.taskCount > 0 && b.taskCount === 0) return -1;
        if (a.taskCount === 0 && b.taskCount > 0) return 1;
        return b.taskCount - a.taskCount;
      });

      setTeamMembers(sortedMembers);
    } catch (error) {
      console.error('Failed to load team members:', error);
      message.error('Không thể tải danh sách nhân viên');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      status: TaskStatus.Pending,
      priority: TaskPriority.Medium,
      type: TaskType.Adhoc,
      dueDate: dayjs().add(3, 'day'),
      progress: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: TaskDisplay) => {
    setEditingItem(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      type: record.type,
      priority: record.priority,
      status: record.status,
      assignedToId: record.assignedToId,
      department: record.department,
      relatedEntityCode: record.relatedEntityCode,
      dueDate: dayjs(record.dueDate),
      progress: record.progress,
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await taskAssignmentService.delete(id);
      message.success('Xóa công việc thành công!');
      loadData();
    } catch (error) {
      console.error('Failed to delete task assignment:', error);
      message.error('Không thể xóa công việc. Vui lòng thử lại.');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingItem) {
        const updateData: UpdateTaskAssignmentDto = {
          title: values.title,
          description: values.description,
          type: values.type,
          priority: values.priority,
          status: values.status,
          assignedToId: values.assignedToId,
          department: values.department,
          relatedEntityCode: values.relatedEntityCode,
          dueDate: values.dueDate.toISOString(),
          progress: values.progress || 0,
          notes: values.notes,
        };
        await taskAssignmentService.update(editingItem.id, updateData);
        message.success('Cập nhật công việc thành công!');
      } else {
        const createData: CreateTaskAssignmentDto = {
          title: values.title,
          description: values.description,
          type: values.type,
          priority: values.priority,
          assignedToId: values.assignedToId,
          department: values.department,
          relatedEntityCode: values.relatedEntityCode,
          dueDate: values.dueDate.toISOString(),
          notes: values.notes,
        };
        await taskAssignmentService.create(createData);
        message.success('Giao việc thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('Failed to save task assignment:', error);
      message.error('Không thể lưu công việc. Vui lòng thử lại.');
    }
  };

  const getStatusTag = (status: number) => {
    const config: Record<number, { color: string; text: string; icon: React.ReactNode }> = {
      [TaskStatus.Pending]: { color: 'default', text: 'Chờ nhận', icon: <ClockCircleOutlined /> },
      [TaskStatus.Accepted]: { color: 'blue', text: 'Đã nhận', icon: <CheckCircleOutlined /> },
      [TaskStatus.InProgress]: { color: 'processing', text: 'Đang thực hiện', icon: <ClockCircleOutlined /> },
      [TaskStatus.Completed]: { color: 'success', text: 'Hoàn thành', icon: <CheckCircleOutlined /> },
      [TaskStatus.Rejected]: { color: 'error', text: 'Từ chối', icon: <ExclamationCircleOutlined /> },
      [TaskStatus.Cancelled]: { color: 'default', text: 'Đã hủy', icon: <ExclamationCircleOutlined /> },
    };
    const c = config[status];
    return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
  };

  const getPriorityTag = (priority: number) => {
    const config: Record<number, { color: string; text: string }> = {
      [TaskPriority.Low]: { color: 'green', text: 'Thấp' },
      [TaskPriority.Medium]: { color: 'orange', text: 'Trung bình' },
      [TaskPriority.High]: { color: 'red', text: 'Cao' },
      [TaskPriority.Urgent]: { color: 'magenta', text: 'Khẩn cấp' },
    };
    return <Tag color={config[priority].color}>{config[priority].text}</Tag>;
  };

  const getTypeTag = (type: number) => {
    const config: Record<number, { color: string; text: string }> = {
      [TaskType.Daily]: { color: 'cyan', text: 'Hàng ngày' },
      [TaskType.Weekly]: { color: 'blue', text: 'Hàng tuần' },
      [TaskType.Monthly]: { color: 'purple', text: 'Hàng tháng' },
      [TaskType.Adhoc]: { color: 'default', text: 'Đột xuất' },
    };
    return <Tag color={config[type].color}>{config[type].text}</Tag>;
  };

  // Statistics (use total from pagination for accurate count)
  const stats = {
    total: pagination.total,
    pending: tasks.filter(t => t.status === TaskStatus.Pending).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.InProgress || t.status === TaskStatus.Accepted).length,
    completed: tasks.filter(t => t.status === TaskStatus.Completed).length,
    overdue: tasks.filter(t => dayjs(t.dueDate).isBefore(dayjs()) && t.status !== TaskStatus.Completed).length,
  };

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all' ? undefined : Number(value) as TaskStatus);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  // Handle department filter change
  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value === 'all' ? undefined : value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  // Handle table pagination change
  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  // Handle refresh - reset filters and reload
  const handleRefresh = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setDepartmentFilter(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadTeamMembers(); // Also refresh team members statistics
  };

  const columns: ColumnsType<TaskDisplay> = [
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
      render: (type: number) => getTypeTag(type),
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: number) => getPriorityTag(priority),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 150,
      render: (name: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {name || '-'}
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
      render: (date: string, record: TaskDisplay) => {
        const d = dayjs(date);
        const isOverdue = d.isBefore(dayjs()) && record.status !== TaskStatus.Completed;
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
      render: (status: number) => getStatusTag(status),
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
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>Làm mới</Button>
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
                      <Input.Search
                        placeholder="Tìm kiếm theo mã, tiêu đề..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={handleSearch}
                        allowClear
                        enterButton
                      />
                    </Col>
                    <Col xs={24} sm={6} md={4}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Trạng thái"
                        value={statusFilter !== undefined ? String(statusFilter) : 'all'}
                        onChange={handleStatusFilterChange}
                      >
                        <Select.Option value="all">Tất cả trạng thái</Select.Option>
                        <Select.Option value={String(TaskStatus.Pending)}>Chờ nhận</Select.Option>
                        <Select.Option value={String(TaskStatus.Accepted)}>Đã nhận</Select.Option>
                        <Select.Option value={String(TaskStatus.InProgress)}>Đang thực hiện</Select.Option>
                        <Select.Option value={String(TaskStatus.Completed)}>Hoàn thành</Select.Option>
                        <Select.Option value={String(TaskStatus.Rejected)}>Từ chối</Select.Option>
                      </Select>
                    </Col>
                    <Col xs={24} sm={6} md={4}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Phòng ban"
                        value={departmentFilter || 'all'}
                        onChange={handleDepartmentFilterChange}
                      >
                        <Select.Option value="all">Tất cả phòng ban</Select.Option>
                        {departments.map(d => (
                          <Select.Option key={d.id} value={d.name}>{d.name}</Select.Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>

                  <Table
                    columns={columns}
                    dataSource={tasks}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      pageSizeOptions: [20, 50, 100],
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} công việc`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1600 }}
                  />
                </>
              ),
            },
            {
              key: 'team',
              label: `Nhân viên (${teamMembers.length})`,
              children: (
                <Table
                  loading={teamLoading}
                  dataSource={teamMembers}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50],
                    showTotal: (total) => `Tổng ${total} nhân viên`,
                  }}
                  columns={[
                    {
                      title: 'Nhân viên',
                      key: 'name',
                      width: 250,
                      render: (_, member: TeamMember) => (
                        <Space>
                          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                          <div>
                            <div style={{ fontWeight: 500 }}>{member.name}</div>
                            <div style={{ fontSize: 12, color: '#999' }}>{member.role}</div>
                          </div>
                        </Space>
                      ),
                    },
                    {
                      title: 'Phòng ban',
                      dataIndex: 'department',
                      key: 'department',
                      width: 180,
                      render: (dept: string) => <Tag color="blue">{dept}</Tag>,
                    },
                    {
                      title: 'Tổng công việc',
                      dataIndex: 'taskCount',
                      key: 'taskCount',
                      width: 120,
                      align: 'center' as const,
                      sorter: (a: TeamMember, b: TeamMember) => a.taskCount - b.taskCount,
                      render: (count: number) => (
                        <span style={{ fontWeight: 500, color: count > 0 ? '#1890ff' : '#999' }}>
                          {count}
                        </span>
                      ),
                    },
                    {
                      title: 'Hoàn thành',
                      dataIndex: 'completedCount',
                      key: 'completedCount',
                      width: 120,
                      align: 'center' as const,
                      sorter: (a: TeamMember, b: TeamMember) => a.completedCount - b.completedCount,
                      render: (count: number) => (
                        <span style={{ fontWeight: 500, color: count > 0 ? '#52c41a' : '#999' }}>
                          {count}
                        </span>
                      ),
                    },
                    {
                      title: 'Tiến độ',
                      key: 'progress',
                      width: 200,
                      render: (_, member: TeamMember) => {
                        const percent = member.taskCount > 0
                          ? Math.round((member.completedCount / member.taskCount) * 100)
                          : 0;
                        return (
                          <Progress
                            percent={percent}
                            size="small"
                            status={percent === 100 ? 'success' : 'active'}
                            format={() => `${member.completedCount}/${member.taskCount}`}
                          />
                        );
                      },
                    },
                    {
                      title: 'Trạng thái',
                      key: 'status',
                      width: 120,
                      align: 'center' as const,
                      render: (_, member: TeamMember) => {
                        const pendingCount = member.taskCount - member.completedCount;
                        if (member.taskCount === 0) {
                          return <Tag>Chưa có việc</Tag>;
                        }
                        if (pendingCount === 0) {
                          return <Tag color="success">Hoàn thành</Tag>;
                        }
                        return <Tag color="processing">{pendingCount} việc đang làm</Tag>;
                      },
                    },
                  ]}
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
        centered
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="Loại công việc" rules={[{ required: true, message: 'Vui lòng chọn loại' }]}>
                <Select>
                  <Select.Option value={TaskType.Daily}>Hàng ngày</Select.Option>
                  <Select.Option value={TaskType.Weekly}>Hàng tuần</Select.Option>
                  <Select.Option value={TaskType.Monthly}>Hàng tháng</Select.Option>
                  <Select.Option value={TaskType.Adhoc}>Đột xuất</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="Mức ưu tiên" rules={[{ required: true, message: 'Vui lòng chọn mức ưu tiên' }]}>
                <Select>
                  <Select.Option value={TaskPriority.Low}>Thấp</Select.Option>
                  <Select.Option value={TaskPriority.Medium}>Trung bình</Select.Option>
                  <Select.Option value={TaskPriority.High}>Cao</Select.Option>
                  <Select.Option value={TaskPriority.Urgent}>Khẩn cấp</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dueDate" label="Hạn hoàn thành" rules={[{ required: true, message: 'Vui lòng chọn hạn hoàn thành' }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="Tiêu đề công việc" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignedToId" label="Người thực hiện" rules={[{ required: true, message: 'Vui lòng chọn người thực hiện' }]}>
                <Select
                  placeholder="Chọn người thực hiện"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map(u => (
                    <Select.Option key={u.id} value={u.id}>
                      {u.displayName || u.name || u.userName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Phòng ban" rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}>
                <Select>
                  {departments.map(d => (
                    <Select.Option key={d.id} value={d.name}>{d.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="relatedEntityCode" label="Mã liên quan">
            <Input placeholder="Mã yêu cầu kiểm nghiệm hoặc mã mẫu thử" />
          </Form.Item>
          {editingItem && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="status" label="Trạng thái">
                    <Select>
                      <Select.Option value={TaskStatus.Pending}>Chờ nhận</Select.Option>
                      <Select.Option value={TaskStatus.Accepted}>Đã nhận</Select.Option>
                      <Select.Option value={TaskStatus.InProgress}>Đang thực hiện</Select.Option>
                      <Select.Option value={TaskStatus.Completed}>Hoàn thành</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="progress" label="Tiến độ (%)">
                    <Select>
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                        <Select.Option key={p} value={p}>{p}%</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskAssignmentList;
