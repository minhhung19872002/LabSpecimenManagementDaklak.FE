import React from 'react';
import { Card, Descriptions, Button, Space, Tag, Spin, Alert } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SpecimenStatus } from '../../types/specimen';
import dayjs from 'dayjs';
import './SpecimenDetail.css';

// RTK Query imports
import { useGetSpecimenQuery } from '../../store/api/specimenApi';

const SpecimenDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading: loading, error } = useGetSpecimenQuery(id!, { skip: !id });

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: 'default', text: t('specimen.status.received') },
      [SpecimenStatus.Testing]: { color: 'processing', text: t('specimen.status.testing') },
      [SpecimenStatus.Storage]: { color: 'blue', text: t('specimen.status.storage') },
      [SpecimenStatus.Disposal]: { color: 'warning', text: t('specimen.status.disposal') },
      [SpecimenStatus.Destroyed]: { color: 'error', text: t('specimen.status.destroyed') },
      [SpecimenStatus.ReturnedToCustomer]: { color: 'success', text: t('specimen.status.returnedToCustomer') },
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

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description="Không thể tải thông tin mẫu. Vui lòng thử lại!"
        type="error"
        showIcon
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="specimen-detail">
      <Card
        title={t('specimen.viewSpecimen')}
        extra={
          <Space>
            <Button onClick={() => navigate('/specimens')}>
              {t('common.back')}
            </Button>
            <Button type="primary" onClick={() => navigate(`/specimen/edit/${id}`)}>
              {t('common.edit')}
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label={t('specimen.code')} span={2}>
            {data.code}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.name')}>
            {data.name}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.type')}>
            {data.type}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.testRequestNumber')}>
            {data.testRequestNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.receivedDate')}>
            {dayjs(data.receivedDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.quantity')}>
            {data.quantity} {data.unit}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.status.label')}>
            {getStatusTag(data.status)}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.storageLocation')} span={2}>
            {data.storageLocation || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.images')} span={2}>
            {data.images || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.deviation')} span={2}>
            {data.deviation || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('specimen.notes')} span={2}>
            {data.notes || '-'}
          </Descriptions.Item>
          {data.creationTime && (
            <Descriptions.Item label={t('common.createdAt')} span={2}>
              {dayjs(data.creationTime).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
          )}
          {data.lastModificationTime && (
            <Descriptions.Item label={t('common.lastModified')} span={2}>
              {dayjs(data.lastModificationTime).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
};

export default SpecimenDetail;
