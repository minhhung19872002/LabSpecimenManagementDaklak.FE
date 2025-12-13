// @ts-nocheck
import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Modal,
  Descriptions,
  Divider,
  message,
  Tooltip,
  Badge
} from 'antd';
import {
  SearchOutlined,
  FilePdfOutlined,
  MailOutlined,
  EyeOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import QRCodeGenerator, { MiniQRCode } from '../../components/common/QRCodeGenerator';

const { RangePicker } = DatePicker;

// Mock data for reports - Viện Vệ sinh Dịch tễ Tây Nguyên
const mockReports = [
  {
    id: '1',
    reportNumber: 'RPT-20251212-0001',
    requestNumber: 'REQ-20251210-0005',
    customerName: 'Bệnh viện Đa khoa tỉnh Đắk Lắk',
    specimenCode: 'SP-2025-001',
    specimenName: 'Mẫu huyết thanh - XN COVID-19',
    testCount: 5,
    status: 'Approved',
    createdAt: '2025-12-12',
    approvedAt: '2025-12-12 10:30',
    approvedBy: 'PGS.TS. Nguyễn Văn A',
    emailSent: true,
  },
  {
    id: '2',
    reportNumber: 'RPT-20251211-0015',
    requestNumber: 'REQ-20251208-0012',
    customerName: 'Trung tâm Kiểm soát bệnh tật Đắk Nông',
    specimenCode: 'SP-2025-015',
    specimenName: 'Mẫu máu - XN Sốt xuất huyết Dengue',
    testCount: 8,
    status: 'Approved',
    createdAt: '2025-12-11',
    approvedAt: '2025-12-11 16:00',
    approvedBy: 'ThS. Trần Thị B',
    emailSent: true,
  },
  {
    id: '3',
    reportNumber: 'RPT-20251211-0014',
    requestNumber: 'REQ-20251207-0010',
    customerName: 'Trung tâm Y tế TP. Buôn Ma Thuột',
    specimenCode: 'SP-2025-014',
    specimenName: 'Mẫu đờm - XN Lao (AFB)',
    testCount: 12,
    status: 'PendingApproval',
    createdAt: '2025-12-11',
    approvedAt: null,
    approvedBy: null,
    emailSent: false,
  },
  {
    id: '4',
    reportNumber: 'RPT-20251210-0010',
    requestNumber: 'REQ-20251205-0008',
    customerName: 'Bệnh viện Đa khoa Vùng Tây Nguyên',
    specimenCode: 'SP-2025-010',
    specimenName: 'Mẫu huyết thanh - XN HIV/Viêm gan',
    testCount: 15,
    status: 'Approved',
    createdAt: '2025-12-10',
    approvedAt: '2025-12-10 14:30',
    approvedBy: 'PGS.TS. Nguyễn Văn A',
    emailSent: false,
  },
  {
    id: '5',
    reportNumber: 'RPT-20251209-0008',
    requestNumber: 'REQ-20251204-0006',
    customerName: 'Trung tâm Kiểm soát bệnh tật Gia Lai',
    specimenCode: 'SP-2025-008',
    specimenName: 'Mẫu dịch ngoáy họng - PCR Cúm A/B',
    testCount: 6,
    status: 'Draft',
    createdAt: '2025-12-09',
    approvedAt: null,
    approvedBy: null,
    emailSent: false,
  },
];

const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    Draft: { color: 'default', text: 'Bản nháp', icon: <ClockCircleOutlined /> },
    PendingApproval: { color: 'orange', text: 'Chờ duyệt', icon: <ClockCircleOutlined /> },
    Approved: { color: 'green', text: 'Đã duyệt', icon: <CheckCircleOutlined /> },
  };
  return configs[status] || { color: 'default', text: status, icon: null };
};

