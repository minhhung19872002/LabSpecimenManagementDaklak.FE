import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, message, Tag, Spin, Space } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testRequestService } from '../../services/testRequestService';
import { TestRequestDto, TestRequestStatus } from '../../types/testRequest';
import dayjs from 'dayjs';
import './TestRequestDetail.css';

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
      [TestRequestStatus.Pending]: { color: 'default', text: t('request.status.pending') },
      [TestRequestStatus.InProgress]: { color: 'processing', text: t('request.status.inProgress') },
      [TestRequestStatus.Completed]: { color: 'success', text: t('request.status.completed') },
      [TestRequestStatus.Cancelled]: { color: 'error', text: t('request.status.cancelled') }
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

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
        title={t('request.viewTestRequest')}
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/requests')}
            >
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/test-request/edit/${id}`)}
            >
              {t('common.edit')}
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label={t('request.requestNumber')} span={2}>
            <strong>{data.requestNumber}</strong>
          </Descriptions.Item>

          <Descriptions.Item label={t('request.requestDate')}>
            {dayjs(data.requestDate).format('DD/MM/YYYY')}
          </Descriptions.Item>

          <Descriptions.Item label={t('request.status.label')}>
            {getStatusTag(data.status)}
          </Descriptions.Item>

          <Descriptions.Item label={t('request.customerName')} span={2}>
            {data.customerName}
          </Descriptions.Item>

          {data.customerEmail && (
            <Descriptions.Item label={t('request.customerEmail')} span={2}>
              {data.customerEmail}
            </Descriptions.Item>
          )}

          {data.customerPhone && (
            <Descriptions.Item label={t('request.customerPhone')} span={2}>
              {data.customerPhone}
            </Descriptions.Item>
          )}

          {data.customerInfo && (
            <Descriptions.Item label={t('request.customerInfo')} span={2}>
              {data.customerInfo}
            </Descriptions.Item>
          )}

          {data.expectedCompletionDate && (
            <Descriptions.Item label={t('request.expectedCompletionDate')} span={2}>
              {dayjs(data.expectedCompletionDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
          )}

          {data.subcontractor && (
            <Descriptions.Item label={t('request.subcontractor')} span={2}>
              {data.subcontractor}
            </Descriptions.Item>
          )}

          {data.notes && (
            <Descriptions.Item label={t('request.notes')} span={2}>
              {data.notes}
            </Descriptions.Item>
          )}

          <Descriptions.Item label={t('common.createdAt')}>
            {data.creationTime ? dayjs(data.creationTime).format('DD/MM/YYYY HH:mm:ss') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label={t('common.updatedAt')}>
            {data.lastModificationTime ? dayjs(data.lastModificationTime).format('DD/MM/YYYY HH:mm:ss') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default TestRequestDetail;
