import React from "react";
import { Button, Space } from "antd";
import { FileTextOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { TestRequestStatus } from "../../../../types/testRequest";

interface ActionButtonsProps {
  status: TestRequestStatus;
  printingTestRequest: boolean;
  onPrintTestRequest: () => void;
  onOpenBM01Modal: () => void;
  onPrintMixedResult: () => void;
  onApprove: () => void;
  onSendResult: () => void;
  onComplete: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  status,
  printingTestRequest,
  onPrintTestRequest,
  onOpenBM01Modal,
  onPrintMixedResult,
  onApprove,
  onSendResult,
  onComplete,
}) => {
  switch (status) {
    case TestRequestStatus.New:
    case TestRequestStatus.Pending:
      return (
        <Button
          icon={<FileTextOutlined />}
          onClick={onPrintTestRequest}
          loading={printingTestRequest}
        >
          In phiếu XN
        </Button>
      );
    case TestRequestStatus.TestingCompleted:
      return (
        <Space>
          <Button
            icon={<FileTextOutlined />}
            onClick={onOpenBM01Modal}
          >
            In KQ Mẫu đơn
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={onPrintMixedResult}
          >
            In KQ hỗn hợp
          </Button>
        </Space>
      );
    case TestRequestStatus.PendingApproval:
      return (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={onApprove}
        >
          Phê duyệt
        </Button>
      );
    case TestRequestStatus.Approved:
      return (
        <Button
          type="primary"
          onClick={onSendResult}
        >
          Gửi kết quả
        </Button>
      );
    case TestRequestStatus.ResultSent:
      return (
        <Button
          type="primary"
          onClick={onComplete}
        >
          Hoàn thành
        </Button>
      );
    default:
      return null;
  }
};

export default ActionButtons;
