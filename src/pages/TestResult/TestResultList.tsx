// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag, Card, Input, Row, Col, Select, Modal, Form, InputNumber, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { testResultService } from '../../services/testResultService';
import { TestResultDto, ResultApprovalStatus } from '../../types/testResult';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

// Mock data for demo - Viện Vệ sinh Dịch tễ Tây Nguyên
const generateMockData = (): TestResultDto[] => {
  const parameters = [
    'SARS-CoV-2 (PCR)', 'Anti-SARS-CoV-2 IgG', 'Anti-SARS-CoV-2 IgM', 'Dengue NS1 Ag', 'Dengue IgM/IgG',
    'HIV 1/2 Ab', 'HBsAg', 'Anti-HCV', 'AFB (Lao)', 'Sốt rét P.falciparum',
    'Sốt rét P.vivax', 'Influenza A', 'Influenza B', 'Salmonella', 'E.coli O157',
  ];

  const units = [
    'Ct value', 'COI', 'COI', 'COI', 'COI',
    'COI', 'COI', 'COI', 'AFB/100 trường', '',
    '', 'Ct value', 'Ct value', 'CFU/g', 'CFU/g',
  ];

  const statuses = [
    ResultApprovalStatus.Draft,
    ResultApprovalStatus.Submitted,
    ResultApprovalStatus.Step1Reviewed,
    ResultApprovalStatus.Step2Approved,
    ResultApprovalStatus.Submitted,
    ResultApprovalStatus.Draft,
  ];

  return Array.from({ length: 40 }, (_, i) => {
    const paramIndex = i % parameters.length;
    const createdDate = dayjs().subtract(i, 'day');
    const isPass = Math.random() > 0.2; // 80% pass rate

    // Generate random values based on parameter type (epidemiology)
    let value = '';
    if (paramIndex === 0 || paramIndex === 11 || paramIndex === 12) { // PCR Ct values
      value = isPass ? 'Âm tính' : (15 + Math.random() * 20).toFixed(1);
    } else if (paramIndex >= 1 && paramIndex <= 7) { // ELISA COI values
      value = isPass ? (0.1 + Math.random() * 0.8).toFixed(2) : (1.2 + Math.random() * 3).toFixed(2);
    } else if (paramIndex === 8) { // AFB
      value = isPass ? '0' : `${Math.floor(1 + Math.random() * 10)}+`;
    } else if (paramIndex === 9 || paramIndex === 10) { // Malaria
      value = isPass ? 'Âm tính' : 'Dương tính';
    } else { // Bacteria
      value = Math.floor(Math.random() * 1000).toString();
    }

    return {
      id: `result-${String(i + 1).padStart(3, '0')}`,
      testId: `test-${String((i % 35) + 1).padStart(3, '0')}`,
      testCode: `TEST-${dayjs().format('YYYYMMDD')}-${String((i % 35) + 1).padStart(4, '0')}`,
      testName: `Phép thử ${parameters[paramIndex]}`,
      parameter: parameters[paramIndex],
      value: value,
      unit: units[paramIndex],
      referenceRange: paramIndex === 0 || paramIndex === 11 || paramIndex === 12 ? 'Âm tính / Ct > 40' :
                      paramIndex >= 1 && paramIndex <= 7 ? 'COI < 1.0 (Âm tính)' :
                      paramIndex === 8 ? '0 AFB' :
                      paramIndex === 9 || paramIndex === 10 ? 'Âm tính' :
                      '< 100 CFU/g',
      isPass: isPass,
      approvalStatus: statuses[i % statuses.length],
      testedBy: `Kỹ thuật viên ${(i % 5) + 1}`,
      testedDate: createdDate.toISOString(),
      reviewedBy: statuses[i % statuses.length] >= ResultApprovalStatus.Step1Reviewed ? `Trưởng phòng ${(i % 2) + 1}` : undefined,
      reviewedDate: statuses[i % statuses.length] >= ResultApprovalStatus.Step1Reviewed ? createdDate.add(1, 'day').toISOString() : undefined,
      approvedBy: statuses[i % statuses.length] >= ResultApprovalStatus.Step2Approved ? 'Giám đốc PTN' : undefined,
      approvedDate: statuses[i % statuses.length] >= ResultApprovalStatus.Step2Approved ? createdDate.add(2, 'day').toISOString() : undefined,
      notes: i % 5 === 0 ? `Ghi chú kết quả ${i + 1}` : undefined,
      creationTime: createdDate.toISOString(),
    };
  });
};

