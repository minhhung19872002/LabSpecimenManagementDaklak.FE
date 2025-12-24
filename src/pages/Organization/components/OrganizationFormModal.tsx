import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Row, Col } from 'antd';
import { OrganizationDto, CreateUpdateOrganizationDto } from '../../../types/organization';
import { getAllProvinces, Ward } from '../../../utils/vietnamLocations';

interface OrganizationFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  editingRecord: OrganizationDto | null;
  submitting: boolean;
  wards: Ward[];
  onProvinceChange: (value: string) => void;
  onSave: (values: CreateUpdateOrganizationDto) => Promise<boolean>;
  onClose: () => void;
}

const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({
  visible,
  mode,
  editingRecord,
  submitting,
  wards,
  onProvinceChange,
  onSave,
  onClose,
}) => {
  const [form] = Form.useForm();
  const provinces = getAllProvinces();

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      if (mode === 'create') {
        form.resetFields();
        form.setFieldsValue({ isActive: true });
      } else if (editingRecord) {
        form.setFieldsValue({
          name: editingRecord.name,
          provinceCode: editingRecord.provinceCode,
          wardCode: editingRecord.wardCode,
          address: editingRecord.address,
          taxCode: editingRecord.taxCode,
          contactPerson: editingRecord.contactPerson,
          phone: editingRecord.phone,
          isActive: editingRecord.isActive,
        });
      }
    }
  }, [visible, mode, editingRecord, form]);

  const handleProvinceChange = (value: string) => {
    form.setFieldsValue({ wardCode: undefined });
    onProvinceChange(value);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateUpdateOrganizationDto = {
        name: values.name,
        provinceCode: values.provinceCode,
        wardCode: values.wardCode,
        address: values.address,
        taxCode: values.taxCode || undefined,
        contactPerson: values.contactPerson,
        phone: values.phone,
        isActive: values.isActive,
      };

      const success = await onSave(payload);
      if (success) {
        form.resetFields();
      }
    } catch (error: any) {
      // Validation error, do nothing
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={mode === 'create' ? 'Thêm mới CS/DN' : 'Cập nhật CS/DN'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={submitting}
      okText={mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
      cancelText="Hủy"
      width={700}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form form={form} layout="vertical">
        {/* Row 1: Tên CS/DN */}
        <Form.Item
          name="name"
          label="Tên CS/DN"
          rules={[
            { required: true, message: 'Vui lòng nhập tên!' },
            { max: 256, message: 'Tên không được quá 256 ký tự!' },
          ]}
        >
          <Input placeholder="Nhập tên cơ sở / doanh nghiệp" />
        </Form.Item>

        {/* Row 2: Tỉnh thành, Phường xã, Trạng thái */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="provinceCode"
              label="Tỉnh thành"
              rules={[{ required: true, message: 'Vui lòng chọn tỉnh thành!' }]}
            >
              <Select
                placeholder="Chọn tỉnh thành"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={handleProvinceChange}
              >
                {provinces.map((p) => (
                  <Select.Option key={p.code} value={p.code}>
                    {p.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="wardCode"
              label="Phường xã"
              rules={[{ required: true, message: 'Vui lòng chọn phường xã!' }]}
            >
              <Select
                placeholder="Chọn phường/xã"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                disabled={wards.length === 0}
              >
                {wards.map((w) => (
                  <Select.Option key={w.code} value={w.code}>
                    {w.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 3: Địa chỉ, Mã số thuế */}
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="address"
              label="Địa chỉ"
              rules={[
                { required: true, message: 'Vui lòng nhập địa chỉ!' },
                { max: 500, message: 'Địa chỉ không được quá 500 ký tự!' },
              ]}
            >
              <Input placeholder="Địa chỉ chi tiết" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="taxCode"
              label="Mã số thuế"
              rules={[{ max: 20, message: 'MST không được quá 20 ký tự!' }]}
            >
              <Input placeholder="Mã số thuế (không bắt buộc)" />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 4: Người liên hệ, Số điện thoại */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contactPerson"
              label="Người liên hệ"
              rules={[
                { required: true, message: 'Vui lòng nhập người liên hệ!' },
                { max: 100, message: 'Tên không được quá 100 ký tự!' },
              ]}
            >
              <Input placeholder="Tên người liên hệ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                {
                  pattern: /^(0|\+84)[0-9]{9,10}$/,
                  message: 'Số điện thoại không hợp lệ!',
                },
              ]}
            >
              <Input placeholder="Số điện thoại" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default OrganizationFormModal;
