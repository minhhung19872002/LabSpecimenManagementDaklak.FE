import React, { useState, useEffect, useCallback } from "react";
import {
  Card, Form, Input, Select, DatePicker, Button, Space, Row, Col,
  Table, message, Spin, Divider, Modal, Tag, Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { NumericFormat } from "react-number-format";
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
  GoodsReceiptPaymentStatus,
  GoodsReceiptType,
} from "../../services/goodsReceiptService";
import { supplierService, SupplierDto } from "../../services/supplierService";
import { employeeService, EmployeeDto } from "../../services/employeeService";
import { productService, ProductDto, ProductType } from "../../services/productService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { PaymentModal } from "./components";
import { PaymentFormData } from "./schemas";
import "../../styles/ListCard.css";
import "./GoodsReceiptEquipmentForm.css";

const stripParagraphTags = (html: string) => html.replace(/<\/?p>/g, "");

interface EquipmentLineItem {
  key: string;
  id?: string;
  productName: string;   // formattedName (HTML)
  serialNumber: string;  // formattedIdentificationCode (HTML)
  model: string;
  manufacturer: string;
  manufacturerId?: string;
  unitPrice: number;
  vatPercent: number;
  amountBeforeVat: number;
  vatAmount: number;
  amountAfterVat: number;
}

const GoodsReceiptEquipmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<GoodsReceiptDto | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [equipmentProducts, setEquipmentProducts] = useState<ProductDto[]>([]);
  const [lineItems, setLineItems] = useState<EquipmentLineItem[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewCode, setPreviewCode] = useState<string>("");

  const canImport = authService.hasPermission(PERMISSIONS.GoodsReceipts.ImportToWarehouse);
  const canPay = authService.hasPermission(PERMISSIONS.GoodsReceipts.AddPayment);

  const isReadonly = receipt
    ? (receipt.orderStatus === GoodsReceiptOrderStatus.Ordering ||
        receipt.orderStatus === GoodsReceiptOrderStatus.WaitingReceipt) ||
      receipt.warehouseStatus === GoodsReceiptWarehouseStatus.Imported
    : false;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { },
  } = useForm<EquipmentReceiptFormData>({
    resolver: yupResolver(equipmentReceiptSchema) as any,
    defaultValues: {
      supplierId: undefined,
      supplierAddress: "",
      supplierPhone: "",
      purchaserId: undefined,
      purchaserName: "",
      deliveryNoteNumber: "",
      documentDate: "",
      documentExpiryDate: "",
      expectedDeliveryDate: "",
      supplierRepresentativePhone: "",
      supplierRepresentativeName: "",
      vatPercent: 8,
      notes: "",
    },
  });

  const defaultVat = watch("vatPercent") || 8;

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        const [suppliersRes, employeesList, productsRes] = await Promise.all([
          supplierService.getList({ limit: 1000 }),
          employeeService.getList({ maxResultCount: 1000 }),
          productService.getList({ productType: ProductType.Equipment, limit: 1000 }),
        ]);
        setSuppliers(suppliersRes.items || []);
        setEmployees(employeesList.items || []);
        setEquipmentProducts(productsRes.items || []);

        if (id) {
          const receiptData = await goodsReceiptService.get(id);
          if (receiptData.receiptType !== GoodsReceiptType.Equipment) {
            navigate(`/goods-receipts/edit/${id}`, { replace: true });
            return;
          }
          setReceipt(receiptData);
          reset({
            supplierId: receiptData.supplierId || undefined,
            supplierAddress: receiptData.supplierAddress || "",
            supplierPhone: receiptData.supplierPhone || "",
            purchaserId: receiptData.purchaserId || undefined,
            purchaserName: receiptData.purchaserName || "",
            deliveryNoteNumber: receiptData.deliveryNoteNumber || "",
            documentDate: receiptData.documentDate || "",
            documentExpiryDate: receiptData.documentExpiryDate || "",
            expectedDeliveryDate: receiptData.expectedDeliveryDate || "",
            supplierRepresentativePhone: receiptData.supplierRepresentativePhone || "",
            supplierRepresentativeName: receiptData.supplierRepresentativeName || "",
            vatPercent: receiptData.vatPercent,
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
              unitPrice: item.unitPrice,
              vatPercent: item.vatPercent,
              amountBeforeVat: item.amountBeforeVat,
              vatAmount: item.vatAmount,
              amountAfterVat: item.amountAfterVat,
            }))
          );
        } else {
          const userInfo = authService.getUserInfo();
          if (userInfo) {
            const currentEmployee = employeesList.items?.find(
              (e) => e.username === userInfo.userName || e.email === userInfo.email
            );
            if (currentEmployee) {
              reset((prev) => ({ ...prev, purchaserId: currentEmployee.id }));
            }
          }
          goodsReceiptService.getNextEquipmentCode().then(setPreviewCode).catch(() => {});
        }
      } catch {
        message.error("Không thể tải dữ liệu");
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, [id, reset]);

  const recalculateLine = (item: EquipmentLineItem): EquipmentLineItem => {
    const amountBeforeVat = item.unitPrice;
    const vatAmount = amountBeforeVat * item.vatPercent / 100;
    return { ...item, amountBeforeVat, vatAmount, amountAfterVat: amountBeforeVat + vatAmount };
  };

  const handleAddFromProduct = (productId: string) => {
    const p = equipmentProducts.find((x) => x.id === productId);
    if (!p) return;
    const newItem: EquipmentLineItem = {
      key: `eq-${Date.now()}`,
      productName: stripParagraphTags(p.formattedName || p.name),
      serialNumber: stripParagraphTags(p.formattedIdentificationCode || p.identificationCode || ""),
      model: p.equipmentModel || "",
      manufacturer: p.manufacturer || "",
      manufacturerId: undefined,
      unitPrice: 0,
      vatPercent: defaultVat,
      amountBeforeVat: 0,
      vatAmount: 0,
      amountAfterVat: 0,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const handleRemoveLine = (key: string) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleLineChange = useCallback((key: string, field: keyof EquipmentLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        return recalculateLine({ ...item, [field]: value });
      })
    );
  }, []);

  const handleSupplierChange = useCallback(async (supplierId: string | null) => {
    if (!supplierId) {
      setValue("supplierAddress", "");
      setValue("supplierPhone", "");
      setValue("supplierRepresentativePhone", "");
      setValue("supplierRepresentativeName", "");
      return;
    }
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (supplier) {
      setValue("supplierAddress", supplier.address || "");
      setValue("supplierPhone", supplier.phone || "");
    }
    try {
      const info = await goodsReceiptService.getLatestSupplierInfo(supplierId);
      if (info.supplierRepresentativePhone) setValue("supplierRepresentativePhone", info.supplierRepresentativePhone);
      if (info.supplierRepresentativeName) setValue("supplierRepresentativeName", info.supplierRepresentativeName);
    } catch {
      // No previous receipt for this supplier
    }
  }, [suppliers, setValue]);

  const totalBeforeVat = lineItems.reduce((sum, item) => sum + item.amountBeforeVat, 0);

  const productOptions = equipmentProducts.map((p) => ({
    value: p.id,
    label: `${p.identificationCode || p.code} - ${p.name}`,
    htmlSerial: stripParagraphTags(p.formattedIdentificationCode || p.identificationCode || p.code),
    htmlName: stripParagraphTags(p.formattedName || p.name),
  }));

  const formatCurrency = (v: number) => v.toLocaleString("vi-VN");

  const buildPayload = (data: EquipmentReceiptFormData): CreateUpdateGoodsReceiptDto => ({
    receiptType: GoodsReceiptType.Equipment,
    supplierId: data.supplierId || undefined,
    supplierAddress: data.supplierAddress || undefined,
    supplierPhone: data.supplierPhone || undefined,
    purchaserId: data.purchaserId || undefined,
    purchaserName: data.purchaserName || undefined,
    deliveryNoteNumber: data.deliveryNoteNumber || undefined,
    documentDate: data.documentDate || undefined,
    documentExpiryDate: data.documentExpiryDate || undefined,
    expectedDeliveryDate: data.expectedDeliveryDate || undefined,
    supplierRepresentativePhone: data.supplierRepresentativePhone || undefined,
    supplierRepresentativeName: data.supplierRepresentativeName || undefined,
    vatPercent: data.vatPercent ?? 8,
    notes: data.notes || undefined,
    items: lineItems
      .filter((item) => item.productName?.trim())
      .map((item): CreateUpdateGoodsReceiptItemDto => ({
        id: item.id,
        productName: item.productName,
        quantity: 1,
        unitPrice: item.unitPrice,
        vatPercent: item.vatPercent,
        isEquipment: true,
        serialNumber: item.serialNumber || undefined,
        model: item.model || undefined,
        manufacturer: item.manufacturer || undefined,
        manufacturerName: item.manufacturer || undefined,
        manufacturerId: item.manufacturerId || undefined,
        supplierId: data.supplierId || undefined,
      })),
  });

  const validateItems = (): boolean => {
    const validItems = lineItems.filter((item) => item.productName?.trim());
    if (validItems.length === 0) {
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
        invoiceFiles: data.invoiceFiles ?? [],
      });
      message.success("Thanh toán thành công");
      setPaymentModalOpen(false);
      const updated = await goodsReceiptService.get(id);
      setReceipt(updated);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể thanh toán."));
    } finally {
      setPaymentLoading(false);
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
    {
      title: "Đơn giá dự kiến",
      key: "unitPrice",
      width: 160,
      render: (_: any, record: EquipmentLineItem) =>
        isReadonly ? `${formatCurrency(record.unitPrice)} VNĐ` : (
          <NumericFormat
            value={record.unitPrice}
            onValueChange={(values) => handleLineChange(record.key, "unitPrice", values.floatValue ?? 0)}
            allowNegative={false}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={3}
            customInput={Input}
            size="small"
            style={{ width: "100%" }}
            addonAfter="VNĐ"
          />
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
            <Col xs={24} sm={12} md={6}>
              <Controller
                name="supplierId"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Nhà cung cấp"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <Select
                      {...field}
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn nhà cung cấp"
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                      allowClear
                      onChange={(value) => {
                        field.onChange(value || null);
                        handleSupplierChange(value || null);
                      }}
                      options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Controller
                name="purchaserId"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Nhân viên mua hàng"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <Select
                      {...field}
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn nhân viên"
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                      allowClear
                      onChange={(value) => field.onChange(value || null)}
                      options={employees.map((e) => ({ value: e.id, label: e.fullName }))}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Thời gian tạo phiếu">
                <Input
                  value={receipt ? dayjs(receipt.creationTime).format("HH:mm DD/MM/YYYY") : dayjs().format("HH:mm DD/MM/YYYY")}
                  disabled
                  style={{ backgroundColor: "#f5f5f5" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Số phiếu giao hàng">
                <Input
                  value={receipt?.code || previewCode || ""}
                  placeholder="Tự động sinh khi lưu"
                  disabled
                  style={{ backgroundColor: "#f5f5f5" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Địa chỉ NCC">
                <Controller
                  name="supplierAddress"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} disabled />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="SĐT NCC">
                <Controller
                  name="supplierPhone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} disabled />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Controller
                name="supplierRepresentativeName"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="Tên người đại diện NCC"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Tên người đại diện"
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Controller
                name="supplierRepresentativePhone"
                control={control}
                render={({ field, fieldState }) => (
                  <Form.Item
                    label="SĐT người đại diện NCC"
                    required
                    validateStatus={fieldState.error ? "error" : undefined}
                    help={fieldState.error?.message}
                  >
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="SĐT người đại diện"
                      disabled={isReadonly}
                      status={fieldState.error ? "error" : undefined}
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
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
            <Col xs={24} sm={12} md={18}>
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

        {/* Equipment items */}
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
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
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
            scroll={{ x: 950 }}
            size="small"
            bordered
            rootClassName="equipment-receipt-table"
            locale={{ emptyText: "Chưa có thiết bị" }}
          />

          <Row justify="end" style={{ padding: "12px 0" }}>
            <Col>
              <span>
                Tổng dự toán:{" "}
                <strong style={{ color: "#1677ff", fontSize: 16 }}>
                  {formatCurrency(totalBeforeVat)} VNĐ
                </strong>
              </span>
            </Col>
          </Row>
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
            canPay &&
            (receipt.orderStatus === GoodsReceiptOrderStatus.Ordering ||
              receipt.orderStatus === GoodsReceiptOrderStatus.WaitingReceipt) &&
            receipt.paymentStatus !== GoodsReceiptPaymentStatus.Paid &&
            receipt.totalAmountAfterVat - receipt.totalPaid > 0 && (
              <Button
                onClick={() => setPaymentModalOpen(true)}
                style={{ borderColor: "#52c41a", color: "#52c41a" }}
              >
                Thanh toán
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

      {receipt && (
        <PaymentModal
          open={paymentModalOpen}
          loading={paymentLoading}
          totalAmount={receipt.totalAmountAfterVat}
          totalPaid={receipt.totalPaid}
          onOk={handlePaymentOk}
          onCancel={() => setPaymentModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GoodsReceiptEquipmentForm;