const TestResultList: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResultDto[]>([]);
  const [filteredData, setFilteredData] = useState<TestResultDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResultApprovalStatus | 'all'>('all');
  const [passFilter, setPassFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestResultDto | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const parameters = [
    'SARS-CoV-2 (PCR)', 'Anti-SARS-CoV-2 IgG', 'Anti-SARS-CoV-2 IgM', 'Dengue NS1 Ag', 'Dengue IgM/IgG',
    'HIV 1/2 Ab', 'HBsAg', 'Anti-HCV', 'AFB (Lao)', 'Sốt rét P.falciparum',
    'Sốt rét P.vivax', 'Influenza A', 'Influenza B', 'Salmonella', 'E.coli O157',
  ];

  useEffect(() => {
    fetchTestResults();
  }, []);

  useEffect(() => {
    let filtered = [...testResults];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.testCode?.toLowerCase().includes(search) ||
        item.testName?.toLowerCase().includes(search) ||
        item.parameter?.toLowerCase().includes(search) ||
        item.value?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.approvalStatus === statusFilter);
    }

    if (passFilter !== 'all') {
      filtered = filtered.filter(item => passFilter === 'pass' ? item.isPass : !item.isPass);
    }

    setFilteredData(filtered);
    setTotalCount(filtered.length);
  }, [searchText, statusFilter, passFilter, testResults]);

  const fetchTestResults = async () => {
    setLoading(true);
    try {
      const result = await testResultService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: 'creationTime desc',
      });
      setTestResults(result.items);
      setFilteredData(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      // API not available, use mock data immediately
      const mockData = generateMockData();
      setTestResults(mockData);
      setFilteredData(mockData);
      setTotalCount(mockData.length);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await testResultService.delete(id);
    } catch (error) {
      console.log('Mock delete:', id);
    }
    setTestResults(prev => prev.filter(item => item.id !== id));
    message.success('Xóa kết quả thành công!');
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      approvalStatus: ResultApprovalStatus.Draft,
      isPass: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: TestResultDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newItem: TestResultDto = {
        id: editingItem?.id || `result-${Date.now()}`,
        testId: values.testId,
        testCode: values.testCode,
        testName: values.testName,
        parameter: values.parameter,
        value: values.value,
        unit: values.unit,
        referenceRange: values.referenceRange,
        isPass: values.isPass,
        approvalStatus: values.approvalStatus,
        testedBy: values.testedBy || 'Kỹ thuật viên 1',
        testedDate: dayjs().toISOString(),
        notes: values.notes,
        creationTime: editingItem?.creationTime || dayjs().toISOString(),
      };

      if (editingItem) {
        setTestResults(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
        message.success('Cập nhật kết quả thành công!');
      } else {
        setTestResults(prev => [newItem, ...prev]);
        message.success('Thêm kết quả mới thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getApprovalStatusColor = (status: ResultApprovalStatus): string => {
    switch (status) {
      case ResultApprovalStatus.Draft: return 'default';
      case ResultApprovalStatus.Submitted: return 'blue';
      case ResultApprovalStatus.Step1Reviewed: return 'cyan';
      case ResultApprovalStatus.Step2Approved: return 'green';
      case ResultApprovalStatus.Rejected: return 'red';
      default: return 'default';
    }
  };

  const getApprovalStatusText = (status: ResultApprovalStatus): string => {
    switch (status) {
      case ResultApprovalStatus.Draft: return 'Nháp';
      case ResultApprovalStatus.Submitted: return 'Đã nộp';
      case ResultApprovalStatus.Step1Reviewed: return 'Đã xem xét';
      case ResultApprovalStatus.Step2Approved: return 'Đã phê duyệt';
      case ResultApprovalStatus.Rejected: return 'Từ chối';
      default: return '';
    }
  };

  const columns: ColumnsType<TestResultDto> = [
    {
      title: 'Mã phép thử',
      dataIndex: 'testCode',
      key: 'testCode',
      width: 180,
      fixed: 'left',
      sorter: (a, b) => (a.testCode || '').localeCompare(b.testCode || ''),
    },
    {
      title: 'Chỉ tiêu',
      dataIndex: 'parameter',
      key: 'parameter',
      width: 160,
    },
    {
      title: 'Kết quả',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      render: (value: string, record: TestResultDto) => (
        <span style={{ fontWeight: 'bold' }}>
          {value} {record.unit}
        </span>
      ),
    },
    {
      title: 'Giới hạn',
      dataIndex: 'referenceRange',
      key: 'referenceRange',
      width: 120,
      render: (val: string) => val || '-',
    },
    {
      title: 'Đạt/Không đạt',
      dataIndex: 'isPass',
      key: 'isPass',
      width: 130,
      render: (isPass?: boolean) => {
        if (isPass === undefined || isPass === null) return '-';
        return isPass ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>Đạt</Tag>
        ) : (
          <Tag color="red" icon={<CloseCircleOutlined />}>Không đạt</Tag>
        );
      },
      filters: [
        { text: 'Đạt', value: true },
        { text: 'Không đạt', value: false },
      ],
      onFilter: (value, record) => record.isPass === value,
    },
    {
      title: 'Người thử',
      dataIndex: 'testedBy',
      key: 'testedBy',
      width: 140,
      render: (val: string) => val || '-',
    },
    {
      title: 'Trạng thái duyệt',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 140,
      render: (status: ResultApprovalStatus) => (
        <Tag color={getApprovalStatusColor(status)}>{getApprovalStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: TestResultDto) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/test-result/${record.id}`)}
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
      title="Kết quả thử nghiệm"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchTestResults}>Làm mới</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm kết quả
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, chỉ tiêu, giá trị..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="Trạng thái duyệt"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value={ResultApprovalStatus.Draft}>Nháp</Select.Option>
            <Select.Option value={ResultApprovalStatus.Submitted}>Đã nộp</Select.Option>
            <Select.Option value={ResultApprovalStatus.Step1Reviewed}>Đã xem xét</Select.Option>
            <Select.Option value={ResultApprovalStatus.Step2Approved}>Đã phê duyệt</Select.Option>
            <Select.Option value={ResultApprovalStatus.Rejected}>Từ chối</Select.Option>
          </Select>
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="Kết quả"
            value={passFilter}
            onChange={setPassFilter}
          >
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="pass">Đạt</Select.Option>
            <Select.Option value="fail">Không đạt</Select.Option>
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
          showTotal: (total) => `Tổng ${total} kết quả`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        scroll={{ x: 1300 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa kết quả' : 'Thêm kết quả mới'}
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
                name="testCode"
                label="Mã phép thử"
                rules={[{ required: true, message: 'Vui lòng nhập mã phép thử' }]}
              >
                <Input placeholder="TEST-YYYYMMDD-XXXX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="parameter"
                label="Chỉ tiêu phân tích"
                rules={[{ required: true, message: 'Vui lòng chọn chỉ tiêu' }]}
              >
                <Select showSearch optionFilterProp="children">
                  {parameters.map(p => (
                    <Select.Option key={p} value={p}>{p}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="value"
                label="Giá trị"
                rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="Đơn vị">
                <Select allowClear>
                  <Select.Option value="">Không có</Select.Option>
                  <Select.Option value="Ct value">Ct value</Select.Option>
                  <Select.Option value="COI">COI (Cut-off Index)</Select.Option>
                  <Select.Option value="copies/mL">copies/mL</Select.Option>
                  <Select.Option value="CFU/g">CFU/g</Select.Option>
                  <Select.Option value="CFU/mL">CFU/mL</Select.Option>
                  <Select.Option value="IU/mL">IU/mL</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="referenceRange" label="Giới hạn cho phép">
                <Input placeholder="VD: < 50, 6.5 - 8.5" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isPass" label="Kết quả" valuePropName="checked">
                <Switch checkedChildren="Đạt" unCheckedChildren="Không đạt" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="approvalStatus" label="Trạng thái">
                <Select>
                  <Select.Option value={ResultApprovalStatus.Draft}>Nháp</Select.Option>
                  <Select.Option value={ResultApprovalStatus.Submitted}>Đã nộp</Select.Option>
                  <Select.Option value={ResultApprovalStatus.Step1Reviewed}>Đã xem xét</Select.Option>
                  <Select.Option value={ResultApprovalStatus.Step2Approved}>Đã phê duyệt</Select.Option>
                  <Select.Option value={ResultApprovalStatus.Rejected}>Từ chối</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="testedBy" label="Người thử nghiệm">
                <Select allowClear>
                  <Select.Option value="ThS. Nguyễn Văn A">ThS. Nguyễn Văn A - Phòng XN Vi sinh</Select.Option>
                  <Select.Option value="CN. Trần Thị B">CN. Trần Thị B - Phòng XN PCR</Select.Option>
                  <Select.Option value="KTV. Lê Văn C">KTV. Lê Văn C - Phòng XN Huyết học</Select.Option>
                  <Select.Option value="ThS. Phạm Thị D">ThS. Phạm Thị D - Phòng XN Miễn dịch</Select.Option>
                  <Select.Option value="CN. Hoàng Văn E">CN. Hoàng Văn E - Phòng XN Ký sinh trùng</Select.Option>
                </Select>
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

export default TestResultList;
