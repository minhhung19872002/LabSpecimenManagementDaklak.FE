import { Modal, Form, Input, Select } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { IndicatorDto } from "../types";
import { IndicatorFormData } from "../schemas/indicatorSchema";

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
      width={480}
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
          label="Tên chỉ tiêu"
          required
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tên chỉ tiêu" />
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
