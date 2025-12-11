import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Card, message, Select, Row, Col, InputNumber } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { specimenService } from '../../services/specimenService';
import { testRequestService } from '../../services/testRequestService';
import { SpecimenStatus } from '../../types/specimen';
import { TestRequestDto } from '../../types/testRequest';
import dayjs from 'dayjs';

const { TextArea } = Input;

const SpecimenForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [testRequests, setTestRequests] = useState<TestRequestDto[]>([]);
  const isEditMode = !!id;

  useEffect(() => {
    loadTestRequests();
    if (isEditMode) {
      loadData();
    }
  }, [id]);

  const loadTestRequests = async () => {
    try {
      const result = await testRequestService.getList({
        skipCount: 0,
        maxResultCount: 1000,
        sorting: 'requestDate desc'
      });
      setTestRequests(result.items);
    } catch (error) {
      message.error(t('messages.loadFailed'));
      console.error('Failed to load test requests:', error);
    }
  };

  const loadData = async () => {
    if (!id) return;

    setLoadingData(true);
    try {
      const data = await specimenService.get(id);
      form.setFieldsValue({
        ...data,
        receivedDate: data.receivedDate ? dayjs(data.receivedDate) : null
      });
    } catch (error) {
      message.error(t('messages.loadFailed'));
      console.error('Failed to load specimen:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        receivedDate: values.receivedDate ? values.receivedDate.toISOString() : new Date().toISOString()
      };

      if (isEditMode && id) {
        await specimenService.update(id, payload);
        message.success(t('messages.updateSuccess'));
      } else {
        await specimenService.create(payload);
        message.success(t('messages.createSuccess'));
      }
      navigate('/specimens');
    } catch (error) {
      message.error(isEditMode ? t('messages.updateFailed') : t('messages.createFailed'));
      console.error('Failed to save specimen:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={isEditMode ? t('specimen.editSpecimen') : t('specimen.createSpecimen')}
      loading={loadingData}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          receivedDate: dayjs(),
          quantity: 1,
          unit: 'Cái',
          status: SpecimenStatus.Received
        }}
      >
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
                  (option?.children as string).toLowerCase().includes(input.toLowerCase())
                }
              >
                {testRequests.map(tr => (
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
                { max: 256, message: t('validation.maxLength', { max: 256 }) }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label={t('specimen.type')}
              rules={[
                { required: true, message: t('validation.required') },
                { max: 256, message: t('validation.maxLength', { max: 256 }) }
              ]}
            >
              <Input />
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
                { max: 50, message: t('validation.maxLength', { max: 50 }) }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="storageLocation"
              label={t('specimen.storageLocation')}
              rules={[
                { max: 256, message: t('validation.maxLength', { max: 256 }) }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {isEditMode && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label={t('specimen.status.label')}
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <Select>
                  <Select.Option value={SpecimenStatus.Received}>
                    {t('specimen.status.received')}
                  </Select.Option>
                  <Select.Option value={SpecimenStatus.Testing}>
                    {t('specimen.status.testing')}
                  </Select.Option>
                  <Select.Option value={SpecimenStatus.Storage}>
                    {t('specimen.status.storage')}
                  </Select.Option>
                  <Select.Option value={SpecimenStatus.Disposal}>
                    {t('specimen.status.disposal')}
                  </Select.Option>
                  <Select.Option value={SpecimenStatus.Destroyed}>
                    {t('specimen.status.destroyed')}
                  </Select.Option>
                  <Select.Option value={SpecimenStatus.ReturnedToCustomer}>
                    {t('specimen.status.returnedToCustomer')}
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Form.Item
          name="images"
          label={t('specimen.images')}
          rules={[
            { max: 2000, message: t('validation.maxLength', { max: 2000 }) }
          ]}
        >
          <TextArea rows={2} placeholder={t('specimen.imagesPlaceholder')} />
        </Form.Item>

        <Form.Item
          name="deviation"
          label={t('specimen.deviation')}
          rules={[
            { max: 1000, message: t('validation.maxLength', { max: 1000 }) }
          ]}
        >
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item
          name="notes"
          label={t('specimen.notes')}
          rules={[
            { max: 2000, message: t('validation.maxLength', { max: 2000 }) }
          ]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditMode ? t('common.update') : t('common.create')}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/specimens')}>
            {t('common.cancel')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SpecimenForm;