const ReportList: React.FC = () => {
  const [reports] = useState(mockReports);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const handlePreview = (record: any) => {
    setSelectedReport(record);
    setPreviewVisible(true);
  };

  const handleShowQR = (record: any) => {
    setSelectedReport(record);
    setQrModalVisible(true);
  };

  const handleExportPDF = (record: any) => {
    message.success(`Đang xuất PDF báo cáo ${record.reportNumber}...`);
  };

  const handleSendEmail = (record: any) => {
    message.success(`Đã gửi email báo cáo ${record.reportNumber} cho ${record.customerName}`);
  };

  const handlePrint = (record: any) => {
    message.info(`Đang in báo cáo ${record.reportNumber}...`);
  };

  const filteredReports = reports.filter((r) => {
    const matchSearch =
      r.reportNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      r.requestNumber.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      title: 'Số báo cáo',
      dataIndex: 'reportNumber',
      key: 'reportNumber',
      width: 180,
      fixed: 'left' as const,
      render: (text: string, record: any) => (
        <a onClick={() => handlePreview(record)}>
          <Space>
            <FilePdfOutlined style={{ color: '#cf1322' }} />
            {text}
          </Space>
        </a>
      ),
    },
    {
      title: 'Yêu cầu',
      dataIndex: 'requestNumber',
      key: 'requestNumber',
      width: 180,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Mẫu thử',
      dataIndex: 'specimenName',
      key: 'specimenName',
      width: 220,
      ellipsis: true,
    },
    {
      title: 'Số phép thử',
      dataIndex: 'testCount',
      key: 'testCount',
      width: 100,
      align: 'center' as const,
      render: (count: number) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
    },
    {
      title: 'QR',
      key: 'qrCode',
      width: 60,
      align: 'center' as const,
      render: (_: any, record: any) =>
        record.status === 'Approved' ? (
          <Tooltip title="Click để xem mã QR">
            <Button
              type="text"
              icon={<QrcodeOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
              onClick={() => handleShowQR(record)}
            />
          </Tooltip>
        ) : (
          <span style={{ color: '#d9d9d9' }}>-</span>
        ),
    },
    {
      title: 'Email',
      dataIndex: 'emailSent',
      key: 'emailSent',
      width: 100,
      render: (sent: boolean) =>
        sent ? (
          <Tag color="green" icon={<MailOutlined />}>Đã gửi</Tag>
        ) : (
          <Tag color="default">Chưa gửi</Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Xem">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handlePreview(record)} />
          </Tooltip>
          <Tooltip title="Xuất PDF">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleExportPDF(record)}
              disabled={record.status !== 'Approved'}
            />
          </Tooltip>
          <Tooltip title="In">
            <Button
              type="text"
              icon={<PrinterOutlined />}
              onClick={() => handlePrint(record)}
              disabled={record.status !== 'Approved'}
            />
          </Tooltip>
          <Tooltip title="Gửi email">
            <Button
              type="text"
              icon={<MailOutlined />}
              onClick={() => handleSendEmail(record)}
              disabled={record.status !== 'Approved'}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="Báo cáo kết quả thử nghiệm">
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo mã, khách hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Select.Option value="Draft">Bản nháp</Select.Option>
              <Select.Option value="PendingApproval">Chờ duyệt</Select.Option>
              <Select.Option value="Approved">Đã duyệt</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={10}>
            <RangePicker style={{ width: '100%' }} placeholder={['Từ ngày', 'Đến ngày']} />
          </Col>
        </Row>

        <Table
          dataSource={filteredReports}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1480 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} báo cáo`,
          }}
        />
      </Card>

      {/* Preview Modal */}
      <Modal
        title={`Chi tiết báo cáo: ${selectedReport?.reportNumber}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Đóng
          </Button>,
          selectedReport?.status === 'Approved' && (
            <Button
              key="qr"
              icon={<QrcodeOutlined />}
              onClick={() => {
                setPreviewVisible(false);
                setQrModalVisible(true);
              }}
            >
              Mã QR
            </Button>
          ),
          <Button
            key="pdf"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleExportPDF(selectedReport)}
            disabled={selectedReport?.status !== 'Approved'}
          >
            Xuất PDF
          </Button>,
        ]}
        width={800}
      >
        {selectedReport && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Số báo cáo">{selectedReport.reportNumber}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getStatusConfig(selectedReport.status).color}>
                  {getStatusConfig(selectedReport.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Số yêu cầu">{selectedReport.requestNumber}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{selectedReport.createdAt}</Descriptions.Item>
              <Descriptions.Item label="Khách hàng" span={2}>{selectedReport.customerName}</Descriptions.Item>
              <Descriptions.Item label="Mã mẫu">{selectedReport.specimenCode}</Descriptions.Item>
              <Descriptions.Item label="Tên mẫu">{selectedReport.specimenName}</Descriptions.Item>
              <Descriptions.Item label="Số phép thử">{selectedReport.testCount}</Descriptions.Item>
              {selectedReport.approvedAt && (
                <>
                  <Descriptions.Item label="Ngày duyệt">{selectedReport.approvedAt}</Descriptions.Item>
                  <Descriptions.Item label="Người duyệt">{selectedReport.approvedBy}</Descriptions.Item>
                </>
              )}
            </Descriptions>

            {selectedReport.status === 'Approved' && (
              <>
                <Divider>Mã QR truy xuất</Divider>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <MiniQRCode
                    value={`${window.location.origin}/verify/${selectedReport.reportNumber}`}
                    size={100}
                    tooltipText="Quét mã để xác minh báo cáo"
                  />
                </div>
              </>
            )}

            <Divider>Kết quả thử nghiệm</Divider>

            <Table
              size="small"
              dataSource={[
                { key: 1, parameter: 'SARS-CoV-2 (PCR)', value: 'Âm tính', unit: '-', limit: 'Âm tính', result: 'Âm tính' },
                { key: 2, parameter: 'Anti-SARS-CoV-2 IgG', value: '0.45', unit: 'COI', limit: '< 1.0', result: 'Âm tính' },
                { key: 3, parameter: 'Anti-SARS-CoV-2 IgM', value: '0.32', unit: 'COI', limit: '< 1.0', result: 'Âm tính' },
                { key: 4, parameter: 'Dengue NS1 Ag', value: '0.28', unit: 'COI', limit: '< 1.0', result: 'Âm tính' },
                { key: 5, parameter: 'Dengue IgM', value: '0.55', unit: 'COI', limit: '< 1.0', result: 'Âm tính' },
              ]}
              columns={[
                { title: 'Chỉ tiêu', dataIndex: 'parameter', key: 'parameter' },
                { title: 'Kết quả', dataIndex: 'value', key: 'value' },
                { title: 'Đơn vị', dataIndex: 'unit', key: 'unit' },
                { title: 'Giới hạn', dataIndex: 'limit', key: 'limit' },
                {
                  title: 'Đánh giá',
                  dataIndex: 'result',
                  key: 'result',
                  render: (text: string) => <Tag color={text === 'Đạt' ? 'green' : 'red'}>{text}</Tag>,
                },
              ]}
              pagination={false}
            />
          </>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        title="Mã QR truy xuất báo cáo"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={400}
      >
        {selectedReport && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <QRCodeGenerator
              value={`${window.location.origin}/verify/${selectedReport.reportNumber}`}
              reportNumber={selectedReport.reportNumber}
              reportDate={selectedReport.createdAt}
              customerName={selectedReport.customerName}
              specimenCode={selectedReport.specimenCode}
              size={200}
              showDetails={true}
              title="Mã QR truy xuất nguồn gốc"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportList;
