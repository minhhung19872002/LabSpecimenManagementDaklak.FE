import React, { useState, useEffect, useCallback } from "react";
import {
  Card, Form, Input, Select, DatePicker, Button, Space, Row, Col,
  Table, message, Spin, Divider, Modal, Tag, Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import { equipmentReceiptSchema, EquipmentReceiptFormData } from "./schemas";
import {
  goodsReceiptService,
  GoodsReceiptDto,
  CreateUpdateGoodsReceiptDto,
  CreateUpdateGoodsReceiptItemDto,
  GoodsReceiptWarehouseStatus,
  GoodsReceiptOrderStatus,
  GoodsReceiptType,
} from "../../services/goodsReceiptService";
import { productService, ProductDto, ProductType } from "../../services/productService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { getApiErrorMessage } from "../../utils/errorHandler";
import "../../styles/ListCard.css";
import "./GoodsReceiptEquipmentForm.css";

const stripParagraphTags = (html: string) => html.replace(/<\/?p>/g, "");

interface EquipmentLineItem {
  key: string;
  id?: string;
  productName: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  manufacturerId?: string;
}

const GoodsReceiptEquipmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<GoodsReceiptDto | null>(null);
  const [equipmentProducts, setEquipmentProducts] = useState<ProductDto[]>([]);
  const [lineItems, setLineItems] = useState<EquipmentLineItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [previewCode, setPreviewCode] = useState<string>("");

  const canImport = authService.hasPermission(PERMISSIONS.GoodsReceipts.ImportToWarehouse);

  const isReadonly = receipt
    ? (receipt.orderStatus === GoodsReceiptOrderStatus.Ordering ||
        receipt.orderStatus === GoodsReceiptOrderStatus.WaitingReceipt) ||
      receipt.warehouseStatus === GoodsReceiptWarehouseStatus.Imported
    : false;

  const { control, handleSubmit, reset } = useForm<EquipmentReceiptFormData>({
    resolver: yupResolver(equipmentReceiptSchema) as any,
    defaultValues: {
      deliveryNoteNumber: "",
      expectedDeliveryDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        const productsRes = await productService.getList({ productType: ProductType.Equipment, limit: 1000 });
        setEquipmentProducts(productsRes.items || []);

        if (id) {
          const receiptData = await goodsReceiptService.get(id);
          if (receiptData.receiptType !== GoodsReceiptType.Equipment) {
            navigate(`/goods-receipts/edit/${id}`, { replace: true });
            return;
          }
          setReceipt(receiptData);
          reset({
            deliveryNoteNumber: receiptData.deliveryNoteNumber || "",
            expectedDeliveryDate: receiptData.expectedDeliveryDate || "",
            notes: receiptData.notes || "",
          });
          setLineItems(
            receiptData.items.map((item, idx) => ({
              key: `existing-${idx}`,
              id: item.id,
              productName: stripParagraphTags(item.productName),
              serialNumber: stripParagraphTags(item.serialNumber || ""),
              model: item.model || "",
              manufacturer: item.manufacturer || "",
              manufacturerId: item.manufacturerId,
            }))
          );
        } else {
          goodsReceiptService.getNextEquipmentCode().then(setPreviewCode).catch(() => {});
        }
      } catch {
        message.error("Không thể tải dữ liệu");
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, [id, reset, navigate]);

  const handleAddFromProduct = (productId: string) => {
    const p = equipmentProducts.find((x) => x.id === productId);
    if (!p) return;
    setLineItems((prev) => [
      ...prev,
      {
        key: `eq-${Date.now()}`,
        productName: stripParagraphTags(p.formattedName || p.name),
        serialNumber: stripParagraphTags(p.formattedIdentificationCode || p.identificationCode || ""),
        model: p.equipmentModel || "",
        manufacturer: p.manufacturer || "",
        manufacturerId: undefined,
      },
    ]);
  };

  const handleRemoveLine = useCallback((key: string) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const productOptions = equipmentProducts.map((p) => ({
    value: p.id,
    label: `${p.identificationCode || p.code} - ${p.name}`,
    htmlSerial: stripParagraphTags(p.formattedIdentificationCode || p.identificationCode || p.code),
    htmlName: stripParagraphTags(p.formattedName || p.name),
  }));

  const buildPayload = (data: EquipmentReceiptFormData): CreateUpdateGoodsReceiptDto => ({
    receiptType: GoodsReceiptType.Equipment,
    vatPercent: 0,
    deliveryNoteNumber: data.deliveryNoteNumber || undefined,
    expectedDeliveryDate: data.expectedDeliveryDate || undefined,
    notes: data.notes || undefined,
    items: lineItems
      .filter((item) => item.productName?.trim())
      .map((item): CreateUpdateGoodsReceiptItemDto => ({
        id: item.id,
        productName: item.productName,
        quantity: 1,
        unitPrice: 0,
        vatPercent: 0,
        isEquipment: true,
        serialNumber: item.serialNumber || undefined,
        model: item.model || undefined,
        manufacturer: item.manufacturer || undefined,
        manufacturerName: item.manufacturer || undefined,
        manufacturerId: item.manufacturerId || undefined,
      })),
  });

  const validateItems = (): boolean => {
    if (!lineItems.some((item) => item.productName?.trim())) {
      message.warning("Vui lòng thêm ít nhất một thiết bị.");
      return false;
    }
    return true;
  };

  const handleSaveDraft = handleSubmit(async (data) => {
    if (!validateItems()) return;
    setSaving(true);
    try {
      const payload = buildPayload(data);
      if (isEdit && id) {
        await goodsReceiptService.update(id, payload);
        message.success("Đã cập nhật phiếu nhập thiết bị");
      } else {
        const result = await goodsReceiptService.create(payload);
        if (previewCode && result.code !== previewCode) {
          message.success(`Đã tạo phiếu nhập thiết bị — Mã phiếu: ${result.code} (đã cập nhật do có phiếu khác được tạo trước)`);
        } else {
          message.success("Đã tạo phiếu nhập thiết bị");
        }
        navigate(`/goods-receipts/${result.id}`);
        return;
      }
      navigate(`/goods-receipts/${id}`);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể lưu phiếu."));
    } finally {
      setSaving(false);
    }
  });

  const handleImportToWarehouse = async () => {
    if (!id) return;
    setImporting(true);
    try {
      await goodsReceiptService.importToWarehouse(id);
      message.success("Đã nhập kho thành công");
      const updated = await goodsReceiptService.get(id);
      setReceipt(updated);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể nhập kho."));
    } finally {
      setImporting(false);
    }
  };

  const actionColumn = !isReadonly
    ? [
        {
          title: "",
          key: "action",
          width: 40,
          render: (_: any, record: EquipmentLineItem) => (
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={() => handleRemoveLine(record.key)}
            />
          ),
        },
      ]
    : [];

  const equipmentColumns = [
    {
      title: "STT",
      key: "index",
      width: 50,
      align: "center" as const,
      render: (_: any, __: EquipmentLineItem, index: number) => index + 1,
    },
    {
      title: "Serial Number",
      key: "serialNumber",
      width: 180,
      onCell: () => ({ style: { verticalAlign: "middle" } }),
      render: (_: any, record: EquipmentLineItem) => (
        <span dangerouslySetInnerHTML={{ __html: record.serialNumber || "-" }} style={{ fontSize: 13 }} />
      ),
    },
    {
      title: "Tên thiết bị",
      key: "productName",
      width: 220,
      onCell: () => ({ style: { verticalAlign: "middle" } }),
      render: (_: any, record: EquipmentLineItem) => (
        <span dangerouslySetInnerHTML={{ __html: record.productName || "-" }} style={{ fontSize: 13 }} />
      ),
    },
    {
      title: "Model",
      key: "model",
      width: 130,
      render: (_: any, record: EquipmentLineItem) => (
        <Typography.Text style={{ fontSize: 13 }}>{record.model || "-"}</Typography.Text>
      ),
    },
    {
      title: "Hãng sản xuất",
      key: "manufacturer",
      width: 160,
      render: (_: any, record: EquipmentLineItem) => (
        <Typography.Text style={{ fontSize: 13 }}>{record.manufacturer || "-"}</Typography.Text>
      ),
    },
    ...actionColumn,
  ];

  if (pageLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card
        className="list-card"
        title={
          <Space>
            {isEdit ? "Sửa phiếu nhập thiết bị" : "Tạo phiếu nhập thiết bị"}
            {receipt?.code && <Tag>{receipt.code}</Tag>}
          </Space>
        }
      >
        <Form layout="vertical" size="middle" style={{ padding: "0 16px" }}>
          <Row gutter={24}>
            <Col xs={24} sm={6}>
              <Form.Item label="Số phiếu giao hàng">
                <Input
                  value={receipt?.code || previewCode || ""}
                  placeholder="Tự động sinh khi lưu"
                  disabled
                  style={{ backgroundColor: "#f5f5f5" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item label="Ngày cần hàng dự kiến">
                <Controller
                  name="expectedDeliveryDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") || "")}
                      disabled={isReadonly}
                      disabledDate={(current) => current && current.isBefore(dayjs(), "day")}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Ghi chú">
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="Ghi chú" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider style={{ margin: "8px 0 16px" }} />

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ marginBottom: 12 }}>
            <strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>
              THÔNG TIN THIẾT BỊ
            </strong>
            {!isReadonly && (
              <Select
                key={`eq-select-${lineItems.length}`}
                placeholder="Chọn thiết bị từ danh mục"
                options={productOptions}
                onSelect={(v: any) => handleAddFromProduct(v)}
                style={{ width: 360 }}
                showSearch
                optionFilterProp="label"
                allowClear
                optionRender={(option) => (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span dangerouslySetInnerHTML={{ __html: (option.data as any).htmlSerial || "" }} />
                    <span>—</span>
                    <span dangerouslySetInnerHTML={{ __html: (option.data as any).htmlName || "" }} />
                  </span>
                )}
              />
            )}
          </div>

          <Table
            columns={equipmentColumns}
            dataSource={lineItems}
            rowKey="key"
            pagination={false}
            scroll={{ x: 650 }}
            size="small"
            bordered
            rootClassName="equipment-receipt-table"
            locale={{ emptyText: "Chưa có thiết bị" }}
          />
        </div>
      </Card>

      <Card
        style={{
          marginTop: 16,
          textAlign: "right",
          boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Space>
          {!isReadonly && (
            <Button onClick={() => navigate("/goods-receipts")}>
              {isEdit ? "Quay lại" : "Hủy phiếu"}
            </Button>
          )}
          {!isReadonly && (!isEdit || receipt?.orderStatus === GoodsReceiptOrderStatus.PendingApproval) && (
            <Button type="primary" onClick={handleSaveDraft} loading={saving}>
              Lưu
            </Button>
          )}
          {isEdit &&
            receipt &&
            canImport &&
            (receipt.orderStatus === GoodsReceiptOrderStatus.Ordering ||
              receipt.orderStatus === GoodsReceiptOrderStatus.WaitingReceipt) &&
            receipt.warehouseStatus === GoodsReceiptWarehouseStatus.NotImported && (
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
          {isEdit &&
            receipt &&
            receipt.warehouseStatus === GoodsReceiptWarehouseStatus.Imported && (
              <Button disabled>Đã nhập kho</Button>
            )}
        </Space>
      </Card>
    </div>
  );
};

export default GoodsReceiptEquipmentForm;
