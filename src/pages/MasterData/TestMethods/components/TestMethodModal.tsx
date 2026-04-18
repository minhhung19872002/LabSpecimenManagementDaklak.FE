import React from "react";
import { Modal, Form, Select, Typography, Tooltip } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import Icon from "../../../../components/common/Icon";
import { RichTextEditor } from "../../../../components/common";
import { TestMethodDto } from "../../../../services/masterDataService";
import { TestMethodFormData } from "../schemas";

const { Text } = Typography;

interface TestMethodModalProps {
  open: boolean;
  loading: boolean;
  editingItem: TestMethodDto | null;
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
    setValue,
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
          label={
            <span>
              Tên phương pháp{" "}
              <Tooltip
                title={
                  <div>
                    <div>Phím tắt định dạng:</div>
                    <div>Ctrl+B: Đậm</div>
                    <div>Ctrl+I: Nghiêng</div>
                    <div>Ctrl+U: Gạch chân</div>
                    <div>Ctrl+,: Chỉ số dưới (x₂)</div>
                    <div>Ctrl+.: Chỉ số trên (x²)</div>
                  </div>
                }
              >
                <span style={{ cursor: "help" }}>
                  <Icon name="info-circle" style={{ color: "#8c8c8c" }} />
                </span>
              </Tooltip>
            </span>
          }
          required
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
        >
          <Controller
            name="formattedName"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={field.value || ""}
                onChange={(html, plainText) => {
                  field.onChange(html);
                  setValue("name", plainText);
                }}
                placeholder="Nhập tên phương pháp"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Đơn vị tính{" "}
              <Tooltip
                title={
                  <div>
                    <div>Phím tắt định dạng:</div>
                    <div>Ctrl+B: Đậm</div>
                    <div>Ctrl+I: Nghiêng</div>
                    <div>Ctrl+U: Gạch chân</div>
                    <div>Ctrl+,: Chỉ số dưới (x₂)</div>
                    <div>Ctrl+.: Chỉ số trên (x²)</div>
                  </div>
                }
              >
                <span style={{ cursor: "help" }}>
                  <Icon name="info-circle" style={{ color: "#8c8c8c" }} />
                </span>
              </Tooltip>
            </span>
          }
          required
          validateStatus={errors.unit ? "error" : ""}
          help={errors.unit?.message}
          style={{ display: "none" }}
        >
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <input type="hidden" {...field} value={field.value ?? ""} />
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
