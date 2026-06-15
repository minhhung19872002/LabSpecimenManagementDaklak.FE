import React, { useState, useEffect } from "react";
import {
  Card, Button, Space, Row, Col, Table, Tag, Spin, Divider, Modal, message,
} from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  goodsReceiptService,
  GoodsReceiptDto,
  GoodsReceiptItemDto,
  GoodsReceiptPaymentDto,
  GoodsReceiptWarehouseStatus,
  GoodsReceiptOrderStatus,
  GoodsReceiptPaymentStatus,
  GoodsReceiptType,
  WarehouseStatusLabels,
  WarehouseStatusColors,
  OrderStatusLabels,
  OrderStatusColors,
  PaymentStatusLabels,
  PaymentStatusColors,
  ReceiptTypeLabels,
  ReceiptTypeColors,
  PAYMENT_METHOD_OPTIONS,
} from "../../services/goodsReceiptService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { PaymentModal } from "./components";
import { PaymentFormData } from "./schemas";
import "../../styles/ListCard.css";
import "./GoodsReceiptDetail.css";

const formatCurrency = (v: number) => v.toLocaleString("vi-VN");

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-item">
    <span className="detail-item-label">{label}</span>
    <span className="detail-item-value">{value != null && value !== "" ? value : "-"}</span>
  </div>
);

const GoodsReceiptDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<GoodsReceiptDto | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [importing, setImporting] = useState(false);

  const canEdit = authService.hasPermission(PERMISSIONS.GoodsReceipts.Edit);
  const canApprove = authService.hasPermission(PERMISSIONS.GoodsReceipts.Approve);
  const canImport = authService.hasPermission(PERMISSIONS.GoodsReceipts.ImportToWarehouse);
  const canPay = authService.hasPermission(PERMISSIONS.GoodsReceipts.AddPayment);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await goodsReceiptService.get(id);
      setReceipt(data);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể tải phiếu nhập hàng."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

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

  const handleImportToWarehouse = async () => {
    if (!id) return;
    setImporting(true);
    try {
      await goodsReceiptService.importToWarehouse(id);
      message.success("Đã nhập kho thành công");
      await loadData();
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể nhập kho."));
    } finally {
      setImporting(false);
    }
  };

  const handlePaymentOk = async (data: PaymentFormData) => {
    if (!id) return;
    setPaymentLoading(true);
    try {
      await goodsReceiptService.addPayment(id, {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        phone: data.phone || undefined,
        representativeName: data.representativeName || undefined,
        notes: data.notes || undefined,
      });
      message.success("Thanh toán thành công");
      setPaymentModalOpen(false);
      await loadData();
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể thanh toán."));
    } finally {
      setPaymentLoading(false);
    }
  };

  const productItems = receipt?.items?.filter((i) => !i.isEquipment) || [];
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
      title: "Hàng hóa",
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
    {
      title: "Giá nhập",
      key: "unitPrice",
      width: 130,
      align: "right" as const,
      render: (_: any, r: GoodsReceiptItemDto) => formatCurrency(r.unitPrice),
    },
    {
      title: "Thành tiền chưa VAT",
      key: "amountBeforeVat",
      width: 150,
      align: "right" as const,
      render: (_: any, r: GoodsReceiptItemDto) => formatCurrency(r.amountBeforeVat),
    },
    {
      title: "VAT %",
      key: "vatPercent",
      width: 80,
      align: "center" as const,
      render: (_: any, r: GoodsReceiptItemDto) => `${r.vatPercent}%`,
    },
    {
      title: "Thành tiền sau VAT",
      key: "amountAfterVat",
      width: 150,
      align: "right" as const,
      render: (_: any, r: GoodsReceiptItemDto) => formatCurrency(r.amountAfterVat),
    },
    {
      title: "Code / Lot",
      dataIndex: "lotNumber",
      key: "lotNumber",
      width: 120,
      render: (v: string) => v || "-",
    },
    {
      title: "Hạn lô",
      key: "lotExpiryDate",
      width: 110,
      render: (_: any, r: GoodsReceiptItemDto) =>
        r.lotExpiryDate ? dayjs(r.lotExpiryDate).format("DD/MM/YYYY") : "-",
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
      title: "Serial Number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      width: 160,
      render: (v: string) => v || "-",
    },
    {
      title: "Tên thiết bị",
      dataIndex: "productName",
      key: "productName",
      width: 200,
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 140,
      render: (v: string) => v || "-",
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplierName",
      key: "supplierName",
      width: 180,
      render: (v: string) => v || "-",
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturer",
      key: "manufacturer",
      width: 150,
      render: (v: string) => v || "-",
    },
    {
      title: "Thành tiền chưa VAT",
      key: "amountBeforeVat",
      width: 150,
      align: "right" as const,
      render: (_: any, r: GoodsReceiptItemDto) => formatCurrency(r.amountBeforeVat),
    },
    {
      title: "VAT %",
      key: "vatPercent",
      width: 80,
      align: "center" as const,
      render: (_: any, r: GoodsReceiptItemDto) => `${r.vatPercent}%`,
    },
    {
      title: "Thành tiền sau VAT",
      key: "amountAfterVat",
      width: 150,
      align: "right" as const,
      render: (_: any, r: GoodsReceiptItemDto) => formatCurrency(r.amountAfterVat),
    },
  ];

  const paymentColumns = [
    {
      title: "Lần",
      dataIndex: "paymentNumber",
      key: "paymentNumber",
      width: 60,
      align: "center" as const,
    },
    {
      title: "Ngày thanh toán",
      key: "paymentDate",
      width: 130,
      render: (_: any, r: GoodsReceiptPaymentDto) =>
        dayjs(r.paymentDate).format("DD/MM/YYYY"),
    },
    {
      title: "Phương thức",
      key: "paymentMethod",
      width: 130,
      render: (_: any, r: GoodsReceiptPaymentDto) =>
        PAYMENT_METHOD_OPTIONS.find((o) => o.value === r.paymentMethod)?.label || "-",
    },
    {
      title: "Số tiền",
      key: "amount",
      width: 150,
      align: "right" as const,
      render: (_: any, r: GoodsReceiptPaymentDto) => `${formatCurrency(r.amount)} VNĐ`,
    },
    {
      title: "Còn lại trước thanh toán",
      key: "remainingBeforePayment",
      width: 180,
      align: "right" as const,
      render: (_: any, r: GoodsReceiptPaymentDto) => `${formatCurrency(r.remainingBeforePayment)} VNĐ`,
    },
    {
      title: "Người đại diện",
      dataIndex: "representativeName",
      key: "representativeName",
      width: 140,
      render: (v: string) => v || "-",
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 120,
      render: (v: string) => v || "-",
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      render: (v: string) => v || "-",
    },
    {
      title: "Thời gian tạo",
      key: "creationTime",
      width: 150,
      render: (_: any, r: GoodsReceiptPaymentDto) =>
        dayjs(r.creationTime).format("HH:mm DD/MM/YYYY"),
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

  const remaining = receipt.totalAmountAfterVat - receipt.totalPaid;
  const isApproved = receipt.orderStatus === GoodsReceiptOrderStatus.Approved;
  const isImported = receipt.warehouseStatus === GoodsReceiptWarehouseStatus.Imported;

  const renderActionButtons = () => (
    <Space wrap>
      {canApprove && receipt.orderStatus === GoodsReceiptOrderStatus.Draft && (
        <Button type="primary" onClick={handleApprove} loading={approving}>
          Duyệt
        </Button>
      )}
      {canPay && isApproved && receipt.paymentStatus !== GoodsReceiptPaymentStatus.Paid && remaining > 0 && (
        <Button onClick={() => setPaymentModalOpen(true)}>
          Thanh toán
        </Button>
      )}
      {canImport && isApproved && !isImported && (
        <Button
          type="primary"
          loading={importing}
          onClick={() => {
            Modal.confirm({
              title: "Xác nhận nhập kho",
              content: "Bạn có chắc chắn muốn nhập kho phiếu này? Sau khi nhập kho sẽ không thể chỉnh sửa.",
              okText: "Nhập kho",
              cancelText: "Hủy",
              centered: true,
              onOk: handleImportToWarehouse,
            });
          }}
        >
          Nhập kho
        </Button>
      )}
      {canEdit && receipt.orderStatus === GoodsReceiptOrderStatus.Draft && (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() =>
            navigate(
              receipt.receiptType === GoodsReceiptType.Equipment
                ? `/goods-receipts/edit-equipment/${id}`
                : `/goods-receipts/edit/${id}`
            )
          }
        >
          Chỉnh sửa
        </Button>
      )}
    </Space>
  );

  return (
    <div className="goods-receipt-detail">
      {/* Back button */}
      <div className="back-button-bar">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/goods-receipts")}
        >
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
              <Tag color={ReceiptTypeColors[receipt.receiptType]}>
                {ReceiptTypeLabels[receipt.receiptType]}
              </Tag>
              <Tag color={OrderStatusColors[receipt.orderStatus]}>
                {OrderStatusLabels[receipt.orderStatus]}
              </Tag>
              <Tag color={WarehouseStatusColors[receipt.warehouseStatus]}>
                {WarehouseStatusLabels[receipt.warehouseStatus]}
              </Tag>
              <Tag color={PaymentStatusColors[receipt.paymentStatus]}>
                {PaymentStatusLabels[receipt.paymentStatus]}
              </Tag>
            </Space>
            {renderActionButtons()}
          </div>
        }
      >
        {/* Info Sections */}
        <div className="detail-sections-row">
          <div className="detail-section">
            <div className="detail-section-title">Thông tin nhà cung cấp</div>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <DetailItem label="Địa chỉ NCC" value={receipt.supplierAddress} />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem label="SĐT NCC" value={receipt.supplierPhone} />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem label="SĐT đại diện NCC" value={receipt.supplierRepresentativePhone} />
              </Col>
            </Row>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Thông tin phiếu</div>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <DetailItem label="Nhân viên mua hàng" value={receipt.purchaserName} />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem label="Người lập phiếu" value={receipt.preparedByName} />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem label="Số phiếu giao hàng từ NCC" value={receipt.deliveryNoteNumber} />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem label="VAT" value={`${receipt.vatPercent}%`} />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem
                  label="Ngày cấp chứng từ"
                  value={receipt.documentDate ? dayjs(receipt.documentDate).format("DD/MM/YYYY") : undefined}
                />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem
                  label="Ngày hết hạn chứng từ"
                  value={receipt.documentExpiryDate ? dayjs(receipt.documentExpiryDate).format("DD/MM/YYYY") : undefined}
                />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem
                  label="Thời gian tạo phiếu"
                  value={dayjs(receipt.creationTime).format("HH:mm DD/MM/YYYY")}
                />
              </Col>
              <Col xs={24} sm={12}>
                <DetailItem label="Ghi chú" value={receipt.notes} />
              </Col>
            </Row>
          </div>
        </div>

        {/* Line Items + Payment Summary */}
        <Card
          className="list-card"
          title={
            receipt.receiptType === GoodsReceiptType.Equipment
              ? `Thông tin thiết bị (${equipmentItems.length} thiết bị)`
              : `Thông tin vật tư (${productItems.length} sản phẩm)`
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          {receipt.receiptType === GoodsReceiptType.Equipment ? (
            <Table
              columns={equipmentColumns}
              dataSource={equipmentItems}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1200 }}
              size="small"
              bordered
              locale={{ emptyText: "Không có thiết bị" }}
            />
          ) : (
            <Table
              columns={productColumns}
              dataSource={productItems}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1400 }}
              size="small"
              bordered
              locale={{ emptyText: "Không có hàng hóa" }}
            />
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
            <div className="payment-summary">
              <div className="payment-summary-row">
                <span>Tổng chưa VAT:</span>
                <strong>{formatCurrency(receipt.totalAmountBeforeVat)} VNĐ</strong>
              </div>
              <div className="payment-summary-row">
                <span>Tổng thuế VAT:</span>
                <strong>{formatCurrency(receipt.totalVatAmount)} VNĐ</strong>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div className="payment-summary-row">
                <span>Tổng tiền:</span>
                <strong style={{ color: "#1677ff", fontSize: 16 }}>{formatCurrency(receipt.totalAmountAfterVat)} VNĐ</strong>
              </div>
              <div className="payment-summary-row">
                <span>Đã thanh toán:</span>
                <span>{formatCurrency(receipt.totalPaid)} VNĐ</span>
              </div>
              <div className="payment-summary-row" style={{ color: remaining > 0 ? "#ff4d4f" : "#52c41a" }}>
                <span>Số tiền còn lại:</span>
                <strong>{formatCurrency(Math.max(0, remaining))} VNĐ</strong>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment History */}
        {receipt.payments && receipt.payments.length > 0 && (
          <Card
            className="list-card"
            title="Lịch sử thanh toán"
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={paymentColumns}
              dataSource={receipt.payments}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1200 }}
              size="small"
              bordered
            />
          </Card>
        )}
      </Card>

      <PaymentModal
        open={paymentModalOpen}
        loading={paymentLoading}
        totalAmount={receipt.totalAmountAfterVat}
        totalPaid={receipt.totalPaid}
        onOk={handlePaymentOk}
        onCancel={() => setPaymentModalOpen(false)}
      />
    </div>
  );
};

export default GoodsReceiptDetail;
