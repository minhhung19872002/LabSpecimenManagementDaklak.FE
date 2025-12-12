// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag, Card, Input, Row, Col, Select, Modal, Form, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { specimenHistoryService } from '../../services/specimenHistoryService';
import { SpecimenHistoryDto, SpecimenStatus } from '../../types/specimenHistory';

// Mock data for demo
const generateMockData = (): SpecimenHistoryDto[] => {
  const actions = [
    'Tiếp nhận mẫu',
    'Chuyển vào kho lạnh',
    'Lấy mẫu thử nghiệm',
    'Hoàn tất thử nghiệm',
    'Chuyển lưu kho',
    'Chuẩn bị hủy mẫu',
    'Đã hủy mẫu',
    'Trả mẫu cho khách hàng',
  ];

  const locations = [
    'Quầy tiếp nhận',
    'Kho lạnh A1',
    'Kho lạnh A2',
    'Phòng thử nghiệm Hóa học',
    'Phòng thử nghiệm Vi sinh',
    'Kho lưu mẫu B1',
    'Khu vực hủy mẫu',
    'Quầy trả mẫu',
  ];

  const performers = [
    'Nguyễn Văn A',
    'Trần Thị B',
    'Lê Văn C',
    'Phạm Thị D',
    'Hoàng Văn E',
  ];

  const statuses = [
    SpecimenStatus.Received,
    SpecimenStatus.Storage,
    SpecimenStatus.Testing,
    SpecimenStatus.Testing,
    SpecimenStatus.Storage,
    SpecimenStatus.Disposal,
    SpecimenStatus.Destroyed,
    SpecimenStatus.ReturnedToCustomer,
  ];

  return Array.from({ length: 50 }, (_, i) => {
    const createdDate = dayjs().subtract(i * 4, 'hour');
    const actionIndex = i % actions.length;

    return {
      id: `history-${String(i + 1).padStart(3, '0')}`,
      specimenId: `spe-${String((i % 30) + 1).padStart(3, '0')}`,
      specimenCode: `SPE-${dayjs().format('YYYYMMDD')}-${String((i % 30) + 1).padStart(4, '0')}`,
      action: actions[actionIndex],
      location: locations[actionIndex],
      status: statuses[actionIndex],
      performedBy: performers[i % performers.length],
      performedAt: createdDate.toISOString(),
      temperature: actionIndex <= 4 ? `${(2 + Math.random() * 4).toFixed(1)}°C` : undefined,
      humidity: actionIndex <= 4 ? `${(50 + Math.random() * 20).toFixed(0)}%` : undefined,
      notes: i % 4 === 0 ? `Ghi chú lịch sử ${i + 1}` : undefined,
      creationTime: createdDate.toISOString(),
    };
  });
};

