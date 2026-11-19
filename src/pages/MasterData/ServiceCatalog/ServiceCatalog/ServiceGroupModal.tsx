import React from "react";
import { Form, Input, Modal } from "antd";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { ServiceGroupFormData } from "./utils";

export interface ServiceGroupModalProps {
  open: boolean;
  /** rename: đổi tên dịch vụ có sẵn (giữ mã NDV) */
  mode: "create" | "rename";
  /** Mã NDV của dịch vụ đang đổi tên */
  code?: string | null;
  loading: boolean;
  form: UseFormReturn<ServiceGroupFormData>;
  onOk: (data: ServiceGroupFormData) => void;
  onCancel: () => void;
}

/** Thêm "Tên dịch vụ" (ServiceGroup, mã NDVxxxx tự sinh) — tạo xong mở phiếu khai báo để thêm chỉ tiêu. Cũng dùng để đổi tên. */
const ServiceGroupModal: React.FC<ServiceGroupModalProps> = ({ open, mode, code, loading, form, onOk, onCancel }) => {
  const isRename = mode === "rename";
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = form;
  return (
    <Modal
      title={isRename ? `Đổi tên dịch vụ ${code ?? ""}`.trim() : "Thêm nhóm dịch vụ"}
      open={open}
      // Modal tự giữ focus sau khi mở → autoFocus của Input không ăn, focus lại sau animation
      afterOpenChange={(visible) => visible && setFocus("name")}
      onOk={handleSubmit(onOk)}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isRename ? "Lưu" : "Thêm mới"}
      cancelText="Hủy"
      width={480}
      centered
      destroyOnHidden
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form layout="vertical">
        <Form.Item
          label="Tên dịch vụ"
          required
          validateStatus={errors.name ? "error" : ""}
          help={
            errors.name?.message ??
            (isRename
              ? "Mã dịch vụ giữ nguyên. Các chỉ tiêu trong dịch vụ hiện tên mới."
              : "Mã dịch vụ (NDV…) tự sinh. Tạo xong sẽ mở phiếu khai báo để thêm chỉ tiêu.")
          }
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} maxLength={256} placeholder="vd: Kiểm nghiệm thực phẩm" onPressEnter={handleSubmit(onOk)} />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServiceGroupModal;
