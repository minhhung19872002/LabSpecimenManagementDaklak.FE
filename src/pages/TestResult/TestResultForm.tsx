import React, { useEffect, useMemo } from 'react';
import { Form, Input, Button, Select, message, InputNumber, DatePicker, Card, Space, Checkbox, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreateTestResultDto, UpdateTestResultDto, ResultApprovalStatus } from '../../types/testResult';
import dayjs from 'dayjs';

// RTK Query imports
import {
  useGetTestResultQuery,
  useCreateTestResultMutation,
  useUpdateTestResultMutation,
} from '../../store/api/testResultApi';
import { useGetTestListQuery } from '../../store/api/testApi';

const { TextArea } = Input;
const { Option } = Select;

const TestResultForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEditMode = !!id;

  // RTK Query hooks
  const { data: testResult, isLoading: loadingTestResult } = useGetTestResultQuery(id!, { skip: !id });
  const { data: testsData } = useGetTestListQuery({ maxResultCount: 1000 });

  // Mutations
  const [createTestResult, { isLoading: isCreating }] = useCreateTestResultMutation();
  const [updateTestResult, { isLoading: isUpdating }] = useUpdateTestResultMutation();

  // Derived data
  const tests = useMemo(() => testsData?.items || [], [testsData]);
  const loading = loadingTestResult || isCreating || isUpdating;

  // Set form values when test result data is loaded
  useEffect(() => {
    if (testResult && isEditMode) {
      form.setFieldsValue({
        ...testResult,
        entryDate: testResult.entryDate ? dayjs(testResult.entryDate) : null,
        reviewDate: testResult.reviewDate ? dayjs(testResult.reviewDate) : null,
        approvalDate: testResult.approvalDate ? dayjs(testResult.approvalDate) : null,
      });
    }
  }, [testResult, isEditMode, form]);

  const onFinish = async (values: any) => {
    try {
      const formData = {
        ...values,
        entryDate: values.entryDate ? values.entryDate.toISOString() : null,
        reviewDate: values.reviewDate ? values.reviewDate.toISOString() : null,
        approvalDate: values.approvalDate ? values.approvalDate.toISOString() : null,
      };

      if (isEditMode && id) {
        await updateTestResult({ id, data: formData as UpdateTestResultDto }).unwrap();
        message.success(t('messages.updateSuccess'));
      } else {
        await createTestResult(formData as CreateTestResultDto).unwrap();
        message.success(t('messages.createSuccess'));
      }
      navigate('/test-results');
    } catch (error: any) {
      console.error('Failed to save test result:', error);
      message.error(error?.data?.error?.message || (isEditMode ? t('messages.updateFailed') : t('messages.createFailed')));
    }
  };

  if (loadingTestResult && isEditMode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

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
