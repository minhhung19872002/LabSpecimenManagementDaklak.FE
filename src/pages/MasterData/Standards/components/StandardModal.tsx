import React from "react";
import { Modal, Form, Input, Select, Typography } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { GroupedStandardData } from "../types";
import { StandardFormData } from "../schemas";

const { Text } = Typography;
const { TextArea } = Input;

interface StandardModalProps {
  open: boolean;
  loading: boolean;
  editingItem: GroupedStandardData | null;
  form: UseFormReturn<StandardFormData>;
  onOk: (data: StandardFormData) => void;
  onCancel: () => void;
}

const StandardModal: React.FC<StandardModalProps> = ({
  open,
  loading,
  editingItem,
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
      title={editingItem ? "Sửa tiêu chuẩn" : "Thêm tiêu chuẩn mới"}
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
        {!editingItem && (
          <Form.Item label="Mã tiêu chuẩn">
            <Text type="secondary" italic>
              Mã sẽ được tự động sinh theo format: TCddmmyyyyxxx
            </Text>
          </Form.Item>
        )}

        {editingItem && (
          <Form.Item label="Mã tiêu chuẩn">
            <Text strong>{editingItem.code}</Text>
          </Form.Item>
        )}

        <Form.Item
          label="Tên tiêu chuẩn"
          required
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tên tiêu chuẩn" />
            )}
          />
        </Form.Item>

        <Form.Item label="Giới hạn (mô tả chung)">
          <Controller
            name="limitDescription"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                value={field.value || ""}
                placeholder="Nhập mô tả giới hạn chung cho tiêu chuẩn"
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

export default StandardModal;
