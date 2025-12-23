import React from 'react';
import { Card, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSpecimenDetail } from './hooks/useSpecimenDetail';
import { SpecimenDetailHeader, SpecimenDetailInfo } from './components/detail';
import './SpecimenDetail.css';

const SpecimenDetail: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, error, handleBack, handleEdit } = useSpecimenDetail();

  if (isLoading) {
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
        extra={<SpecimenDetailHeader onBack={handleBack} onEdit={handleEdit} />}
      >
        <SpecimenDetailInfo data={data} />
      </Card>
    </div>
  );
};

export default SpecimenDetail;
