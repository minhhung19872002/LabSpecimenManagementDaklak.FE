import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import {
  Card, Form, Input, Select, DatePicker, InputNumber, Button, Space, Row, Col,
  Table, message, Spin, Divider, Tag, Modal, AutoComplete,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
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
import { manufacturerService, ManufacturerDto } from "../../services/manufacturerService";
import { supplierService, SupplierDto, CreateUpdateSupplierDto } from "../../services/supplierService";
import { equipmentService, EquipmentListDto } from "../../services/equipmentService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { PaymentModal } from "./components";
import { PaymentFormData } from "./schemas";
import "../../styles/ListCard.css";

const SupplierModal = lazy(
  () => import("../Suppliers/components/SupplierModal")
);

interface EquipmentLineItem {
  key: string;
  id?: string;
  productName: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  manufacturerId?: string;
  supplierId: string;
  supplierName: string;
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
  const [manufacturers, setManufacturers] = useState<ManufacturerDto[]>([]);
  const [existingEquipments, setExistingEquipments] = useState<EquipmentListDto[]>([]);
  const [lineItems, setLineItems] = useState<EquipmentLineItem[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isCustomVat, setIsCustomVat] = useState(false);
  const [approving, setApproving] = useState(false);
  const [importing, setImporting] = useState(false);

  // Inline supplier creation modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierModalLoading, setSupplierModalLoading] = useState(false);
  // Track which line item the supplier is being created for (key), null means creating for a general add
  const [supplierModalTargetKey, setSupplierModalTargetKey] = useState<string | null>(null);

  const canApprove = authService.hasPermission(PERMISSIONS.GoodsReceipts.Approve);
  const canImport = authService.hasPermission(PERMISSIONS.GoodsReceipts.ImportToWarehouse);
  const canPay = authService.hasPermission(PERMISSIONS.GoodsReceipts.AddPayment);

  const isReadonly = receipt
    ? receipt.orderStatus === GoodsReceiptOrderStatus.Approved ||
      receipt.warehouseStatus === GoodsReceiptWarehouseStatus.Imported
    : false;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { },
  } = useForm<EquipmentReceiptFormData>({
    resolver: yupResolver(equipmentReceiptSchema) as any,
    defaultValues: {
      supplierId: undefined,
      supplierAddress: "",
      supplierPhone: "",
      purchaserName: "",
      deliveryNoteNumber: "",
      documentDate: "",
      documentExpiryDate: "",
      supplierRepresentativePhone: "",
      vatPercent: 8,
      notes: "",
    },
  });

  const defaultVat = watch("vatPercent") || 8;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        const [suppliersRes, manufacturerList, equipmentsRes] = await Promise.all([
          supplierService.getList({ limit: 1000 }),
          manufacturerService.getActive(),
          equipmentService.getList({ limit: 1000 }),
        ]);
        setSuppliers(suppliersRes.items || []);
        setManufacturers(manufacturerList || []);
        setExistingEquipments(equipmentsRes.items || []);

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
            purchaserName: receiptData.purchaserName || "",
            deliveryNoteNumber: receiptData.deliveryNoteNumber || "",
            documentDate: receiptData.documentDate || "",
            documentExpiryDate: receiptData.documentExpiryDate || "",
            supplierRepresentativePhone: receiptData.supplierRepresentativePhone || "",
            vatPercent: receiptData.vatPercent,
            notes: receiptData.notes || "",
          });

          setLineItems(
            receiptData.items.map((item, idx) => ({
              key: `existing-${idx}`,
              id: item.id,
              productName: item.productName,
              serialNumber: item.serialNumber || "",
              model: item.model || "",
              manufacturer: item.manufacturer || "",
              manufacturerId: item.manufacturerId,
              supplierId: item.supplierId || "",
              supplierName: item.supplierName || "",
              unitPrice: item.unitPrice,
              vatPercent: item.vatPercent,
              amountBeforeVat: item.amountBeforeVat,
              vatAmount: item.vatAmount,
              amountAfterVat: item.amountAfterVat,
            }))
          );

          const vatValues = receiptData.items.map((i) => i.vatPercent);
          const allSameVat = vatValues.length > 0 && vatValues.every((v) => v === vatValues[0]);
          setIsCustomVat(!allSameVat);
        } else {
          const userInfo = authService.getUserInfo();
          if (userInfo?.fullName) {
            reset((prev) => ({ ...prev, purchaserName: userInfo.fullName }));
          }
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
    return {
      ...item,
      amountBeforeVat,
      vatAmount,
      amountAfterVat: amountBeforeVat + vatAmount,
    };
  };

  const handleAddBlankRow = () => {
    const newItem: EquipmentLineItem = {
      key: `new-${Date.now()}`,
      productName: "",
      serialNumber: "",
      model: "",
      manufacturer: "",
      manufacturerId: undefined,
      supplierId: "",
      supplierName: "",
      unitPrice: 0,
      vatPercent: defaultVat,
      amountBeforeVat: 0,
      vatAmount: 0,
      amountAfterVat: 0,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const handleAddFromExisting = (equipmentId: string) => {
    const eq = existingEquipments.find((e) => e.id === equipmentId);
    if (!eq) return;
    const newItem: EquipmentLineItem = {
      key: `eq-${Date.now()}`,
      productName: eq.name,
      serialNumber: eq.serialNumber || "",
      model: eq.model || "",
      manufacturer: eq.manufacturer || "",
      manufacturerId: undefined,
      supplierId: "",
      supplierName: eq.supplierName || "",
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
    if (field === "vatPercent") {
      setIsCustomVat(true);
    }

    setLineItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };

        if (field === "supplierId") {
          const supplier = suppliers.find((s) => s.id === value);
          if (supplier) updated.supplierName = supplier.name;
        }

        return recalculateLine(updated);
      })
    );
  }, [suppliers]);

  const handleHeaderVatChange = (value: number | null) => {
    const vat = value || 0;
    setValue("vatPercent", vat);
    setLineItems((prev) => prev.map((item) => recalculateLine({ ...item, vatPercent: vat })));
  };

  const handleResetUniformVat = () => {
    setIsCustomVat(false);
    const currentVat = getValues("vatPercent") || 8;
    setLineItems((prev) => prev.map((item) => recalculateLine({ ...item, vatPercent: currentVat })));
  };

  const totalBeforeVat = lineItems.reduce((sum, item) => sum + item.amountBeforeVat, 0);
  const totalVat = lineItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalAfterVat = totalBeforeVat + totalVat;

  const manufacturerOptions = manufacturers.map((m) => ({
    value: m.name,
    label: m.name,
  }));

  const supplierOptions = suppliers
    .filter((s) => s.isActive)
    .map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));

  const existingEquipmentOptions = existingEquipments.map((e) => ({
    value: e.id,
    label: `${e.code} - ${e.name}${e.serialNumber ? ` (S/N: ${e.serialNumber})` : ""}`,
  }));

  const formatCurrency = (v: number) => v.toLocaleString("vi-VN");

  const buildPayload = (data: EquipmentReceiptFormData): CreateUpdateGoodsReceiptDto => ({
    receiptType: GoodsReceiptType.Equipment,
    supplierId: undefined,
    supplierAddress: data.supplierAddress || undefined,
    supplierPhone: data.supplierPhone || undefined,
    purchaserName: data.purchaserName || undefined,
    deliveryNoteNumber: data.deliveryNoteNumber || undefined,
    documentDate: data.documentDate || undefined,
    documentExpiryDate: data.documentExpiryDate || undefined,
    supplierRepresentativePhone: undefined,
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
        supplierId: item.supplierId || undefined,
      })),
  });

  const validateItems = (): boolean => {
    const validItems = lineItems.filter((item) => item.productName?.trim());
    if (validItems.length === 0) {
      message.warning("Vui lòng thêm ít nhất một thiết bị.");
      return false;
    }
    const missingSerial = validItems.find((item) => !item.serialNumber?.trim());
    if (missingSerial) {
      message.warning(`Thiết bị "${missingSerial.productName}" thiếu số serial.`);
      return false;
    }
    const missingSupplier = validItems.find((item) => !item.supplierId?.trim());
    if (missingSupplier) {
      message.warning(`Thiết bị "${missingSupplier.productName}" chưa chọn nhà cung cấp.`);
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
        message.success("Đã tạo phiếu nhập thiết bị");
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

  const handleApprove = handleSubmit(async (data) => {
    if (!validateItems()) return;
    setApproving(true);
    try {
      const payload = buildPayload(data);
      let receiptId = id;
      if (isEdit && id) {
        await goodsReceiptService.update(id, payload);
      } else {
        const result = await goodsReceiptService.create(payload);
        receiptId = result.id;
      }
      await goodsReceiptService.approve(receiptId!);
      message.success("Đã duyệt đơn");
      navigate(`/goods-receipts/${receiptId}`);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể duyệt đơn."));
    } finally {
      setApproving(false);
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

  const handleCreateSupplier = async (data: CreateUpdateSupplierDto) => {
    setSupplierModalLoading(true);
    try {
      const newSupplier = await supplierService.create(data);
      setSuppliers((prev) => [...prev, newSupplier]);
      // If triggered from a specific line item, auto-select the new supplier for that row
      if (supplierModalTargetKey) {
        setLineItems((prev) =>
          prev.map((item) => {
            if (item.key !== supplierModalTargetKey) return item;
            return recalculateLine({ ...item, supplierId: newSupplier.id, supplierName: newSupplier.name });
          })
        );
      }
      message.success("Đã tạo nhà cung cấp mới");
      setSupplierModalOpen(false);
      setSupplierModalTargetKey(null);
    } catch (error: any) {
      message.error(getApiErrorMessage(error, "Không thể tạo nhà cung cấp."));
    } finally {
      setSupplierModalLoading(false);
    }
  };

  const openSupplierModal = (lineKey: string) => {
    setSupplierModalTargetKey(lineKey);
    setSupplierModalOpen(true);
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
      width: 150,
      render: (_: any, record: EquipmentLineItem) =>
        isReadonly ? (record.serialNumber || "-") : (
          <Input
            value={record.serialNumber}
            placeholder="Số serial"
            onChange={(e) => handleLineChange(record.key, "serialNumber", e.target.value)}
            size="small"
            status={!record.serialNumber?.trim() ? "warning" : undefined}
          />
        ),
    },
    {
      title: "Tên thiết bị",
      key: "productName",
      width: 200,
      render: (_: any, record: EquipmentLineItem) =>
        isReadonly ? (record.productName || "-") : (
          <Input
            value={record.productName}
            placeholder="Tên thiết bị"
            onChange={(e) => handleLineChange(record.key, "productName", e.target.value)}
            size="small"
          />
        ),
    },
    {
      title: "Model",
      key: "model",
      width: 130,
      render: (_: any, record: EquipmentLineItem) =>
        isReadonly ? (record.model || "-") : (
          <Input
            value={record.model}
            placeholder="Model"
            onChange={(e) => handleLineChange(record.key, "model", e.target.value)}
            size="small"
          />
        ),
    },
    {
      title: "Nhà cung cấp",
      key: "supplierId",
      width: 200,
      render: (_: any, record: EquipmentLineItem) => {
        if (isReadonly) return record.supplierName || "-";
        return (
          <Select
            value={record.supplierId || undefined}
            placeholder="Chọn NCC"
            options={supplierOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onChange={(v) => handleLineChange(record.key, "supplierId", v)}
            style={{ width: "100%" }}
            size="small"
            status={!record.supplierId?.trim() ? "warning" : undefined}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "4px 0" }} />
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => openSupplierModal(record.key)}
                  style={{ width: "100%", textAlign: "left" }}
                  size="small"
                >
                  Tạo nhà cung cấp mới
                </Button>
              </>
            )}
          />
        );
      },
    },
    {
      title: "Hãng sản xuất",
      key: "manufacturer",
      width: 160,
      render: (_: any, record: EquipmentLineItem) => {
        if (isReadonly) return record.manufacturer || "-";
        return (
          <AutoComplete
            value={record.manufacturer || ""}
            options={manufacturerOptions.filter((o) =>
              o.value.toLowerCase().includes((record.manufacturer || "").toLowerCase())
            )}
            onSelect={(value) => {
              const m = manufacturers.find((x) => x.name === value);
              handleLineChange(record.key, "manufacturer", value);
              if (m) handleLineChange(record.key, "manufacturerId", m.id);
            }}
            onChange={(value) => {
              handleLineChange(record.key, "manufacturer", value);
              handleLineChange(record.key, "manufacturerId", undefined);
            }}
            placeholder="Nhập hãng SX"
            style={{ width: "100%" }}
            size="small"
          />
        );
      },
    },
    {
      title: "Thành tiền chưa VAT",
      key: "unitPrice",
      width: 180,
      render: (_: any, record: EquipmentLineItem) =>
        isReadonly ? `${formatCurrency(record.unitPrice)} VNĐ` : (
          <InputNumber
            value={record.unitPrice}
            min={0}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => Number(v?.replace(/,/g, "") || 0)}
            onChange={(v) => handleLineChange(record.key, "unitPrice", v || 0)}
            style={{ width: "100%" }}
            size="small"
            addonAfter="VNĐ"
          />
        ),
    },
    {
      title: "VAT",
      key: "vatPercent",
      width: 75,
      align: "center" as const,
      render: (_: any, record: EquipmentLineItem) =>
        isReadonly ? `${record.vatPercent}%` : (
          <InputNumber
            value={record.vatPercent}
            min={0}
            max={100}
            onChange={(v) => handleLineChange(record.key, "vatPercent", v || 0)}
            style={{ width: "100%" }}
            size="small"
            suffix="%"
          />
        ),
    },
    {
      title: "Thành tiền sau VAT",
      key: "amountAfterVat",
      width: 160,
      align: "right" as const,
      render: (_: any, record: EquipmentLineItem) => `${formatCurrency(record.amountAfterVat)} VNĐ`,
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
              <Form.Item label="Nhân viên mua hàng">
                <Controller
                  name="purchaserName"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="Nhân viên mua hàng" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Số phiếu giao hàng từ NCC">
                <Controller
                  name="deliveryNoteNumber"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="Số phiếu giao hàng" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Người lập phiếu">
                <Input value={receipt?.preparedByName || authService.getUserInfo()?.fullName || ""} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Thời gian tạo phiếu">
                <Input value={receipt ? dayjs(receipt.creationTime).format("HH:mm DD/MM/YYYY") : dayjs().format("HH:mm DD/MM/YYYY")} disabled style={{ backgroundColor: "#f5f5f5" }} />
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
                    <Input {...field} value={field.value || ""} placeholder="Địa chỉ nhà cung cấp" disabled={isReadonly} />
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
                    <Input {...field} value={field.value || ""} placeholder="Số điện thoại NCC" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="SĐT đại diện NCC">
                <Controller
                  name="supplierRepresentativePhone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} placeholder="SĐT đại diện" disabled={isReadonly} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="VAT (%)">
                {isCustomVat ? (
                  <Space.Compact style={{ width: "100%" }}>
                    <Input value="Tùy chọn theo thiết bị" disabled style={{ flex: 1 }} />
                    {!isReadonly && (
                      <Button onClick={handleResetUniformVat}>Đặt lại</Button>
                    )}
                  </Space.Compact>
                ) : (
                  <Controller
                    name="vatPercent"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        {...field}
                        onChange={(v) => handleHeaderVatChange(v as number)}
                        style={{ width: "100%" }}
                        min={0} max={100} suffix="%"
                        disabled={isReadonly}
                      />
                    )}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Ngày cấp chứng từ">
                <Controller
                  name="documentDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") || "")}
                      disabled={isReadonly}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Ngày hết hạn chứng từ">
                <Controller
                  name="documentExpiryDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") || "")}
                      disabled={isReadonly}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddBlankRow}
                >
                  Thêm thiết bị
                </Button>
                <Select
                  key={`eq-select-${lineItems.length}`}
                  placeholder="Chọn thiết bị đã có"
                  options={existingEquipmentOptions}
                  onSelect={(v) => handleAddFromExisting(v)}
                  style={{ width: 320 }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                />
              </div>
            )}
          </div>

          <Table
            columns={equipmentColumns}
            dataSource={lineItems}
            rowKey="key"
            pagination={false}
            scroll={{ x: 1400 }}
            size="small"
            bordered
            locale={{ emptyText: "Chưa có thiết bị" }}
          />

          <Row justify="end" style={{ padding: "12px 0" }}>
            <Col>
              <Space size={24}>
                <span>
                  Tổng chưa VAT:{" "}
                  <strong>{formatCurrency(totalBeforeVat)} VNĐ</strong>
                </span>
                <span>
                  Tổng thuế VAT:{" "}
                  <strong>{formatCurrency(totalVat)} VNĐ</strong>
                </span>
                <span>
                  Tổng tiền:{" "}
                  <strong style={{ color: "#1677ff", fontSize: 16 }}>
                    {formatCurrency(totalAfterVat)} VNĐ
                  </strong>
                </span>
              </Space>
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
          {/* Hủy phiếu / Quay lại */}
          {!isReadonly && (
            <Button onClick={() => navigate("/goods-receipts")}>
              {isEdit ? "Quay lại" : "Hủy phiếu"}
            </Button>
          )}
          {/* Lưu tạm (Draft) — ẩn khi edit phiếu đã lưu */}
          {!isReadonly && (!isEdit || receipt?.orderStatus === GoodsReceiptOrderStatus.Draft) && (
            <Button onClick={handleSaveDraft} loading={saving}>
              Lưu tạm
            </Button>
          )}
          {/* Lưu (Approve) */}
          {!isReadonly &&
            canApprove &&
            (!isEdit || receipt?.orderStatus === GoodsReceiptOrderStatus.Draft) && (
              <Button
                type="primary"
                onClick={handleApprove}
                loading={approving}
              >
                Lưu
              </Button>
            )}

          {/* Approved state: Thanh toán + Nhập kho */}
          {isEdit &&
            receipt &&
            canPay &&
            receipt.orderStatus === GoodsReceiptOrderStatus.Approved &&
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
            receipt.orderStatus === GoodsReceiptOrderStatus.Approved &&
            receipt.warehouseStatus === GoodsReceiptWarehouseStatus.NotImported && (
              <Button
                type="primary"
                loading={importing}
                onClick={() => {
                  Modal.confirm({
                    title: "Xác nhận nhập kho",
                    content:
                      "Bạn có chắc chắn muốn nhập kho phiếu này? Sau khi nhập kho sẽ không thể chỉnh sửa.",
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

          {/* Imported state: disabled indicator */}
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

      {/* Inline Supplier Creation Modal */}
      <Suspense fallback={null}>
        <SupplierModal
          open={supplierModalOpen}
          loading={supplierModalLoading}
          editingSupplier={null}
          onOk={handleCreateSupplier}
          onCancel={() => {
            setSupplierModalOpen(false);
            setSupplierModalTargetKey(null);
          }}
        />
      </Suspense>
    </div>
  );
};

export default GoodsReceiptEquipmentForm;
