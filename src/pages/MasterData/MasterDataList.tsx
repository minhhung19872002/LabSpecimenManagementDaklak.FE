// @ts-nocheck
import React, { useState, useMemo } from 'react';
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
  message,
  Popconfirm,
  Tabs,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DatabaseOutlined,
  ImportOutlined,
  ExportOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  mockSpecimenTypes,
  mockTestMethods,
  mockStorageLocations,
  mockDepartments,
  mockCustomers,
} from '../../mocks/mockData';

// Types
interface MasterDataItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  // Extra fields for specific categories
  temperature?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Convert mock data from mockData.ts to unified format
const convertToMasterDataFormat = () => {
  const specimenTypes: MasterDataItem[] = mockSpecimenTypes.map((item, index) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    category: 'specimenTypes',
    description: `Loại mẫu: ${item.name}`,
    isActive: true,
    sortOrder: index + 1,
    createdAt: dayjs().toISOString(),
  }));

  const testMethods: MasterDataItem[] = mockTestMethods.map((item, index) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    category: 'testMethods',
    description: `Phương pháp: ${item.name}`,
    isActive: true,
    sortOrder: index + 1,
    createdAt: dayjs().toISOString(),
  }));

  const storageLocations: MasterDataItem[] = mockStorageLocations.map((item, index) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    category: 'storageLocations',
    description: `Nhiệt độ: ${item.temperature}`,
    temperature: item.temperature,
    isActive: true,
    sortOrder: index + 1,
    createdAt: dayjs().toISOString(),
  }));

  const departments: MasterDataItem[] = mockDepartments.map((item, index) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    category: 'departments',
    description: `Phòng ban: ${item.name}`,
    isActive: true,
    sortOrder: index + 1,
    createdAt: dayjs().toISOString(),
  }));

  const customers: MasterDataItem[] = mockCustomers.map((item, index) => ({
    id: item.id,
    code: item.id,
    name: item.name,
    category: 'customers',
    description: item.address,
    address: item.address,
    phone: item.phone,
    email: item.email,
    isActive: true,
    sortOrder: index + 1,
    createdAt: dayjs().toISOString(),
  }));

  // Additional categories with static data
  const standards: MasterDataItem[] = [
    { id: 'std-001', code: 'QCVN09', name: 'QCVN 09-MT:2015/BTNMT', category: 'standards', description: 'Quy chuẩn nước ngầm', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: 'std-002', code: 'QCVN08', name: 'QCVN 08-MT:2015/BTNMT', category: 'standards', description: 'Quy chuẩn nước mặt', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: 'std-003', code: 'QCVN03', name: 'QCVN 03-MT:2015/BTNMT', category: 'standards', description: 'Quy chuẩn đất', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: 'std-004', code: 'QCVN01', name: 'QCVN 01:2009/BYT', category: 'standards', description: 'Quy chuẩn nước ăn uống', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
    { id: 'std-005', code: 'TCVN4193', name: 'TCVN 4193:2014', category: 'standards', description: 'Tiêu chuẩn cà phê nhân', isActive: true, sortOrder: 5, createdAt: dayjs().toISOString() },
  ];

  const parameters: MasterDataItem[] = [
    { id: 'param-001', code: 'PH', name: 'pH', category: 'parameters', description: 'Độ pH', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: 'param-002', code: 'EC', name: 'EC (Độ dẫn điện)', category: 'parameters', description: 'Độ dẫn điện - µS/cm', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: 'param-003', code: 'TDS', name: 'TDS', category: 'parameters', description: 'Tổng chất rắn hòa tan - mg/L', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: 'param-004', code: 'N', name: 'Nitơ tổng (N)', category: 'parameters', description: 'Hàm lượng Nitơ tổng - mg/kg', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
    { id: 'param-005', code: 'P', name: 'Phospho tổng (P)', category: 'parameters', description: 'Hàm lượng Phospho tổng - mg/kg', isActive: true, sortOrder: 5, createdAt: dayjs().toISOString() },
    { id: 'param-006', code: 'K', name: 'Kali (K)', category: 'parameters', description: 'Hàm lượng Kali - mg/kg', isActive: true, sortOrder: 6, createdAt: dayjs().toISOString() },
    { id: 'param-007', code: 'COL', name: 'Coliform tổng', category: 'parameters', description: 'Coliform tổng số - CFU/100mL', isActive: true, sortOrder: 7, createdAt: dayjs().toISOString() },
    { id: 'param-008', code: 'ECOLI', name: 'E.coli', category: 'parameters', description: 'E.coli - CFU/100mL', isActive: true, sortOrder: 8, createdAt: dayjs().toISOString() },
    { id: 'param-009', code: 'PB', name: 'Chì (Pb)', category: 'parameters', description: 'Hàm lượng Chì - mg/kg', isActive: true, sortOrder: 9, createdAt: dayjs().toISOString() },
    { id: 'param-010', code: 'CD', name: 'Cadimi (Cd)', category: 'parameters', description: 'Hàm lượng Cadimi - mg/kg', isActive: true, sortOrder: 10, createdAt: dayjs().toISOString() },
    { id: 'param-011', code: 'AS', name: 'Asen (As)', category: 'parameters', description: 'Hàm lượng Asen - mg/kg', isActive: true, sortOrder: 11, createdAt: dayjs().toISOString() },
    { id: 'param-012', code: 'CAF', name: 'Caffeine', category: 'parameters', description: 'Hàm lượng Caffeine - %', isActive: true, sortOrder: 12, createdAt: dayjs().toISOString() },
    { id: 'param-013', code: 'MOIS', name: 'Độ ẩm', category: 'parameters', description: 'Độ ẩm - %', isActive: true, sortOrder: 13, createdAt: dayjs().toISOString() },
  ];

  const units: MasterDataItem[] = [
    { id: 'unit-001', code: 'MGL', name: 'mg/L', category: 'units', description: 'Miligram trên lít', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: 'unit-002', code: 'MGKG', name: 'mg/kg', category: 'units', description: 'Miligram trên kilogram', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: 'unit-003', code: 'PERCENT', name: '%', category: 'units', description: 'Phần trăm', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: 'unit-004', code: 'CFU100ML', name: 'CFU/100mL', category: 'units', description: 'Colony Forming Unit per 100mL', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
    { id: 'unit-005', code: 'CFUG', name: 'CFU/g', category: 'units', description: 'Colony Forming Unit per gram', isActive: true, sortOrder: 5, createdAt: dayjs().toISOString() },
    { id: 'unit-006', code: 'USCM', name: 'µS/cm', category: 'units', description: 'Micro Siemens per centimeter', isActive: true, sortOrder: 6, createdAt: dayjs().toISOString() },
    { id: 'unit-007', code: 'PPM', name: 'ppm', category: 'units', description: 'Parts per million', isActive: true, sortOrder: 7, createdAt: dayjs().toISOString() },
    { id: 'unit-008', code: 'PPB', name: 'ppb', category: 'units', description: 'Parts per billion', isActive: true, sortOrder: 8, createdAt: dayjs().toISOString() },
  ];

  return {
    specimenTypes,
    testMethods,
    storageLocations,
    departments,
    customers,
    standards,
    parameters,
    units,
  };
};

const categoryLabels: Record<string, string> = {
  specimenTypes: 'Loại mẫu',
  testMethods: 'Phương pháp thử',
  standards: 'Tiêu chuẩn',
  parameters: 'Chỉ tiêu phân tích',
  units: 'Đơn vị đo',
  storageLocations: 'Vị trí lưu kho',
  departments: 'Phòng ban',
  customers: 'Khách hàng',
};

const MasterDataList: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('specimenTypes');
  const initialData = useMemo(() => convertToMasterDataFormat(), []);
  const [data, setData] = useState<Record<string, MasterDataItem[]>>(initialData);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [form] = Form.useForm();

  const currentData = data[activeCategory] || [];
  const filteredData = searchText
    ? currentData.filter(item =>
        item.code.toLowerCase().includes(searchText.toLowerCase()) ||
        item.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : currentData;

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      category: activeCategory,
      isActive: true,
      sortOrder: currentData.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: MasterDataItem) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setData(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter(item => item.id !== id),
    }));
    message.success('Xóa thành công!');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newItem: MasterDataItem = {
        id: editingItem?.id || `${Date.now()}`,
        code: values.code,
        name: values.name,
        category: activeCategory,
        description: values.description,
        isActive: values.isActive,
        sortOrder: values.sortOrder,
        createdAt: editingItem?.createdAt || dayjs().toISOString(),
      };

      if (editingItem) {
        setData(prev => ({
          ...prev,
          [activeCategory]: prev[activeCategory].map(item =>
            item.id === editingItem.id ? newItem : item
          ),
        }));
        message.success('Cập nhật thành công!');
      } else {
        setData(prev => ({
          ...prev,
          [activeCategory]: [...prev[activeCategory], newItem],
        }));
        message.success('Thêm mới thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleImportExcel = () => {
    message.info('Chức năng Import Excel - Đang phát triển');
  };

  const handleExportExcel = () => {
    const blob = new Blob(['Mock Excel Data'], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `master_data_${activeCategory}.xlsx`;
    a.click();
    message.success('Xuất Excel thành công!');
  };

  // Dynamic columns based on category
  const getColumns = (): ColumnsType<MasterDataItem> => {
    const baseColumns: ColumnsType<MasterDataItem> = [
      {
        title: 'STT',
        dataIndex: 'sortOrder',
        key: 'sortOrder',
        width: 60,
      },
      {
        title: 'Mã',
        dataIndex: 'code',
        key: 'code',
        width: 120,
      },
      {
        title: 'Tên',
        dataIndex: 'name',
        key: 'name',
        width: 250,
      },
    ];

    // Add extra columns for specific categories
    if (activeCategory === 'customers') {
      baseColumns.push(
        {
          title: 'Địa chỉ',
          dataIndex: 'description',
          key: 'description',
          ellipsis: true,
        },
        {
          title: 'Điện thoại',
          dataIndex: 'phone',
          key: 'phone',
          width: 130,
        },
        {
          title: 'Email',
          dataIndex: 'email',
          key: 'email',
          width: 180,
          ellipsis: true,
        }
      );
    } else if (activeCategory === 'storageLocations') {
      baseColumns.push(
        {
          title: 'Mô tả',
          dataIndex: 'description',
          key: 'description',
          ellipsis: true,
        },
        {
          title: 'Nhiệt độ',
          dataIndex: 'temperature',
          key: 'temperature',
          width: 100,
        }
      );
    } else {
      baseColumns.push({
        title: 'Mô tả',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
      });
    }

    baseColumns.push(
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        key: 'isActive',
        width: 100,
        render: (isActive: boolean) => (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Hoạt động' : 'Ngừng'}
          </Tag>
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 100,
        render: (_, record) => (
          <Space size="small">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      }
    );

    return baseColumns;
  };

  // Calculate stats
  const totalItems = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div>
      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Tổng danh mục" value={Object.keys(data).length} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Tổng dữ liệu" value={totalItems} />
          </Card>
        </Col>
        {Object.entries(categoryLabels).slice(0, 4).map(([key, label]) => (
          <Col xs={12} sm={8} md={4} key={key}>
            <Card>
              <Statistic title={label} value={data[key]?.length || 0} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <Space>
            <DatabaseOutlined />
            Ngân hàng dữ liệu (Master Data)
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ImportOutlined />} onClick={handleImportExcel}>
              Import Excel
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExportExcel}>
              Export Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm mới
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeCategory}
          onChange={(key) => {
            setActiveCategory(key);
            setSearchText('');
          }}
          tabPosition="left"
          style={{ minHeight: 400 }}
          items={Object.entries(categoryLabels).map(([key, label]) => ({
            key,
            label: (
              <Space>
                {label}
                <Tag>{data[key]?.length || 0}</Tag>
              </Space>
            ),
            children: (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} md={8}>
                    <Input
                      placeholder="Tìm kiếm theo mã, tên..."
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                    />
                  </Col>
                </Row>

                <Table
                  columns={getColumns()}
                  dataSource={filteredData}
                  rowKey="id"
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} mục`,
                  }}
                  scroll={{ x: activeCategory === 'customers' ? 900 : 700 }}
                />
              </>
            ),
          }))}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? `Chỉnh sửa ${categoryLabels[activeCategory]}` : `Thêm ${categoryLabels[activeCategory]} mới`}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        okText={editingItem ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="code"
                label="Mã"
                rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên"
                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          {activeCategory === 'customers' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="phone" label="Điện thoại">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="email" label="Email">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          )}
          {activeCategory === 'storageLocations' && (
            <Form.Item name="temperature" label="Nhiệt độ bảo quản">
              <Input placeholder="VD: 2-8°C" />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sortOrder" label="Thứ tự sắp xếp">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Trạng thái">
                <Select>
                  <Select.Option value={true}>Hoạt động</Select.Option>
                  <Select.Option value={false}>Ngừng</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MasterDataList;
