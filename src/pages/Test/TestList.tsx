// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Card, Input, Row, Col, Select, Modal, Form, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testService } from '../../services/testService';
import { specimenService } from '../../services/specimenService';
import { testMethodService } from '../../services/masterDataService';
import { userService, UserLookupDto } from '../../services/userService';
import { TestDto, TestStatus } from '../../types/test';
import dayjs from 'dayjs';
import { PATH_ROUTES } from '../../constants';

const TestList: React.FC = () => {
  const [data, setData] = useState<TestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestDto | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Master data from API
  const [testMethods, setTestMethods] = useState<any[]>([]);
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [users, setUsers] = useState<UserLookupDto[]>([]);

  const loadMasterData = async () => {
    try {
      const [methodsResult, specimensResult] = await Promise.all([
        testMethodService.getActive(),
        specimenService.getList({ maxResultCount: 1000 }),
      ]);
      setTestMethods(methodsResult.items || []);
      setSpecimens(specimensResult.items || []);
    } catch (error) {
      console.error('Error loading master data:', error);
    }

    // Load users separately to handle errors
    try {
      const usersResult = await userService.getLookup();
      setUsers(usersResult || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await testService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: 'creationTime desc',
        search: searchText || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      const items = result.items || [];
      setData(items);
      setTotalCount(result.totalCount || 0);
    } catch (error) {
      console.error('Error loading tests:', error);
      message.error('Không thể tải danh sách phép thử. Vui lòng kiểm tra kết nối server.');
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load master data once on mount
  useEffect(() => {
    loadMasterData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchText, statusFilter]);

  // Handle search
  const handleSearch = () => {
    setSearchText(searchInput);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (value: TestStatus | 'all') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await testService.delete(id);
      message.success('Xóa phép thử thành công!');
      loadData();
    } catch (error) {
      console.error('Error deleting test:', error);
      message.error('Không thể xóa phép thử. Vui lòng thử lại.');
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      code: `TEST-${dayjs().format('YYYYMMDD')}-${String(data.length + 1).padStart(4, '0')}`,
      status: TestStatus.Pending,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: TestDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      completedDate: record.completedDate ? dayjs(record.completedDate) : null,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        specimenId: values.specimenId,
        name: values.name,
        method: values.method,
        standard: values.standard,
        status: values.status,
        assigneeId: values.assigneeId,
        startDate: values.startDate?.toISOString(),
        completionDate: values.completedDate?.toISOString(),
        notes: values.notes,
      };

      if (editingItem) {
        await testService.update(editingItem.id, payload);
        message.success('Cập nhật phép thử thành công!');
      } else {
        await testService.create(payload);
        message.success('Thêm phép thử mới thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      console.error('Error saving test:', error);
      message.error('Không thể lưu phép thử. Vui lòng thử lại.');
    }
  };

  const getStatusColor = (status: TestStatus): string => {
    switch (status) {
      case TestStatus.Pending: return 'default';
      case TestStatus.Assigned: return 'blue';
      case TestStatus.InProgress: return 'processing';
      case TestStatus.Completed: return 'cyan';
      case TestStatus.Reviewed: return 'orange';
      case TestStatus.Approved: return 'green';
      default: return 'default';
    }
  };

  const getStatusText = (status: TestStatus): string => {
    switch (status) {
      case TestStatus.Pending: return 'Chờ xử lý';
      case TestStatus.Assigned: return 'Đã giao';
      case TestStatus.InProgress: return 'Đang thực hiện';
      case TestStatus.Completed: return 'Hoàn thành';
      case TestStatus.Reviewed: return 'Đã xem xét';
      case TestStatus.Approved: return 'Đã phê duyệt';
      default: return '';
    }
  };

  const columns = [
    {
      title: 'Mã phép thử',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      fixed: 'left' as const,
      sorter: (a: TestDto, b: TestDto) => a.code.localeCompare(b.code),
    },
    {
      title: 'Tên phép thử',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Mã mẫu',
      dataIndex: 'specimenCode',
      key: 'specimenCode',
      width: 180,
    },
    {
      title: 'Phương pháp',
      dataIndex: 'method',
      key: 'method',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Tiêu chuẩn',
      dataIndex: 'standard',
      key: 'standard',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 140,
      render: (name: string) => name || '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: TestStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: TestDto) => {
        const isLocked = record.status === TestStatus.Approved;
        const lockedReason = isLocked ? "Không thể chỉnh sửa phép thử đã duyệt" : "";
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(PATH_ROUTES.tests.detail(record.id))}
            />
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={isLocked}
              title={lockedReason}
            />
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
              disabled={isLocked}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={isLocked}
                title={lockedReason}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title="Danh sách phép thử"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>Làm mới</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm phép thử
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo mã, tên, phương pháp, tiêu chuẩn..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            allowClear
            onClear={() => {
              setSearchInput('');
              setSearchText('');
              setCurrentPage(1);
            }}
            enterButton
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value={TestStatus.Pending}>Chờ xử lý</Select.Option>
            <Select.Option value={TestStatus.Assigned}>Đã giao</Select.Option>
            <Select.Option value={TestStatus.InProgress}>Đang thực hiện</Select.Option>
            <Select.Option value={TestStatus.Completed}>Hoàn thành</Select.Option>
            <Select.Option value={TestStatus.Reviewed}>Đã xem xét</Select.Option>
            <Select.Option value={TestStatus.Approved}>Đã phê duyệt</Select.Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} phép thử`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        scroll={{ x: 1400 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa phép thử' : 'Thêm phép thử mới'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        okText={editingItem ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        centered
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã phép thử"
                rules={[{ required: true, message: 'Vui lòng nhập mã phép thử' }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="specimenId"
                label="Mẫu thử"
                rules={[{ required: true, message: 'Vui lòng chọn mẫu' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="children"
                  placeholder="Chọn mẫu thử"
                >
                  {specimens.map(s => (
                    <Select.Option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Tên phép thử"
                rules={[{ required: true, message: 'Vui lòng nhập tên phép thử' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="method"
                label="Phương pháp thử"
                rules={[{ required: true, message: 'Vui lòng chọn phương pháp' }]}
              >
                <Select showSearch optionFilterProp="children">
                  {testMethods.map(m => (
                    <Select.Option key={m.id} value={m.name}>{m.code} - {m.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="standard"
                label="Tiêu chuẩn áp dụng"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu chuẩn' }]}
              >
                <Select showSearch optionFilterProp="children" placeholder="Chọn tiêu chuẩn">
                  {[...new Set(testMethods.map(m => m.standard).filter(Boolean))].map(s => (
                    <Select.Option key={s} value={s}>{s}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assigneeId" label="Người thực hiện">
                <Select
                  placeholder="Chọn người thực hiện"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.displayName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Select.Option value={TestStatus.Pending}>Chờ xử lý</Select.Option>
                  <Select.Option value={TestStatus.Assigned}>Đã giao</Select.Option>
                  <Select.Option value={TestStatus.InProgress}>Đang thực hiện</Select.Option>
                  <Select.Option value={TestStatus.Completed}>Hoàn thành</Select.Option>
                  <Select.Option value={TestStatus.Reviewed}>Đã xem xét</Select.Option>
                  <Select.Option value={TestStatus.Approved}>Đã phê duyệt</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Ngày bắt đầu">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="completedDate" label="Ngày hoàn thành">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TestList;
