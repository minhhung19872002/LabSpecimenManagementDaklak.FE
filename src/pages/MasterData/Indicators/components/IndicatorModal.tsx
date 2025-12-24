import React from "react";
import { Modal, Form, Input, Select } from "antd";
import type { FormInstance } from "antd";
import { IndicatorDto } from "../types";

interface GroupOption {
  value: string;
  label: string;
}

interface IndicatorModalProps {
  open: boolean;
  loading: boolean;
  editingIndicator: IndicatorDto | null;
  form: FormInstance;
  groupOptions: GroupOption[];
  onOk: () => void;
  onCancel: () => void;
}

const IndicatorModal: React.FC<IndicatorModalProps> = ({
  open,
  loading,
  editingIndicator,
  form,
  groupOptions,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={editingIndicator ? "Sửa chỉ tiêu" : "Thêm chỉ tiêu mới"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editingIndicator ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      width={480}
      centered
      styles={{ body: { paddingTop: 16 } }}
      forceRender
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="indicatorGroupId"
          label="Nhóm chỉ tiêu"
          rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
        >
          <Select
            placeholder="Chọn nhóm"
            showSearch
            optionFilterProp="label"
            options={groupOptions}
          />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên chỉ tiêu"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tên chỉ tiêu",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="isActive" label="Trạng thái">
          <Select>
            <Select.Option value={true}>Hoạt động</Select.Option>
            <Select.Option value={false}>Ngừng</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IndicatorModal;
