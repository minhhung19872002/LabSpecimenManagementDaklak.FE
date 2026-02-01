import React from "react";
import { Modal, Form, Input, Select } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { GroupedSpecimenTypeData } from "../types";
import { SpecimenTypeFormData } from "../schemas";

const { TextArea } = Input;

interface CategoryOption {
  value: string;
  label: string;
  isActive: boolean;
}

interface SpecimenTypeModalProps {
  open: boolean;
  loading: boolean;
  editingItem: GroupedSpecimenTypeData | null;
  form: UseFormReturn<SpecimenTypeFormData>;
  categoryOptions: CategoryOption[];
  onOk: (data: SpecimenTypeFormData) => void;
  onCancel: () => void;
}

const SpecimenTypeModal: React.FC<SpecimenTypeModalProps> = ({
  open,
  loading,
  editingItem,
  form,
  categoryOptions,
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
      title={editingItem ? "Sửa loại mẫu" : "Thêm loại mẫu mới"}
      open={open}
      onOk={handleSubmit(onOk)}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editingItem ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      width={500}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form layout="vertical">
        <Form.Item
          label="Danh mục loại mẫu"
          required
          validateStatus={errors.sampleTypeCategoryId ? "error" : ""}
          help={errors.sampleTypeCategoryId?.message}
        >
          <Controller
            name="sampleTypeCategoryId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                placeholder="Chọn danh mục loại mẫu"
                optionFilterProp="label"
                options={categoryOptions}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Tên loại mẫu"
          required
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tên loại mẫu" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          validateStatus={errors.description ? "error" : ""}
          help={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                placeholder="Nhập mô tả (không bắt buộc)"
                rows={3}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Trạng thái">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Select {...field}>
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Ngừng</Select.Option>
              </Select>
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SpecimenTypeModal;
