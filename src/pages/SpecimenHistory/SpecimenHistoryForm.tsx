import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { specimenHistoryService } from '../../services/specimenHistoryService';
import { CreateSpecimenHistoryDto, UpdateSpecimenHistoryDto, SpecimenStatus } from '../../types/specimenHistory';

const { Option } = Select;
const { TextArea } = Input;

const SpecimenHistoryForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit && id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (historyId: string) => {
    setLoading(true);
    try {
      const data = await specimenHistoryService.getById(historyId);
      form.setFieldsValue({
        action: data.action,
        location: data.location,
        status: data.status,
        notes: data.notes,
      });
    } catch (error) {
      message.error(t('specimenHistory.form.fetchError'));
      console.error('Failed to fetch specimen history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        const updateDto: UpdateSpecimenHistoryDto = {
          action: values.action,
          location: values.location,
          status: values.status,
          notes: values.notes,
          performedById: values.performedById,
        };
        await specimenHistoryService.update(id, updateDto);
        message.success(t('specimenHistory.form.updateSuccess'));
      } else {
        const createDto: CreateSpecimenHistoryDto = {
          specimenId: values.specimenId,
          action: values.action,
          location: values.location,
          status: values.status,
          notes: values.notes,
          performedById: values.performedById,
        };
        await specimenHistoryService.create(createDto);
        message.success(t('specimenHistory.form.createSuccess'));
      }
      navigate('/specimen-histories');
    } catch (error) {
      message.error(
        isEdit
          ? t('specimenHistory.form.updateError')
          : t('specimenHistory.form.createError')
      );
      console.error('Failed to save specimen history:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title={isEdit ? t('specimenHistory.form.editTitle') : t('specimenHistory.form.createTitle')}>
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: SpecimenStatus.Received,
          }}
        >
          {!isEdit && (
            <Form.Item
              label={t('specimenHistory.form.specimenId')}
              name="specimenId"
              rules={[{ required: true, message: t('specimenHistory.form.specimenIdRequired') }]}
            >
              <Input />
            </Form.Item>
          )}

          <Form.Item
            label={t('specimenHistory.form.action')}
            name="action"
            rules={[
              { required: true, message: t('specimenHistory.form.actionRequired') },
              { max: 200, message: t('specimenHistory.form.actionMaxLength') },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('specimenHistory.form.location')}
            name="location"
            rules={[
              { required: true, message: t('specimenHistory.form.locationRequired') },
              { max: 200, message: t('specimenHistory.form.locationMaxLength') },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('specimenHistory.form.status')}
            name="status"
            rules={[{ required: true, message: t('specimenHistory.form.statusRequired') }]}
          >
            <Select>
              <Option value={SpecimenStatus.Received}>{t('specimenHistory.status.received')}</Option>
              <Option value={SpecimenStatus.Testing}>{t('specimenHistory.status.testing')}</Option>
              <Option value={SpecimenStatus.Storage}>{t('specimenHistory.status.storage')}</Option>
              <Option value={SpecimenStatus.Disposal}>{t('specimenHistory.status.disposal')}</Option>
              <Option value={SpecimenStatus.Destroyed}>{t('specimenHistory.status.destroyed')}</Option>
              <Option value={SpecimenStatus.ReturnedToCustomer}>{t('specimenHistory.status.returnedToCustomer')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={t('specimenHistory.form.notes')}
            name="notes"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ marginRight: 8 }}>
              {isEdit ? t('common.update') : t('common.create')}
            </Button>
            <Button onClick={() => navigate('/specimen-histories')}>
              {t('common.cancel')}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default SpecimenHistoryForm;
