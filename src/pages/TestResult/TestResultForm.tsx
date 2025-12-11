import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, message, InputNumber, DatePicker, Card, Space, Checkbox } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testResultService } from '../../services/testResultService';
import { testService } from '../../services/testService';
import { CreateTestResultDto, UpdateTestResultDto, ResultApprovalStatus } from '../../types/testResult';
import { TestDto } from '../../types/test';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const TestResultForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<TestDto[]>([]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEditMode = !!id;

  useEffect(() => {
    fetchTests();
    if (isEditMode && id) {
      fetchTestResult(id);
    }
  }, [id]);

  const fetchTests = async () => {
    try {
      const result = await testService.getList({ maxResultCount: 1000 });
      setTests(result.items);
    } catch (error) {
      message.error(t('messages.loadFailed'));
    }
  };

  const fetchTestResult = async (testResultId: string) => {
    setLoading(true);
    try {
      const data = await testResultService.get(testResultId);
      form.setFieldsValue({
        ...data,
        entryDate: data.entryDate ? dayjs(data.entryDate) : null,
        reviewDate: data.reviewDate ? dayjs(data.reviewDate) : null,
        approvalDate: data.approvalDate ? dayjs(data.approvalDate) : null,
      });
    } catch (error) {
      message.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const formData = {
        ...values,
        entryDate: values.entryDate ? values.entryDate.toISOString() : null,
        reviewDate: values.reviewDate ? values.reviewDate.toISOString() : null,
        approvalDate: values.approvalDate ? values.approvalDate.toISOString() : null,
      };

      if (isEditMode && id) {
        await testResultService.update(id, formData as UpdateTestResultDto);
        message.success(t('messages.updateSuccess'));
      } else {
        await testResultService.create(formData as CreateTestResultDto);
        message.success(t('messages.createSuccess'));
      }
      navigate('/test-results');
    } catch (error) {
      message.error(isEditMode ? t('messages.updateFailed') : t('messages.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title={isEditMode ? t('testResult.editTestResult') : t('testResult.createTestResult')}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          {!isEditMode && (
            <Form.Item
              label={t('testResult.test')}
              name="testId"
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <Select
                placeholder={t('testResult.selectTest')}
                showSearch
                optionFilterProp="children"
              >
                {tests.map((test) => (
                  <Option key={test.id} value={test.id}>
                    {test.code} - {test.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label={t('testResult.parameter')}
            name="parameter"
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('testResult.value')}
            name="value"
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('testResult.unit')}
            name="unit"
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label={t('testResult.lowerLimit')} name="lowerLimit">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label={t('testResult.upperLimit')} name="upperLimit">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isPass" valuePropName="checked">
            <Checkbox>{t('testResult.isPass')}</Checkbox>
          </Form.Item>

          {isEditMode && (
            <>
              <Form.Item
                label={t('testResult.approvalStatus.label')}
                name="approvalStatus"
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <Select>
                  <Option value={ResultApprovalStatus.Draft}>{t('testResult.approvalStatus.draft')}</Option>
                  <Option value={ResultApprovalStatus.Submitted}>{t('testResult.approvalStatus.submitted')}</Option>
                  <Option value={ResultApprovalStatus.Step1Reviewed}>{t('testResult.approvalStatus.step1Reviewed')}</Option>
                  <Option value={ResultApprovalStatus.Step2Approved}>{t('testResult.approvalStatus.step2Approved')}</Option>
                  <Option value={ResultApprovalStatus.Rejected}>{t('testResult.approvalStatus.rejected')}</Option>
                </Select>
              </Form.Item>

              <Form.Item label={t('testResult.entryDate')} name="entryDate">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label={t('testResult.reviewDate')} name="reviewDate">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label={t('testResult.reviewComment')} name="reviewComment">
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item label={t('testResult.approvalDate')} name="approvalDate">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label={t('testResult.approvalComment')} name="approvalComment">
                <TextArea rows={3} />
              </Form.Item>
            </>
          )}

          <Form.Item label={t('testResult.chartData')} name="chartData">
            <TextArea rows={4} placeholder="JSON format" />
          </Form.Item>

          <Form.Item label={t('testResult.notes')} name="notes">
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t('common.save')}
              </Button>
              <Button onClick={() => navigate('/test-results')}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TestResultForm;
