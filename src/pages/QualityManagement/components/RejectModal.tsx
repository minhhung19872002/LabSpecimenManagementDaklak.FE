import React, { useState } from 'react';
import { Modal, Input, Form, message } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface RejectModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title?: string;
}

const RejectModal: React.FC<RejectModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  title = 'Từ chối duyệt chỉ tiêu',
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onConfirm(values.reason);
      form.resetFields();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      console.error('Error rejecting:', error);
      message.error('Không thể từ chối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <span>
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          {title}
        </span>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Xác nhận từ chối"
      cancelText="Hủy"
      okButtonProps={{ danger: true, loading }}
      destroyOnClose
      width={600}
      centered
      getContainer={() => document.body}
      wrapClassName="reject-modal-fullscreen"
      style={{ top: 0 }}
      styles={{
        mask: { position: 'fixed', inset: 0 },
        wrapper: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Lý do từ chối"
          rules={[
            { required: true, message: 'Vui lòng nhập lý do từ chối' },
            { min: 10, message: 'Lý do từ chối phải có ít nhất 10 ký tự' },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Nhập lý do từ chối..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RejectModal;
