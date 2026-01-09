import { Modal, Form, Input, Select } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { IndicatorGroupDto } from "../types";
import { IndicatorGroupFormData } from "../schemas/indicatorSchema";

interface LaboratoryOption {
  value: string;
  label: string;
}

interface GroupModalProps {
  open: boolean;
  loading: boolean;
  editingGroup: IndicatorGroupDto | null;
  form: UseFormReturn<IndicatorGroupFormData>;
  laboratoryOptions: LaboratoryOption[];
  onOk: (data: IndicatorGroupFormData) => void;
  onCancel: () => void;
}

const GroupModal: React.FC<GroupModalProps> = ({
  open,
  loading,
  editingGroup,
  form,
  laboratoryOptions,
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
      title={editingGroup ? "Sửa nhóm chỉ tiêu" : "Thêm nhóm chỉ tiêu mới"}
      open={open}
      onOk={handleSubmit(onOk)}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editingGroup ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      width={480}
      centered
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form layout="vertical">
        <Form.Item
          label="Tên nhóm"
          required
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tên nhóm" />
            )}
          />
        </Form.Item>
        <Form.Item label="Khoa phòng thực hiện">
          <Controller
            name="laboratoryId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                allowClear
                showSearch
                placeholder="Chọn khoa phòng (không bắt buộc)"
                optionFilterProp="label"
                options={laboratoryOptions}
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

export default GroupModal;
