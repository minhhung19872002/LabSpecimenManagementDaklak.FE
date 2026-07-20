import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Table,
  Tag,
  Spin,
  Modal,
  Input,
  Steps,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  goodsReceiptService,
  GoodsReceiptDto,
  GoodsReceiptItemDto,
  GoodsReceiptWarehouseStatus,
  GoodsReceiptOrderStatus,
  WarehouseStatusLabels,
  WarehouseStatusColors,
  OrderStatusLabels,
  OrderStatusColors,
} from "../../services/goodsReceiptService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import approvalProcessService, {
  ApprovalSnapshotDto,
  ApprovalStepStatus,
  ApprovalSnapshotStatus,
} from "../../services/approvalProcessService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import "../../styles/ListCard.css";
import "./GoodsReceiptDetail.css";

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="detail-item">
    <span className="detail-item-label">{label}</span>
    <span className="detail-item-value">
      {value != null && value !== "" ? value : "-"}
    </span>
  </div>
);

const GoodsReceiptDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<GoodsReceiptDto | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [snapshot, setSnapshot] = useState<ApprovalSnapshotDto | null>(null);

  const canEdit = authService.hasPermission(PERMISSIONS.GoodsReceipts.Edit);
  const canApprove = authService.hasPermission(PERMISSIONS.GoodsReceipts.Approve);

  const loadSnapshot = useCallback(async () => {
    if (!id) return;
    try {
      const snap = await approvalProcessService.getSnapshot(id);
      setSnapshot(snap);
    } catch (error: any) {
      setSnapshot(null);
      if (error?.response?.status && error.response.status !== 404) {
        console.error("Failed to load approval snapshot:", error);
      }
    }
  }, [id]);

  const loadData = useCallback(async (opts?: { includeSnapshot?: boolean }) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await goodsReceiptService.get(id);
      setReceipt(data);
      if (opts?.includeSnapshot !== false) {
        await loadSnapshot();
      }
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể tải phiếu nhập hàng."));
    } finally {
      setLoading(false);
    }
  }, [id, loadSnapshot]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async () => {
    if (!id) return;
    setApproving(true);
    try {
      await goodsReceiptService.approve(id);
      message.success("Đã duyệt đơn");
      await loadData();
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể duyệt đơn."));
    } finally {
      setApproving(false);
    }
  };

  const handleRejectClick = () => {
    setRejectNotes("");
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!id) return;
    setRejecting(true);
    try {
      await goodsReceiptService.reject(id, rejectNotes || undefined);
      message.success("Đã từ chối phiếu");
      setRejectModalOpen(false);
      await loadData();
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể từ chối phiếu."));
    } finally {
      setRejecting(false);
    }
  };

  const materialItems = receipt?.items?.filter((i) => !i.isEquipment) || [];
  const equipmentItems = receipt?.items?.filter((i) => i.isEquipment) || [];

  const productColumns = [
    {
      title: "STT",
      key: "index",
      width: 50,
      align: "center" as const,
      render: (_: any, __: GoodsReceiptItemDto, index: number) => index + 1,
    },
    {
      title: "Mã nhận dạng",
      key: "identificationCode",
      width: 130,
      render: (_: any, r: GoodsReceiptItemDto) => r.identificationCode || "-",
    },
    {
      title: "Tên hàng hóa",
      dataIndex: "productName",
      key: "productName",
      width: 200,
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturer",
      key: "manufacturer",
      width: 150,
      render: (v: string) => v || "-",
    },
    {
      title: "Đơn vị",
      dataIndex: "unitName",
      key: "unitName",
      width: 100,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right" as const,
    },
  ];

  const equipmentColumns = [
    {
      title: "STT",
      key: "index",
      width: 50,
      align: "center" as const,
      render: (_: any, __: GoodsReceiptItemDto, index: number) => index + 1,
    },
    {
      title: "Tên thiết bị",
      dataIndex: "productName",
      key: "productName",
      width: 200,
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturer",
      key: "manufacturer",
      width: 150,
      render: (v: string) => v || "-",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 140,
      render: (v: string) => v || "-",
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unitName",
      key: "unitName",
      width: 100,
      render: (v: string) => v || "-",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "right" as const,
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <Card className="list-card">
        <div style={{ textAlign: "center", padding: 40 }}>
          Không tìm thấy phiếu nhập hàng
          <br />
          <Button type="link" onClick={() => navigate("/goods-receipts")}>
            Quay lại danh sách
          </Button>
        </div>
      </Card>
    );
  }

  const currentUserId = authService.getUserInfo()?.id;
  const currentStepApproverId = snapshot?.steps?.find(
    (s) => s.stepOrder === snapshot.currentStepOrder,
  )?.approverId;
  const isCurrentApprover =
    !!currentUserId &&
    currentUserId === currentStepApproverId &&
    snapshot?.status === ApprovalSnapshotStatus.Pending;

  const renderActionButtons = () => (
    <Space wrap>
      {canApprove &&
        isCurrentApprover &&
        receipt.orderStatus === GoodsReceiptOrderStatus.PendingApproval && (
          <>
            <Button type="primary" onClick={handleApprove} loading={approving}>
              Duyệt
            </Button>
            <Button type="default" danger onClick={handleRejectClick} loading={rejecting}>
              Từ chối
            </Button>
          </>
        )}
      {canEdit &&
        receipt.warehouseStatus === GoodsReceiptWarehouseStatus.NotImported &&
        receipt.orderStatus !== GoodsReceiptOrderStatus.PendingApproval &&
        receipt.orderStatus !== GoodsReceiptOrderStatus.Rejected && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/goods-receipts/edit/${id}`)}
          >
            Chỉnh sửa
          </Button>
        )}
    </Space>
  );

  return (
    <div className="goods-receipt-detail">
      <div className="back-button-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/goods-receipts")}>
          Quay lại
        </Button>
      </div>

      <Card
        className="list-card"
        title={
          <div className="card-header-flex">
            <Space wrap>
              <span>Chi tiết phiếu nhập hàng</span>
              <Tag className="receipt-code-tag">{receipt.code}</Tag>
              <Tag color={OrderStatusColors[receipt.orderStatus]}>
                {OrderStatusLabels[receipt.orderStatus]}
              </Tag>
              <Tag color={WarehouseStatusColors[receipt.warehouseStatus]}>
                {WarehouseStatusLabels[receipt.warehouseStatus]}
              </Tag>
            </Space>
            {renderActionButtons()}
          </div>
        }
      >
        <div className="detail-sections-row">
          <div className="detail-section">
            <div className="detail-section-title">Thông tin phiếu</div>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <DetailItem
                  label="Ngày cần hàng dự kiến"
                  value={
                    receipt.expectedDeliveryDate
                      ? dayjs(receipt.expectedDeliveryDate).format("DD/MM/YYYY")
                      : undefined
                  }
                />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem label="Ghi chú" value={receipt.notes} />
              </Col>
            </Row>
          </div>
        </div>

        {snapshot && snapshot.steps.length > 0 && (
          <div className="detail-section" style={{ marginBottom: 16 }}>
            <div className="detail-section-title">Tiến trình phê duyệt</div>
            <Steps
              size="small"
              current={
                snapshot.status === ApprovalSnapshotStatus.Approved
                  ? snapshot.totalSteps
                  : snapshot.currentStepOrder
              }
              status={snapshot.status === ApprovalSnapshotStatus.Rejected ? "error" : "process"}
              items={snapshot.steps
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map((step) => {
                  let status: "wait" | "process" | "finish" | "error" = "wait";
                  let icon: React.ReactNode = undefined;
                  if (step.status === ApprovalStepStatus.Approved) {
                    status = "finish";
                    icon = <CheckCircleOutlined />;
                  } else if (step.status === ApprovalStepStatus.Rejected) {
                    status = "error";
                    icon = <CloseCircleOutlined />;
                  } else if (
                    step.stepOrder === snapshot.currentStepOrder &&
                    snapshot.status === ApprovalSnapshotStatus.Pending
                  ) {
                    status = "process";
                    icon = <ClockCircleOutlined />;
                  }

                  const desc =
                    step.status === ApprovalStepStatus.Approved
                      ? `Đã duyệt${step.actionDate ? ` · ${dayjs(step.actionDate).format("HH:mm DD/MM/YYYY")}` : ""}`
                      : step.status === ApprovalStepStatus.Rejected
                        ? `Từ chối${step.notes ? ` — ${step.notes}` : ""}${step.actionDate ? ` · ${dayjs(step.actionDate).format("HH:mm DD/MM/YYYY")}` : ""}`
                        : "Chờ duyệt";

                  return {
                    title: `Cấp ${step.stepOrder + 1}: ${step.approverName}`,
                    description: desc,
                    status,
                    icon,
                  };
                })}
            />
          </div>
        )}

        <Card
          className="list-card"
          title={`Thông tin vật tư (${materialItems.length} sản phẩm)`}
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={productColumns}
            dataSource={materialItems}
            rowKey="id"
            pagination={false}
            scroll={{ x: 730 }}
            size="small"
            bordered
            locale={{ emptyText: "Không có vật tư" }}
          />
        </Card>

        <Card
          className="list-card"
          title={`Thông tin thiết bị (${equipmentItems.length} thiết bị)`}
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={equipmentColumns}
            dataSource={equipmentItems}
            rowKey="id"
            pagination={false}
            scroll={{ x: 740 }}
            size="small"
            bordered
            locale={{ emptyText: "Không có thiết bị" }}
          />
        </Card>
      </Card>

      <Modal
        title="Từ chối phiếu đặt hàng"
        open={rejectModalOpen}
        onOk={handleRejectConfirm}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={rejecting}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        destroyOnClose
        centered
      >
        <p>
          Bạn có chắc chắn muốn từ chối phiếu <strong>{receipt.code}</strong>?
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Nhập lý do từ chối (không bắt buộc)"
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default GoodsReceiptDetail;
