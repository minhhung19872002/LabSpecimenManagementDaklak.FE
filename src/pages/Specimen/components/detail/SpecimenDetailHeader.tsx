import React from 'react';
import { Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';

interface SpecimenDetailHeaderProps {
  onBack: () => void;
  onEdit: () => void;
}

const SpecimenDetailHeader: React.FC<SpecimenDetailHeaderProps> = ({ onBack, onEdit }) => {
  const { t } = useTranslation();

  return (
    <Space>
      <Button onClick={onBack}>{t('common.back')}</Button>
      <Button type="primary" onClick={onEdit}>{t('common.edit')}</Button>
    </Space>
  );
};

export default SpecimenDetailHeader;
