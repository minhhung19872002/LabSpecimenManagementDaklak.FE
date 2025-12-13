import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, message, InputNumber, DatePicker, Card, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testService } from '../../services/testService';
import { CreateTestDto, UpdateTestDto, TestStatus } from '../../types/test';
import dayjs from 'dayjs';
import { mockSpecimens, mockTestMethods, mockUsers } from '../../mocks/mockData';

const { TextArea } = Input;
const { Option } = Select;

const TestForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEditMode = !!id;

  // Use centralized mock data for specimens
  const specimens = mockSpecimens.map(s => ({
    id: s.id,
    code: s.code,
    name: s.name,
  }));

  // Get technicians for assignee dropdown
  const technicians = mockUsers.filter(u =>
    u.role === 'Technician' || u.role === 'LabManager'
  );

  useEffect(() => {
    if (isEditMode && id) {
      fetchTest(id);
    }
  }, [id]);

  const fetchTest = async (testId: string) => {
    setLoading(true);
    try {
      const data = await testService.get(testId);
      form.setFieldsValue({
        ...data,
        assignmentDate: data.assignmentDate ? dayjs(data.assignmentDate) : null,
        startDate: data.startDate ? dayjs(data.startDate) : null,
        completionDate: data.completionDate ? dayjs(data.completionDate) : null,
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
        assignmentDate: values.assignmentDate ? values.assignmentDate.toISOString() : null,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        completionDate: values.completionDate ? values.completionDate.toISOString() : null,
      };

      if (isEditMode && id) {
        await testService.update(id, formData as UpdateTestDto);
        message.success(t('messages.updateSuccess'));
      } else {
        await testService.create(formData as CreateTestDto);
        message.success(t('messages.createSuccess'));
      }
      navigate('/tests');
    } catch (error) {
      message.error(isEditMode ? t('messages.updateFailed') : t('messages.createFailed'));
    } finally {
      setLoading(false);
    }
  };

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
              {mockTestMethods.map(method => (
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
            <Select placeholder="Chọn người thực hiện" allowClear showSearch optionFilterProp="children">
              {technicians.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.fullName} - {user.department}
                </Option>
              ))}
            </Select>
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
