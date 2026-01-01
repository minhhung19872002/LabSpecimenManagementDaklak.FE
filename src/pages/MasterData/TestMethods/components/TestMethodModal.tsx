import React from "react";
import { Modal, Form, Input, Select, Typography } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { GroupedTestMethodData } from "../types";
import { TestMethodFormData } from "../schemas";

const { Text } = Typography;

interface TestMethodModalProps {
  open: boolean;
  loading: boolean;
  editingItem: GroupedTestMethodData | null;
  form: UseFormReturn<TestMethodFormData>;
  onOk: (data: TestMethodFormData) => void;
  onCancel: () => void;
}

const TestMethodModal: React.FC<TestMethodModalProps> = ({
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
      title={editingItem ? "Sửa phương pháp thử" : "Thêm phương pháp thử mới"}
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
          <Form.Item label="Mã phương pháp">
            <Text type="secondary" italic>
              Mã sẽ được tự động sinh theo format: PPddmmyyyyxxx
            </Text>
          </Form.Item>
        )}

        {editingItem && (
          <Form.Item label="Mã phương pháp">
            <Text strong>{editingItem.code}</Text>
          </Form.Item>
        )}

        <Form.Item
          label="Tên phương pháp"
          required
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tên phương pháp" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Đơn vị tính"
          required
          validateStatus={errors.unit ? "error" : ""}
          help={errors.unit?.message}
        >
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="VD: mg/L, %, CFU/g..." />
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

export default TestMethodModal;
