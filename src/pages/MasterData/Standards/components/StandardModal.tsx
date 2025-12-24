import React from "react";
import { Modal, Form, Input, Select, Typography } from "antd";
import type { FormInstance } from "antd";
import { GroupedStandardData } from "../types";

const { Text } = Typography;
const { TextArea } = Input;

interface StandardModalProps {
  open: boolean;
  loading: boolean;
  editingItem: GroupedStandardData | null;
  form: FormInstance;
  onOk: () => void;
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
  return (
    <Modal
      title={editingItem ? "Sửa tiêu chuẩn" : "Thêm tiêu chuẩn mới"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editingItem ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      width={500}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form form={form} layout="vertical">
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
          name="name"
          label="Tên tiêu chuẩn"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tên tiêu chuẩn",
            },
          ]}
        >
          <Input placeholder="Nhập tên tiêu chuẩn" />
        </Form.Item>

        <Form.Item
          name="limitDescription"
          label="Giới hạn (mô tả chung)"
        >
          <TextArea placeholder="Nhập mô tả giới hạn chung cho tiêu chuẩn" rows={3} />
        </Form.Item>

        <Form.Item name="isActive" label="Trạng thái" initialValue={true}>
          <Select>
            <Select.Option value={true}>Hoạt động</Select.Option>
            <Select.Option value={false}>Ngừng</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StandardModal;
