// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Card, message, Select, Row, Col, InputNumber, Divider, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testRequestService } from '../../services/testRequestService';
import { TestRequestStatus } from '../../types/testRequest';
import dayjs from 'dayjs';
import FileUpload from '../../components/common/FileUpload';
import TATCalculator, { calculateWorkingEndDate } from '../../components/common/TATCalculator';

const { TextArea } = Input;
const { Title, Text } = Typography;

const TestRequestForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [tatDays, setTatDays] = useState<number>(5);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      loadData();
    }
  }, [id]);

  // Auto-calculate expected completion date when request date or TAT changes
  useEffect(() => {
    const requestDate = form.getFieldValue('requestDate');
    if (requestDate && tatDays > 0) {
      const endDate = calculateWorkingEndDate(requestDate, tatDays);
      form.setFieldsValue({ expectedCompletionDate: endDate });
    }
  }, [tatDays]);

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
      if (data.attachments) {
        setAttachments(data.attachments);
      }
    } catch (error) {
      message.error(t('messages.loadFailed'));
      console.error('Failed to load test request:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRequestDateChange = (date: any) => {
    if (date && tatDays > 0) {
      const endDate = calculateWorkingEndDate(date, tatDays);
      form.setFieldsValue({ expectedCompletionDate: endDate });
    }
  };

  const handleTATChange = (value: number | null) => {
    if (value) {
      setTatDays(value);
      const requestDate = form.getFieldValue('requestDate');
      if (requestDate) {
        const endDate = calculateWorkingEndDate(requestDate, value);
        form.setFieldsValue({ expectedCompletionDate: endDate });
      }
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        requestDate: values.requestDate ? values.requestDate.toISOString() : new Date().toISOString(),
        expectedCompletionDate: values.expectedCompletionDate ? values.expectedCompletionDate.toISOString() : null,
        attachments: attachments.map(f => ({
          name: f.name,
          url: f.url || f.response?.url,
          type: f.type
        })),
        tatDays: tatDays
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
          status: TestRequestStatus.Pending,
          tatDays: 5
        }}
      >
        {/* Thông tin khách hàng */}
        <Title level={5}>Thông tin khách hàng</Title>
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
              <Input placeholder="Nhập tên khách hàng" />
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
              <Input placeholder="email@example.com" />
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
              <Input placeholder="0xxx xxx xxx" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="customerAddress"
              label="Địa chỉ khách hàng"
              rules={[
                { max: 500, message: t('validation.maxLength', { max: 500 }) }
              ]}
            >
              <Input placeholder="Địa chỉ khách hàng" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="customerInfo"
          label={t('request.customerInfo')}
          rules={[
            { max: 1000, message: t('validation.maxLength', { max: 1000 }) }
          ]}
        >
          <TextArea rows={2} placeholder="Thông tin bổ sung về khách hàng..." />
        </Form.Item>

        <Divider />

        {/* Thời gian thử nghiệm */}
        <Title level={5}>Thời gian thử nghiệm (TAT)</Title>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="requestDate"
              label={t('request.requestDate')}
              rules={[{ required: true, message: t('validation.required') }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                onChange={handleRequestDateChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="tatDays"
              label="Số ngày TAT (ngày làm việc)"
              tooltip="Thời gian thử nghiệm dự kiến, không tính thứ 7, Chủ nhật và ngày lễ"
            >
              <InputNumber
                min={1}
                max={365}
                style={{ width: '100%' }}
                onChange={handleTATChange}
                addonAfter="ngày"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="expectedCompletionDate"
              label={t('request.expectedCompletionDate')}
              tooltip="Tự động tính từ ngày tiếp nhận + TAT"
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
        </Row>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          * Ngày hoàn thành dự kiến được tính tự động, bỏ qua thứ 7, Chủ nhật và ngày lễ
        </Text>

        <Divider />

        {/* Nhà thầu phụ */}
        <Title level={5}>Nhà thầu phụ (nếu có)</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="subcontractor"
              label={t('request.subcontractor')}
              rules={[
                { max: 256, message: t('validation.maxLength', { max: 256 }) }
              ]}
            >
              <Input placeholder="Tên nhà thầu phụ (nếu gửi mẫu ra ngoài)" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="subcontractorReason"
              label="Lý do sử dụng nhà thầu phụ"
            >
              <Input placeholder="Lý do gửi mẫu cho nhà thầu phụ" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* File đính kèm */}
        <Title level={5}>Hồ sơ đính kèm</Title>
        <Form.Item
          label="Đính kèm hình ảnh mẫu, biên bản, hồ sơ khách hàng"
          tooltip="Hỗ trợ: Hình ảnh (JPG, PNG), PDF, Word, Excel. Tối đa 10 file, mỗi file ≤ 10MB"
        >
          <FileUpload
            value={attachments}
            onChange={setAttachments}
            maxCount={10}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            maxSize={10}
          />
        </Form.Item>

        {isEditMode && (
          <>
            <Divider />
            <Title level={5}>Trạng thái</Title>
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
          </>
        )}

        <Divider />

        <Form.Item
          name="notes"
          label={t('request.notes')}
          rules={[
            { max: 2000, message: t('validation.maxLength', { max: 2000 }) }
          ]}
        >
          <TextArea rows={4} placeholder="Ghi chú thêm..." />
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
