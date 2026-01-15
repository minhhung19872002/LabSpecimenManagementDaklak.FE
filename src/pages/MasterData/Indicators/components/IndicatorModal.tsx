import { Modal, Form, Select, Tooltip } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import Icon from "../../../../components/common/Icon";
import { IndicatorDto } from "../types";
import { IndicatorFormData } from "../schemas/indicatorSchema";
import { RichTextEditor } from "../../../../components/common";

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
