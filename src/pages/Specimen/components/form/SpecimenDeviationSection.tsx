import React from 'react';
import { Form, Input, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { VALIDATION_RULES } from '../../constants/specimenForm.constants';

const { TextArea } = Input;
const { Title } = Typography;

const SpecimenDeviationSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <Title level={5}>Ghi nhận sai lệch</Title>
      <Form.Item
        name="deviation"
        label="Sai lệch của mẫu (nếu có)"
        tooltip="Ghi nhận các sai lệch so với yêu cầu ban đầu: thiếu số lượng, bao bì hư hỏng, nhiệt độ không đảm bảo..."
        rules={[{ max: VALIDATION_RULES.deviation.max, message: t('validation.maxLength', { max: VALIDATION_RULES.deviation.max }) }]}
      >
        <TextArea
          rows={3}
          placeholder="Mô tả sai lệch: thiếu số lượng, bao bì hư hỏng, nhiệt độ bảo quản không đảm bảo..."
        />
      </Form.Item>
    </>
  );
};

export default SpecimenDeviationSection;