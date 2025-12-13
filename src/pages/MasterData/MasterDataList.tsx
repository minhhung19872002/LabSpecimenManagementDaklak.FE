// @ts-nocheck
import React, { useState } from 'react';
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
  Upload,
  Descriptions,
  Typography,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  UploadOutlined,
  DownloadOutlined,
  ImportOutlined,
  ExportOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

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
}

// Mock data by category
const mockDataByCategory: Record<string, MasterDataItem[]> = {
  specimenTypes: [
    { id: '1', code: 'NN', name: 'Nước ngầm', category: 'specimenTypes', description: 'Mẫu nước ngầm từ giếng khoan', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: '2', code: 'NM', name: 'Nước mặt', category: 'specimenTypes', description: 'Mẫu nước sông, suối, hồ', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: '3', code: 'DAT', name: 'Đất', category: 'specimenTypes', description: 'Mẫu đất các loại', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: '4', code: 'TP', name: 'Thực phẩm', category: 'specimenTypes', description: 'Mẫu thực phẩm', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
    { id: '5', code: 'PB', name: 'Phân bón', category: 'specimenTypes', description: 'Mẫu phân bón', isActive: true, sortOrder: 5, createdAt: dayjs().toISOString() },
    { id: '6', code: 'CP', name: 'Cà phê', category: 'specimenTypes', description: 'Mẫu cà phê các loại', isActive: true, sortOrder: 6, createdAt: dayjs().toISOString() },
    { id: '7', code: 'HT', name: 'Hồ tiêu', category: 'specimenTypes', description: 'Mẫu hồ tiêu', isActive: true, sortOrder: 7, createdAt: dayjs().toISOString() },
    { id: '8', code: 'RC', name: 'Rau củ', category: 'specimenTypes', description: 'Mẫu rau củ quả', isActive: true, sortOrder: 8, createdAt: dayjs().toISOString() },
  ],
  testMethods: [
    { id: '1', code: 'TCVN6492', name: 'TCVN 6492:2011', category: 'testMethods', description: 'Phương pháp xác định pH', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: '2', code: 'TCVN4559', name: 'TCVN 4559:1998', category: 'testMethods', description: 'Phương pháp xác định EC', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: '3', code: 'TCVN6638', name: 'TCVN 6638:2000', category: 'testMethods', description: 'Phương pháp xác định Nitơ tổng', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: '4', code: 'TCVN6187', name: 'TCVN 6187-1:2019', category: 'testMethods', description: 'Phương pháp xác định Coliform', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
    { id: '5', code: 'AOAC950', name: 'AOAC 950.40', category: 'testMethods', description: 'Phương pháp xác định Caffeine', isActive: true, sortOrder: 5, createdAt: dayjs().toISOString() },
  ],
  standards: [
    { id: '1', code: 'QCVN09', name: 'QCVN 09-MT:2015/BTNMT', category: 'standards', description: 'Quy chuẩn nước ngầm', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: '2', code: 'QCVN08', name: 'QCVN 08-MT:2015/BTNMT', category: 'standards', description: 'Quy chuẩn nước mặt', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: '3', code: 'QCVN03', name: 'QCVN 03-MT:2015/BTNMT', category: 'standards', description: 'Quy chuẩn đất', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: '4', code: 'QCVN01', name: 'QCVN 01:2009/BYT', category: 'standards', description: 'Quy chuẩn nước ăn uống', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
  ],
  parameters: [
    { id: '1', code: 'PH', name: 'pH', category: 'parameters', description: 'Độ pH', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: '2', code: 'EC', name: 'EC (Độ dẫn điện)', category: 'parameters', description: 'Độ dẫn điện', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: '3', code: 'TDS', name: 'TDS', category: 'parameters', description: 'Tổng chất rắn hòa tan', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: '4', code: 'N', name: 'Nitơ tổng (N)', category: 'parameters', description: 'Hàm lượng Nitơ tổng', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
    { id: '5', code: 'P', name: 'Phospho tổng (P)', category: 'parameters', description: 'Hàm lượng Phospho tổng', isActive: true, sortOrder: 5, createdAt: dayjs().toISOString() },
    { id: '6', code: 'K', name: 'Kali (K)', category: 'parameters', description: 'Hàm lượng Kali', isActive: true, sortOrder: 6, createdAt: dayjs().toISOString() },
    { id: '7', code: 'COL', name: 'Coliform tổng', category: 'parameters', description: 'Coliform tổng số', isActive: true, sortOrder: 7, createdAt: dayjs().toISOString() },
    { id: '8', code: 'ECOLI', name: 'E.coli', category: 'parameters', description: 'E.coli', isActive: true, sortOrder: 8, createdAt: dayjs().toISOString() },
    { id: '9', code: 'PB', name: 'Chì (Pb)', category: 'parameters', description: 'Hàm lượng Chì', isActive: true, sortOrder: 9, createdAt: dayjs().toISOString() },
    { id: '10', code: 'CD', name: 'Cadimi (Cd)', category: 'parameters', description: 'Hàm lượng Cadimi', isActive: true, sortOrder: 10, createdAt: dayjs().toISOString() },
  ],
  units: [
    { id: '1', code: 'MGL', name: 'mg/L', category: 'units', description: 'Miligram trên lít', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: '2', code: 'MGKG', name: 'mg/kg', category: 'units', description: 'Miligram trên kilogram', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: '3', code: 'PERCENT', name: '%', category: 'units', description: 'Phần trăm', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: '4', code: 'CFU100ML', name: 'CFU/100mL', category: 'units', description: 'Colony Forming Unit per 100mL', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
    { id: '5', code: 'CFUG', name: 'CFU/g', category: 'units', description: 'Colony Forming Unit per gram', isActive: true, sortOrder: 5, createdAt: dayjs().toISOString() },
    { id: '6', code: 'USCM', name: 'µS/cm', category: 'units', description: 'Micro Siemens per centimeter', isActive: true, sortOrder: 6, createdAt: dayjs().toISOString() },
  ],
  storageLocations: [
    { id: '1', code: 'KLA1', name: 'Kho lạnh A1', category: 'storageLocations', description: 'Kho lạnh 2-8°C', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: '2', code: 'KLA2', name: 'Kho lạnh A2', category: 'storageLocations', description: 'Kho lạnh 2-8°C', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: '3', code: 'KHB1', name: 'Kho B1', category: 'storageLocations', description: 'Kho thường', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: '4', code: 'KHB2', name: 'Kho B2', category: 'storageLocations', description: 'Kho thường', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
    { id: '5', code: 'KHC1', name: 'Kho hóa chất C1', category: 'storageLocations', description: 'Kho hóa chất', isActive: true, sortOrder: 5, createdAt: dayjs().toISOString() },
    { id: '6', code: 'PMD1', name: 'Phòng mẫu D1', category: 'storageLocations', description: 'Phòng lưu mẫu', isActive: true, sortOrder: 6, createdAt: dayjs().toISOString() },
  ],
  departments: [
    { id: '1', code: 'PHH', name: 'Phòng Hóa học', category: 'departments', description: 'Phòng thử nghiệm Hóa học', isActive: true, sortOrder: 1, createdAt: dayjs().toISOString() },
    { id: '2', code: 'PVS', name: 'Phòng Vi sinh', category: 'departments', description: 'Phòng thử nghiệm Vi sinh', isActive: true, sortOrder: 2, createdAt: dayjs().toISOString() },
    { id: '3', code: 'PVL', name: 'Phòng Vật lý', category: 'departments', description: 'Phòng thử nghiệm Vật lý', isActive: true, sortOrder: 3, createdAt: dayjs().toISOString() },
    { id: '4', code: 'PMT', name: 'Phòng Môi trường', category: 'departments', description: 'Phòng thử nghiệm Môi trường', isActive: true, sortOrder: 4, createdAt: dayjs().toISOString() },
  ],
};

const categoryLabels: Record<string, string> = {
  specimenTypes: 'Loại mẫu',
  testMethods: 'Phương pháp thử',
  standards: 'Tiêu chuẩn',
  parameters: 'Chỉ tiêu phân tích',
  units: 'Đơn vị đo',
  storageLocations: 'Vị trí lưu kho',
  departments: 'Phòng ban',
};

const MasterDataList: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('specimenTypes');
  const [data, setData] = useState<Record<string, MasterDataItem[]>>(mockDataByCategory);
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
    // Mock export
    const blob = new Blob(['Mock Excel Data'], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `master_data_${activeCategory}.xlsx`;
    a.click();
    message.success('Xuất Excel thành công!');
  };

  const columns: ColumnsType<MasterDataItem> = [
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
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
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
    },
  ];

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
          onChange={setActiveCategory}
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
                  columns={columns}
                  dataSource={filteredData}
                  rowKey="id"
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} mục`,
                  }}
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
