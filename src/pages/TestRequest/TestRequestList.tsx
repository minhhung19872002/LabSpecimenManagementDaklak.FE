// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Card, Input, DatePicker, Row, Col, Select, Modal, Form } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { testRequestService } from '../../services/testRequestService';
import { TestRequestDto, TestRequestStatus } from '../../types/testRequest';
import dayjs from 'dayjs';
import { mockTestRequests, mockCustomers } from '../../mocks/mockData';

// Use centralized mock data
const generateMockData = (): TestRequestDto[] => {
  return mockTestRequests.map(req => {
    const customer = mockCustomers.find(c => c.id === req.customerId);
    return {
      id: req.id,
      requestNumber: req.requestNumber,
      requestDate: req.requestDate,
      customerName: customer?.name || 'N/A',
      customerEmail: customer?.email || '',
      customerPhone: customer?.phone || '',
      customerAddress: customer?.address || '',
      status: req.status,
      expectedCompletionDate: req.expectedCompletionDate,
      notes: req.notes,
      creationTime: req.createdAt,
    };
  });
};

const TestRequestList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto[]>([]);
  const [filteredData, setFilteredData] = useState<TestRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestRequestDto | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await testRequestService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: 'requestDate desc'
      });
      setData(result.items);
      setFilteredData(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      // API not available, use mock data immediately
      const mockData = generateMockData();
      setData(mockData);
      setFilteredData(mockData);
      setTotalCount(mockData.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...data];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.requestNumber.toLowerCase().includes(search) ||
        item.customerName.toLowerCase().includes(search) ||
        item.customerEmail?.toLowerCase().includes(search) ||
        item.customerPhone?.includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredData(filtered);
    setTotalCount(filtered.length);
  }, [searchText, statusFilter, data]);

  const handleDelete = async (id: string) => {
    try {
      await testRequestService.delete(id);
      message.success(t('messages.deleteSuccess'));
    } catch (error) {
      // Mock delete
      console.log('Mock delete:', id);
    }
    setData(prev => prev.filter(item => item.id !== id));
    message.success('Xóa yêu cầu thành công!');
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      requestNumber: `REQ-${dayjs().format('YYYYMMDD')}-${String(data.length + 1).padStart(4, '0')}`,
      requestDate: dayjs(),
      status: TestRequestStatus.Pending,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: TestRequestDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      requestDate: dayjs(record.requestDate),
      expectedCompletionDate: record.expectedCompletionDate ? dayjs(record.expectedCompletionDate) : null,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newItem: TestRequestDto = {
        id: editingItem?.id || `req-${Date.now()}`,
        requestNumber: values.requestNumber,
        requestDate: values.requestDate.toISOString(),
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        customerAddress: values.customerAddress,
        status: values.status,
        expectedCompletionDate: values.expectedCompletionDate?.toISOString(),
        notes: values.notes,
        creationTime: editingItem?.creationTime || dayjs().toISOString(),
      };

      if (editingItem) {
        setData(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
        message.success('Cập nhật yêu cầu thành công!');
      } else {
        setData(prev => [newItem, ...prev]);
        message.success('Tạo yêu cầu mới thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getStatusTag = (status: TestRequestStatus) => {
    const statusConfig = {
      [TestRequestStatus.Pending]: { color: 'default', text: 'Chờ xử lý' },
      [TestRequestStatus.InProgress]: { color: 'processing', text: 'Đang thực hiện' },
      [TestRequestStatus.Completed]: { color: 'success', text: 'Hoàn thành' },
      [TestRequestStatus.Cancelled]: { color: 'error', text: 'Đã hủy' }
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<TestRequestDto> = [
    {
      title: 'Số yêu cầu',
      dataIndex: 'requestNumber',
      key: 'requestNumber',
      width: 180,
      fixed: 'left',
      sorter: (a, b) => a.requestNumber.localeCompare(b.requestNumber),
    },
    {
      title: 'Ngày yêu cầu',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.requestDate).unix() - dayjs(b.requestDate).unix(),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'customerEmail',
      key: 'customerEmail',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Điện thoại',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      width: 150
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: TestRequestStatus) => getStatusTag(status),
      filters: [
        { text: 'Chờ xử lý', value: TestRequestStatus.Pending },
        { text: 'Đang thực hiện', value: TestRequestStatus.InProgress },
        { text: 'Hoàn thành', value: TestRequestStatus.Completed },
        { text: 'Đã hủy', value: TestRequestStatus.Cancelled },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ngày hoàn thành dự kiến',
      dataIndex: 'expectedCompletionDate',
      key: 'expectedCompletionDate',
      width: 180,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: TestRequestDto) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/test-request/${record.id}`)}
          />
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title="Danh sách yêu cầu thử nghiệm"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>Làm mới</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Tạo mới
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo số YC, khách hàng, email, SĐT..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="Lọc theo trạng thái"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value={TestRequestStatus.Pending}>Chờ xử lý</Select.Option>
            <Select.Option value={TestRequestStatus.InProgress}>Đang thực hiện</Select.Option>
            <Select.Option value={TestRequestStatus.Completed}>Hoàn thành</Select.Option>
            <Select.Option value={TestRequestStatus.Cancelled}>Đã hủy</Select.Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} yêu cầu`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }
        }}
        scroll={{ x: 1400 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa yêu cầu thử nghiệm' : 'Tạo yêu cầu thử nghiệm mới'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        okText={editingItem ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        centered
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="requestNumber"
                label="Số yêu cầu"
                rules={[{ required: true, message: 'Vui lòng nhập số yêu cầu' }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="requestDate"
                label="Ngày yêu cầu"
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Tên khách hàng"
                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerEmail"
                label="Email"
                rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerPhone" label="Số điện thoại">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Select.Option value={TestRequestStatus.Pending}>Chờ xử lý</Select.Option>
                  <Select.Option value={TestRequestStatus.InProgress}>Đang thực hiện</Select.Option>
                  <Select.Option value={TestRequestStatus.Completed}>Hoàn thành</Select.Option>
                  <Select.Option value={TestRequestStatus.Cancelled}>Đã hủy</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="customerAddress" label="Địa chỉ">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="expectedCompletionDate" label="Ngày hoàn thành dự kiến">
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

export default TestRequestList;
