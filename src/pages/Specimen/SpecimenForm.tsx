import React, { useState, useEffect, useMemo } from 'react';
import { Form, Input, DatePicker, Button, Card, message, Select, Row, Col, InputNumber, Divider, Typography, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SpecimenStatus } from '../../types/specimen';
import dayjs from 'dayjs';
import FileUpload from '../../components/common/FileUpload';

// RTK Query imports
import {
  useGetSpecimenQuery,
  useCreateSpecimenMutation,
  useUpdateSpecimenMutation,
} from '../../store/api/specimenApi';
import { useGetTestRequestListQuery } from '../../store/api/testRequestApi';
import {
  useGetActiveSpecimenTypesQuery,
  useGetActiveStorageLocationsQuery,
} from '../../store/api/masterDataApi';

const { TextArea } = Input;
const { Title } = Typography;

const SpecimenForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [specimenImages, setSpecimenImages] = useState<any[]>([]);
  const isEditMode = !!id;

  // RTK Query hooks
  const { data: specimenData, isLoading: loadingSpecimen } = useGetSpecimenQuery(id!, { skip: !id });
  const { data: testRequestsData } = useGetTestRequestListQuery({ maxResultCount: 1000 });
  const { data: specimenTypesData } = useGetActiveSpecimenTypesQuery();
  const { data: storageLocationsData } = useGetActiveStorageLocationsQuery();

  // Mutations
  const [createSpecimen, { isLoading: isCreating }] = useCreateSpecimenMutation();
  const [updateSpecimen, { isLoading: isUpdating }] = useUpdateSpecimenMutation();

  // Derived data
  const testRequests = useMemo(() => {
    const items = testRequestsData?.items || [];
    return items.map((tr: any) => ({
      id: tr.id,
      requestNumber: tr.requestNumber,
      customerName: tr.customerName,
    }));
  }, [testRequestsData]);
  const specimenTypes = useMemo(() => specimenTypesData?.items || [], [specimenTypesData]);
  const storageLocations = useMemo(() => storageLocationsData?.items || [], [storageLocationsData]);
  const loading = isCreating || isUpdating;

  // Set form values when specimen data is loaded
  useEffect(() => {
    if (specimenData && isEditMode) {
      form.setFieldsValue({
        ...specimenData,
        receivedDate: specimenData.receivedDate ? dayjs(specimenData.receivedDate) : null,
      });
      // Parse images from string if available
      if (specimenData.images) {
        try {
          const parsedImages = JSON.parse(specimenData.images);
          if (Array.isArray(parsedImages)) {
            setSpecimenImages(parsedImages);
          }
        } catch {
          // If not JSON, ignore
        }
      }
    }
  }, [specimenData, isEditMode, form]);

  const onFinish = async (values: any) => {
    try {
      const payload = {
        ...values,
        receivedDate: values.receivedDate ? values.receivedDate.toISOString() : new Date().toISOString(),
        images: specimenImages.length > 0
          ? JSON.stringify(specimenImages.map(f => ({
              name: f.name,
              url: f.url || f.response?.url,
              type: f.type,
            })))
          : undefined,
      };

      if (isEditMode && id) {
        await updateSpecimen({ id, data: payload }).unwrap();
        message.success(t('messages.updateSuccess'));
      } else {
        await createSpecimen(payload).unwrap();
        message.success(t('messages.createSuccess'));
      }
      navigate('/specimens');
    } catch (error: any) {
      console.error('Failed to save specimen:', error);
      message.error(error?.data?.error?.message || (isEditMode ? t('messages.updateFailed') : t('messages.createFailed')));
    }
  };

  if (loadingSpecimen && isEditMode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card title={isEditMode ? t('specimen.editSpecimen') : t('specimen.createSpecimen')}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          receivedDate: dayjs(),
          quantity: 1,
          unit: 'Cái',
          status: SpecimenStatus.Received,
        }}
      >
        {/* Thông tin cơ bản */}
        <Title level={5}>Thông tin mẫu</Title>
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
                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {testRequests.map((tr: any) => (
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
                { max: 256, message: t('validation.maxLength', { max: 256 }) },
              ]}
            >
              <Input placeholder="Tên mẫu thử nghiệm" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label={t('specimen.type')}
              rules={[
                { required: true, message: t('validation.required') },
                { max: 256, message: t('validation.maxLength', { max: 256 }) },
              ]}
            >
              <Select placeholder="Chọn loại mẫu" showSearch optionFilterProp="children">
                {specimenTypes.map((type: any) => (
                  <Select.Option key={type.id} value={type.name}>
                    {type.code} - {type.name}
                  </Select.Option>
                ))}
              </Select>
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
                { max: 50, message: t('validation.maxLength', { max: 50 }) },
              ]}
            >
              <Select placeholder="Đơn vị">
                <Select.Option value="mL">mL</Select.Option>
                <Select.Option value="ống">Ống</Select.Option>
                <Select.Option value="tube">Tube</Select.Option>
                <Select.Option value="swab">Swab</Select.Option>
                <Select.Option value="mẫu">Mẫu</Select.Option>
                <Select.Option value="lọ">Lọ</Select.Option>
                <Select.Option value="slide">Slide</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="storageLocation"
              label={t('specimen.storageLocation')}
              rules={[{ max: 256, message: t('validation.maxLength', { max: 256 }) }]}
            >
              <Select placeholder="Vị trí lưu mẫu" allowClear showSearch optionFilterProp="children">
                {storageLocations.map((loc: any) => (
                  <Select.Option key={loc.id} value={loc.name}>
                    {loc.code} - {loc.name} ({loc.temperature || 'N/A'})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* Hình ảnh mẫu */}
        <Title level={5}>Hình ảnh mẫu</Title>
        <Form.Item
          label="Đính kèm hình ảnh mẫu (chụp khi tiếp nhận)"
          tooltip="Hỗ trợ: JPG, PNG, GIF. Tối đa 10 hình, mỗi hình ≤ 5MB"
        >
          <FileUpload
            value={specimenImages}
            onChange={setSpecimenImages}
            maxCount={10}
            accept="image/*"
            maxSize={5}
            listType="picture-card"
          />
        </Form.Item>

        <Divider />

        {/* Sai lệch mẫu */}
        <Title level={5}>Ghi nhận sai lệch</Title>
        <Form.Item
          name="deviation"
          label="Sai lệch của mẫu (nếu có)"
          tooltip="Ghi nhận các sai lệch so với yêu cầu ban đầu: thiếu số lượng, bao bì hư hỏng, nhiệt độ không đảm bảo..."
          rules={[{ max: 1000, message: t('validation.maxLength', { max: 1000 }) }]}
        >
          <TextArea
            rows={3}
            placeholder="Mô tả sai lệch: thiếu số lượng, bao bì hư hỏng, nhiệt độ bảo quản không đảm bảo..."
          />
        </Form.Item>

        {isEditMode && (
          <>
            <Divider />
            <Title level={5}>Trạng thái mẫu</Title>
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
          </>
        )}

        <Divider />

        <Form.Item
          name="notes"
          label={t('specimen.notes')}
          rules={[{ max: 2000, message: t('validation.maxLength', { max: 2000 }) }]}
        >
          <TextArea rows={4} placeholder="Ghi chú thêm về mẫu..." />
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
