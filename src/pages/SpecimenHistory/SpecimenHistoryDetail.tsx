import React from 'react';
import { Card, Descriptions, Button, Space, Spin, Tag, Alert } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { SpecimenStatus } from '../../types/specimenHistory';

// RTK Query imports
import { useGetSpecimenHistoryQuery } from '../../store/api/specimenHistoryApi';

const SpecimenHistoryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data, isLoading: loading, error } = useGetSpecimenHistoryQuery(id!, { skip: !id });

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: 'blue', label: t('specimenHistory.status.received') },
      [SpecimenStatus.Testing]: { color: 'orange', label: t('specimenHistory.status.testing') },
      [SpecimenStatus.Storage]: { color: 'green', label: t('specimenHistory.status.storage') },
      [SpecimenStatus.Disposal]: { color: 'red', label: t('specimenHistory.status.disposal') },
      [SpecimenStatus.Destroyed]: { color: 'volcano', label: t('specimenHistory.status.destroyed') },
      [SpecimenStatus.ReturnedToCustomer]: { color: 'purple', label: t('specimenHistory.status.returnedToCustomer') },
    };

    const config = statusConfig[status];
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description="Không thể tải thông tin lịch sử mẫu. Vui lòng thử lại!"
        type="error"
        showIcon
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Spin spinning={loading}>
      <Card
        title={t('specimenHistory.detail.title')}
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/specimen-histories')}
            >
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/specimen-histories/${id}/edit`)}
            >
              {t('common.edit')}
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label={t('specimenHistory.detail.specimenCode')} span={2}>
            <strong>{data.specimenCode || '-'}</strong>
          </Descriptions.Item>

          <Descriptions.Item label={t('specimenHistory.detail.action')}>
            {data.action}
          </Descriptions.Item>

          <Descriptions.Item label={t('specimenHistory.detail.location')}>
            {data.location}
          </Descriptions.Item>

          <Descriptions.Item label={t('specimenHistory.detail.status')}>
            {getStatusTag(data.status)}
          </Descriptions.Item>

          <Descriptions.Item label="Người thực hiện">
            {data.performedByName || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian thực hiện">
            {data.timestamp ? dayjs(data.timestamp).format('DD/MM/YYYY HH:mm') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label={t('specimenHistory.detail.creationTime')}>
            {dayjs(data.creationTime).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>

          <Descriptions.Item label="Nhiệt độ">
            {data.temperature != null ? `${data.temperature}°C` : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Độ ẩm">
            {data.humidity != null ? `${data.humidity}%` : '-'}
          </Descriptions.Item>

          <Descriptions.Item label={t('specimenHistory.detail.notes')} span={2}>
            {data.notes || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Spin>
  );
};

export default SpecimenHistoryDetail;
