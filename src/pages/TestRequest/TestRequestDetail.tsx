// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, message, Tag, Spin, Space, Table, Divider, Typography, Row, Col } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testRequestService } from '../../services/testRequestService';
import {
  TestRequestDto, TestRequestStatus, ResultLanguage, SamplingRequirement,
  SampleStorageOption, SampleStatus
} from '../../types/testRequest';
import dayjs from 'dayjs';
import './TestRequestDetail.css';

const { Title, Text } = Typography;

const TestRequestDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (requestId: string) => {
    setLoading(true);
    try {
      const result = await testRequestService.get(requestId);
      setData(result);
    } catch (error: any) {
      console.error('Error loading test request:', error);
      message.error('Không thể tải thông tin yêu cầu thử nghiệm');
      setData(null);
    } finally {
      setLoading(false);
    }
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

  const getSampleStatusTag = (status: SampleStatus) => {
    const statusConfig = {
      [SampleStatus.Normal]: { color: 'default', text: 'Bình thường' },
      [SampleStatus.Damaged]: { color: 'warning', text: 'Hư hỏng' },
      [SampleStatus.NotMeetRequirements]: { color: 'error', text: 'Không đạt YC' },
      [SampleStatus.Testing]: { color: 'processing', text: 'Đang kiểm nghiệm' },
      [SampleStatus.Completed]: { color: 'success', text: 'Hoàn thành' }
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getResultLanguageText = (lang: ResultLanguage) => {
    const langMap = {
      [ResultLanguage.Vietnamese]: 'Tiếng Việt',
      [ResultLanguage.English]: 'Tiếng Anh',
      [ResultLanguage.VietnameseAndEnglish]: 'Tiếng Việt/Anh'
    };
    return langMap[lang] || 'Tiếng Việt';
  };

  const getSamplingRequirementText = (req: SamplingRequirement) => {
    const reqMap = {
      [SamplingRequirement.LabSampling]: 'TTKN lấy mẫu',
      [SamplingRequirement.CustomerSampling]: 'KH tự lấy mẫu'
    };
    return reqMap[req] || 'KH tự lấy mẫu';
  };

  const getSampleStorageText = (opt: SampleStorageOption) => {
    const optMap = {
      [SampleStorageOption.No]: 'Không',
      [SampleStorageOption.Yes]: 'Có (theo quy định của Trung tâm)'
    };
    return optMap[opt] || 'Không';
  };

  const BoolIcon = ({ value }: { value: boolean }) => {
    return value ? (
      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
    ) : (
      <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />
    );
  };

  // Sample table columns
  const sampleColumns = [
    {
      title: 'STT',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 50,
      align: 'center' as const,
    },
    {
      title: 'Mã mẫu',
      dataIndex: 'sampleCode',
      key: 'sampleCode',
      width: 100,
    },
    {
      title: 'Tên mẫu',
      dataIndex: 'sampleName',
      key: 'sampleName',
      width: 150,
    },
    {
      title: 'Địa chỉ lấy mẫu',
      dataIndex: 'samplingAddress',
      key: 'samplingAddress',
      width: 180,
      render: (value: string) => value || '-',
    },
    {
      title: 'Lượng mẫu',
      dataIndex: 'sampleQuantity',
      key: 'sampleQuantity',
      width: 80,
      render: (value: string) => value || '-',
    },
    {
      title: 'Tình trạng mẫu',
      dataIndex: 'statusText',
      key: 'statusText',
      width: 120,
      render: (value: string, record: any) => value || getSampleStatusTag(record.status),
    },
    {
      title: 'Trạng thái XL',
      dataIndex: 'processingStatus',
      key: 'processingStatus',
      width: 100,
      render: (value: string) => value ? <Tag color="blue">{value}</Tag> : '-',
    },
    {
      title: 'Chỉ tiêu kiểm nghiệm',
      dataIndex: 'indicators',
      key: 'indicators',
      width: 350,
      render: (indicators: any[]) => {
        if (!indicators || indicators.length === 0) return '-';
        return (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {indicators.map((ind, idx) => (
              <div key={idx} style={{ marginBottom: 6, padding: '4px 8px', background: '#f5f5f5', borderRadius: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                    {ind.indicatorCode || ind.indicatorName}
                  </Tag>
                  <Text style={{ fontSize: 11 }}>{ind.indicatorName}</Text>
                  {ind.unitPrice > 0 && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      ({ind.unitPrice?.toLocaleString('vi-VN')}đ)
                    </Text>
                  )}
                  {ind.sentToDepartment && (
                    <Tag color="green" style={{ margin: 0, fontSize: 10 }}>Đã gửi KP</Tag>
                  )}
                </div>
                {(ind.transferDate || ind.requestDate) && (
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                    {ind.transferDate && (
                      <span style={{ marginRight: 8 }}>
                        CG: {dayjs(ind.transferDate).format('DD/MM/YY')}
                      </span>
                    )}
                    {ind.requestDate && (
                      <span>
                        YC: {dayjs(ind.requestDate).format('DD/MM/YY')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Mã số mẫu',
      dataIndex: 'storageLocation',
      key: 'storageLocation',
      width: 100,
      render: (value: string) => value || '-',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      width: 120,
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: 'Chi phí',
      dataIndex: 'totalIndicatorCost',
      key: 'totalIndicatorCost',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value > 0 ? `${value.toLocaleString('vi-VN')}đ` : '-',
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <p>{t('common.noData')}</p>
      </Card>
    );
  }

  return (
    <div className="test-request-detail">
      <Card
        title={
          <Space wrap>
            <span>Chi tiết yêu cầu thử nghiệm</span>
            <Tag color="blue">{data.requestNumber}</Tag>
            {getStatusTag(data.status)}
          </Space>
        }
        extra={
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/requests')}
            >
              Quay lại
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/test-request/edit/${id}`)}
            >
              Chỉnh sửa
            </Button>
          </Space>
        }
      >
        {/* Thông tin hợp đồng */}
        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin hợp đồng
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12} md={6}>
              <div className="detail-item">
                <Text type="secondary">Số HĐ:</Text>
                <Text strong>{data.contractNumber || '-'}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="detail-item">
                <Text type="secondary">Ngày HĐ:</Text>
                <Text strong>
                  {data.contractDate ? dayjs(data.contractDate).format('DD/MM/YYYY') : '-'}
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="detail-item">
                <Text type="secondary">Số phiếu thu:</Text>
                <Text>{data.receiptNumber || '-'}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="detail-item">
                <Text type="secondary">Ngày yêu cầu:</Text>
                <Text strong>
                  {data.requestDate ? dayjs(data.requestDate).format('DD/MM/YYYY HH:mm') : '-'}
                </Text>
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
            <Col xs={24}>
              <Space wrap size={[16, 8]}>
                <Space size={4}>
                  <BoolIcon value={data.sentToAccounting} />
                  <Text style={{ fontSize: 13 }}>Gửi kế toán</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.paymentReceived} />
                  <Text style={{ fontSize: 13 }}>Đã thu tiền</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.sentToDepartment} />
                  <Text style={{ fontSize: 13 }}>Gửi khoa phòng</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.resultReturned} />
                  <Text style={{ fontSize: 13 }}>Trả kết quả</Text>
                </Space>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Thông tin khách hàng */}
        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin khách hàng
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <div className="detail-item">
                <Text type="secondary">Tên CS/DN:</Text>
                <Text strong style={{ fontSize: 15 }}>{data.customerName || '-'}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="detail-item">
                <Text type="secondary">Mã số thuế:</Text>
                <Text>{data.taxCode || '-'}</Text>
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 12]} style={{ marginTop: 8 }}>
            <Col xs={24}>
              <div className="detail-item">
                <Text type="secondary">Địa chỉ:</Text>
                <Text>
                  {[data.address, data.ward, data.district, data.province]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </Text>
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 12]} style={{ marginTop: 8 }}>
            <Col xs={24} sm={12}>
              <div className="detail-item">
                <Text type="secondary">Người liên hệ:</Text>
                <Text strong>{data.contactPerson || '-'}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="detail-item">
                <Text type="secondary">Điện thoại:</Text>
                <Text strong>{data.phone || '-'}</Text>
              </div>
            </Col>
          </Row>
        </div>

        {/* Loại hình mẫu */}
        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>
            Loại hình mẫu
          </Title>
          <Row gutter={[16, 8]}>
            <Col xs={24}>
              <Space wrap size={[16, 8]}>
                <Space size={4}>
                  <BoolIcon value={data.sampleTypeService} />
                  <Text style={{ fontSize: 13 }}>Dịch vụ</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.sampleTypeContract} />
                  <Text style={{ fontSize: 13 }}>Hợp đồng</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.sampleTypeTask} />
                  <Text style={{ fontSize: 13 }}>Nhiệm vụ</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.sampleTypeSubContract} />
                  <Text style={{ fontSize: 13 }}>Thầu phụ</Text>
                </Space>
              </Space>
            </Col>
          </Row>
          {data.subContract && (
            <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
              <Col xs={24}>
                <div className="detail-item">
                  <Text type="secondary">Thầu phụ:</Text>
                  <Text>{data.subContract}</Text>
                </div>
              </Col>
            </Row>
          )}
        </div>

        {/* Bảng mẫu */}
        <Divider orientation="left" style={{ marginTop: 24 }}>
          <Space>
            <span style={{ fontWeight: 600 }}>Thông tin mẫu</span>
            <Tag color="blue">{data.totalSampleCount || data.samples?.length || 0} mẫu</Tag>
          </Space>
        </Divider>

        <Table
          dataSource={data.samples || []}
          columns={sampleColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1500 }}
          size="small"
          bordered
          style={{ marginBottom: 24 }}
          locale={{ emptyText: 'Không có mẫu nào' }}
        />

        {/* Yêu cầu về phương pháp */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <div className="detail-section">
              <Title level={5} style={{ marginBottom: 12 }}>
                Yêu cầu về phương pháp
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <Space wrap size={[16, 8]}>
                    <Space size={4}>
                      <BoolIcon value={data.methodWestHighlandInstitute} />
                      <Text style={{ fontSize: 13 }}>Theo Viện KHKT NN Tây Nguyên</Text>
                    </Space>
                    <Space size={4}>
                      <BoolIcon value={data.methodCustomer} />
                      <Text style={{ fontSize: 13 }}>Theo yêu cầu khách hàng</Text>
                    </Space>
                  </Space>
                </Col>
                {data.methodCustomerDetail && (
                  <Col xs={24}>
                    <div className="detail-item">
                      <Text type="secondary">Chi tiết PP KH:</Text>
                      <Text>{data.methodCustomerDetail}</Text>
                    </div>
                  </Col>
                )}
              </Row>
            </div>

            <div className="detail-section" style={{ marginTop: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Yêu cầu về kết quả
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Ngôn ngữ:</Text>
                    <Text>{getResultLanguageText(data.resultLanguage)}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Số bản:</Text>
                    <Text>{data.resultCopyCount || '-'}</Text>
                  </div>
                </Col>
                <Col xs={24}>
                  <Space wrap size={[16, 8]}>
                    <Space size={4}>
                      <BoolIcon value={data.separatePassedResults} />
                      <Text style={{ fontSize: 13 }}>Tách riêng CT đạt</Text>
                    </Space>
                  </Space>
                </Col>
                {data.conformityDeclaration && (
                  <Col xs={24}>
                    <div className="detail-item">
                      <Text type="secondary">Công bố hợp quy:</Text>
                      <Text>{data.conformityDeclaration}</Text>
                    </div>
                  </Col>
                )}
                {data.otherRequirements && (
                  <Col xs={24}>
                    <div className="detail-item">
                      <Text type="secondary">Yêu cầu khác:</Text>
                      <Text>{data.otherRequirements}</Text>
                    </div>
                  </Col>
                )}
              </Row>
            </div>

            <div className="detail-section" style={{ marginTop: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Yêu cầu về lấy mẫu & giao trả
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Lấy mẫu:</Text>
                    <Text>{getSamplingRequirementText(data.samplingRequirement)}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Lưu mẫu:</Text>
                    <Text>{getSampleStorageText(data.sampleStorage)}</Text>
                  </div>
                </Col>
                <Col xs={24}>
                  <Space wrap size={[16, 8]}>
                    <Space size={4}>
                      <BoolIcon value={data.deliveryDirectPickup} />
                      <Text style={{ fontSize: 13 }}>Nhận trực tiếp</Text>
                    </Space>
                    <Space size={4}>
                      <BoolIcon value={data.deliveryPostal} />
                      <Text style={{ fontSize: 13 }}>Gửi bưu điện</Text>
                    </Space>
                    <Space size={4}>
                      <BoolIcon value={data.returnStoredSample} />
                      <Text style={{ fontSize: 13 }}>Trả lại mẫu lưu</Text>
                    </Space>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Ngày trả KQ:</Text>
                    <Text strong style={{ color: '#1890ff' }}>
                      {data.resultDeliveryDate ? dayjs(data.resultDeliveryDate).format('DD/MM/YYYY') : '-'}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Ngày hoàn thành dự kiến:</Text>
                    <Text strong style={{ color: '#52c41a' }}>
                      {data.expectedCompletionDate ? dayjs(data.expectedCompletionDate).format('DD/MM/YYYY') : '-'}
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="detail-section">
              <Title level={5} style={{ marginBottom: 12 }}>
                Thông tin chi phí
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <div style={{
                    background: '#e6f7ff',
                    padding: '16px',
                    borderRadius: 8,
                    border: '1px solid #91d5ff',
                    textAlign: 'center'
                  }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Tổng chi phí:</Text>
                    <Text strong style={{ fontSize: 24, color: '#1890ff' }}>
                      {(data.totalCost || 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </div>
                </Col>
                {data.totalCostInWords && (
                  <Col xs={24}>
                    <div className="detail-item">
                      <Text type="secondary">Bằng chữ:</Text>
                      <Text italic>{data.totalCostInWords}</Text>
                    </div>
                  </Col>
                )}
              </Row>
            </div>

            <div className="detail-section" style={{ marginTop: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Người phụ trách
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <div className="detail-item">
                    <Text type="secondary">Người giám sát:</Text>
                    <Text strong>{data.supervisorName || '-'}</Text>
                  </div>
                </Col>
                <Col xs={24}>
                  <div className="detail-item">
                    <Text type="secondary">Giám đốc:</Text>
                    <Text strong>{data.directorName || '-'}</Text>
                  </div>
                </Col>
              </Row>
            </div>

            {data.notes && (
              <div className="detail-section" style={{ marginTop: 16 }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Ghi chú
                </Title>
                <Text>{data.notes}</Text>
              </div>
            )}

            {data.subcontractor && (
              <div className="detail-section" style={{ marginTop: 16 }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Nhà thầu phụ
                </Title>
                <Text>{data.subcontractor}</Text>
              </div>
            )}
          </Col>
        </Row>

        {/* Thông tin hệ thống */}
        <Divider />
        <Descriptions size="small" column={{ xs: 1, sm: 2 }} style={{ marginTop: 16 }}>
          <Descriptions.Item label="Ngày tạo">
            {data.creationTime ? dayjs(data.creationTime).format('DD/MM/YYYY HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối">
            {data.lastModificationTime ? dayjs(data.lastModificationTime).format('DD/MM/YYYY HH:mm:ss') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default TestRequestDetail;
