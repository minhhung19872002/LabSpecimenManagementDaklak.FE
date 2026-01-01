import { Modal, Form, Input, Select } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import { IndicatorGroupDto } from "../types";
import { IndicatorGroupFormData } from "../schemas/indicatorSchema";

interface GroupModalProps {
  open: boolean;
  loading: boolean;
  editingGroup: IndicatorGroupDto | null;
  form: UseFormReturn<IndicatorGroupFormData>;
  onOk: (data: IndicatorGroupFormData) => void;
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
