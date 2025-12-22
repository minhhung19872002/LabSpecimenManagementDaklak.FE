import React, { useEffect, useMemo } from 'react';
import { Form, Input, Button, Select, message, InputNumber, DatePicker, Card, Space, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TestStatus } from '../../types/test';
import dayjs from 'dayjs';

// RTK Query imports
import { useGetTestQuery, useCreateTestMutation, useUpdateTestMutation } from '../../store/api/testApi';
import { useGetSpecimenListQuery } from '../../store/api/specimenApi';
import { useGetTestMethodListQuery } from '../../store/api/masterDataApi';

const { TextArea } = Input;
const { Option } = Select;

const TestForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEditMode = !!id;

  // RTK Query hooks
  const { data: testData, isLoading: loadingTest } = useGetTestQuery(id!, { skip: !id });
  const { data: specimensData } = useGetSpecimenListQuery({ maxResultCount: 1000 });
  const { data: testMethodsData } = useGetTestMethodListQuery({ maxResultCount: 1000 });

  // Mutations
  const [createTest, { isLoading: isCreating }] = useCreateTestMutation();
  const [updateTest, { isLoading: isUpdating }] = useUpdateTestMutation();

  // Derived data
  const specimens = useMemo(() => specimensData?.items || [], [specimensData]);
  const testMethods = useMemo(() => testMethodsData?.items || [], [testMethodsData]);
  const loading = loadingTest || isCreating || isUpdating;

  // Set form values when test data is loaded
  useEffect(() => {
    if (testData && isEditMode) {
      form.setFieldsValue({
        ...testData,
        assignmentDate: testData.assignmentDate ? dayjs(testData.assignmentDate) : null,
        startDate: testData.startDate ? dayjs(testData.startDate) : null,
        completionDate: testData.completionDate ? dayjs(testData.completionDate) : null,
      });
    }
  }, [testData, isEditMode, form]);

  const onFinish = async (values: any) => {
    try {
      const formData = {
        ...values,
        assignmentDate: values.assignmentDate ? values.assignmentDate.toISOString() : null,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        completionDate: values.completionDate ? values.completionDate.toISOString() : null,
      };

      if (isEditMode && id) {
        await updateTest({ id, data: formData }).unwrap();
        message.success(t('messages.updateSuccess'));
      } else {
        await createTest(formData).unwrap();
        message.success(t('messages.createSuccess'));
      }
      navigate('/tests');
    } catch (error: any) {
      console.error('Failed to save test:', error);
      message.error(error?.data?.error?.message || (isEditMode ? t('messages.updateFailed') : t('messages.createFailed')));
    }
  };

  if (loadingTest && isEditMode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card title={isEditMode ? t('test.editTest') : t('test.createTest')}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          {!isEditMode && (
            <Form.Item
              label={t('test.specimen')}
              name="specimenId"
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <Select
                placeholder={t('test.selectSpecimen')}
                showSearch
                optionFilterProp="children"
              >
                {specimens.map((specimen) => (
                  <Option key={specimen.id} value={specimen.id}>
                    {specimen.code} - {specimen.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label={t('test.name')}
            name="name"
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('test.method')}
            name="method"
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select placeholder="Chọn phương pháp thử" showSearch optionFilterProp="children">
              {testMethods.map(method => (
                <Option key={method.id} value={method.name}>
                  {method.code} - {method.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('test.standard')}
            name="standard"
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input placeholder="Tiêu chuẩn áp dụng (VD: TCVN, QCVN...)" />
          </Form.Item>

          {isEditMode && (
            <>
              <Form.Item
                label={t('test.status.label')}
                name="status"
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <Select>
                  <Option value={TestStatus.Pending}>{t('test.status.pending')}</Option>
                  <Option value={TestStatus.Assigned}>{t('test.status.assigned')}</Option>
                  <Option value={TestStatus.InProgress}>{t('test.status.inProgress')}</Option>
                  <Option value={TestStatus.Completed}>{t('test.status.completed')}</Option>
                  <Option value={TestStatus.Reviewed}>{t('test.status.reviewed')}</Option>
                  <Option value={TestStatus.Approved}>{t('test.status.approved')}</Option>
                </Select>
              </Form.Item>

              <Form.Item label={t('test.assignmentDate')} name="assignmentDate">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label={t('test.startDate')} name="startDate">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label={t('test.completionDate')} name="completionDate">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}

          <Form.Item label={t('test.assigneeId')} name="assigneeId">
            <Input placeholder="Nhập ID người thực hiện" />
          </Form.Item>

          <Form.Item label={t('test.estimatedDuration')} name="estimatedDuration">
            <InputNumber min={0} style={{ width: '100%' }} placeholder={t('test.estimatedDurationPlaceholder')} />
          </Form.Item>

          <Form.Item label={t('test.notes')} name="notes">
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t('common.save')}
              </Button>
              <Button onClick={() => navigate('/tests')}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TestForm;
