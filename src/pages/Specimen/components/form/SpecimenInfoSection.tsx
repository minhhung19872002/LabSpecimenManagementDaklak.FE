import React from 'react';
import { Form, Input, DatePicker, Select, Row, Col, InputNumber, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SPECIMEN_UNIT_OPTIONS, VALIDATION_RULES } from '../../constants/specimenForm.constants';

const { Title } = Typography;

interface SpecimenInfoSectionProps {
  testRequests: Array<{ id: string; requestNumber: string; customerName: string }>;
  specimenTypes: Array<{ id: string; code: string; name: string }>;
  storageLocations: Array<{ id: string; code: string; name: string; temperature?: string }>;
}

const SpecimenInfoSection: React.FC<SpecimenInfoSectionProps> = ({
  testRequests,
  specimenTypes,
  storageLocations,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Title level={5}>Thông tin mẫu</Title>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="testRequestId"
            label={t('specimen.testRequest')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select
              showSearch
              placeholder={t('specimen.selectTestRequest')}
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {testRequests.map((tr) => (
                <Select.Option key={tr.id} value={tr.id}>
                  {tr.requestNumber} - {tr.customerName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="receivedDate"
            label={t('specimen.receivedDate')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label={t('specimen.name')}
            rules={[
              { required: true, message: t('validation.required') },
              { max: VALIDATION_RULES.name.max, message: t('validation.maxLength', { max: VALIDATION_RULES.name.max }) },
            ]}
          >
            <Input placeholder="Tên mẫu thử nghiệm" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="type"
            label={t('specimen.type')}
            rules={[
              { required: true, message: t('validation.required') },
              { max: VALIDATION_RULES.type.max, message: t('validation.maxLength', { max: VALIDATION_RULES.type.max }) },
            ]}
          >
            <Select placeholder="Chọn loại mẫu" showSearch optionFilterProp="children">
              {specimenTypes.map((type) => (
                <Select.Option key={type.id} value={type.name}>
                  {type.code} - {type.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="quantity"
            label={t('specimen.quantity')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="unit"
            label={t('specimen.unit')}
            rules={[
              { required: true, message: t('validation.required') },
              { max: VALIDATION_RULES.unit.max, message: t('validation.maxLength', { max: VALIDATION_RULES.unit.max }) },
            ]}
          >
            <Select placeholder="Đơn vị">
              {SPECIMEN_UNIT_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="storageLocation"
            label={t('specimen.storageLocation')}
            rules={[{ max: VALIDATION_RULES.storageLocation.max, message: t('validation.maxLength', { max: VALIDATION_RULES.storageLocation.max }) }]}
          >
            <Select placeholder="Vị trí lưu mẫu" allowClear showSearch optionFilterProp="children">
              {storageLocations.map((loc) => (
                <Select.Option key={loc.id} value={loc.name}>
                  {loc.code} - {loc.name} ({loc.temperature || 'N/A'})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default SpecimenInfoSection;