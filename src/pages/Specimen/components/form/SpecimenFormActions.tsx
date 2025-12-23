import React from 'react';
import { Form, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface SpecimenFormActionsProps {
  isEditMode: boolean;
  loading: boolean;
  onCancel: () => void;
}

const SpecimenFormActions: React.FC<SpecimenFormActionsProps> = ({
  isEditMode,
  loading,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Form.Item>
      <Button type="primary" htmlType="submit" loading={loading}>
        {isEditMode ? t('common.update') : t('common.create')}
      </Button>
      <Button style={{ marginLeft: 8 }} onClick={onCancel}>
        {t('common.cancel')}
      </Button>
    </Form.Item>
  );
};

export default SpecimenFormActions;
