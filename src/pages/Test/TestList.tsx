// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Card, Input, Row, Col, Select, Modal, Form, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testService } from '../../services/testService';
import { TestDto, TestStatus } from '../../types/test';
import dayjs from 'dayjs';

// Mock data for demo - Viện Vệ sinh Dịch tễ Tây Nguyên
const generateMockData = (): TestDto[] => {
  const testNames = [
    'Real-time PCR SARS-CoV-2',
    'ELISA IgG/IgM COVID-19',
    'Real-time PCR Influenza A/B',
    'ELISA Dengue NS1/IgM/IgG',
    'Nuôi cấy vi khuẩn đường ruột',
    'Nhuộm soi AFB (Lao)',
    'ELISA HIV 1/2',
    'Real-time PCR Viêm gan B (HBV DNA)',
    'XN Sốt rét (Giemsa)',
    'ELISA Viêm gan C (Anti-HCV)',
    'Nuôi cấy máu',
    'Kháng sinh đồ',
    'XN Ký sinh trùng đường ruột',
    'Real-time PCR HPV',
    'ELISA Rubella IgG/IgM',
  ];

  const methods = [
    'RT-PCR theo CDC Hoa Kỳ',
    'ELISA theo hướng dẫn nhà sản xuất',
    'Nuôi cấy theo TCVN 8127:2009',
    'Nhuộm Ziehl-Neelsen',
    'Giemsa theo WHO',
    'Kháng sinh đồ CLSI 2023',
    'Real-time PCR Roche',
    'ELISA Abbott',
    'Soi tươi KOH',
    'PCR Multiplex',
  ];

  const standards = [
    'TCVN 8127:2009',
    'WHO Guidelines 2023',
    'CDC Protocol',
    'CLSI M100-Ed33',
    'Bộ Y tế Việt Nam',
    'ISO 15189:2022',
  ];

  const statuses = [
    TestStatus.Pending,
    TestStatus.Assigned,
    TestStatus.InProgress,
    TestStatus.Completed,
    TestStatus.Reviewed,
    TestStatus.Approved,
  ];

  return Array.from({ length: 35 }, (_, i) => {
    const createdDate = dayjs().subtract(i * 2, 'day');

    return {
      id: `test-${String(i + 1).padStart(3, '0')}`,
      code: `TEST-${dayjs().format('YYYYMMDD')}-${String(i + 1).padStart(4, '0')}`,
      name: testNames[i % testNames.length],
      specimenId: `spe-${String((i % 30) + 1).padStart(3, '0')}`,
      specimenCode: `SPE-${dayjs().format('YYYYMMDD')}-${String((i % 30) + 1).padStart(4, '0')}`,
      method: methods[i % methods.length],
      standard: standards[i % standards.length],
      status: statuses[i % statuses.length],
      assignedTo: i % 2 === 0 ? ['ThS. Nguyễn Văn A', 'CN. Trần Thị B', 'KTV. Lê Văn C', 'ThS. Phạm Thị D', 'CN. Hoàng Văn E'][i % 5] : undefined,
      startDate: i % 3 !== 0 ? createdDate.add(1, 'day').toISOString() : undefined,
      completedDate: statuses[i % statuses.length] >= TestStatus.Completed ? createdDate.add(3, 'day').toISOString() : undefined,
      notes: i % 4 === 0 ? `Ghi chú phép thử số ${i + 1}` : undefined,
      creationTime: createdDate.toISOString(),
    };
  });
};

const TestList: React.FC = () => {
  const [tests, setTests] = useState<TestDto[]>([]);
  const [filteredData, setFilteredData] = useState<TestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestDto | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const testMethods = [
    'RT-PCR theo CDC Hoa Kỳ',
    'ELISA theo hướng dẫn nhà sản xuất',
    'Nuôi cấy theo TCVN 8127:2009',
    'Nhuộm Ziehl-Neelsen',
    'Giemsa theo WHO',
    'Kháng sinh đồ CLSI 2023',
    'Real-time PCR Roche',
    'ELISA Abbott',
    'Soi tươi KOH',
    'PCR Multiplex',
  ];

  const testStandards = [
    'TCVN 8127:2009',
    'WHO Guidelines 2023',
    'CDC Protocol',
    'CLSI M100-Ed33',
    'Bộ Y tế Việt Nam',
    'ISO 15189:2022',
  ];

  const fetchTests = async () => {
    setLoading(true);
    try {
      const result = await testService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
      });
      setTests(result.items);
      setFilteredData(result.items);
      setTotal(result.totalCount);
    } catch (error) {
      // API not available, use mock data immediately
      const mockData = generateMockData();
      setTests(mockData);
      setFilteredData(mockData);
      setTotal(mockData.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    let filtered = [...tests];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.code.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.specimenCode?.toLowerCase().includes(search) ||
        item.method?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredData(filtered);
    setTotal(filtered.length);
  }, [searchText, statusFilter, tests]);

  const handleDelete = async (id: string) => {
    try {
      await testService.delete(id);
    } catch (error) {
      console.log('Mock delete:', id);
    }
    setTests(prev => prev.filter(item => item.id !== id));
    message.success('Xóa phép thử thành công!');
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      code: `TEST-${dayjs().format('YYYYMMDD')}-${String(tests.length + 1).padStart(4, '0')}`,
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
      const newItem: TestDto = {
        id: editingItem?.id || `test-${Date.now()}`,
        code: values.code,
        name: values.name,
        specimenId: values.specimenId,
        specimenCode: values.specimenCode,
        method: values.method,
        standard: values.standard,
        status: values.status,
        assignedTo: values.assignedTo,
        startDate: values.startDate?.toISOString(),
        completedDate: values.completedDate?.toISOString(),
        notes: values.notes,
        creationTime: editingItem?.creationTime || dayjs().toISOString(),
      };

      if (editingItem) {
        setTests(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
        message.success('Cập nhật phép thử thành công!');
      } else {
        setTests(prev => [newItem, ...prev]);
        message.success('Thêm phép thử mới thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
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
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 140,
      render: (text: string) => text || '-',
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
      render: (_: any, record: TestDto) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/test/${record.id}`)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
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
    <Card
      title="Danh sách phép thử"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchTests}>Làm mới</Button>
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
          <Input
            placeholder="Tìm kiếm theo mã, tên, phương pháp..."
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
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 10);
          },
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} phép thử`,
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
                name="specimenCode"
                label="Mã mẫu"
                rules={[{ required: true, message: 'Vui lòng nhập mã mẫu' }]}
              >
                <Input placeholder="SPE-YYYYMMDD-XXXX" />
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
                    <Select.Option key={m} value={m}>{m}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="standard" label="Tiêu chuẩn áp dụng">
                <Select allowClear showSearch optionFilterProp="children">
                  {testStandards.map(s => (
                    <Select.Option key={s} value={s}>{s}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignedTo" label="Người thực hiện">
                <Select allowClear>
                  <Select.Option value="ThS. Nguyễn Văn A">ThS. Nguyễn Văn A - Phòng XN Vi sinh</Select.Option>
                  <Select.Option value="CN. Trần Thị B">CN. Trần Thị B - Phòng XN PCR</Select.Option>
                  <Select.Option value="KTV. Lê Văn C">KTV. Lê Văn C - Phòng XN Huyết học</Select.Option>
                  <Select.Option value="ThS. Phạm Thị D">ThS. Phạm Thị D - Phòng XN Miễn dịch</Select.Option>
                  <Select.Option value="CN. Hoàng Văn E">CN. Hoàng Văn E - Phòng XN Ký sinh trùng</Select.Option>
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
