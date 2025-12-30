import React from "react";
import { Modal, Form, Input, Select, Typography } from "antd";
import type { FormInstance } from "antd";
import { NumericFormat } from "react-number-format";
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
        >
          <NumericFormat
            placeholder="Nhập giới hạn (VD: 0.5)"
            allowNegative={false}
            decimalScale={1}
            customInput={Input}
            onValueChange={(values) => {
              form.setFieldValue("allowedLimit", values.value);
            }}
          />
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
