import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, message, Tag, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { specimenService } from '../../services/specimenService';
import { SpecimenDto, SpecimenStatus } from '../../types/specimen';
import dayjs from 'dayjs';
import './SpecimenDetail.css';
import { getSpecimenById, SpecimenStatus as MockSpecimenStatus } from '../../mocks/mockData';

// Get mock specimen from centralized data
const getMockSpecimen = (id: string): SpecimenDto | null => {
  const mockData = getSpecimenById(id);
  if (!mockData) return null;

  // Map mock status to SpecimenStatus
  let status: SpecimenStatus;
  switch (mockData.status) {
    case MockSpecimenStatus.Received:
      status = SpecimenStatus.Received;
      break;
    case MockSpecimenStatus.Testing:
      status = SpecimenStatus.Testing;
      break;
    case MockSpecimenStatus.Storage:
      status = SpecimenStatus.Storage;
      break;
    case MockSpecimenStatus.Disposal:
      status = SpecimenStatus.Disposal;
      break;
    case MockSpecimenStatus.Destroyed:
      status = SpecimenStatus.Destroyed;
      break;
    case MockSpecimenStatus.ReturnedToCustomer:
      status = SpecimenStatus.ReturnedToCustomer;
      break;
    default:
      status = SpecimenStatus.Received;
  }

  return {
    id: mockData.id,
    code: mockData.code,
    name: mockData.name,
    type: mockData.type,
    receivedDate: mockData.receivedDate,
    testRequestId: mockData.testRequestId,
    testRequestNumber: mockData.testRequestNumber,
    quantity: mockData.quantity,
    unit: mockData.unit,
    status,
    storageLocation: mockData.storageLocation,
    storageCondition: mockData.storageCondition,
    notes: mockData.description,
    creationTime: mockData.createdAt,
  };
};

const SpecimenDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SpecimenDto | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (specimenId: string) => {
    setLoading(true);
    try {
      const result = await specimenService.get(specimenId);
      setData(result);
    } catch (error) {
      console.log('API not available, using mock data');
      setData(getMockSpecimen(specimenId));
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: 'default', text: t('specimen.status.received') },
      [SpecimenStatus.Testing]: { color: 'processing', text: t('specimen.status.testing') },
      [SpecimenStatus.Storage]: { color: 'blue', text: t('specimen.status.storage') },
      [SpecimenStatus.Disposal]: { color: 'warning', text: t('specimen.status.disposal') },
      [SpecimenStatus.Destroyed]: { color: 'error', text: t('specimen.status.destroyed') },
      [SpecimenStatus.ReturnedToCustomer]: { color: 'success', text: t('specimen.status.returnedToCustomer') }
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
