import React from "react";
import { Modal, Form, Input, Switch } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { SampleTypeCategoryFormData } from "../schemas";
import { SampleTypeCategoryDto } from "../types";

interface CategoryModalProps {
  open: boolean;
  loading: boolean;
  editingCategory: SampleTypeCategoryDto | null;
  form: UseFormReturn<SampleTypeCategoryFormData>;
  onOk: (data: SampleTypeCategoryFormData) => void;
  onCancel: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  loading,
  editingCategory,
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
      title={editingCategory ? "Sửa danh mục loại mẫu" : "Thêm danh mục loại mẫu"}
      open={open}
      onOk={handleSubmit(onOk)}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editingCategory ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      destroyOnClose
      width={500}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form layout="vertical">
        <Form.Item
          label="Tên danh mục"
          required
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tên danh mục loại mẫu" maxLength={256} />
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
              <Input.TextArea
                {...field}
                value={field.value || ""}
                placeholder="Nhập mô tả (không bắt buộc)"
                rows={3}
                maxLength={500}
                showCount
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

export default CategoryModal;
