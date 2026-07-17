import React, { useState, useEffect, useCallback } from "react";
import {
  Card, Button, Space, Row, Col, Table, Tag, Spin, DatePicker, message,
} from "antd";
import { ArrowLeftOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  supplierService,
  SupplierDto,
  CreateUpdateSupplierDto,
} from "../../services/supplierService";
import {
  warehouseImportReceiptService,
  WarehouseImportReceiptListDto,
  WarehouseImportReceiptStatusLabels,
  WarehouseImportReceiptStatusColors,
} from "../../services/warehouseImportReceiptService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { SupplierModal } from "./components";
import { PATH_ROUTES } from "../../constants/routes";
import "../../styles/ListCard.css";

const { RangePicker } = DatePicker;

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ marginBottom: 12 }}>
    <span style={{ color: "#888", fontSize: 13 }}>{label}</span>
    <div style={{ fontWeight: 500 }}>{value || "-"}</div>
  </div>
);

const SupplierDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<SupplierDto | null>(null);
  const [receipts, setReceipts] = useState<WarehouseImportReceiptListDto[]>([]);
  const [receiptsTotal, setReceiptsTotal] = useState(0);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalLoading, setEditModalLoading] = useState(false);

  const loadSupplier = useCallback(async () => {
    if (!id) return;
    try {
      const data = await supplierService.get(id);
      setSupplier(data);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReceipts = useCallback(async () => {
    if (!id) return;
    setReceiptsLoading(true);
    try {
      const result = await warehouseImportReceiptService.getList({
        supplierId: id,
        skipCount: (page - 1) * pageSize,
        maxResultCount: pageSize,
        fromDate: dateRange?.[0]?.format("YYYY-MM-DD"),
        toDate: dateRange?.[1]?.format("YYYY-MM-DD"),
        sorting: "ActualImportDate desc",
      });
      setReceipts(result.items || []);
      setReceiptsTotal(result.totalCount || 0);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setReceiptsLoading(false);
    }
  }, [id, page, pageSize, dateRange]);

  useEffect(() => {
    loadSupplier();
  }, [loadSupplier]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleEditSave = async (data: CreateUpdateSupplierDto) => {
    if (!id) return;
    setEditModalLoading(true);
    try {
      await supplierService.update(id, data);
      message.success("Cập nhật nhà cung cấp thành công");
      setEditModalOpen(false);
      loadSupplier();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setEditModalLoading(false);
    }
  };

  const receiptColumns: ColumnsType<WarehouseImportReceiptListDto> = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Mã phiếu nhập kho",
      dataIndex: "code",
      key: "code",
      width: 170,
    },
    {
      title: "Phiếu mua hàng",
      dataIndex: "goodsReceiptCode",
      key: "goodsReceiptCode",
      width: 150,
    },
    {
      title: "Ngày nhập kho",
      dataIndex: "actualImportDate",
      key: "actualImportDate",
      width: 140,
      render: (v: string) => v ? dayjs(v).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (v: number) => (
        <Tag color={WarehouseImportReceiptStatusColors[v]}>
          {WarehouseImportReceiptStatusLabels[v]}
        </Tag>
      ),
    },
    {
      title: "Kho",
      dataIndex: "warehouseName",
      key: "warehouseName",
      width: 160,
      render: (v: string) => v || "-",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 60,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(PATH_ROUTES.warehouseImports.detail(record.id))}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p>Không tìm thấy nhà cung cấp</p>
          <Button type="link" onClick={() => navigate("/suppliers-management")}>Quay lại danh sách</Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: "0 12px" }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/suppliers-management")}
          type="link"
          style={{ paddingLeft: 0 }}
        >
          Chi tiết nhà cung cấp
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card className="list-card" title="Thông tin nhà cung cấp">
            <div style={{ padding: "4px 24px 16px" }}>
            <Tag color="blue" style={{ fontSize: 14, marginBottom: 16 }}>{supplier.code} (ID NCC)</Tag>

            <DetailItem label="Tên NCC" value={supplier.name} />
            <DetailItem label="Địa chỉ" value={supplier.address} />

            <Row gutter={16}>
              <Col span={12}>
                <DetailItem label="Mã số thuế" value={supplier.taxCode} />
              </Col>
              <Col span={12}>
                <DetailItem label="Người liên hệ" value={supplier.note} />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <DetailItem label="Số điện thoại" value={supplier.phone} />
              </Col>
              <Col span={12}>
                <DetailItem label="Email" value={supplier.email} />
              </Col>
            </Row>

            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditModalOpen(true)}
            >
              Chỉnh sửa
            </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            className="list-card supplier-history-card"
            title="Lịch sử nhập kho từ NCC"
            extra={
              <Space wrap>
                <span style={{ color: "#fff", fontWeight: 500 }}>Ngày nhập kho:</span>
                <RangePicker
                  format="DD/MM/YYYY"
                  value={dateRange}
                  onChange={(dates) => {
                    setDateRange(dates);
                    setPage(1);
                  }}
                  allowClear
                  style={{ maxWidth: 280 }}
                />
              </Space>
            }
          >
            <Table
              columns={receiptColumns}
              dataSource={receipts}
              rowKey="id"
              loading={receiptsLoading}
              size="small"
              scroll={{ x: 1000 }}
              pagination={{
                current: page,
                pageSize,
                total: receiptsTotal,
                showSizeChanger: true,
                pageSizeOptions: ["50", "100", "150"],
                showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]}/${total}`,
                onChange: (p, ps) => { setPage(p); setPageSize(ps); },
              }}
              onRow={(record) => ({
                onDoubleClick: () => navigate(PATH_ROUTES.warehouseImports.detail(record.id)),
                style: { cursor: "pointer" },
              })}
            />
          </Card>
        </Col>
      </Row>

      <SupplierModal
        open={editModalOpen}
        loading={editModalLoading}
        editingSupplier={supplier}
        onOk={handleEditSave}
        onCancel={() => setEditModalOpen(false)}
      />
    </div>
  );
};

export default SupplierDetail;
