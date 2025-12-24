import React from "react";
import { Modal, Form, Input, Select } from "antd";
import type { FormInstance } from "antd";
import { IndicatorGroupDto } from "../types";

interface GroupModalProps {
  open: boolean;
  loading: boolean;
  editingGroup: IndicatorGroupDto | null;
  form: FormInstance;
  onOk: () => void;
  onCancel: () => void;
}

const GroupModal: React.FC<GroupModalProps> = ({
  open,
  loading,
  editingGroup,
  form,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={editingGroup ? "Sửa nhóm chỉ tiêu" : "Thêm nhóm chỉ tiêu mới"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editingGroup ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      width={480}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên nhóm"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tên nhóm",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="isActive" label="Trạng thái" initialValue={true}>
          <Select defaultValue={true}>
            <Select.Option value={true}>Hoạt động</Select.Option>
            <Select.Option value={false}>Ngừng</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GroupModal;
