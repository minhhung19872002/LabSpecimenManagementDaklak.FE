import React from 'react';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { VALIDATION_RULES } from '../../constants/specimenForm.constants';

const { TextArea } = Input;

const SpecimenNotesSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Form.Item
      name="notes"
      label={t('specimen.notes')}
      rules={[{ max: VALIDATION_RULES.notes.max, message: t('validation.maxLength', { max: VALIDATION_RULES.notes.max }) }]}
    >
      <TextArea rows={4} placeholder="Ghi chú thêm về mẫu..." />
    </Form.Item>
  );
};

export default SpecimenNotesSection;
