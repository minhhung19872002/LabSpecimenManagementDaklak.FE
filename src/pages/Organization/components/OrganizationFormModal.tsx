import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Switch, Row, Col } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { getAllProvinces, Ward, Province } from "../../../utils/vietnamLocations";
import { OrganizationFormData } from "../schemas";

interface OrganizationFormModalProps {
  visible: boolean;
  mode: "create" | "edit";
  form: UseFormReturn<OrganizationFormData>;
  submitting: boolean;
  wards: Ward[];
  onProvinceChange: (value: string) => void;
  onSave: (values: OrganizationFormData) => void;
  onClose: () => void;
}

const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({
  visible,
  mode,
  form,
  submitting,
  wards,
  onProvinceChange,
  onSave,
  onClose,
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      const loadedProvinces = await getAllProvinces();
      setProvinces(loadedProvinces);
    };
    loadProvinces();
  }, []);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Modal
      title={mode === "create" ? "Thêm mới CS/DN" : "Cập nhật CS/DN"}
      open={visible}
      onOk={handleSubmit(onSave)}
      onCancel={onClose}
      confirmLoading={submitting}
      okText={mode === "create" ? "Tạo mới" : "Cập nhật"}
      cancelText="Hủy"
      width={700}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form layout="vertical">
        {/* Row 1: Tên CS/DN */}
        <Form.Item
          label="Tên CS/DN"
          required
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tên cơ sở / doanh nghiệp" />
            )}
          />
        </Form.Item>

        {/* Row 2: Tỉnh thành, Phường xã, Trạng thái */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Tỉnh thành"
              required
              validateStatus={errors.provinceCode ? "error" : ""}
              help={errors.provinceCode?.message}
            >
              <Controller
                name="provinceCode"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Chọn tỉnh thành"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    onChange={(value) => {
                      field.onChange(value);
                      onProvinceChange(value);
                    }}
                  >
                    {provinces.map((p) => (
                      <Select.Option key={p.code} value={p.code}>
                        {p.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Phường xã"
              required
              validateStatus={errors.wardCode ? "error" : ""}
              help={errors.wardCode?.message}
            >
              <Controller
                name="wardCode"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
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
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Trạng thái">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    checkedChildren="Hoạt động"
                    unCheckedChildren="Ngừng"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 3: Địa chỉ, Mã số thuế */}
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              label="Địa chỉ"
              required
              validateStatus={errors.address ? "error" : ""}
              help={errors.address?.message}
            >
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Địa chỉ chi tiết" />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Mã số thuế"
              validateStatus={errors.taxCode ? "error" : ""}
              help={errors.taxCode?.message}
            >
              <Controller
                name="taxCode"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Mã số thuế (không bắt buộc)"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 4: Người liên hệ, Số điện thoại, SĐT phụ */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Người liên hệ"
              required
              validateStatus={errors.contactPerson ? "error" : ""}
              help={errors.contactPerson?.message}
            >
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Tên người liên hệ" />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Số điện thoại"
              required
              validateStatus={errors.phone ? "error" : ""}
              help={errors.phone?.message}
            >
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Số điện thoại" />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="SĐT phụ"
              validateStatus={errors.secondaryPhone ? "error" : ""}
              help={errors.secondaryPhone?.message}
            >
              <Controller
                name="secondaryPhone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="SĐT phụ (không bắt buộc)"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default OrganizationFormModal;