const SpecimenHistoryList: React.FC = () => {
  const [data, setData] = useState<SpecimenHistoryDto[]>([]);
  const [filteredData, setFilteredData] = useState<SpecimenHistoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<SpecimenStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecimenHistoryDto | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actionOptions = [
    'Tiếp nhận mẫu',
    'Chuyển vào kho lạnh',
    'Lấy mẫu thử nghiệm',
    'Hoàn tất thử nghiệm',
    'Chuyển lưu kho',
    'Chuẩn bị hủy mẫu',
    'Đã hủy mẫu',
    'Trả mẫu cho khách hàng',
  ];

  const locationOptions = [
    'Quầy tiếp nhận',
    'Kho lạnh A1',
    'Kho lạnh A2',
    'Phòng thử nghiệm Hóa học',
    'Phòng thử nghiệm Vi sinh',
    'Kho lưu mẫu B1',
    'Khu vực hủy mẫu',
    'Quầy trả mẫu',
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await specimenHistoryService.getList({
        skipCount: 0,
        maxResultCount: 100,
        sorting: 'creationTime desc',
      });
      setData(result.items);
      setFilteredData(result.items);
      setTotal(result.totalCount);
    } catch (error) {
      console.log('API not available, using mock data');
      const mockData = generateMockData();
      setData(mockData);
      setFilteredData(mockData);
      setTotal(mockData.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...data];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.specimenCode?.toLowerCase().includes(search) ||
        item.action?.toLowerCase().includes(search) ||
        item.location?.toLowerCase().includes(search) ||
        item.performedBy?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredData(filtered);
    setTotal(filtered.length);
  }, [searchText, statusFilter, data]);

  const handleDelete = async (id: string) => {
    try {
      await specimenHistoryService.delete(id);
    } catch (error) {
      console.log('Mock delete:', id);
    }
    setData(prev => prev.filter(item => item.id !== id));
    message.success('Xóa lịch sử thành công!');
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      status: SpecimenStatus.Received,
      performedAt: dayjs(),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: SpecimenHistoryDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      performedAt: record.performedAt ? dayjs(record.performedAt) : dayjs(),
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newItem: SpecimenHistoryDto = {
        id: editingItem?.id || `history-${Date.now()}`,
        specimenId: values.specimenId,
        specimenCode: values.specimenCode,
        action: values.action,
        location: values.location,
        status: values.status,
        performedBy: values.performedBy,
        performedAt: values.performedAt?.toISOString(),
        temperature: values.temperature,
        humidity: values.humidity,
        notes: values.notes,
        creationTime: editingItem?.creationTime || dayjs().toISOString(),
      };

      if (editingItem) {
        setData(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
        message.success('Cập nhật lịch sử thành công!');
      } else {
        setData(prev => [newItem, ...prev]);
        message.success('Thêm lịch sử mới thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: 'blue', label: 'Đã nhận' },
      [SpecimenStatus.Testing]: { color: 'processing', label: 'Đang thử nghiệm' },
      [SpecimenStatus.Storage]: { color: 'cyan', label: 'Lưu kho' },
      [SpecimenStatus.Disposal]: { color: 'warning', label: 'Chờ hủy' },
      [SpecimenStatus.Destroyed]: { color: 'error', label: 'Đã hủy' },
      [SpecimenStatus.ReturnedToCustomer]: { color: 'success', label: 'Đã trả khách' },
    };

    const config = statusConfig[status];
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const columns = [
    {
      title: 'Mã mẫu',
      dataIndex: 'specimenCode',
      key: 'specimenCode',
      width: 180,
      fixed: 'left' as const,
      sorter: (a: SpecimenHistoryDto, b: SpecimenHistoryDto) =>
        (a.specimenCode || '').localeCompare(b.specimenCode || ''),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 180,
      render: (action: string) => (
        <Space>
          <HistoryOutlined />
          {action}
        </Space>
      ),
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      width: 180,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: SpecimenStatus) => getStatusTag(status),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 140,
    },
    {
      title: 'Thời gian',
      dataIndex: 'performedAt',
      key: 'performedAt',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
      sorter: (a: SpecimenHistoryDto, b: SpecimenHistoryDto) =>
        dayjs(a.performedAt).unix() - dayjs(b.performedAt).unix(),
    },
    {
      title: 'Nhiệt độ',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: 'Độ ẩm',
      dataIndex: 'humidity',
      key: 'humidity',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: SpecimenHistoryDto) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/specimen-histories/${record.id}`)}
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
      title="Lịch sử mẫu thử nghiệm"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm lịch sử
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã mẫu, hành động, vị trí..."
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
            <Select.Option value={SpecimenStatus.Received}>Đã nhận</Select.Option>
            <Select.Option value={SpecimenStatus.Testing}>Đang thử nghiệm</Select.Option>
            <Select.Option value={SpecimenStatus.Storage}>Lưu kho</Select.Option>
            <Select.Option value={SpecimenStatus.Disposal}>Chờ hủy</Select.Option>
            <Select.Option value={SpecimenStatus.Destroyed}>Đã hủy</Select.Option>
            <Select.Option value={SpecimenStatus.ReturnedToCustomer}>Đã trả khách</Select.Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize || 10);
          },
        }}
        scroll={{ x: 1500 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa lịch sử' : 'Thêm lịch sử mẫu'}
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
                name="specimenCode"
                label="Mã mẫu"
                rules={[{ required: true, message: 'Vui lòng nhập mã mẫu' }]}
              >
                <Input placeholder="SPE-YYYYMMDD-XXXX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="performedAt"
                label="Thời gian thực hiện"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="action"
                label="Hành động"
                rules={[{ required: true, message: 'Vui lòng chọn hành động' }]}
              >
                <Select>
                  {actionOptions.map(a => (
                    <Select.Option key={a} value={a}>{a}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Vị trí"
                rules={[{ required: true, message: 'Vui lòng chọn vị trí' }]}
              >
                <Select>
                  {locationOptions.map(l => (
                    <Select.Option key={l} value={l}>{l}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái mẫu">
                <Select>
                  <Select.Option value={SpecimenStatus.Received}>Đã nhận</Select.Option>
                  <Select.Option value={SpecimenStatus.Testing}>Đang thử nghiệm</Select.Option>
                  <Select.Option value={SpecimenStatus.Storage}>Lưu kho</Select.Option>
                  <Select.Option value={SpecimenStatus.Disposal}>Chờ hủy</Select.Option>
                  <Select.Option value={SpecimenStatus.Destroyed}>Đã hủy</Select.Option>
                  <Select.Option value={SpecimenStatus.ReturnedToCustomer}>Đã trả khách</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="performedBy" label="Người thực hiện">
                <Select allowClear>
                  <Select.Option value="Nguyễn Văn A">Nguyễn Văn A</Select.Option>
                  <Select.Option value="Trần Thị B">Trần Thị B</Select.Option>
                  <Select.Option value="Lê Văn C">Lê Văn C</Select.Option>
                  <Select.Option value="Phạm Thị D">Phạm Thị D</Select.Option>
                  <Select.Option value="Hoàng Văn E">Hoàng Văn E</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="temperature" label="Nhiệt độ">
                <Input placeholder="VD: 4.5°C" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="humidity" label="Độ ẩm">
                <Input placeholder="VD: 65%" />
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

export default SpecimenHistoryList;
