import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, Button, Space, Table, Tag, Spin, Typography, message, Collapse, Tooltip } from "antd";
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
  EquipmentReceiveStatusLabels,
  EquipmentReceiveStatusColors,
} from "../../services/warehouseImportReceiptService";
import { goodsReceiptService, GoodsReceiptDto } from "../../services/goodsReceiptService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { WarehouseImportModal } from "../GoodsReceipts/components";
import { truncateMiddle } from "../../utils/fileUtils";
import "../../styles/ListCard.css";
import "./WarehouseImportDetail.css";

const { Title, Text } = Typography;
const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const WarehouseImportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state as any;
  const fromSupplier = stateData?.from === "supplier";
  const supplierId = stateData?.supplierId as string | undefined;
  const fromProductDetail = stateData?.from === "productDetail";
  const productDetailPath = stateData?.productDetailPath as string | undefined;
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
          <Button type="link" onClick={() => {
            if (fromProductDetail && productDetailPath) {
              navigate(productDetailPath, { state: stateData?.productDetailState });
            } else {
              navigate("/warehouse-imports");
            }
          }}>Quay lại</Button>
        </div>
      </Card>
    );
  }

  const isCompleted = receipt.status === WarehouseImportReceiptStatus.Completed;
  const statusColor = isCompleted ? (receipt.hasDefectiveItem ? "red" : "green") : "orange";
  const statusLabel = isCompleted ? (receipt.hasDefectiveItem ? "Hàng lỗi" : "Hoàn thành") : "Đang thực hiện";

  const materialItems = receipt.items.filter(i => !i.isEquipment);
  const equipmentItems = receipt.items
    .filter(i => i.isEquipment)
    .sort((a, b) => a.goodsReceiptItemId === b.goodsReceiptItemId ? a.equipmentIndex - b.equipmentIndex : a.goodsReceiptItemId.localeCompare(b.goodsReceiptItemId));

  const equipGroupRowSpans: Record<string, number> = {};
  {
    let i = 0;
    while (i < equipmentItems.length) {
      const groupId = equipmentItems[i].goodsReceiptItemId;
      let j = i;
      while (j < equipmentItems.length && equipmentItems[j].goodsReceiptItemId === groupId) j++;
      for (let k = i; k < j; k++) {
        equipGroupRowSpans[equipmentItems[k].id] = k === i ? j - i : 0;
      }
      i = j;
    }
  }

  const materialColumns: ColumnsType<WarehouseImportReceiptItemDto> = [
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
      key: "orderedQuantity",
      width: 100,
      align: "center",
      render: (_: any, record: WarehouseImportReceiptItemDto) => (
        <div>
          <div>{record.orderedQuantity}</div>
          {record.purchaseUnitName && (
            <div style={{ fontSize: 11, color: "#888" }}>{record.purchaseUnitName}</div>
          )}
        </div>
      ),
    },
    {
      title: "SL nhận thực tế",
      key: "actualReceivedQuantity",
      width: 150,
      align: "center",
      render: (_: any, record: WarehouseImportReceiptItemDto) => (
        <div>
          <div>{record.actualReceivedQuantity}</div>
          {record.unitName && (
            <div style={{ fontSize: 11, color: "#888" }}>{record.unitName}</div>
          )}
        </div>
      ),
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturerName",
      key: "manufacturerName",
      width: 140,
      render: (v?: string) => v || "-",
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
      title: "Kho lưu trữ",
      dataIndex: "storageWarehouseName",
      key: "storageWarehouseName",
      width: 140,
      render: (v?: string) => v || "-",
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
      width: 160,
      render: (_, record) =>
        record.qualityDocumentFileId ? (
          <Tooltip title={record.qualityDocumentFileName}>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              style={{ maxWidth: "100%", padding: 0 }}
              onClick={() => window.open(`${baseUrl}/api/v1/files/${record.qualityDocumentFileId}`, "_blank")}
            >
              <span style={{ verticalAlign: "middle" }}>
                {truncateMiddle(record.qualityDocumentFileName || "")}
              </span>
            </Button>
          </Tooltip>
        ) : "-",
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 130,
      align: "right",
      render: (v?: number) => v != null ? `${new Intl.NumberFormat("vi-VN").format(v)} đ` : "-",
    },
    {
      title: "VAT",
      dataIndex: "vatPercent",
      key: "vatPercent",
      width: 70,
      align: "center",
      render: (v?: number) => v != null ? `${v}%` : "-",
    },
    {
      title: "Thành tiền",
      dataIndex: "totalLineAmount",
      key: "totalLineAmount",
      width: 150,
      align: "right",
      render: (v?: number) => v != null ? `${new Intl.NumberFormat("vi-VN").format(v)} đ` : "-",
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 150,
      render: (v?: string) => v || "-",
    },
  ];

  const equipmentColumns: ColumnsType<WarehouseImportReceiptItemDto> = [
    {
      title: "Tên thiết bị",
      dataIndex: "productName",
      key: "productName",
      width: 180,
      onCell: (record) => ({ rowSpan: equipGroupRowSpans[record.id] }),
    },
    {
      title: "SL Đặt",
      key: "orderedQuantity",
      width: 100,
      align: "center",
      onCell: (record) => ({ rowSpan: equipGroupRowSpans[record.id] }),
      render: (_, record) => `${record.orderedQuantity} ${record.purchaseUnitName || ""}`.trim(),
    },
    {
      title: "Mã tài sản",
      dataIndex: "assetCode",
      key: "assetCode",
      width: 120,
      render: (v?: string) => v || "-",
    },
    {
      title: "Số Serial NSX",
      dataIndex: "serialNumber",
      key: "serialNumber",
      width: 140,
      render: (v?: string) => v || "-",
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturerName",
      key: "manufacturerName",
      width: 140,
      render: (v?: string) => v || "-",
    },
    {
      title: "Trạng thái",
      key: "equipmentReceiveStatus",
      width: 120,
      render: (_, record) => (
        <Tag color={EquipmentReceiveStatusColors[record.equipmentReceiveStatus]}>
          {EquipmentReceiveStatusLabels[record.equipmentReceiveStatus]}
        </Tag>
      ),
    },
    {
      title: "TG khấu hao",
      key: "depreciationPeriod",
      width: 110,
      render: (_, record) =>
        record.depreciationPeriod != null ? `${record.depreciationPeriod} năm` : "-",
    },
    {
      title: "Nguyên giá",
      key: "originalPrice",
      width: 130,
      align: "right",
      render: (_, record) =>
        record.originalPrice != null
          ? new Intl.NumberFormat("vi-VN").format(record.originalPrice) + " đ"
          : "-",
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      key: "location",
      width: 150,
      render: (v?: string) => v || "-",
    },
  ];

  return (
    <div className="warehouse-import-detail">
      <div className="back-button-bar">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (fromProductDetail && productDetailPath) {
              navigate(productDetailPath, { state: stateData?.productDetailState });
            } else if (fromSupplier && supplierId) {
              navigate(`/suppliers-management/${supplierId}`);
            } else {
              navigate("/warehouse-imports");
            }
          }}
        >
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
                  In barcode
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
                <Text type="secondary">Tổng giá trị đơn hàng (Đã bao gồm VAT):</Text>
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

        <Collapse
          defaultActiveKey={["materials", "equipment"]}
          style={{ marginBottom: 16 }}
          items={[
            ...(materialItems.length > 0
              ? [
                  {
                    key: "materials",
                    label: <strong>Nhóm 1 — Vật tư / Hóa chất ({materialItems.length} dòng)</strong>,
                    children: (
                      <Table
                        columns={materialColumns}
                        dataSource={materialItems}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 1200 }}
                        size="small"
                        bordered
                      />
                    ),
                  },
                ]
              : []),
            ...(equipmentItems.length > 0
              ? [
                  {
                    key: "equipment",
                    label: <strong>Nhóm 2 — Thiết bị phòng Lab ({equipmentItems.length} thiết bị)</strong>,
                    children: (
                      <Table
                        columns={equipmentColumns}
                        dataSource={equipmentItems}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 1100 }}
                        size="small"
                        bordered
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />

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
        importReceipt={receipt}
        printOnly
      />
    )}
    </div>
  );
};

export default WarehouseImportDetail;
