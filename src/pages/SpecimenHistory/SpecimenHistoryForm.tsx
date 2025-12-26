import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Spin, DatePicker, InputNumber, Row, Col } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { specimenHistoryService } from '../../services/specimenHistoryService';
import { specimenService } from '../../services/specimenService';
import { storageLocationService } from '../../services/masterDataService';
import { userService, UserLookupDto } from '../../services/userService';
import { CreateSpecimenHistoryDto, UpdateSpecimenHistoryDto, SpecimenStatus } from '../../types/specimenHistory';
import { PATH_ROUTES } from '../../constants';

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

  // Master data from API
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<UserLookupDto[]>([]);

  const loadMasterData = async () => {
    try {
      const [specimensResult, locationsResult, usersResult] = await Promise.all([
        specimenService.getList({ maxResultCount: 1000 }),
        storageLocationService.getActive(),
        userService.getLookup(),
      ]);
      setSpecimens(specimensResult.items || []);
      setStorageLocations(locationsResult.items || []);
      setUsers(usersResult || []);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  useEffect(() => {
    loadMasterData();
    if (isEdit && id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (historyId: string) => {
    setLoading(true);
    try {
      const data = await specimenHistoryService.getById(historyId);
      form.setFieldsValue({
        specimenId: data.specimenId,
        action: data.action,
        location: data.location,
        status: data.status,
        notes: data.notes,
        temperature: data.temperature,
        humidity: data.humidity,
        timestamp: data.timestamp ? dayjs(data.timestamp) : undefined,
        performedById: data.performedById,
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
      const timestamp = values.timestamp ? values.timestamp.toISOString() : undefined;

      if (isEdit && id) {
        const updateDto: UpdateSpecimenHistoryDto = {
          action: values.action,
          location: values.location,
          status: values.status,
          notes: values.notes,
          temperature: values.temperature,
          humidity: values.humidity,
          timestamp: timestamp,
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
          temperature: values.temperature,
          humidity: values.humidity,
          timestamp: timestamp,
          performedById: values.performedById,
        };
        await specimenHistoryService.create(createDto);
        message.success(t('specimenHistory.form.createSuccess'));
      }
      navigate(PATH_ROUTES.specimenHistories.index);
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
                {specimens.map(specimen => (
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
              {storageLocations.map(loc => (
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
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map(user => (
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
            <Button onClick={() => navigate(PATH_ROUTES.specimenHistories.index)}>
              {t('common.cancel')}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default SpecimenHistoryForm;
