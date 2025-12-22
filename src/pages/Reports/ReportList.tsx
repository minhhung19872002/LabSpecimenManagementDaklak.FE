import React, { useState, useMemo } from 'react';
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
  Badge,
  Form
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
  ClockCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  SendOutlined,
  AuditOutlined,
  RocketOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import QRCodeGenerator, { MiniQRCode } from '../../components/common/QRCodeGenerator';
import { downloadBlobAsFile } from '../../services/importService';

// RTK Query imports
import {
  useGetReportListQuery,
  useCreateReportMutation,
  useSubmitReportForReviewMutation,
  useApproveReportMutation,
  useIssueReportMutation,
  useSendReportEmailMutation,
  ReportDto,
  CreateReportDto,
} from '../../store/api/reportApi';
import { useGetTestRequestListQuery } from '../../store/api/testRequestApi';
import { useGetSpecimensByTestRequestQuery } from '../../store/api/specimenApi';
import { useGetTestsBySpecimenQuery } from '../../store/api/testApi';
import { reportService } from '../../services/reportService';

const { RangePicker } = DatePicker;

const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    Draft: { color: 'default', text: 'Bản nháp', icon: <ClockCircleOutlined /> },
    PendingApproval: { color: 'orange', text: 'Chờ duyệt', icon: <ClockCircleOutlined /> },
    Approved: { color: 'green', text: 'Đã duyệt', icon: <CheckCircleOutlined /> },
    Issued: { color: 'blue', text: 'Đã phát hành', icon: <CheckCircleOutlined /> },
  };
  return configs[status] || { color: 'default', text: status, icon: null };
};

