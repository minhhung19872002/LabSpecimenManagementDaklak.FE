import { useState } from "react";
import { Modal, Input, Form, message } from "antd";
import { CloseCircleOutlined } from "../../../components/common/Icon";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { rejectSchema, RejectFormData } from "../schemas/rejectSchema";

const { TextArea } = Input;

interface RejectModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title?: string;
  okText?: string;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
}

const RejectModal: React.FC<RejectModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  title = "Từ chối duyệt chỉ tiêu",
  okText = "Xác nhận từ chối",
  label = "Lý do từ chối",
  placeholder = "Nhập lý do từ chối...",
  errorMessage = "Không thể từ chối. Vui lòng thử lại.",
}) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormData>({
    resolver: yupResolver(rejectSchema),
    defaultValues: { reason: "" },
  });

  const handleOk = async (data: RejectFormData) => {
    try {
      setLoading(true);
      await onConfirm(data.reason);
      reset();
    } catch (error: any) {
      console.error("Error rejecting:", error);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <Modal
      title={
        <span>
          <CloseCircleOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
          {title}
        </span>
      }
      open={visible}
      onOk={handleSubmit(handleOk)}
      onCancel={handleCancel}
      okText={okText}
      cancelText="Hủy"
      okButtonProps={{ danger: true, loading }}
      destroyOnClose
      width={600}
      centered
      getContainer={() => document.body}
      wrapClassName="reject-modal-fullscreen"
      style={{ top: 0 }}
      styles={{
        mask: { position: "fixed", inset: 0 },
        wrapper: {
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Form layout="vertical">
        <Form.Item
          label={label}
          required
          validateStatus={errors.reason ? "error" : ""}
          help={errors.reason?.message}
        >
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={4}
                placeholder={placeholder}
                maxLength={500}
                showCount
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RejectModal;
