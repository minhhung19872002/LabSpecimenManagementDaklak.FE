// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag, Card, Input, Row, Col, Select, Modal, Form, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { testResultService } from '../../services/testResultService';
import { testService } from '../../services/testService';
import { TestResultDto, ResultApprovalStatus, CreateTestResultDto, UpdateTestResultDto } from '../../types/testResult';
import { TestDto } from '../../types/test';
import type { ColumnsType } from 'antd/es/table';

const TestResultList: React.FC = () => {
  const [data, setData] = useState<TestResultDto[]>([]);
  const [tests, setTests] = useState<TestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResultApprovalStatus | undefined>(undefined);
  const [passFilter, setPassFilter] = useState<boolean | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestResultDto | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load data when filters change
  useEffect(() => {
    fetchTestResults();
  }, [currentPage, pageSize, searchText, statusFilter, passFilter]);

  // Load tests once on mount
  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTestResults = async () => {
    setLoading(true);
    try {
      const result = await testResultService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: 'creationTime desc',
        search: searchText || undefined,
        approvalStatus: statusFilter,
        isPass: passFilter,
      });
      setData(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      message.error('Không thể tải danh sách kết quả. Vui lòng kiểm tra kết nối API.');
      console.error('Failed to fetch test results:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setSearchText(searchInput);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (value: ResultApprovalStatus | 'all') => {
    setStatusFilter(value === 'all' ? undefined : value);
    setCurrentPage(1);
  };

  // Handle pass filter change
  const handlePassFilterChange = (value: 'all' | 'pass' | 'fail') => {
    if (value === 'all') {
      setPassFilter(undefined);
    } else {
      setPassFilter(value === 'pass');
    }
    setCurrentPage(1);
  };

  const fetchTests = async () => {
    try {
      const result = await testService.getList({
        maxResultCount: 1000,
      });
      setTests(result.items);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await testResultService.delete(id);
      message.success('Xóa kết quả thành công!');
      fetchTestResults();
    } catch (error) {
      message.error('Không thể xóa kết quả. Vui lòng thử lại.');
      console.error('Failed to delete test result:', error);
    }
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

      if (editingItem) {
        const updateData: UpdateTestResultDto = {
          parameter: values.parameter,
          value: values.value,
          unit: values.unit,
          isPass: values.isPass,
          approvalStatus: values.approvalStatus,
          notes: values.notes,
        };

        await testResultService.update(editingItem.id, updateData);
        message.success('Cập nhật kết quả thành công!');
      } else {
        const createData: CreateTestResultDto = {
          testId: values.testId,
          parameter: values.parameter,
          value: values.value,
          unit: values.unit,
          isPass: values.isPass,
          notes: values.notes,
        };

        await testResultService.create(createData);
        message.success('Thêm kết quả mới thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchTestResults();
    } catch (error) {
      if (error.errorFields) {
        console.error('Validation failed:', error);
      } else {
        message.error('Không thể lưu kết quả. Vui lòng thử lại.');
        console.error('Failed to save test result:', error);
      }
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
      title: 'Người nhập',
      dataIndex: 'enteredByName',
      key: 'enteredByName',
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
      render: (_: any, record: TestResultDto) => {
        const isLocked = record.approvalStatus === ResultApprovalStatus.Step2Approved;
        const lockedReason = isLocked ? "Không thể chỉnh sửa kết quả đã duyệt" : "";
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/test-result/${record.id}`)}
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
          <Input.Search
            placeholder="Tìm kiếm theo mã, chỉ tiêu, giá trị..."
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
            placeholder="Trạng thái duyệt"
            value={statusFilter === undefined ? 'all' : statusFilter}
            onChange={handleStatusChange}
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
            value={passFilter === undefined ? 'all' : (passFilter ? 'pass' : 'fail')}
            onChange={handlePassFilterChange}
          >
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="pass">Đạt</Select.Option>
            <Select.Option value="fail">Không đạt</Select.Option>
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
        centered
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="testId"
                label="Phép thử"
                rules={[{ required: true, message: 'Vui lòng chọn phép thử' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="children"
                  placeholder="Chọn phép thử"
                >
                  {tests.map(test => (
                    <Select.Option key={test.id} value={test.id}>
                      {test.code} - {test.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="parameter"
                label="Chỉ tiêu phân tích"
                rules={[{ required: true, message: 'Vui lòng nhập chỉ tiêu' }]}
              >
                <Input placeholder="Nhập chỉ tiêu" />
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
              <Form.Item
                name="unit"
                label="Đơn vị"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
              >
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
            <Col span={12}>
              <Form.Item name="isPass" label="Kết quả" valuePropName="checked">
                <Switch checkedChildren="Đạt" unCheckedChildren="Không đạt" />
              </Form.Item>
            </Col>
            {editingItem && (
              <Col span={12}>
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
            )}
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
