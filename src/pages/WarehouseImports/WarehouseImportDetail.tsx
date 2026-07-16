import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Button, Space, Table, Tag, Spin, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  warehouseImportReceiptService,
  WarehouseImportReceiptDto,
  WarehouseImportReceiptItemDto,
  WarehouseImportReceiptStatus,
  WarehouseImportLineStatus,
  WarehouseImportLineStatusLabels,
  WarehouseImportLineStatusColors,
} from "../../services/warehouseImportReceiptService";
import { goodsReceiptService, GoodsReceiptDto } from "../../services/goodsReceiptService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { WarehouseImportModal } from "../GoodsReceipts/components";
import "../../styles/ListCard.css";
import "./WarehouseImportDetail.css";

const { Title, Text } = Typography;
const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const WarehouseImportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<WarehouseImportReceiptDto | null>(null);
  const [goodsReceipt, setGoodsReceipt] = useState<GoodsReceiptDto | null>(null);
  const [printBarcodeOpen, setPrintBarcodeOpen] = useState(false);
  const canPrintBarcode = authService.hasPermission(PERMISSIONS.WarehouseImportReceipts.Confirm);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await warehouseImportReceiptService.get(id);
      setReceipt(data);
      if (data.goodsReceiptId) {
        goodsReceiptService.get(data.goodsReceiptId)
          .then(setGoodsReceipt)
          .catch(() => {});
      }
    } catch {
      message.error("Không thể tải thông tin phiếu nhập kho");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <Card className="list-card">
        <div style={{ textAlign: "center", padding: 40 }}>
          <p>Không tìm thấy phiếu nhập kho</p>
          <Button type="link" onClick={() => navigate("/warehouse-imports")}>Quay lại danh sách</Button>
        </div>
      </Card>
    );
  }

  const isCompleted = receipt.status === WarehouseImportReceiptStatus.Completed;
  const statusColor = isCompleted ? (receipt.hasDefectiveItem ? "red" : "green") : "orange";
  const statusLabel = isCompleted ? (receipt.hasDefectiveItem ? "Hàng lỗi" : "Hoàn thành") : "Đang thực hiện";

  const itemColumns: ColumnsType<WarehouseImportReceiptItemDto> = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "productName",
      key: "productName",
      width: 200,
    },
    {
      title: "ĐVT",
      dataIndex: "unitName",
      key: "unitName",
      width: 80,
      render: (v?: string) => v || "-",
    },
    {
      title: "SL đặt",
      dataIndex: "orderedQuantity",
      key: "orderedQuantity",
      width: 100,
      align: "right",
    },
    {
      title: "SL nhận thực tế",
      dataIndex: "actualReceivedQuantity",
      key: "actualReceivedQuantity",
      width: 120,
      align: "right",
    },
    {
      title: "Số lô",
      dataIndex: "lotNumber",
      key: "lotNumber",
      width: 120,
      render: (v?: string) => v || "-",
    },
    {
      title: "Hạn lô",
      dataIndex: "lotExpiryDate",
      key: "lotExpiryDate",
      width: 110,
      render: (v?: string) => v ? dayjs(v).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: WarehouseImportLineStatus) => (
        <Tag color={WarehouseImportLineStatusColors[status]}>
          {WarehouseImportLineStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: "Chứng từ CL",
      key: "qualityDocument",
      width: 130,
      render: (_, record) =>
        record.qualityDocumentFileId ? (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open(`${baseUrl}/api/v1/files/${record.qualityDocumentFileId}`, "_blank")}
          >
            {record.qualityDocumentFileName}
          </Button>
        ) : "-",
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 150,
      render: (v?: string) => v || "-",
    },
  ];

  return (
    <div className="warehouse-import-detail">
      <div className="back-button-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/warehouse-imports")}>
          Quay lại
        </Button>
      </div>

      <Card
        className="list-card"
        title={
          <div className="card-header-flex">
            <Space wrap>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Chi tiết phiếu nhập kho</span>
              <Tag className="receipt-code-tag">{receipt.code}</Tag>
              <Tag color={statusColor}>{statusLabel}</Tag>
            </Space>
            <Space wrap>
              {canPrintBarcode && goodsReceipt && (
                <Button onClick={() => setPrintBarcodeOpen(true)}>
                  In mã vật tư
                </Button>
              )}
              {!isCompleted && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/warehouse-imports/edit/${receipt.id}`)}
                >
                  Chỉnh sửa
                </Button>
              )}
            </Space>
          </div>
        }
      >
        <div className="detail-sections-row">
          <div className="detail-section">
            <Title level={5} style={{ marginBottom: 12 }}>Thông tin phiếu</Title>
            <div className="detail-grid-2col">
              <div className="detail-item">
                <Text type="secondary">Phiếu mua hàng:</Text>
                <a onClick={() => navigate(`/goods-receipts/${receipt.goodsReceiptId}`)}>
                  <Text strong style={{ color: "#1677ff" }}>{receipt.goodsReceiptCode}</Text>
                </a>
              </div>
              <div className="detail-item">
                <Text type="secondary">Ngày nhận thực tế:</Text>
                <Text strong>{receipt.actualImportDate ? dayjs(receipt.actualImportDate).format("DD/MM/YYYY") : "-"}</Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">Kho:</Text>
                <Text strong>{receipt.warehouseName || "-"}</Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">Thủ kho thực hiện:</Text>
                <Text strong>{receipt.warehouseKeeperName || "-"}</Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">Người tạo:</Text>
                <Text>{receipt.creatorName || "-"}</Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">Thời gian tạo:</Text>
                <Text>{receipt.creationTime ? dayjs(receipt.creationTime).format("DD/MM/YYYY HH:mm") : "-"}</Text>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <Title level={5} style={{ marginBottom: 12 }}>Thông tin nhà cung cấp</Title>
            <div className="detail-column-list">
              <div className="detail-item">
                <Text type="secondary">Nhà cung cấp:</Text>
                <Text strong>{receipt.supplierName || "-"}</Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">Người liên hệ:</Text>
                <Text strong>{receipt.contactPersonName || "-"}</Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">Tổng giá trị đơn hàng:</Text>
                <Text strong>
                  {receipt.totalAmount != null
                    ? receipt.totalAmount.toLocaleString("vi-VN") + " đ"
                    : "-"}
                </Text>
              </div>
            </div>
            {((receipt.deliveryDocumentFiles && receipt.deliveryDocumentFiles.length > 0) || receipt.deliveryDocumentFileId) && (
              <>
                <Title level={5} style={{ marginBottom: 8, marginTop: 16 }}>Chứng từ giao hàng</Title>
                {(receipt.deliveryDocumentFiles && receipt.deliveryDocumentFiles.length > 0
                  ? receipt.deliveryDocumentFiles
                  : [{ fileId: receipt.deliveryDocumentFileId!, fileName: receipt.deliveryDocumentFileName || "" }]
                ).map((f) => (
                  <Button
                    key={f.fileId}
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    style={{ padding: 0, height: "auto", display: "block", marginBottom: 4 }}
                    onClick={() => window.open(`${baseUrl}/api/v1/files/${f.fileId}`, "_blank")}
                  >
                    {f.fileName}
                  </Button>
                ))}
              </>
            )}
          </div>
        </div>

        <Card
          className="list-card"
          title={`Danh sách sản phẩm (${receipt.items.length} sản phẩm)`}
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={itemColumns}
            dataSource={receipt.items}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
            size="small"
            bordered
          />
        </Card>

        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>Đánh giá nhập hàng</Title>
          <Text>{receipt.notes || "-"}</Text>
        </div>
      </Card>
    {goodsReceipt && (
      <WarehouseImportModal
        open={printBarcodeOpen}
        onClose={() => setPrintBarcodeOpen(false)}
        receipt={goodsReceipt}
        onImportSuccess={() => setPrintBarcodeOpen(false)}
        printOnly
      />
    )}
    </div>
  );
};

export default WarehouseImportDetail;
