import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Card,
  Row,
  Col,
  Select,
  message,
  Space,
} from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { TablePaginationConfig, SorterResult } from 'antd/es/table/interface';
import { receiptService } from '../../services/receiptService';
import {
  ReceiptDto,
  ReceiptStatus,
  ReceiptStatusLabels,
} from '../../types/receipt';
import { PATH_ROUTES } from '../../constants';
import { getColumns } from './components/columns';
import PaymentConfirmationModal from '../TestRequest/components/PaymentConfirmationModal';
import ExportReceiptModal from './components/ExportReceiptModal';

const ReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReceiptDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchInput, setSearchInput] = useState('');
  const [searchFilter, setSearchFilter] = useState(''); // Applied filter
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | undefined>(
    undefined
  );
  const [sorting, setSorting] = useState<string | undefined>(undefined);

  // Payment confirmation modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedTestRequestId, setSelectedTestRequestId] = useState<string | null>(null);

  // Export modal state
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await receiptService.getList({
        filter: searchFilter || undefined,
        status: statusFilter,
        sorting: sorting,
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
      });
      setData(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      message.error('Không thể tải danh sách phiếu thu');
    } finally {
      setLoading(false);
    }
  }, [searchFilter, statusFilter, sorting, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setSearchFilter(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchFilter('');
    setCurrentPage(1);
  };

  const handleStatusChange = (value: ReceiptStatus | undefined) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<ReceiptDto> | SorterResult<ReceiptDto>[]
  ) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 50);

    // Handle sorting
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (singleSorter?.field && singleSorter?.order) {
      const order = singleSorter.order === 'ascend' ? 'asc' : 'desc';
      setSorting(`${String(singleSorter.field)} ${order}`);
    } else {
      setSorting(undefined);
    }
  };

  const handleRowDoubleClick = (record: ReceiptDto) => {
    navigate(PATH_ROUTES.receipts.detail(record.id));
  };

  // Handle open payment confirmation modal
  const handleOpenPaymentModal = (testRequestId: string) => {
    setSelectedTestRequestId(testRequestId);
    setPaymentModalVisible(true);
  };

  // Handle close payment confirmation modal
  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedTestRequestId(null);
  };

  // Handle payment success - reload data
  const handlePaymentSuccess = () => {
    fetchData();
  };

  const columns = getColumns({
    onConfirmPayment: handleOpenPaymentModal,
  });

  // Status filter options
  const statusOptions = [
    { value: undefined, label: 'Tất cả trạng thái' },
    ...Object.entries(ReceiptStatusLabels).map(([key, label]) => ({
      value: Number(key) as ReceiptStatus,
      label,
    })),
  ];

  return (
    <Card
      title="Danh sách phiếu thu"
      extra={
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => setExportModalVisible(true)}
          >
            Xuất phiếu thu
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Làm mới
          </Button>
        </Space>
      }
    >
      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo số HĐ, tên KH, số phiếu thu..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            allowClear
            onClear={handleClearSearch}
            enterButton
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Lọc theo trạng thái"
            value={statusFilter}
            onChange={handleStatusChange}
            options={statusOptions}
            allowClear
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        onRow={(record) => ({
          onDoubleClick: () => handleRowDoubleClick(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} phiếu thu`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      {/* Payment Confirmation Modal */}
      {selectedTestRequestId && (
        <PaymentConfirmationModal
          open={paymentModalVisible}
          onClose={handleClosePaymentModal}
          testRequestId={selectedTestRequestId}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Export Receipt Modal */}
      <ExportReceiptModal
        open={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
      />
    </Card>
  );
};

export default ReceiptList;
