import React from "react";
import { Modal, Button, Space, Typography } from "antd";
import { MailOutlined } from "../../../components/common/Icon";

const { Text } = Typography;

interface PasswordSentModalProps {
  open: boolean;
  email: string | null;
  onClose: () => void;
}

const PasswordSentModal: React.FC<PasswordSentModalProps> = ({
  open,
  email,
  onClose,
}) => {
  return (
    <Modal
      title={
        <Space>
          <MailOutlined style={{ color: "#52c41a" }} />
          Thông báo
        </Space>
      }
      open={open}
      onCancel={onClose}
      centered
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={450}
    >
      <div style={{ padding: "16px 0", textAlign: "center" }}>
        <div
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            padding: 24,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <MailOutlined
            style={{ fontSize: 48, color: "#52c41a", marginBottom: 16 }}
          />
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            Mật khẩu đã được gửi qua email
          </div>
          <div style={{ color: "#666" }}>{email}</div>
        </div>
        <Text type="secondary">
          Nhân viên sẽ nhận được email chứa thông tin đăng nhập và được yêu cầu
          đổi mật khẩu sau khi đăng nhập lần đầu.
        </Text>
      </div>
    </Modal>
  );
};

export default PasswordSentModal;
