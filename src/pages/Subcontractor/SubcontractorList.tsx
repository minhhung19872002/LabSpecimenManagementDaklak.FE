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
  Tabs,
  List,
  Typography,
  Rate,
  Progress,
  Descriptions,
  Upload
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;

// Types
interface Subcontractor {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  taxCode: string;
  status: 'active' | 'inactive' | 'pending';
  capabilities: string[];
  certifications: Certification[];
  evaluationScore: number;
  contractStartDate: string;
  contractEndDate: string;
  notes?: string;
  createdAt: string;
}

interface Certification {
  id: string;
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  status: 'valid' | 'expired' | 'expiring';
}

// Mock data - Viện Vệ sinh Dịch tễ Tây Nguyên
const generateMockData = (): Subcontractor[] => {
  const names = [
    'Viện Pasteur TP. Hồ Chí Minh',
    'Viện Vệ sinh Dịch tễ Trung ương',
    'Bệnh viện Nhiệt đới Trung ương',
    'Trung tâm Kiểm nghiệm Dược phẩm và Sinh phẩm Quốc gia',
    'Viện Kiểm định Quốc gia Vắc xin và Sinh phẩm Y tế',
    'Viện Y học biển Việt Nam',
  ];

  const capabilities = [
    ['Xét nghiệm COVID-19 khẳng định', 'Giải trình tự gen virus', 'Xét nghiệm bệnh nhiệt đới'],
    ['Xét nghiệm HIV khẳng định', 'Xét nghiệm Viêm gan B/C', 'Nuôi cấy vi khuẩn đặc biệt'],
    ['Điều trị bệnh truyền nhiễm', 'Xét nghiệm chuyên sâu', 'Nghiên cứu lâm sàng'],
    ['Kiểm nghiệm vắc xin', 'Kiểm nghiệm sinh phẩm', 'Kiểm nghiệm thuốc'],
    ['Kiểm định vắc xin', 'Thử nghiệm sinh học', 'Đánh giá an toàn sinh phẩm'],
    ['Xét nghiệm độc tố biển', 'Phân tích vi sinh môi trường', 'Xét nghiệm bệnh lây từ động vật biển'],
  ];

  return Array.from({ length: 6 }, (_, i) => ({
    id: `sub-${String(i + 1).padStart(3, '0')}`,
    code: `NTP-${String(i + 1).padStart(3, '0')}`,
    name: names[i],
    address: `Địa chỉ ${i + 1}, TP. Hồ Chí Minh`,
    phone: `028 ${3800 + i} ${1000 + i * 111}`,
    email: `contact@subcontractor${i + 1}.com.vn`,
    contactPerson: `Nguyễn Văn ${String.fromCharCode(65 + i)}`,
    taxCode: `0301${String(i + 1).padStart(6, '0')}`,
    status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'pending' : 'active',
    capabilities: capabilities[i],
    certifications: [
      {
        id: `cert-${i}-1`,
        name: 'ISO/IEC 17025:2017',
        issuedBy: 'BoA',
        issuedDate: dayjs().subtract(2, 'year').toISOString(),
        expiryDate: dayjs().add(1, 'year').toISOString(),
        status: 'valid' as const,
      },
      {
        id: `cert-${i}-2`,
        name: 'VILAS',
        issuedBy: 'Bộ KH&CN',
        issuedDate: dayjs().subtract(1, 'year').toISOString(),
        expiryDate: dayjs().add(2, 'year').toISOString(),
        status: 'valid' as const,
      },
    ],
    evaluationScore: 3.5 + Math.random() * 1.5,
    contractStartDate: dayjs().subtract(1, 'year').toISOString(),
    contractEndDate: dayjs().add(1, 'year').toISOString(),
    notes: i % 2 === 0 ? `Ghi chú nhà thầu phụ ${i + 1}` : undefined,
    createdAt: dayjs().subtract(i * 30, 'day').toISOString(),
  }));
};

