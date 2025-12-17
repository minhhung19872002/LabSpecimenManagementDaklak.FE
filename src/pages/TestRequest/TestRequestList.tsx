// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Card, Input, Row, Col, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined, ImportOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { testRequestService } from '../../services/testRequestService';
import { TestRequestDto, TestRequestStatus } from '../../types/testRequest';
import ImportExcelModal from '../../components/common/ImportExcelModal';
import { importService, downloadBlobAsFile } from '../../services/importService';
import dayjs from 'dayjs';

const TestRequestList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | 'all'>('all');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await importService.downloadTestRequestsTemplate();
      downloadBlobAsFile(blob, 'test-requests-template.xlsx');
      message.success('Tải template thành công!');
    } catch (error) {
      console.error('Error downloading template:', error);
      message.error('Không thể tải template. Vui lòng thử lại.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await testRequestService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: 'requestDate desc',
        search: searchText || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      const items = result.items || [];
      setData(items);
      setTotalCount(result.totalCount || 0);
    } catch (error: any) {
      console.error('Error loading test requests:', error);
      message.error('Không thể tải danh sách yêu cầu thử nghiệm. Vui lòng kiểm tra kết nối server.');
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load data when page, pageSize, searchText or statusFilter changes
  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchText, statusFilter]);

  // Handle search with debounce
  const handleSearch = () => {
    setSearchText(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle status filter change
  const handleStatusChange = (value: TestRequestStatus | 'all') => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDelete = async (id: string) => {
    try {
      await testRequestService.delete(id);
      message.success('Xóa yêu cầu thành công!');
      loadData(); // Reload data from server
    } catch (error: any) {
      console.error('Error deleting test request:', error);
      message.error('Không thể xóa yêu cầu. Vui lòng thử lại.');
    }
  };

  const handleCreate = () => {
    navigate('/test-request/create');
  };

  const handleEdit = (record: TestRequestDto) => {
    navigate(`/test-request/edit/${record.id}`);
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
      title: 'Tên CS/DN',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Người liên hệ',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: 'Số mẫu',
      dataIndex: 'totalSampleCount',
      key: 'totalSampleCount',
      width: 80,
      align: 'center' as const,
      render: (value: number) => value || 0,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      align: 'right' as const,
      render: (value: number) => value ? `${value.toLocaleString('vi-VN')}đ` : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: TestRequestStatus) => getStatusTag(status),
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
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            loading={downloadingTemplate}
          >
            Tải Template
          </Button>
          <Button
            icon={<ImportOutlined />}
            onClick={() => setImportModalOpen(true)}
          >
            Import Excel
          </Button>
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
          <Input.Search
            placeholder="Tìm kiếm theo số YC, tên CS/DN, người liên hệ, SĐT..."
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
        <Col xs={24} sm={12} md={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="Lọc theo trạng thái"
            value={statusFilter}
            onChange={handleStatusChange}
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
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} yêu cầu`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }
        }}
        scroll={{ x: 1600 }}
      />

      {/* Import Excel Modal */}
      <ImportExcelModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          loadData();
        }}
        importType="test-requests"
      />
    </Card>
  );
};

export default TestRequestList;
