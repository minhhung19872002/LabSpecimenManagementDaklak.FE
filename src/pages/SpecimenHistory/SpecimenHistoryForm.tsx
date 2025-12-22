import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Spin, DatePicker, InputNumber, Row, Col } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { SpecimenStatus } from '../../types/specimenHistory';

// RTK Query imports
import {
  useGetSpecimenHistoryQuery,
  useCreateSpecimenHistoryMutation,
  useUpdateSpecimenHistoryMutation,
} from '../../store/api/specimenHistoryApi';
import { useGetSpecimenListQuery } from '../../store/api/specimenApi';
import { useGetActiveStorageLocationsQuery } from '../../store/api/masterDataApi';
import { useGetUserLookupQuery } from '../../store/api/userApi';

const { Option } = Select;
const { TextArea } = Input;

const SpecimenHistoryForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const isEdit = !!id;

  // RTK Query hooks
  const { data: historyData, isLoading: loading } = useGetSpecimenHistoryQuery(id!, { skip: !id });
  const { data: specimensData } = useGetSpecimenListQuery({ maxResultCount: 1000 });
  const { data: storageLocationsData } = useGetActiveStorageLocationsQuery();
  const { data: usersData } = useGetUserLookupQuery();

  // Mutations
  const [createSpecimenHistory, { isLoading: isCreating }] = useCreateSpecimenHistoryMutation();
  const [updateSpecimenHistory, { isLoading: isUpdating }] = useUpdateSpecimenHistoryMutation();

  const submitting = isCreating || isUpdating;
  const specimens = specimensData?.items || [];
  const storageLocations = storageLocationsData?.items || [];
  const users = usersData || [];

  // Populate form when data is loaded
  useEffect(() => {
    if (historyData && isEdit) {
      form.setFieldsValue({
        specimenId: historyData.specimenId,
        action: historyData.action,
        location: historyData.location,
        status: historyData.status,
        notes: historyData.notes,
        temperature: historyData.temperature,
        humidity: historyData.humidity,
        timestamp: historyData.timestamp ? dayjs(historyData.timestamp) : undefined,
        performedById: historyData.performedById,
      });
    }
  }, [historyData, isEdit, form]);

  const onFinish = async (values: any) => {
    try {
      const timestamp = values.timestamp ? values.timestamp.toISOString() : undefined;

      const payload = {
        specimenId: values.specimenId,
        action: values.action,
        location: values.location,
        status: values.status,
        notes: values.notes,
        temperature: values.temperature,
        humidity: values.humidity,
        timestamp: timestamp,
        performedById: values.performedById,
      };

      if (isEdit && id) {
        await updateSpecimenHistory({ id, data: payload }).unwrap();
        message.success(t('specimenHistory.form.updateSuccess'));
      } else {
        await createSpecimenHistory(payload).unwrap();
        message.success(t('specimenHistory.form.createSuccess'));
      }
      navigate('/specimen-histories');
    } catch (error: any) {
      console.error('Failed to save specimen history:', error);
      message.error(
        isEdit
          ? t('specimenHistory.form.updateError')
          : t('specimenHistory.form.createError')
      );
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
            timestamp: dayjs(),
          }}
        >
          {!isEdit && (
            <Form.Item
              label={t('specimenHistory.form.specimenId')}
              name="specimenId"
              rules={[{ required: true, message: t('specimenHistory.form.specimenIdRequired') }]}
            >
              <Select placeholder="Chọn mẫu" showSearch optionFilterProp="children">
                {specimens.map((specimen: any) => (
                  <Option key={specimen.id} value={specimen.id}>
                    {specimen.code} - {specimen.name}
                  </Option>
                ))}
              </Select>
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
            <Select placeholder="Chọn hành động">
              <Option value="Tiếp nhận mẫu">Tiếp nhận mẫu</Option>
              <Option value="Chuyển vào phòng thử nghiệm">Chuyển vào phòng thử nghiệm</Option>
              <Option value="Chuyển vào tủ lạnh">Chuyển vào tủ lạnh</Option>
              <Option value="Lấy mẫu thử nghiệm">Lấy mẫu thử nghiệm</Option>
              <Option value="Hoàn tất thử nghiệm">Hoàn tất thử nghiệm</Option>
              <Option value="Chuyển lưu kho">Chuyển lưu kho</Option>
              <Option value="Hủy mẫu">Hủy mẫu</Option>
              <Option value="Trả mẫu cho khách">Trả mẫu cho khách</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={t('specimenHistory.form.location')}
            name="location"
            rules={[
              { required: true, message: t('specimenHistory.form.locationRequired') },
              { max: 200, message: t('specimenHistory.form.locationMaxLength') },
            ]}
          >
            <Select placeholder="Chọn vị trí" showSearch optionFilterProp="children">
              <Option value="Quầy tiếp nhận">Quầy tiếp nhận</Option>
              {storageLocations.map((loc: any) => (
                <Option key={loc.id} value={loc.name}>
                  {loc.code} - {loc.name}
                </Option>
              ))}
            </Select>
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

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Thời gian"
                name="timestamp"
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: '100%' }}
                  placeholder="Chọn thời gian"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Nhiệt độ (°C)"
                name="temperature"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 25.5"
                  step={0.1}
                  precision={1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Độ ẩm (%)"
                name="humidity"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 65"
                  min={0}
                  max={100}
                  step={1}
                  precision={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Người thực hiện"
            name="performedById"
          >
            <Select
              placeholder="Chọn người thực hiện"
              showSearch
              optionFilterProp="children"
              allowClear
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user: any) => (
                <Option key={user.id} value={user.id}>
                  {user.displayName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('specimenHistory.form.notes')}
            name="notes"
          >
            <TextArea rows={4} placeholder="Ghi chú thêm (nếu có)" />
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
