import React from 'react';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { renderStatusTag } from '../../utils/specimenStatus';

interface SpecimenDetailInfoProps {
  data: {
    code: string;
    name: string;
    type: string;
    testRequestNumber?: string;
    receivedDate: string;
    quantity: number;
    unit: string;
    status: number;
    storageLocation?: string;
    images?: string;
    deviation?: string;
    notes?: string;
    creationTime?: string;
    lastModificationTime?: string;
  };
}

const SpecimenDetailInfo: React.FC<SpecimenDetailInfoProps> = ({ data }) => {
  const { t } = useTranslation();

  return (
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
        {renderStatusTag(data.status, t)}
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
  );
};

export default SpecimenDetailInfo;
