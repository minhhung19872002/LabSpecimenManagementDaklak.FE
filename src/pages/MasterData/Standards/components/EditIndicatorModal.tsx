import React from "react";
import { Modal, Form, Input, Select, Typography } from "antd";
import type { FormInstance } from "antd";
import { StandardIndicatorDto } from "../types";

const { Text } = Typography;

interface EditIndicatorModalProps {
  open: boolean;
  loading: boolean;
  indicator: StandardIndicatorDto | null;
  form: FormInstance;
  onOk: () => void;
  onCancel: () => void;
}

const COMPARISON_OPERATORS = [
  { value: "<=", label: "<=" },
  { value: ">=", label: ">=" },
  { value: "<", label: "<" },
  { value: ">", label: ">" },
  { value: "=", label: "=" },
];

const EditIndicatorModal: React.FC<EditIndicatorModalProps> = ({
  open,
  loading,
  indicator,
  form,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title="Sửa chỉ tiêu trong tiêu chuẩn"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Cập nhật"
      cancelText="Hủy"
      width={400}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form form={form} layout="vertical">
        {indicator && (
          <>
            <Form.Item label="Chỉ tiêu">
              <Text strong>{indicator.indicatorName}</Text>
            </Form.Item>

            <Form.Item label="Phương pháp">
              <Text>{indicator.testMethodName}</Text>
            </Form.Item>

            <Form.Item label="Đơn vị">
              <Text>{indicator.unit}</Text>
            </Form.Item>
          </>
        )}

        <Form.Item
          name="comparisonOperator"
          label="Ký hiệu so sánh"
        >
          <Select
            options={COMPARISON_OPERATORS}
            placeholder="Chọn ký hiệu"
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="allowedLimit"
          label="Giới hạn cho phép"
          rules={[
            {
              validator: (_, value) => {
                if (value === undefined || value === null || value === "") {
                  return Promise.resolve();
                }
                const num = parseFloat(value);
                if (isNaN(num)) {
                  return Promise.reject(new Error("Vui lòng nhập số hợp lệ"));
                }
                if (num < 0) {
                  return Promise.reject(new Error("Giá trị phải >= 0"));
                }
                // Check max 1 decimal place
                const decimalPart = value.toString().split(".")[1];
                if (decimalPart && decimalPart.length > 1) {
                  return Promise.reject(new Error("Chỉ cho phép tối đa 1 chữ số thập phân"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Nhập giới hạn (VD: 0.5)" />
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

export default EditIndicatorModal;
