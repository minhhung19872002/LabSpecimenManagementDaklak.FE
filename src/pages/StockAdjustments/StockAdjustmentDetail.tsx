import React, { useState, useEffect } from "react";
import {
  Card, Button, Space, Row, Col, Table, Tag, Spin, Popconfirm, message,
} from "antd";
import {
  ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  stockAdjustmentService,
  StockAdjustmentDto,
  StockAdjustmentItemDto,
  StockAdjustmentStatus,
  StockAdjustmentStatusLabels,
  StockAdjustmentStatusColors,
} from "../../services/stockAdjustmentService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { PATH_ROUTES } from "../../constants/routes";
import { getApiErrorMessage } from "../../utils/errorHandler";
import "../../styles/ListCard.css";
import "./StockAdjustmentDetail.css";

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

const StockAdjustmentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [adjustment, setAdjustment] = useState<StockAdjustmentDto | null>(null);

  const canEdit = authService.hasPermission(PERMISSIONS.StockAdjustments.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.StockAdjustments.Delete);
  const canConfirm = authService.hasPermission(PERMISSIONS.StockAdjustments.Confirm);

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (adjustmentId: string) => {
    setLoading(true);
    try {
      const data = await stockAdjustmentService.get(adjustmentId);
      setAdjustment(data);
    } catch {
      message.error("Không thể tải phiếu điều chỉnh kho");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!adjustment) return;
    setConfirming(true);
    try {
      await stockAdjustmentService.confirm(adjustment.id);
      message.success("Xác nhận kiểm kê và cập nhật tồn kho thành công");
      fetchData(adjustment.id);
    } catch (err) {
      message.error(getApiErrorMessage(err, "Không thể xác nhận phiếu"));
    } finally {
      setConfirming(false);
    }
  };

  const handleDelete = async () => {
    if (!adjustment) return;
    try {
      await stockAdjustmentService.delete(adjustment.id);
      message.success("Xóa phiếu thành công");
      navigate(PATH_ROUTES.stockAdjustments.index);
    } catch {
      message.error("Không thể xóa phiếu");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!adjustment) {
    return (
      <Card className="list-card">
        <div style={{ textAlign: "center", padding: 40 }}>
          Không tìm thấy phiếu điều chỉnh kho
          <br />
          <Button type="link" onClick={() => navigate(PATH_ROUTES.stockAdjustments.index)}>
            Quay lại danh sách
          </Button>
        </div>
      </Card>
    );
  }

  const isDraft = adjustment.status === StockAdjustmentStatus.Draft;

  const warehouseGroups = new Map<string, StockAdjustmentItemDto[]>();
  for (const item of adjustment.items) {
    const key = item.warehouseId || "_none";
    if (!warehouseGroups.has(key)) warehouseGroups.set(key, []);
    warehouseGroups.get(key)!.push(item);
  }

  const itemColumns = [
    {
      title: "STT",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Tên vật tư",
      dataIndex: "productName",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Tồn kho dự kiến",
      dataIndex: "expectedStock",
      width: 150,
      align: "right" as const,
      render: (v: number | null | undefined, record: StockAdjustmentItemDto) => {
        if (v == null) return "-";
        const unit = record.actualUnitName || record.unitName || "";
        return `${v.toLocaleString("vi-VN")} ${unit}`.trim();
      },
    },
    {
      title: "Số lượng thực tế",
      dataIndex: "actualQuantity",
      width: 150,
      align: "right" as const,
      render: (v: number, record: StockAdjustmentItemDto) => {
        const unit = record.actualUnitName || record.unitName || "";
        return `${v.toLocaleString("vi-VN")} ${unit}`.trim();
      },
    },
    {
      title: "Chênh lệch",
      width: 160,
      align: "right" as const,
      render: (_: any, record: StockAdjustmentItemDto) => {
        const expected = record.expectedStock;
        if (expected == null) {
          const v = record.adjustmentQuantity;
          if (v === 0) return "0";
          const color = v > 0 ? "#52c41a" : "#ff4d4f";
          const sign = v > 0 ? "+" : "";
          return (
            <span style={{ color, fontWeight: 600 }}>
              {sign}{v.toLocaleString("vi-VN")}
            </span>
          );
        }
        const diff = record.actualQuantity - expected;
        if (diff === 0) return "0";
        const unit = record.actualUnitName || record.unitName || "";
        const color = diff > 0 ? "#52c41a" : "#ff4d4f";
        const sign = diff > 0 ? "+" : "";
        return (
          <div style={{ color, fontWeight: 600 }}>
            <div>{sign}{diff.toLocaleString("vi-VN")} {unit}</div>
            {expected !== 0 && (
              <div style={{ fontSize: 12 }}>{sign}{((diff / expected) * 100).toFixed(1)}%</div>
            )}
          </div>
        );
      },
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      width: 200,
      ellipsis: true,
      render: (v: string) => v || "-",
    },
  ];

  return (
    <div className="stock-adjustment-detail">
      <div className="back-button-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>

      <Card
        className="list-card"
        title={
          <div className="card-header-flex">
            <Space wrap>
              <span>Chi tiết phiếu điều chỉnh kho</span>
              <Tag className="receipt-code-tag">{adjustment.code}</Tag>
              <Tag color={StockAdjustmentStatusColors[adjustment.status]}>
                {StockAdjustmentStatusLabels[adjustment.status]}
              </Tag>
            </Space>
            <Space wrap>
              {isDraft && canEdit && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate(PATH_ROUTES.stockAdjustments.edit(adjustment.id))}
                >
                  Chỉnh sửa
                </Button>
              )}
              {isDraft && canConfirm && (
                <Popconfirm
                  title="Xác nhận kiểm kê?"
                  description="Sau khi xác nhận, tồn kho sẽ được cập nhật và không thể hoàn tác."
                  onConfirm={handleConfirm}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button
                    icon={<CheckCircleOutlined />}
                    loading={confirming}
                  >
                    Xác nhận kiểm kê
                  </Button>
                </Popconfirm>
              )}
              {isDraft && canDelete && (
                <Popconfirm
                  title="Xóa phiếu này?"
                  onConfirm={handleDelete}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Xóa
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        }
      >
        <div className="detail-section">
          <div className="detail-section-title">Thông tin phiếu</div>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <DetailItem
                label="Ngày kiểm kê"
                value={dayjs(adjustment.inventoryDate).format("DD/MM/YYYY")}
              />
            </Col>
            <Col xs={24} sm={8}>
              <DetailItem label="Nhân viên kiểm kê" value={adjustment.inventoryUserName} />
            </Col>
            <Col xs={24} sm={8}>
              <DetailItem label="Người tạo phiếu" value={adjustment.creatorName} />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col xs={24} sm={8}>
              <DetailItem
                label="Ngày tạo"
                value={dayjs(adjustment.creationTime).format("DD/MM/YYYY HH:mm")}
              />
            </Col>
            <Col xs={24} sm={16}>
              <DetailItem label="Ghi chú" value={adjustment.notes} />
            </Col>
          </Row>
        </div>

        {[...warehouseGroups.entries()].map(([whKey, items]) => {
          const warehouseName = items[0]?.warehouseName || "Chưa phân kho";
          return (
            <div key={whKey} className="detail-section">
              <div className="detail-section-title">
                {warehouseName} ({items.length} vật tư)
              </div>
              <Table
                dataSource={items}
                columns={itemColumns}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 900 }}
              />
            </div>
          );
        })}
      </Card>
    </div>
  );
};

export default StockAdjustmentDetail;
