// @ts-nocheck
import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Descriptions,
  Timeline,
  Row,
  Col,
  Statistic,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;

// Mock data for NCR - Viện Vệ sinh Dịch tễ Tây Nguyên
const mockNCRs = [
  {
    id: '1',
    ncrNumber: 'NCR-20251212-0001',
    title: 'Kết quả PCR COVID-19 có Ct value bất thường',
    type: 'TestResult',
    severity: 'Major',
    status: 'Open',
    reportedBy: 'ThS. Nguyễn Văn A',
    reportedAt: '2025-12-12',
    assignedTo: 'CN. Trần Thị B',
    relatedTest: 'TEST-20251210-0005',
    description: 'Kết quả PCR COVID-19 cho Ct value = 38.5, nằm trong vùng không xác định (35-40)',
    rootCause: '',
    correctiveAction: '',
    dueDate: '2025-12-19',
  },
  {
    id: '2',
    ncrNumber: 'NCR-20251210-0003',
    title: 'Mẫu huyết thanh bị vỡ trong quá trình vận chuyển',
    type: 'Specimen',
    severity: 'Critical',
    status: 'InProgress',
    reportedBy: 'KTV. Lê Văn C',
    reportedAt: '2025-12-10',
    assignedTo: 'ThS. Phạm Thị D',
    relatedTest: 'SPE-20251208-0012',
    description: 'Phát hiện 3 mẫu huyết thanh bị vỡ ống trong thùng vận chuyển từ BV Đa khoa tỉnh',
    rootCause: 'Bao bì đóng gói không đủ chống sốc, nhiệt độ vận chuyển không ổn định',
    correctiveAction: 'Đang thực hiện lấy mẫu lại và yêu cầu đơn vị gửi mẫu cải thiện quy trình đóng gói',
    dueDate: '2025-12-15',
  },
  {
    id: '3',
    ncrNumber: 'NCR-20251205-0002',
    title: 'Máy Real-time PCR chưa được bảo trì định kỳ',
    type: 'Equipment',
    severity: 'Minor',
    status: 'Closed',
    reportedBy: 'CN. Hoàng Văn E',
    reportedAt: '2025-12-05',
    assignedTo: 'ThS. Nguyễn Văn A',
    relatedTest: 'EQP-PCR-001',
    description: 'Máy Real-time PCR ABI 7500 chưa được bảo trì định kỳ theo lịch (quá hạn 15 ngày)',
    rootCause: 'Quên lịch bảo trì do không có hệ thống nhắc nhở tự động',
    correctiveAction: 'Đã liên hệ nhà cung cấp bảo trì và thiết lập hệ thống nhắc nhở trên phần mềm',
    dueDate: '2025-12-08',
    closedAt: '2025-12-07',
    closedBy: 'KTV. Lê Văn C',
  },
  {
    id: '4',
    ncrNumber: 'NCR-20251201-0001',
    title: 'Sai sót trong báo cáo kết quả XN HIV',
    type: 'Report',
    severity: 'Major',
    status: 'Closed',
    reportedBy: 'CN. Trần Thị B',
    reportedAt: '2025-12-01',
    assignedTo: 'KTV. Lê Văn C',
    relatedTest: 'RPT-20251130-0010',
    description: 'Báo cáo kết quả XN HIV gửi BV có sai tên bệnh nhân và số mẫu',
    rootCause: 'Nhập liệu sai từ phiếu yêu cầu do chữ viết tay khó đọc',
    correctiveAction: 'Đã thu hồi và phát hành lại báo cáo, yêu cầu sử dụng phiếu yêu cầu điện tử',
    dueDate: '2025-12-05',
    closedAt: '2025-12-04',
    closedBy: 'ThS. Phạm Thị D',
  },
];

const ncrTypes = [
  { value: 'TestResult', label: 'Kết quả thử nghiệm', color: 'blue' },
  { value: 'Specimen', label: 'Mẫu thử', color: 'purple' },
  { value: 'Equipment', label: 'Thiết bị', color: 'orange' },
  { value: 'Report', label: 'Báo cáo', color: 'cyan' },
  { value: 'Process', label: 'Quy trình', color: 'magenta' },
  { value: 'Other', label: 'Khác', color: 'default' },
];

