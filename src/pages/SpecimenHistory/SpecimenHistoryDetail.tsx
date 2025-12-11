import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, message, Spin, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { specimenHistoryService } from '../../services/specimenHistoryService';
import { SpecimenHistoryDto, SpecimenStatus } from '../../types/specimenHistory';

const SpecimenHistoryDetail: React.FC = () => {
  const [data, setData] = useState<SpecimenHistoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (historyId: string) => {
    setLoading(true);
    try {
      const result = await specimenHistoryService.getById(historyId);
      setData(result);
    } catch (error) {
      message.error(t('specimenHistory.detail.fetchError'));
      console.error('Failed to fetch specimen history:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!data && !loading) {
    return null;
  }

  return (
    <Spin spinning={loading}>
      <Card
        title={t('specimenHistory.detail.title')}
        extra={
          <div>
            <Button
              type="primary"
              onClick={() => navigate(`/specimen-histories/${id}/edit`)}
              style={{ marginRight: 8 }}
            >
              {t('common.edit')}
            </Button>
            <Button onClick={() => navigate('/specimen-histories')}>
              {t('common.back')}
            </Button>
          </div>
        }
      >
        {data && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label={t('specimenHistory.detail.id')} span={2}>
              {data.id}
            </Descriptions.Item>

            <Descriptions.Item label={t('specimenHistory.detail.specimenCode')}>
              {data.specimenCode || '-'}
            </Descriptions.Item>

            <Descriptions.Item label={t('specimenHistory.detail.specimenId')}>
              {data.specimenId}
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

            <Descriptions.Item label={t('specimenHistory.detail.creationTime')}>
              {dayjs(data.creationTime).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>

            <Descriptions.Item label={t('specimenHistory.detail.notes')} span={2}>
              {data.notes || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </Spin>
  );
};

export default SpecimenHistoryDetail;
