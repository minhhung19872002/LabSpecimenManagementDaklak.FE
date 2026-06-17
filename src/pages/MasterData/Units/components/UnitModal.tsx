import React from "react";
import { Modal, Form, Input, Switch, Select } from "antd";
import { Controller } from "react-hook-form";
import { UseFormReturn } from "react-hook-form";
import { UnitDto, UnitCategoryLabels } from "../../../../services/masterDataService";
import { UnitFormData } from "../schemas";

interface UnitModalProps {
  open: boolean;
  loading: boolean;
  editingUnit: UnitDto | null;
  form: UseFormReturn<UnitFormData>;
  onOk: (data: UnitFormData) => void;
  onCancel: () => void;
}

const UnitModal: React.FC<UnitModalProps> = ({
  open,
  loading,
  editingUnit,
  form,
  onOk,
  onCancel,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Modal
      title={editingUnit ? "Sửa đơn vị hàng hóa" : "Thêm đơn vị hàng hóa"}
      open={open}
      onOk={handleSubmit(onOk)}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editingUnit ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      destroyOnClose
      width={500}
      centered
    >
      <Form layout="vertical">
        <Form.Item
          label="Mã đơn vị hàng hóa"
          required
          validateStatus={errors.code ? "error" : ""}
          help={errors.code?.message}
        >
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nhập mã đơn vị hàng hóa"
                maxLength={50}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Tên đơn vị hàng hóa"
          required
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nhập tên đơn vị hàng hóa"
                maxLength={256}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Phân loại"
          required
          validateStatus={errors.category ? "error" : ""}
          help={errors.category?.message}
        >
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Chọn phân loại"
                options={Object.entries(UnitCategoryLabels).map(([value, label]) => ({
                  value: Number(value),
                  label,
                }))}
              />
            )}
          />
        </Form.Item>

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
      </Form>
    </Modal>
  );
};

export default UnitModal;
