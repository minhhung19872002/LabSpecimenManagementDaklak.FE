import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, message, Modal, Row, Space, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined, CheckOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { PATH_ROUTES } from "../../constants/routes";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { authService } from "../../services/authService";
import {
  MaterialReceiptDto,
  MaterialReceiptItemDto,
  MaterialReceiptStatus,
  MaterialReceiptStatusColors,
  MaterialReceiptStatusLabels,
  materialReceiptService,
} from "../../services/materialReceiptService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import "../../styles/ListCard.css";
import "../GoodsReceipts/GoodsReceiptDetail.css";

const DetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-item">
    <span className="detail-item-label">{label}</span>
    <span className="detail-item-value">{value != null && value !== "" ? value : "—"}</span>
  </div>
);

const MaterialReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<MaterialReceiptDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const canEdit = authService.hasPermission(PERMISSIONS.MaterialReceipts.Create);
  const canConfirm = authService.hasPermission(PERMISSIONS.MaterialReceipts.Confirm);
  const canDelete = authService.hasPermission(PERMISSIONS.MaterialReceipts.Delete);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setReceipt(await materialReceiptService.get(id));
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể tải phiếu nhận vật tư"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleConfirm = () => {
    if (!id || !receipt) return;
    Modal.confirm({
      title: "Xác nhận nhận vật tư",
      content: `Xác nhận phiếu ${receipt.code} đã nhận vật tư?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        setConfirming(true);
        try {
          await materialReceiptService.confirm(id);
          message.success("Đã xác nhận nhận vật tư");
          await loadData();
        } catch (error) {
          message.error(getApiErrorMessage(error, "Không thể xác nhận phiếu nhận vật tư"));
        } finally {
          setConfirming(false);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!id || !receipt) return;
    Modal.confirm({
      title: "Xóa phiếu nhận vật tư",
      content: `Bạn có chắc muốn xóa phiếu ${receipt.code}?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await materialReceiptService.delete(id);
          message.success("Đã xóa phiếu nhận vật tư");
          navigate(PATH_ROUTES.materialReceipts.index);
        } catch (error) {
          message.error(getApiErrorMessage(error, "Không thể xóa phiếu nhận vật tư"));
        }
      },
    });
  };

  const columns = useMemo<ColumnsType<MaterialReceiptItemDto>>(() => [
    { title: "STT", width: 60, align: "center", render: (_, __, index) => index + 1 },
    { title: "Mã nhận dạng", dataIndex: "identificationCode", width: 140, render: (value) => value || "—" },
    { title: "Số lô", dataIndex: "lotNumber", width: 110, render: (value: string) => value || "—" },
    { title: "Tên vật tư / hóa chất", dataIndex: "productName", width: 220 },
    { title: "Cấu hình kỹ thuật", dataIndex: "technicalSpec", width: 180, render: (value) => value || "—" },
    { title: "Hạn sử dụng", dataIndex: "nearestExpiryDate", width: 120, render: (value) => value ? dayjs(value).format("DD/MM/YYYY") : "—" },
    { title: "CAS", dataIndex: "casNumber", width: 120, render: (value) => value || "—" },
    { title: "Hãng sản xuất", dataIndex: "manufacturerName", width: 140, ellipsis: true, render: (value: string) => value || "—" },
    { title: "Đơn vị", dataIndex: "unitName", width: 120, render: (value) => value || "—" },
    { title: "Số lượng", dataIndex: "quantity", width: 110, align: "right" },
    { title: "Kho nhận", dataIndex: "receivingWarehouseName", width: 170 },
  ], []);

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin /></div>;
  }
  if (!receipt) return null;

  const isDraft = receipt.status === MaterialReceiptStatus.Draft;

  return (
    <div className="goods-receipt-detail">
      <div className="back-button-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(PATH_ROUTES.materialReceipts.index)}>Quay lại</Button>
      </div>

      <Card
        className="list-card"
        title={
          <div className="card-header-flex">
            <Space wrap>
              <span>Chi tiết phiếu nhận vật tư</span>
              <Tag className="receipt-code-tag">{receipt.code}</Tag>
              <Tag color={MaterialReceiptStatusColors[receipt.status]}>{MaterialReceiptStatusLabels[receipt.status]}</Tag>
            </Space>
            <Space wrap>
              {isDraft && canEdit && (
                <Button icon={<EditOutlined />} onClick={() => navigate(PATH_ROUTES.materialReceipts.edit(receipt.id))}>Chỉnh sửa</Button>
              )}
              {isDraft && canDelete && (
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>Xóa</Button>
              )}
              {isDraft && canConfirm && (
                <Button type="primary" icon={<CheckOutlined />} loading={confirming} onClick={handleConfirm}>Xác nhận đã nhận</Button>
              )}
            </Space>
          </div>
        }
      >
        <div className="detail-section">
          <div className="detail-section-title">Thông tin phiếu</div>
          <Row gutter={24}>
            <Col xs={24} sm={12} lg={6}><DetailItem label="Mã phiếu" value={receipt.code} /></Col>
            <Col xs={24} sm={12} lg={6}><DetailItem label="Người nhận vật tư" value={receipt.receiverName} /></Col>
            <Col xs={24} sm={12} lg={6}><DetailItem label="Ngày nhận vật tư" value={dayjs(receipt.receiptDate).format("DD/MM/YYYY")} /></Col>
            <Col xs={24} sm={12} lg={6}><DetailItem label="Người tạo" value={receipt.creatorName} /></Col>
            {receipt.notes && <Col xs={24}><DetailItem label="Ghi chú" value={receipt.notes} /></Col>}
          </Row>
        </div>

        <Card
          className="list-card"
          title={`Thông tin vật tư (${receipt.items.length})`}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={columns}
            dataSource={receipt.items}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 1500 }}
            locale={{ emptyText: "Không có vật tư" }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default MaterialReceiptDetail;
