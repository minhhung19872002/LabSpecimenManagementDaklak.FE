import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';

interface CreateRoleModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<unknown>;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const result = await onCreate(values.name);
      if (result) {
        form.resetFields();
        onClose();
      }
    } catch (error) {
      if (error instanceof Error && error.message) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Thêm nhóm mới"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Tạo"
      cancelText="Hủy"
      destroyOnClose
      centered
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="Tên nhóm quyền"
          rules={[
            { required: true, message: 'Vui lòng nhập tên nhóm quyền' },
            { min: 1, max: 256, message: 'Tên nhóm quyền phải từ 1-256 ký tự' },
          ]}
        >
          <Input placeholder="Nhập tên nhóm quyền" maxLength={256} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateRoleModal;