const severityConfig: Record<string, { color: string; text: string }> = {
  Minor: { color: 'green', text: 'Nhẹ' },
  Major: { color: 'orange', text: 'Nghiêm trọng' },
  Critical: { color: 'red', text: 'Rất nghiêm trọng' },
};

const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  Open: { color: 'red', text: 'Mở', icon: <ExclamationCircleOutlined /> },
  InProgress: { color: 'blue', text: 'Đang xử lý', icon: <ClockCircleOutlined /> },
  Closed: { color: 'green', text: 'Đã đóng', icon: <CheckCircleOutlined /> },
};

const NCRList: React.FC = () => {
  const [ncrs, setNcrs] = useState(mockNCRs);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingNCR, setEditingNCR] = useState<any>(null);
  const [selectedNCR, setSelectedNCR] = useState<any>(null);
  const [form] = Form.useForm();

  // Stats
  const openCount = ncrs.filter((n) => n.status === 'Open').length;
  const inProgressCount = ncrs.filter((n) => n.status === 'InProgress').length;
  const closedCount = ncrs.filter((n) => n.status === 'Closed').length;

  const handleAdd = () => {
    setEditingNCR(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingNCR(record);
    form.setFieldsValue({
      ...record,
      dueDate: dayjs(record.dueDate),
    });
    setIsModalOpen(true);
  };

  const handleView = (record: any) => {
    setSelectedNCR(record);
    setIsDetailOpen(true);
  };

  const handleDelete = (id: string) => {
    setNcrs(ncrs.filter((n) => n.id !== id));
    message.success('Đã xóa NCR');
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      const newNCR = {
        ...values,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
      };

      if (editingNCR) {
        setNcrs(ncrs.map((n) => (n.id === editingNCR.id ? { ...n, ...newNCR } : n)));
        message.success('Đã cập nhật NCR');
      } else {
        const ncr = {
          id: Date.now().toString(),
          ncrNumber: `NCR-${dayjs().format('YYYYMMDD')}-${String(ncrs.length + 1).padStart(4, '0')}`,
          ...newNCR,
          reportedAt: dayjs().format('YYYY-MM-DD'),
          status: 'Open',
        };
        setNcrs([ncr, ...ncrs]);
        message.success('Đã tạo NCR mới');
      }
      setIsModalOpen(false);
    });
  };

  const filteredNCRs = ncrs.filter((n) => {
    const matchSearch =
      n.ncrNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      n.title.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !statusFilter || n.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      title: 'Mã NCR',
      dataIndex: 'ncrNumber',
      key: 'ncrNumber',
      render: (text: string, record: any) => (
        <a onClick={() => handleView(record)}>
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            {text}
          </Space>
        </a>
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const config = ncrTypes.find((t) => t.value === type);
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
    },
    {
      title: 'Mức độ',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={severityConfig[severity]?.color}>{severityConfig[severity]?.text}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color} icon={statusConfig[status]?.icon}>
          {statusConfig[status]?.text}
        </Tag>
      ),
    },
    {
      title: 'Người báo cáo',
      dataIndex: 'reportedBy',
      key: 'reportedBy',
    },
    {
      title: 'Người xử lý',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
    },
    {
      title: 'Hạn xử lý',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string, record: any) => {
        const isOverdue = record.status !== 'Closed' && dayjs(date).isBefore(dayjs());
        return <span style={{ color: isOverdue ? '#cf1322' : undefined }}>{date}</span>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Xóa NCR?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="NCR đang mở"
              value={openCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đang xử lý"
              value={inProgressCount}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã đóng"
              value={closedCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {openCount > 0 && (
        <Alert
          message={`Có ${openCount} NCR đang chờ xử lý`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title="Quản lý Công việc không phù hợp (NCR)"
        extra={
          <Space>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Select.Option value="Open">Mở</Select.Option>
              <Select.Option value="InProgress">Đang xử lý</Select.Option>
              <Select.Option value="Closed">Đã đóng</Select.Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Tạo NCR
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredNCRs}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} NCR` }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingNCR ? 'Cập nhật NCR' : 'Tạo NCR mới'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="Mô tả ngắn gọn vấn đề" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Loại NCR" rules={[{ required: true }]}>
                <Select placeholder="Chọn loại">
                  {ncrTypes.map((t) => (
                    <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="severity" label="Mức độ" rules={[{ required: true }]}>
                <Select placeholder="Chọn mức độ">
                  <Select.Option value="Minor">Nhẹ</Select.Option>
                  <Select.Option value="Major">Nghiêm trọng</Select.Option>
                  <Select.Option value="Critical">Rất nghiêm trọng</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignedTo" label="Người xử lý" rules={[{ required: true }]}>
                <Select placeholder="Chọn người xử lý">
                  <Select.Option value="ThS. Nguyễn Văn A">ThS. Nguyễn Văn A - Phòng XN Vi sinh</Select.Option>
                  <Select.Option value="CN. Trần Thị B">CN. Trần Thị B - Phòng XN PCR</Select.Option>
                  <Select.Option value="KTV. Lê Văn C">KTV. Lê Văn C - Phòng XN Huyết học</Select.Option>
                  <Select.Option value="ThS. Phạm Thị D">ThS. Phạm Thị D - Phòng XN Miễn dịch</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Hạn xử lý" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="relatedTest" label="Mã liên quan (Test/Specimen/Equipment)">
            <Input placeholder="TEST-xxx, SPE-xxx, EQP-xxx" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Mô tả chi tiết vấn đề không phù hợp" />
          </Form.Item>
          {editingNCR && (
            <>
              <Form.Item name="rootCause" label="Nguyên nhân gốc">
                <TextArea rows={2} placeholder="Phân tích nguyên nhân gốc rễ" />
              </Form.Item>
              <Form.Item name="correctiveAction" label="Hành động khắc phục">
                <TextArea rows={2} placeholder="Mô tả các hành động khắc phục" />
              </Form.Item>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Select.Option value="Open">Mở</Select.Option>
                  <Select.Option value="InProgress">Đang xử lý</Select.Option>
                  <Select.Option value="Closed">Đã đóng</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết NCR: ${selectedNCR?.ncrNumber}`}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={<Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>}
        width={800}
      >
        {selectedNCR && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã NCR">{selectedNCR.ncrNumber}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusConfig[selectedNCR.status]?.color}>
                  {statusConfig[selectedNCR.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu đề" span={2}>{selectedNCR.title}</Descriptions.Item>
              <Descriptions.Item label="Loại">
                {ncrTypes.find((t) => t.value === selectedNCR.type)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ">
                <Tag color={severityConfig[selectedNCR.severity]?.color}>
                  {severityConfig[selectedNCR.severity]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Người báo cáo">{selectedNCR.reportedBy}</Descriptions.Item>
              <Descriptions.Item label="Ngày báo cáo">{selectedNCR.reportedAt}</Descriptions.Item>
              <Descriptions.Item label="Người xử lý">{selectedNCR.assignedTo}</Descriptions.Item>
              <Descriptions.Item label="Hạn xử lý">{selectedNCR.dueDate}</Descriptions.Item>
              <Descriptions.Item label="Mã liên quan" span={2}>{selectedNCR.relatedTest}</Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>{selectedNCR.description}</Descriptions.Item>
              {selectedNCR.rootCause && (
                <Descriptions.Item label="Nguyên nhân gốc" span={2}>{selectedNCR.rootCause}</Descriptions.Item>
              )}
              {selectedNCR.correctiveAction && (
                <Descriptions.Item label="Hành động khắc phục" span={2}>{selectedNCR.correctiveAction}</Descriptions.Item>
              )}
            </Descriptions>

            <Card title="Lịch sử xử lý" style={{ marginTop: 16 }} size="small">
              <Timeline
                items={[
                  {
                    color: 'red',
                    children: `${selectedNCR.reportedAt} - NCR được tạo bởi ${selectedNCR.reportedBy}`,
                  },
                  ...(selectedNCR.status !== 'Open'
                    ? [{ color: 'blue', children: 'Đang xử lý - Phân tích nguyên nhân và thực hiện khắc phục' }]
                    : []),
                  ...(selectedNCR.status === 'Closed'
                    ? [{ color: 'green', children: `${selectedNCR.closedAt} - Đã đóng bởi ${selectedNCR.closedBy}` }]
                    : []),
                ]}
              />
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
};

export default NCRList;
