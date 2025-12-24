import React from "react";
import { Modal, Form, Input, Select, Typography } from "antd";
import type { FormInstance } from "antd";
import { GroupedTestMethodData } from "../types";

const { Text } = Typography;

interface TestMethodModalProps {
  open: boolean;
  loading: boolean;
  editingItem: GroupedTestMethodData | null;
  form: FormInstance;
  onOk: () => void;
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
  return (
    <Modal
      title={editingItem ? "Sửa phương pháp thử" : "Thêm phương pháp thử mới"}
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
          name="name"
          label="Tên phương pháp"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tên phương pháp",
            },
          ]}
        >
          <Input placeholder="Nhập tên phương pháp" />
        </Form.Item>

        <Form.Item
          name="unit"
          label="Đơn vị tính"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập đơn vị tính",
            },
          ]}
        >
          <Input placeholder="VD: mg/L, %, CFU/g..." />
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

export default TestMethodModal;
