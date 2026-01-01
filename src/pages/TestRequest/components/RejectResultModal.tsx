import { useState } from "react";
import { Modal, Button, Input, Typography, message } from "antd";
import { testRequestService } from "../../../services/testRequestService";

const { Text } = Typography;
const { TextArea } = Input;

interface RejectResultModalProps {
  open: boolean;
  onClose: () => void;
  testRequestId: string;
  onSuccess: () => void;
}

const RejectResultModal: React.FC<RejectResultModalProps> = ({
  open,
  onClose,
  testRequestId,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleRejectResult = async () => {
    if (!testRequestId || !reason.trim()) {
      message.warning("Vui lòng nhập lý do không duyệt");
      return;
    }

    setLoading(true);
    try {
      await testRequestService.rejectResult(testRequestId, reason);
      message.success("Đã trả lại cho Quản lý Kỹ thuật xem xét");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error rejecting result:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể từ chối kết quả. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Không duyệt kết quả"
      open={open}
      width={600}
      centered
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          loading={loading}
          disabled={!reason.trim()}
          onClick={handleRejectResult}
        >
          Xác nhận
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 12 }}>
        <Text>Kết quả sẽ được trả lại cho Quản lý Kỹ thuật xem xét.</Text>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Text>Vui lòng nhập lý do không duyệt:</Text>
      </div>
      <TextArea
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Nhập lý do không duyệt kết quả..."
        maxLength={1000}
        showCount
      />
    </Modal>
  );
};

export default RejectResultModal;
