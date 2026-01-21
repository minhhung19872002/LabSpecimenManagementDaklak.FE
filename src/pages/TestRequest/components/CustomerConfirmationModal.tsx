import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Alert,
  Tooltip,
  Spin,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  SwapOutlined,
  StopOutlined,
  FileAddOutlined,
} from "../../../components/common/Icon";
import { testRequestService } from "../../../services/testRequestService";
import { IndicatorPendingConfirmationDto } from "../../../types/testRequest";
import { IndicatorApprovalStatus } from "../../../types/laboratoryTask";
import { formatDate } from "../../../utils/formatters";
import { IndicatorName } from "../../../components/common";
import { getApiErrorMessage } from "../../../utils/errorHandler";

const { Text, Title } = Typography;

interface CustomerConfirmationModalProps {
  visible: boolean;
  testRequestId: string;
  onClose: () => void;
  onConfirmComplete: () => void;
}

const CustomerConfirmationModal: React.FC<CustomerConfirmationModalProps> = ({
  visible,
  testRequestId,
  onClose,
  onConfirmComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [indicators, setIndicators] = useState<
    IndicatorPendingConfirmationDto[]
  >([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Load pending confirmation indicators
  const loadIndicators = async () => {
    if (!testRequestId) return;

    setLoading(true);
    try {
      const result = await testRequestService.getIndicatorsPendingConfirmation(
        testRequestId
      );
      setIndicators(result);
      setSelectedRowKeys([]);
    } catch (error: any) {
      console.error("Failed to load pending confirmations:", error);
      message.error("Không thể tải danh sách chỉ tiêu chờ xác nhận");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadIndicators();
    }
  }, [visible, testRequestId]);

  // Handle single indicator confirmation
  const handleConfirmSingle = async (
    indicatorId: string,
    confirmed: boolean
  ) => {
    setActionLoading(true);
    try {
      await testRequestService.confirmIndicator(testRequestId, indicatorId, {
        confirmed,
      });
      message.success(
        confirmed ? "Đã xác nhận đồng ý" : "Đã xác nhận không đồng ý"
      );
      loadIndicators();
      onConfirmComplete();
    } catch (error: any) {
      console.error("Failed to confirm indicator:", error);
      message.error(getApiErrorMessage(error, "Không thể xác nhận chỉ tiêu"));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk confirmation
  const handleBulkConfirm = async (confirmed: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    setActionLoading(true);
    try {
      await testRequestService.bulkConfirmIndicators(testRequestId, {
        indicatorIds: selectedRowKeys,
        confirmed,
      });
      message.success(
        confirmed
          ? `Đã xác nhận đồng ý cho ${selectedRowKeys.length} chỉ tiêu`
          : `Đã xác nhận không đồng ý cho ${selectedRowKeys.length} chỉ tiêu`
      );
      loadIndicators();
      onConfirmComplete();
    } catch (error: any) {
      console.error("Failed to bulk confirm:", error);
      message.error(getApiErrorMessage(error, "Không thể xác nhận chỉ tiêu"));
    } finally {
      setActionLoading(false);
    }
  };

  // Get description based on status
  const getStatusDescription = (record: IndicatorPendingConfirmationDto) => {
    if (
      record.approvalStatus === IndicatorApprovalStatus.MethodChangeRequested
    ) {
      return (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Tag icon={<SwapOutlined />} color="gold">
              Yêu cầu đổi phương pháp
            </Tag>
          </div>
          <Text type="secondary">PP cũ: </Text>
          <Text>{record.oldMethodName || "-"}</Text>
          <br />
          <Text type="secondary">PP mới: </Text>
          <Text strong style={{ color: "#1890ff" }}>
            {record.newMethodName || "-"}
          </Text>
          <br />
          <Text type="secondary">Lý do: </Text>
          <Text>{record.methodChangeReason || "-"}</Text>
        </div>
      );
    }

    if (record.approvalStatus === IndicatorApprovalStatus.TestingRejected) {
      return (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Tag icon={<StopOutlined />} color="red">
              Từ chối thử nghiệm
            </Tag>
          </div>
          <Text type="secondary">Lý do: </Text>
          <Text>{record.testingRejectionReason || "-"}</Text>
        </div>
      );
    }

    if (
      record.approvalStatus === IndicatorApprovalStatus.SupplementaryRequested
    ) {
      return (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Tag icon={<FileAddOutlined />} color="cyan">
              Yêu cầu bổ sung
            </Tag>
          </div>
          <Text type="secondary">Nội dung yêu cầu: </Text>
          <Text>{record.supplementaryRequestReason || "-"}</Text>
          {record.supplementaryRequestedByName && (
            <>
              <br />
              <Text type="secondary">Người yêu cầu: </Text>
              <Text>{record.supplementaryRequestedByName}</Text>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  // Get action buttons based on status
  const getActionButtons = (record: IndicatorPendingConfirmationDto) => {
    if (
      record.approvalStatus === IndicatorApprovalStatus.MethodChangeRequested
    ) {
      return (
        <Space size="small">
          <Tooltip title="KH đồng ý đổi PP">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleConfirmSingle(record.id, true)}
              loading={actionLoading}
            >
              Đồng ý
            </Button>
          </Tooltip>
          <Tooltip title="KH không đồng ý (hủy chỉ tiêu)">
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleConfirmSingle(record.id, false)}
              loading={actionLoading}
            >
              Từ chối
            </Button>
          </Tooltip>
        </Space>
      );
    }

    if (record.approvalStatus === IndicatorApprovalStatus.TestingRejected) {
      return (
        <Space size="small">
          <Tooltip title="KH đồng ý từ chối TN (xác nhận hủy chỉ tiêu)">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleConfirmSingle(record.id, true)}
              loading={actionLoading}
            >
              Đồng ý
            </Button>
          </Tooltip>
          <Tooltip title="KH không đồng ý từ chối (vẫn muốn TN)">
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleConfirmSingle(record.id, false)}
              loading={actionLoading}
            >
              Từ chối
            </Button>
          </Tooltip>
        </Space>
      );
    }

    if (
      record.approvalStatus === IndicatorApprovalStatus.SupplementaryRequested
    ) {
      return (
        <Space size="small">
          <Tooltip title="KH đồng ý cung cấp bổ sung, tiếp tục thử nghiệm">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleConfirmSingle(record.id, true)}
              loading={actionLoading}
            >
              Đồng ý
            </Button>
          </Tooltip>
          <Tooltip title="KH từ chối bổ sung, hủy chỉ tiêu này">
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleConfirmSingle(record.id, false)}
              loading={actionLoading}
            >
              Từ chối
            </Button>
          </Tooltip>
        </Space>
      );
    }

    return null;
  };

  const columns = [
    {
      title: "Mẫu",
      key: "sample",
      width: 150,
      render: (_: unknown, record: IndicatorPendingConfirmationDto) => (
        <div>
          <Tag color="blue">{record.sampleCode}</Tag>
          <div style={{ fontSize: 12, marginTop: 4 }}>{record.sampleName}</div>
        </div>
      ),
    },
    {
      title: "Chỉ tiêu",
      key: "indicator",
      width: 180,
      render: (_: unknown, record: IndicatorPendingConfirmationDto) => (
        <div>
          <IndicatorName name={record.indicatorName || ""} formattedName={record.indicatorFormattedName} style={{ fontWeight: 600 }} />
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.indicatorCode}
          </Text>
        </div>
      ),
    },
    {
      title: "Khoa phòng",
      dataIndex: "laboratoryName",
      key: "laboratoryName",
      width: 150,
    },
    {
      title: "Nội dung yêu cầu",
      key: "description",
      width: 300,
      render: (_: unknown, record: IndicatorPendingConfirmationDto) =>
        getStatusDescription(record),
    },
    {
      title: "Người yêu cầu",
      key: "requestedBy",
      width: 150,
      render: (_: unknown, record: IndicatorPendingConfirmationDto) => (
        <div>
          <Text>{record.requestedByName || "-"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.requestedDate ? formatDate(record.requestedDate) : "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      fixed: "right" as const,
      render: (_: unknown, record: IndicatorPendingConfirmationDto) =>
        getActionButtons(record),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as string[]);
    },
  };

  return (
    <Modal
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            Xác nhận phản hồi khách hàng
          </Title>
          <Tag color="warning">{indicators.length} chỉ tiêu</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={
        <Space>
          <Button
            danger
            icon={<CloseOutlined />}
            disabled={selectedRowKeys.length === 0}
            loading={actionLoading}
            onClick={() => handleBulkConfirm(false)}
          >
            Từ chối ({selectedRowKeys.length})
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            disabled={selectedRowKeys.length === 0}
            loading={actionLoading}
            onClick={() => handleBulkConfirm(true)}
          >
            Đồng ý ({selectedRowKeys.length})
          </Button>
        </Space>
      }
      centered
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : indicators.length === 0 ? (
        <Alert
          message="Không có chỉ tiêu nào chờ xác nhận"
          description="Tất cả các chỉ tiêu đã được xác nhận hoặc không có yêu cầu từ QLKT."
          type="info"
          showIcon
        />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={indicators}
            rowKey="id"
            rowSelection={rowSelection}
            pagination={false}
            size="small"
            scroll={{ x: 1130 }}
            loading={actionLoading}
          />
        </>
      )}
    </Modal>
  );
};

export default CustomerConfirmationModal;
