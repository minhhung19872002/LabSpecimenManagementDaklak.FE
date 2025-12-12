// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Card, message, Select, Row, Col, InputNumber, Divider, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { specimenService } from '../../services/specimenService';
import { testRequestService } from '../../services/testRequestService';
import { SpecimenStatus } from '../../types/specimen';
import { TestRequestDto } from '../../types/testRequest';
import dayjs from 'dayjs';
import FileUpload from '../../components/common/FileUpload';

const { TextArea } = Input;
const { Title } = Typography;

const SpecimenForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [testRequests, setTestRequests] = useState<TestRequestDto[]>([]);
  const [specimenImages, setSpecimenImages] = useState<any[]>([]);
  const isEditMode = !!id;

  useEffect(() => {
    loadTestRequests();
    if (isEditMode) {
      loadData();
    }
  }, [id]);

  const loadTestRequests = async () => {
    try {
      const result = await testRequestService.getList({
        skipCount: 0,
        maxResultCount: 1000,
        sorting: 'requestDate desc'
      });
      setTestRequests(result.items);
    } catch (error) {
      message.error(t('messages.loadFailed'));
      console.error('Failed to load test requests:', error);
    }
  };

  const loadData = async () => {
    if (!id) return;

    setLoadingData(true);
    try {
      const data = await specimenService.get(id);
      form.setFieldsValue({
        ...data,
        receivedDate: data.receivedDate ? dayjs(data.receivedDate) : null
      });
      if (data.specimenImages) {
        setSpecimenImages(data.specimenImages);
      }
    } catch (error) {
      message.error(t('messages.loadFailed'));
      console.error('Failed to load specimen:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        receivedDate: values.receivedDate ? values.receivedDate.toISOString() : new Date().toISOString(),
        specimenImages: specimenImages.map(f => ({
          name: f.name,
          url: f.url || f.response?.url,
          type: f.type
        }))
      };

      if (isEditMode && id) {
        await specimenService.update(id, payload);
        message.success(t('messages.updateSuccess'));
      } else {
        await specimenService.create(payload);
        message.success(t('messages.createSuccess'));
      }
      navigate('/specimens');
    } catch (error) {
      message.error(isEditMode ? t('messages.updateFailed') : t('messages.createFailed'));
      console.error('Failed to save specimen:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={isEditMode ? t('specimen.editSpecimen') : t('specimen.createSpecimen')}
      loading={loadingData}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          receivedDate: dayjs(),
          quantity: 1,
          unit: 'Cái',
          status: SpecimenStatus.Received
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
                  (option?.children as string).toLowerCase().includes(input.toLowerCase())
                }
              >
                {testRequests.map(tr => (
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
                { max: 256, message: t('validation.maxLength', { max: 256 }) }
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
                { max: 256, message: t('validation.maxLength', { max: 256 }) }
              ]}
            >
              <Select placeholder="Chọn loại mẫu">
                <Select.Option value="Máu">Máu toàn phần</Select.Option>
                <Select.Option value="Huyết thanh">Huyết thanh</Select.Option>
                <Select.Option value="Huyết tương">Huyết tương</Select.Option>
                <Select.Option value="Dịch mũi họng">Dịch mũi họng (NTA/Swab)</Select.Option>
                <Select.Option value="Nước tiểu">Nước tiểu</Select.Option>
                <Select.Option value="Phân">Phân</Select.Option>
                <Select.Option value="Đờm">Đờm</Select.Option>
                <Select.Option value="Dịch não tủy">Dịch não tủy (CSF)</Select.Option>
                <Select.Option value="Mô sinh thiết">Mô sinh thiết</Select.Option>
                <Select.Option value="Khác">Khác</Select.Option>
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
                { max: 50, message: t('validation.maxLength', { max: 50 }) }
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
              rules={[
                { max: 256, message: t('validation.maxLength', { max: 256 }) }
              ]}
            >
              <Select placeholder="Vị trí lưu mẫu" allowClear>
                <Select.Option value="Tủ lạnh 2-8°C - Phòng XN Vi sinh">Tủ lạnh 2-8°C - Phòng XN Vi sinh</Select.Option>
                <Select.Option value="Tủ đông -20°C - Phòng XN PCR">Tủ đông -20°C - Phòng XN PCR</Select.Option>
                <Select.Option value="Tủ đông -80°C - Lưu trữ dài hạn">Tủ đông -80°C - Lưu trữ dài hạn</Select.Option>
                <Select.Option value="Tủ lạnh - Phòng XN Huyết học">Tủ lạnh - Phòng XN Huyết học</Select.Option>
                <Select.Option value="Phòng mẫu nhiệt độ thường">Phòng mẫu nhiệt độ thường</Select.Option>
                <Select.Option value="Kho lưu mẫu âm">Kho lưu mẫu âm</Select.Option>
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
          rules={[
            { max: 1000, message: t('validation.maxLength', { max: 1000 }) }
          ]}
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
          rules={[
            { max: 2000, message: t('validation.maxLength', { max: 2000 }) }
          ]}
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
