import React from 'react';
import { Form, Select, Row, Col, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SPECIMEN_STATUS_OPTIONS } from '../../constants/specimenForm.constants';

const { Title } = Typography;

interface SpecimenStatusSectionProps {
  isEditMode: boolean;
}

const SpecimenStatusSection: React.FC<SpecimenStatusSectionProps> = ({ isEditMode }) => {
  const { t } = useTranslation();

  if (!isEditMode) {
    return null;
  }

  return (
    <>
      <Title level={5}>Trạng thái mẫu</Title>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="status"
            label={t('specimen.status.label')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select>
              {SPECIMEN_STATUS_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default SpecimenStatusSection;