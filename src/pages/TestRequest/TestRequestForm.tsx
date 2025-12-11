import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Card, message, Select, Row, Col } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testRequestService } from '../../services/testRequestService';
import { TestRequestStatus } from '../../types/testRequest';
import dayjs from 'dayjs';

const { TextArea } = Input;

const TestRequestForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    setLoadingData(true);
    try {
      const data = await testRequestService.get(id);
      form.setFieldsValue({
        ...data,
        requestDate: data.requestDate ? dayjs(data.requestDate) : null,
        expectedCompletionDate: data.expectedCompletionDate ? dayjs(data.expectedCompletionDate) : null
      });
    } catch (error) {
      message.error(t('messages.loadFailed'));
      console.error('Failed to load test request:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        requestDate: values.requestDate ? values.requestDate.toISOString() : new Date().toISOString(),
        expectedCompletionDate: values.expectedCompletionDate ? values.expectedCompletionDate.toISOString() : null
      };

      if (isEditMode && id) {
        await testRequestService.update(id, payload);
        message.success(t('messages.updateSuccess'));
      } else {
        await testRequestService.create(payload);
        message.success(t('messages.createSuccess'));
      }
      navigate('/requests');
    } catch (error) {
      message.error(isEditMode ? t('messages.updateFailed') : t('messages.createFailed'));
      console.error('Failed to save test request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={isEditMode ? t('request.editTestRequest') : t('request.createTestRequest')}
      loading={loadingData}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          requestDate: dayjs(),
          status: TestRequestStatus.Pending
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="requestDate"
              label={t('request.requestDate')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="expectedCompletionDate"
              label={t('request.expectedCompletionDate')}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customerName"
              label={t('request.customerName')}
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
              name="customerEmail"
              label={t('request.customerEmail')}
              rules={[
                { type: 'email', message: t('validation.email') },
                { max: 256, message: t('validation.maxLength', { max: 256 }) }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customerPhone"
              label={t('request.customerPhone')}
              rules={[
                { max: 50, message: t('validation.maxLength', { max: 50 }) }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="subcontractor"
              label={t('request.subcontractor')}
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
                label={t('request.status.label')}
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <Select>
                  <Select.Option value={TestRequestStatus.Pending}>
                    {t('request.status.pending')}
                  </Select.Option>
                  <Select.Option value={TestRequestStatus.InProgress}>
                    {t('request.status.inProgress')}
                  </Select.Option>
                  <Select.Option value={TestRequestStatus.Completed}>
                    {t('request.status.completed')}
                  </Select.Option>
                  <Select.Option value={TestRequestStatus.Cancelled}>
                    {t('request.status.cancelled')}
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Form.Item
          name="customerInfo"
          label={t('request.customerInfo')}
          rules={[
            { max: 1000, message: t('validation.maxLength', { max: 1000 }) }
          ]}
        >
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item
          name="notes"
          label={t('request.notes')}
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
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/requests')}>
            {t('common.cancel')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TestRequestForm;
