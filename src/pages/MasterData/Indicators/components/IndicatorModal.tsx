import { Modal, Form, Select, Typography } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { IndicatorDto } from "../types";
import { IndicatorFormData } from "../schemas/indicatorSchema";
import { RichTextEditor } from "../../../../components/common";

const { Text } = Typography;

interface GroupOption {
  value: string;
  label: string;
}

interface IndicatorModalProps {
  open: boolean;
  loading: boolean;
  editingIndicator: IndicatorDto | null;
  form: UseFormReturn<IndicatorFormData>;
  groupOptions: GroupOption[];
  onOk: (data: IndicatorFormData) => void;
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
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  return (
    <Modal
      title={editingIndicator ? "Sửa chỉ tiêu" : "Thêm chỉ tiêu mới"}
      open={open}
      onOk={handleSubmit(onOk)}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editingIndicator ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      width={520}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form layout="vertical">
        <Form.Item
          label="Nhóm chỉ tiêu"
          required
          validateStatus={errors.indicatorGroupId ? "error" : ""}
          help={errors.indicatorGroupId?.message}
        >
          <Controller
            name="indicatorGroupId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Chọn nhóm"
                showSearch
                optionFilterProp="label"
                options={groupOptions}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={
            <span>
              Tên chỉ tiêu{" "}
              <Text type="secondary" style={{ fontWeight: "normal" }}>
                (Ctrl+B: đậm, Ctrl+I: nghiêng, Ctrl+U: gạch chân)
              </Text>
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
                  // Also update plain text name for search/display fallback
                  setValue("name", plainText);
                }}
                placeholder="Tên chỉ tiêu"
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

export default IndicatorModal;