const ReportList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTestRequestId, setSelectedTestRequestId] = useState<string | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [form] = Form.useForm();

  // RTK Query hooks
  const { data: reportsData, isLoading: loading, refetch } = useGetReportListQuery({ maxResultCount: 100 });
  const { data: testRequestsData } = useGetTestRequestListQuery({ maxResultCount: 1000 });
  const { data: specimensData } = useGetSpecimensByTestRequestQuery(selectedTestRequestId!, { skip: !selectedTestRequestId });
  const { data: testsData } = useGetTestsBySpecimenQuery(
    specimensData && specimensData.length > 0 ? specimensData[0].id : '',
    { skip: !specimensData || specimensData.length === 0 }
  );

  // Mutations
  const [createReport, { isLoading: createLoading }] = useCreateReportMutation();
  const [submitForReview] = useSubmitReportForReviewMutation();
  const [approveReport] = useApproveReportMutation();
  const [issueReport] = useIssueReportMutation();
  const [sendReportEmail] = useSendReportEmailMutation();

  // Derived data
  const testRequests = useMemo(() => testRequestsData?.items || [], [testRequestsData]);
  const specimens = useMemo(() => specimensData || [], [specimensData]);
  const tests = useMemo(() => testsData || [], [testsData]);

  const reports = useMemo(() => {
    return (reportsData?.items || []).map((r: ReportDto) => ({
      id: r.id,
      reportNumber: r.reportNumber,
      requestNumber: r.testRequestNumber || '',
      customerName: r.customerName,
      specimenCode: r.specimenCodes?.join(', ') || '',
      specimenName: r.title,
      testCount: r.testCount || 0,
      status: r.status === 0 ? 'Draft' : r.status === 1 ? 'PendingApproval' : r.status === 2 ? 'Approved' : 'Issued',
      createdAt: dayjs(r.creationTime).format('YYYY-MM-DD'),
      approvedAt: r.issuedDate ? dayjs(r.issuedDate).format('YYYY-MM-DD HH:mm') : null,
      approvedBy: r.approvedByName || null,
      emailSent: r.status === 4, // Issued
    }));
  }, [reportsData]);

  // Workflow handlers
  const handleSubmitForApproval = async (record: any) => {
    Modal.confirm({
      title: 'Xác nhận gửi duyệt',
      content: `Bạn có chắc chắn muốn gửi báo cáo "${record.reportNumber}" để duyệt?`,
      okText: 'Gửi duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        setWorkflowLoading(true);
        try {
          await submitForReview(record.id).unwrap();
          message.success('Đã gửi báo cáo để duyệt!');
        } catch (error) {
          message.error('Không thể gửi báo cáo để duyệt. Vui lòng thử lại.');
          console.error('Failed to submit for approval:', error);
        } finally {
          setWorkflowLoading(false);
        }
      },
    });
  };

  const handleApprove = async (record: any) => {
    Modal.confirm({
      title: 'Xác nhận duyệt báo cáo',
      content: `Bạn có chắc chắn muốn duyệt báo cáo "${record.reportNumber}"?`,
      okText: 'Duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        setWorkflowLoading(true);
        try {
          await approveReport({ id: record.id }).unwrap();
          message.success('Đã duyệt báo cáo thành công!');
        } catch (error) {
          message.error('Không thể duyệt báo cáo. Vui lòng thử lại.');
          console.error('Failed to approve:', error);
        } finally {
          setWorkflowLoading(false);
        }
      },
    });
  };

  const handleIssue = async (record: any) => {
    Modal.confirm({
      title: 'Xác nhận phát hành báo cáo',
      content: `Bạn có chắc chắn muốn phát hành báo cáo "${record.reportNumber}"? Sau khi phát hành, báo cáo sẽ có mã QR truy xuất.`,
      okText: 'Phát hành',
      cancelText: 'Hủy',
      onOk: async () => {
        setWorkflowLoading(true);
        try {
          await issueReport(record.id).unwrap();
          message.success('Đã phát hành báo cáo thành công!');
        } catch (error) {
          message.error('Không thể phát hành báo cáo. Vui lòng thử lại.');
          console.error('Failed to issue:', error);
        } finally {
          setWorkflowLoading(false);
        }
      },
    });
  };

  const handlePreview = (record: any) => {
    setSelectedReport(record);
    setPreviewVisible(true);
  };

  const handleShowQR = (record: any) => {
    setSelectedReport(record);
    setQrModalVisible(true);
  };

  const handleExportPDF = async (record: any) => {
    try {
      message.loading({ content: `Đang xuất PDF báo cáo ${record.reportNumber}...`, key: 'exportPdf' });
      const blob = await reportService.exportPdf(record.id);
      downloadBlobAsFile(blob, `BaoCao_${record.reportNumber}.pdf`);
      message.success({ content: `Xuất PDF báo cáo ${record.reportNumber} thành công!`, key: 'exportPdf' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error({ content: 'Không thể xuất PDF. Vui lòng thử lại.', key: 'exportPdf' });
    }
  };

  const handleSendEmail = async (record: any) => {
    try {
      await sendReportEmail({ id: record.id, data: { email: '' } }).unwrap();
      message.success(`Đã gửi email báo cáo ${record.reportNumber} cho ${record.customerName}`);
    } catch (error) {
      message.error('Không thể gửi email. Vui lòng thử lại.');
    }
  };

  const handlePrint = (record: any) => {
    message.info(`Đang in báo cáo ${record.reportNumber}...`);
  };

  const handleOpenCreateModal = () => {
    form.resetFields();
    setSelectedTestRequestId(null);
    setCreateModalVisible(true);
  };

  const handleTestRequestChange = async (testRequestId: string) => {
    const selectedRequest = testRequests.find((tr: any) => tr.id === testRequestId);
    if (selectedRequest) {
      form.setFieldsValue({
        customerName: selectedRequest.customerName || '',
        title: `Báo cáo kết quả - ${selectedRequest.requestNumber || ''}`,
        specimenIds: [],
        testIds: [],
      });
      setSelectedTestRequestId(testRequestId);
    }
  };

  const handleCreateReport = async () => {
    try {
      const values = await form.validateFields();

      const createData: CreateReportDto = {
        title: values.title,
        testRequestId: values.testRequestId,
        customerName: values.customerName,
        specimenIds: values.specimenIds?.length > 0 ? JSON.stringify(values.specimenIds) : undefined,
        testIds: values.testIds?.length > 0 ? JSON.stringify(values.testIds) : undefined,
        notes: values.notes,
      };

      await createReport(createData).unwrap();
      message.success('Tạo báo cáo mới thành công!');
      setCreateModalVisible(false);
      form.resetFields();
      setSelectedTestRequestId(null);
    } catch (error: any) {
      if (error.errorFields) {
        console.error('Validation failed:', error);
      } else {
        message.error('Không thể tạo báo cáo. Vui lòng thử lại.');
        console.error('Failed to create report:', error);
      }
    }
  };

  const filteredReports = reports.filter((r: any) => {
    const matchSearch =
      r.reportNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.requestNumber?.toLowerCase().includes(searchText.toLowerCase());
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
        record.status === 'Approved' || record.status === 'Issued' ? (
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
      title: 'Quy trình',
      key: 'workflow',
      width: 140,
      render: (_: any, record: any) => {
        if (record.status === 'Draft') {
          return (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleSubmitForApproval(record)}
              loading={workflowLoading}
            >
              Gửi duyệt
            </Button>
          );
        }
        if (record.status === 'PendingApproval') {
          return (
            <Button
              type="primary"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => handleApprove(record)}
              loading={workflowLoading}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Duyệt
            </Button>
          );
        }
        if (record.status === 'Approved') {
          return (
            <Button
              type="primary"
              size="small"
              icon={<RocketOutlined />}
              onClick={() => handleIssue(record)}
              loading={workflowLoading}
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            >
              Phát hành
            </Button>
          );
        }
        if (record.status === 'Issued') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Hoàn tất</Tag>;
        }
        return null;
      },
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
              disabled={record.status !== 'Approved' && record.status !== 'Issued'}
            />
          </Tooltip>
          <Tooltip title="In">
            <Button
              type="text"
              icon={<PrinterOutlined />}
              onClick={() => handlePrint(record)}
              disabled={record.status !== 'Approved' && record.status !== 'Issued'}
            />
          </Tooltip>
          <Tooltip title="Gửi email">
            <Button
              type="text"
              icon={<MailOutlined />}
              onClick={() => handleSendEmail(record)}
              disabled={record.status !== 'Approved' && record.status !== 'Issued'}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Báo cáo kết quả thử nghiệm"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
              Tạo báo cáo
            </Button>
          </Space>
        }
      >
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
              <Select.Option value="Issued">Đã phát hành</Select.Option>
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
          loading={loading}
          scroll={{ x: 1620 }}
          pagination={{
            pageSize: 50,
            pageSizeOptions: [50, 100, 150],
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
        centered
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Đóng
          </Button>,
          (selectedReport?.status === 'Approved' || selectedReport?.status === 'Issued') && (
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
            disabled={selectedReport?.status !== 'Approved' && selectedReport?.status !== 'Issued'}
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

            {(selectedReport.status === 'Approved' || selectedReport.status === 'Issued') && (
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
        centered
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

      {/* Create Report Modal */}
      <Modal
        title="Tạo báo cáo mới"
        open={createModalVisible}
        onOk={handleCreateReport}
        onCancel={() => setCreateModalVisible(false)}
        okText="Tạo báo cáo"
        cancelText="Hủy"
        confirmLoading={createLoading}
        width={600}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="testRequestId"
            label="Yêu cầu thử nghiệm"
            rules={[{ required: true, message: 'Vui lòng chọn yêu cầu thử nghiệm' }]}
          >
            <Select
              showSearch
              placeholder="Chọn yêu cầu thử nghiệm"
              optionFilterProp="children"
              onChange={handleTestRequestChange}
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {testRequests.map((tr: any) => (
                <Select.Option key={tr.id} value={tr.id}>
                  {tr.requestNumber} - {tr.customerName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề báo cáo"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề báo cáo' }]}
          >
            <Input placeholder="Nhập tiêu đề báo cáo" />
          </Form.Item>

          <Form.Item
            name="customerName"
            label="Tên khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
          >
            <Input placeholder="Nhập tên khách hàng" />
          </Form.Item>

          {specimens.length > 0 && (
            <Form.Item
              name="specimenIds"
              label="Chọn mẫu thử"
            >
              <Select
                mode="multiple"
                placeholder="Chọn mẫu thử để đưa vào báo cáo"
                allowClear
              >
                {specimens.map((s: any) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {tests.length > 0 && (
            <Form.Item
              name="testIds"
              label="Chọn phép thử"
            >
              <Select
                mode="multiple"
                placeholder="Chọn phép thử để đưa vào báo cáo"
                allowClear
              >
                {tests.map((t: any) => (
                  <Select.Option key={t.id} value={t.id}>
                    {t.code} - {t.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportList;
