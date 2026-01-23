import React from "react";
import { Modal, Form, Row, Col, Select, Input, DatePicker } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import dayjs from "dayjs";
import { SubcontractorFormData } from "../schemas";
import { ALL_CAPABILITIES } from "../hooks";

interface SubcontractorFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: UseFormReturn<SubcontractorFormData>;
  onCancel: () => void;
  onSubmit: (data: SubcontractorFormData) => void;
}

const SubcontractorFormModal: React.FC<SubcontractorFormModalProps> = ({
  open,
  isEditing,
  form,
  onCancel,
  onSubmit,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Modal
      title={isEditing ? "Chỉnh sửa nhà thầu phụ" : "Thêm nhà thầu phụ mới"}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={onCancel}
      width={800}
      okText={isEditing ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      centered
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Mã nhà thầu phụ"
              required
              validateStatus={errors.code ? "error" : ""}
              help={errors.code?.message}
            >
              <Controller
                name="code"
                control={control}
                render={({ field }) => <Input {...field} disabled />}
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label="Tên nhà thầu phụ"
              required
              validateStatus={errors.name ? "error" : ""}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Người liên hệ"
              required
              validateStatus={errors.contactPerson ? "error" : ""}
              help={errors.contactPerson?.message}
            >
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Điện thoại"
              required
              validateStatus={errors.phone ? "error" : ""}
              help={errors.phone?.message}
            >
              <Controller
                name="phone"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Email"
              validateStatus={errors.email ? "error" : ""}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input {...field} value={field.value || ""} />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Mã số thuế">
              <Controller
                name="taxCode"
                control={control}
                render={({ field }) => (
                  <Input {...field} value={field.value || ""} />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Địa chỉ">
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Input.TextArea {...field} value={field.value || ""} rows={2} />
            )}
          />
        </Form.Item>

        <Form.Item label="Năng lực thử nghiệm">
          <Controller
            name="capabilities"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                mode="multiple"
                placeholder="Chọn năng lực"
                value={field.value || []}
              >
                {ALL_CAPABILITIES.map((cap) => (
                  <Select.Option key={cap} value={cap}>
                    {cap}
                  </Select.Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Trạng thái">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <Select.Option value="active">Đang hoạt động</Select.Option>
                    <Select.Option value="inactive">
                      Ngừng hoạt động
                    </Select.Option>
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Ngày bắt đầu HĐ">
              <Controller
                name="contractStartDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.toDate() || null)}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Ngày kết thúc HĐ">
              <Controller
                name="contractEndDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.toDate() || null)}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Ghi chú">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea {...field} value={field.value || ""} rows={3} />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SubcontractorFormModal;
