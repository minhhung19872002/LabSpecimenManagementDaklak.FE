// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Card, Input, Row, Col, Select, Modal, Form, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { specimenService } from '../../services/specimenService';
import { SpecimenDto, SpecimenStatus } from '../../types/specimen';
import dayjs from 'dayjs';
import { mockSpecimens, mockTestRequests, mockSpecimenTypes, mockStorageLocations } from '../../mocks/mockData';

// Use centralized mock data
const generateMockData = (): SpecimenDto[] => {
  return mockSpecimens.map(specimen => {
    const testRequest = mockTestRequests.find(r => r.id === specimen.testRequestId);
    const specimenType = mockSpecimenTypes.find(t => t.id === specimen.typeId);
    const storageLocation = mockStorageLocations.find(l => l.id === specimen.storageLocationId);
    return {
      id: specimen.id,
      code: specimen.code,
      name: specimen.name,
      type: specimenType?.name || 'N/A',
      receivedDate: specimen.receivedDate,
      testRequestId: specimen.testRequestId,
      testRequestNumber: testRequest?.requestNumber || 'N/A',
      quantity: specimen.quantity,
      unit: specimen.unit,
      status: specimen.status,
      storageLocation: storageLocation?.name || '-',
      storageCondition: storageLocation?.temperature || '-',
      description: specimen.notes,
      creationTime: specimen.createdAt,
    };
  });
};

const SpecimenList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SpecimenDto[]>([]);
  const [filteredData, setFilteredData] = useState<SpecimenDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<SpecimenStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecimenDto | null>(null);
  const [form] = Form.useForm();

  const specimenTypes = mockSpecimenTypes.map(t => t.name);
  const storageLocations = mockStorageLocations.map(l => l.name);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await specimenService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: 'receivedDate desc'
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
        item.code.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.type?.toLowerCase().includes(search) ||
        item.testRequestNumber?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    setFilteredData(filtered);
    setTotalCount(filtered.length);
  }, [searchText, statusFilter, typeFilter, data]);

  const handleDelete = async (id: string) => {
    try {
      await specimenService.delete(id);
    } catch (error) {
      console.log('Mock delete:', id);
    }
    setData(prev => prev.filter(item => item.id !== id));
    message.success('Xóa mẫu thành công!');
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      code: `SPE-${dayjs().format('YYYYMMDD')}-${String(data.length + 1).padStart(4, '0')}`,
      receivedDate: dayjs(),
      status: SpecimenStatus.Received,
      quantity: 1,
      unit: 'mẫu',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: SpecimenDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      receivedDate: dayjs(record.receivedDate),
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newItem: SpecimenDto = {
        id: editingItem?.id || `spe-${Date.now()}`,
        code: values.code,
        name: values.name,
        type: values.type,
        receivedDate: values.receivedDate.toISOString(),
        testRequestId: values.testRequestId,
        testRequestNumber: values.testRequestNumber,
        quantity: values.quantity,
        unit: values.unit,
        status: values.status,
        storageLocation: values.storageLocation,
        storageCondition: values.storageCondition,
        description: values.description,
        creationTime: editingItem?.creationTime || dayjs().toISOString(),
      };

      if (editingItem) {
        setData(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
        message.success('Cập nhật mẫu thành công!');
      } else {
        setData(prev => [newItem, ...prev]);
        message.success('Thêm mẫu mới thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: 'blue', text: 'Đã nhận' },
      [SpecimenStatus.Testing]: { color: 'processing', text: 'Đang thử nghiệm' },
      [SpecimenStatus.Storage]: { color: 'cyan', text: 'Lưu kho' },
      [SpecimenStatus.Disposal]: { color: 'warning', text: 'Chờ hủy' },
      [SpecimenStatus.Destroyed]: { color: 'error', text: 'Đã hủy' },
      [SpecimenStatus.ReturnedToCustomer]: { color: 'success', text: 'Đã trả khách' }
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<SpecimenDto> = [
    {
      title: 'Mã mẫu',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      fixed: 'left',
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: 'Tên mẫu',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Loại mẫu',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: specimenTypes.map(t => ({ text: t, value: t })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Ngày nhận',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.receivedDate).unix() - dayjs(b.receivedDate).unix(),
    },
    {
      title: 'Số yêu cầu',
      dataIndex: 'testRequestNumber',
      key: 'testRequestNumber',
      width: 180
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: 100,
      render: (_: any, record: SpecimenDto) => `${record.quantity} ${record.unit}`
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: SpecimenStatus) => getStatusTag(status)
    },
    {
      title: 'Vị trí lưu',
      dataIndex: 'storageLocation',
      key: 'storageLocation',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: SpecimenDto) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/specimen/${record.id}`)}
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
      title="Danh sách mẫu thử nghiệm"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>Làm mới</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm mẫu
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên, loại mẫu..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="Loại mẫu"
            value={typeFilter}
            onChange={setTypeFilter}
          >
            <Select.Option value="all">Tất cả loại</Select.Option>
            {specimenTypes.map(t => (
              <Select.Option key={t} value={t}>{t}</Select.Option>
            ))}
          </Select>
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
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} mẫu`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }
        }}
        scroll={{ x: 1500 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa mẫu' : 'Thêm mẫu mới'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        okText={editingItem ? 'Cập nhật' : 'Thêm mẫu'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã mẫu"
                rules={[{ required: true, message: 'Vui lòng nhập mã mẫu' }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="receivedDate"
                label="Ngày nhận"
                rules={[{ required: true, message: 'Vui lòng chọn ngày nhận' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên mẫu"
                rules={[{ required: true, message: 'Vui lòng nhập tên mẫu' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại mẫu"
                rules={[{ required: true, message: 'Vui lòng chọn loại mẫu' }]}
              >
                <Select>
                  {specimenTypes.map(t => (
                    <Select.Option key={t} value={t}>{t}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="quantity" label="Số lượng">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="Đơn vị">
                <Select>
                  <Select.Option value="mẫu">mẫu</Select.Option>
                  <Select.Option value="ml">ml</Select.Option>
                  <Select.Option value="L">L</Select.Option>
                  <Select.Option value="g">g</Select.Option>
                  <Select.Option value="kg">kg</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Trạng thái">
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
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="storageLocation" label="Vị trí lưu kho">
                <Select allowClear>
                  {storageLocations.map(loc => (
                    <Select.Option key={loc} value={loc}>{loc}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="storageCondition" label="Điều kiện bảo quản">
                <Select allowClear>
                  <Select.Option value="2-8°C">2-8°C (Lạnh)</Select.Option>
                  <Select.Option value="-20°C">-20°C (Đông lạnh)</Select.Option>
                  <Select.Option value="Nhiệt độ phòng">Nhiệt độ phòng</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="testRequestNumber" label="Số yêu cầu thử nghiệm">
            <Input placeholder="REQ-YYYYMMDD-XXXX" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SpecimenList;
