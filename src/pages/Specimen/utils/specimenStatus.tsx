import React from 'react';
import { Tag } from 'antd';
import { TFunction } from 'i18next';
import { SpecimenStatus } from '../../../types/specimen';

export const getStatusConfig = (status: SpecimenStatus, t: TFunction) => {
  const statusConfig: Record<SpecimenStatus, { color: string; text: string }> = {
    [SpecimenStatus.Received]: { color: 'default', text: t('specimen.status.received') },
    [SpecimenStatus.Testing]: { color: 'processing', text: t('specimen.status.testing') },
    [SpecimenStatus.Storage]: { color: 'blue', text: t('specimen.status.storage') },
    [SpecimenStatus.Disposal]: { color: 'warning', text: t('specimen.status.disposal') },
    [SpecimenStatus.Destroyed]: { color: 'error', text: t('specimen.status.destroyed') },
    [SpecimenStatus.ReturnedToCustomer]: { color: 'success', text: t('specimen.status.returnedToCustomer') },
  };
  return statusConfig[status];
};

export const renderStatusTag = (status: SpecimenStatus, t: TFunction) => {
  const config = getStatusConfig(status, t);
  return <Tag color={config.color}>{config.text}</Tag>;
};