const SubcontractorList: React.FC = () => {
  const [data, setData] = useState<Subcontractor[]>([]);
  const [filteredData, setFilteredData] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subcontractor | null>(null);
  const [selectedItem, setSelectedItem] = useState<Subcontractor | null>(null);
  const [form] = Form.useForm();

  const allCapabilities = [
    'Xét nghiệm COVID-19 khẳng định',
    'Giải trình tự gen virus',
    'Xét nghiệm bệnh nhiệt đới',
    'Xét nghiệm HIV khẳng định',
    'Xét nghiệm Viêm gan B/C',
    'Nuôi cấy vi khuẩn đặc biệt',
    'Kiểm nghiệm vắc xin',
    'Kiểm nghiệm sinh phẩm',
    'Thử nghiệm sinh học',
    'Đánh giá an toàn sinh phẩm',
    'Xét nghiệm kháng thuốc',
    'PCR định lượng virus',
    'Western Blot',
    'ELISA chuyên sâu',
  ];

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
        item.contactPerson.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredData(filtered);
  }, [searchText, statusFilter, data]);

  const loadData = () => {
    setLoading(true);
    // Direct mock data load - no delay needed
    const mockData = generateMockData();
    setData(mockData);
    setFilteredData(mockData);
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      code: `NTP-${String(data.length + 1).padStart(3, '0')}`,
      status: 'pending',
      contractStartDate: dayjs(),
      contractEndDate: dayjs().add(1, 'year'),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: Subcontractor) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      contractStartDate: dayjs(record.contractStartDate),
      contractEndDate: dayjs(record.contractEndDate),
    });
    setIsModalOpen(true);
  };

  const handleView = (record: Subcontractor) => {
    setSelectedItem(record);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
    message.success('Xóa nhà thầu phụ thành công!');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newItem: Subcontractor = {
        id: editingItem?.id || `sub-${Date.now()}`,
        code: values.code,
        name: values.name,
        address: values.address,
        phone: values.phone,
        email: values.email,
        contactPerson: values.contactPerson,
        taxCode: values.taxCode,
        status: values.status,
        capabilities: values.capabilities || [],
        certifications: editingItem?.certifications || [],
        evaluationScore: editingItem?.evaluationScore || 0,
        contractStartDate: values.contractStartDate.toISOString(),
        contractEndDate: values.contractEndDate.toISOString(),
        notes: values.notes,
        createdAt: editingItem?.createdAt || dayjs().toISOString(),
      };

      if (editingItem) {
        setData(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
        message.success('Cập nhật nhà thầu phụ thành công!');
      } else {
        setData(prev => [newItem, ...prev]);
        message.success('Thêm nhà thầu phụ thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: 'Đang hoạt động' },
      inactive: { color: 'red', text: 'Ngừng hoạt động' },
      pending: { color: 'orange', text: 'Chờ đánh giá' },
    };
    return <Tag color={config[status].color}>{config[status].text}</Tag>;
  };

  const columns: ColumnsType<Subcontractor> = [
    {
      title: 'Mã NTP',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Tên nhà thầu phụ',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      ellipsis: true,
    },
    {
      title: 'Người liên hệ',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 150,
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: 'Năng lực',
      dataIndex: 'capabilities',
      key: 'capabilities',
      width: 250,
      render: (caps: string[]) => (
        <Space wrap size={[0, 4]}>
          {caps.slice(0, 2).map(cap => (
            <Tag key={cap} color="blue">{cap}</Tag>
          ))}
          {caps.length > 2 && <Tag>+{caps.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'evaluationScore',
      key: 'evaluationScore',
      width: 140,
      render: (score: number) => <Rate disabled allowHalf value={score} />,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Hết hạn HĐ',
      dataIndex: 'contractEndDate',
      key: 'contractEndDate',
      width: 120,
      render: (date: string) => {
        const d = dayjs(date);
        const isExpiring = d.diff(dayjs(), 'month') < 3;
        return (
          <Text type={isExpiring ? 'danger' : undefined}>
            {d.format('DD/MM/YYYY')}
          </Text>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
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

  return (
    <div>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            Quản lý Nhà thầu phụ
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm nhà thầu phụ
            </Button>
          </Space>
        }
      >
        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo mã, tên, người liên hệ..."
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
              <Select.Option value="active">Đang hoạt động</Select.Option>
              <Select.Option value="pending">Chờ đánh giá</Select.Option>
              <Select.Option value="inactive">Ngừng hoạt động</Select.Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nhà thầu phụ`,
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa nhà thầu phụ' : 'Thêm nhà thầu phụ mới'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText={editingItem ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="Mã nhà thầu phụ" rules={[{ required: true }]}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên nhà thầu phụ" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contactPerson" label="Người liên hệ" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Điện thoại" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taxCode" label="Mã số thuế">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="capabilities" label="Năng lực thử nghiệm">
            <Select mode="multiple" placeholder="Chọn năng lực">
              {allCapabilities.map(cap => (
                <Select.Option key={cap} value={cap}>{cap}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Select.Option value="active">Đang hoạt động</Select.Option>
                  <Select.Option value="pending">Chờ đánh giá</Select.Option>
                  <Select.Option value="inactive">Ngừng hoạt động</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractStartDate" label="Ngày bắt đầu HĐ">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractEndDate" label="Ngày kết thúc HĐ">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết nhà thầu phụ: ${selectedItem?.name}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={900}
      >
        {selectedItem && (
          <Tabs
            items={[
              {
                key: 'info',
                label: 'Thông tin chung',
                children: (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Mã NTP">{selectedItem.code}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">{getStatusTag(selectedItem.status)}</Descriptions.Item>
                    <Descriptions.Item label="Tên" span={2}>{selectedItem.name}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>{selectedItem.address}</Descriptions.Item>
                    <Descriptions.Item label="Người liên hệ">{selectedItem.contactPerson}</Descriptions.Item>
                    <Descriptions.Item label="Điện thoại">{selectedItem.phone}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selectedItem.email}</Descriptions.Item>
                    <Descriptions.Item label="Mã số thuế">{selectedItem.taxCode}</Descriptions.Item>
                    <Descriptions.Item label="Bắt đầu HĐ">{dayjs(selectedItem.contractStartDate).format('DD/MM/YYYY')}</Descriptions.Item>
                    <Descriptions.Item label="Kết thúc HĐ">{dayjs(selectedItem.contractEndDate).format('DD/MM/YYYY')}</Descriptions.Item>
                    <Descriptions.Item label="Đánh giá" span={2}>
                      <Rate disabled allowHalf value={selectedItem.evaluationScore} />
                      <Text style={{ marginLeft: 8 }}>{selectedItem.evaluationScore.toFixed(1)}/5</Text>
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'capabilities',
                label: 'Năng lực thử nghiệm',
                children: (
                  <List
                    dataSource={selectedItem.capabilities}
                    renderItem={(item) => (
                      <List.Item>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        {item}
                      </List.Item>
                    )}
                  />
                ),
              },
              {
                key: 'certifications',
                label: 'Chứng nhận',
                children: (
                  <Table
                    dataSource={selectedItem.certifications}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: 'Tên chứng nhận', dataIndex: 'name', key: 'name' },
                      { title: 'Cấp bởi', dataIndex: 'issuedBy', key: 'issuedBy' },
                      { title: 'Ngày cấp', dataIndex: 'issuedDate', key: 'issuedDate', render: (d) => dayjs(d).format('DD/MM/YYYY') },
                      { title: 'Ngày hết hạn', dataIndex: 'expiryDate', key: 'expiryDate', render: (d) => dayjs(d).format('DD/MM/YYYY') },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        key: 'status',
                        render: (s) => (
                          <Tag color={s === 'valid' ? 'green' : s === 'expiring' ? 'orange' : 'red'}>
                            {s === 'valid' ? 'Còn hiệu lực' : s === 'expiring' ? 'Sắp hết hạn' : 'Hết hạn'}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default SubcontractorList;
