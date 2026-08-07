import React, { useState, useEffect, useCallback } from "react";
import {
  Card, Button, Space, Table, Select, DatePicker, Input, Collapse,
  message, Spin, Popconfirm, Tag, Empty,
} from "antd";
import {
  DeleteOutlined, ArrowLeftOutlined,
  SaveOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { NumericFormat } from "react-number-format";
import {
  stockAdjustmentService,
  StockAdjustmentDto,
  StockAdjustmentStatus,
  CreateUpdateStockAdjustmentDto,
} from "../../services/stockAdjustmentService";
import { productService, ProductDto } from "../../services/productService";
import { warehouseService, WarehouseDto } from "../../services/masterDataService";
import { authService } from "../../services/authService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { PATH_ROUTES } from "../../constants/routes";
import "../../styles/ListCard.css";

interface WarehouseSection {
  warehouseId: string;
  warehouseName: string;
  products: ProductDto[];
  loading: boolean;
  items: InventoryItem[];
}

interface InventoryItem {
  productId: string;
  actualQuantity: number | null;
  actualUnitId: string;
  reason: string;
}

const StockInventoryForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const isView = (!!id && !location.pathname.includes("/edit/")) ||
    location.state?.mode === "view";

  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [adjustment, setAdjustment] = useState<StockAdjustmentDto | null>(null);

  const [inventoryDate, setInventoryDate] = useState<dayjs.Dayjs>(dayjs());
  const [notes, setNotes] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [sections, setSections] = useState<WarehouseSection[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const isReadonly = isView || adjustment?.status === StockAdjustmentStatus.Confirmed;

  useEffect(() => {
    const init = async () => {
      try {
        const whs = await warehouseService.getActiveForUser();
        setWarehouses(whs);
      } catch {
        message.error("Không thể tải dữ liệu khởi tạo");
      }

      const user = authService.getUserInfo();
      if (user) {
        setCurrentUserName(user.fullName || user.userName);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (id) {
      loadAdjustment(id);
    }
  }, [id]);

  useEffect(() => {
    if (!id && warehouses.length > 0) {
      const stateWarehouseId = (location.state?.warehouseId || searchParams.get("warehouseId")) as string | undefined;
      if (stateWarehouseId) {
        const wh = warehouses.find(w => w.id === stateWarehouseId);
        if (wh) {
          addWarehouseSection(wh);
        }
      }
    }
  }, [warehouses, id]);

  const loadAdjustment = async (adjustmentId: string) => {
    setPageLoading(true);
    try {
      const data = await stockAdjustmentService.get(adjustmentId);
      setAdjustment(data);
      setInventoryDate(dayjs(data.inventoryDate));
      setNotes(data.notes || "");

      const warehouseIds = [...new Set(
        data.items.filter(i => i.warehouseId).map(i => i.warehouseId!)
      )];

      const newSections: WarehouseSection[] = [];
      for (const whId of warehouseIds) {
        const whItems = data.items.filter(i => i.warehouseId === whId);
        const warehouseName = whItems[0]?.warehouseName || "";

        let products: ProductDto[] = [];
        try {
          const result = await productService.getList({
            warehouseId: whId,
            limit: 500,
          });
          products = result.items;
        } catch { /* fallback empty */ }

        const items: InventoryItem[] = products.map(p => {
          const existing = whItems.find(i => i.productId === p.id);
          return {
            productId: p.id,
            actualQuantity: existing?.actualQuantity ?? null,
            actualUnitId: existing?.actualUnitId || p.volumeUnitId || p.baseUnitId,
            reason: existing?.reason || "",
          };
        });

        newSections.push({
          warehouseId: whId,
          warehouseName,
          products,
          loading: false,
          items,
        });
      }

      setSections(newSections);
      setActiveKeys(warehouseIds);
    } catch {
      message.error("Không thể tải phiếu kiểm kê");
    } finally {
      setPageLoading(false);
    }
  };

  const addWarehouseSection = async (warehouse: WarehouseDto) => {
    if (sections.some(s => s.warehouseId === warehouse.id)) {
      message.warning("Kho đã được thêm");
      return;
    }

    const newSection: WarehouseSection = {
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      products: [],
      loading: true,
      items: [],
    };

    setSections(prev => [...prev, newSection]);
    setActiveKeys(prev => [...prev, warehouse.id]);

    try {
      const result = await productService.getList({
        warehouseId: warehouse.id,
        limit: 500,
      });

      const items: InventoryItem[] = result.items.map(p => ({
        productId: p.id,
        actualQuantity: null,
        actualUnitId: p.volumeUnitId || p.baseUnitId,
        reason: "",
      }));

      setSections(prev => prev.map(s =>
        s.warehouseId === warehouse.id
          ? { ...s, products: result.items, items, loading: false }
          : s
      ));
    } catch {
      message.error(`Không thể tải vật tư cho kho ${warehouse.name}`);
      setSections(prev => prev.map(s =>
        s.warehouseId === warehouse.id ? { ...s, loading: false } : s
      ));
    }
  };

  const removeWarehouseSection = (warehouseId: string) => {
    setSections(prev => prev.filter(s => s.warehouseId !== warehouseId));
    setActiveKeys(prev => prev.filter(k => k !== warehouseId));
  };

  const updateItem = useCallback((
    warehouseId: string,
    productId: string,
    field: keyof InventoryItem,
    value: any,
  ) => {
    setSections(prev => prev.map(s => {
      if (s.warehouseId !== warehouseId) return s;
      return {
        ...s,
        items: s.items.map(item =>
          item.productId === productId ? { ...item, [field]: value } : item
        ),
      };
    }));
  }, []);

  const convertExpectedToActualUnit = (product: ProductDto, actualUnitId: string | undefined): number | undefined => {
    const expected = product.expectedStockConsumable;
    if (!expected && expected !== 0) return undefined;
    if (!actualUnitId || actualUnitId === product.volumeUnitId) return expected;
    if (actualUnitId === product.baseUnitId && product.volumePerUnit && product.volumePerUnit > 0) {
      return expected / product.volumePerUnit;
    }
    return expected;
  };

  const buildPayload = (): CreateUpdateStockAdjustmentDto => {
    const allItems = sections.flatMap(s =>
      s.items
        .filter(item => item.actualQuantity !== null && item.actualQuantity !== undefined)
        .map(item => {
          const product = s.products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            actualQuantity: item.actualQuantity!,
            warehouseId: s.warehouseId,
            actualUnitId: item.actualUnitId || undefined,
            reason: item.reason || undefined,
            expectedStock: product ? convertExpectedToActualUnit(product, item.actualUnitId) : undefined,
          };
        })
    );

    return {
      notes: notes || undefined,
      inventoryDate: inventoryDate.toISOString(),
      items: allItems,
    };
  };

  const handleSaveDraft = async () => {
    const payload = buildPayload();
    if (payload.items.length === 0) {
      message.warning("Vui lòng nhập số lượng thực tế cho ít nhất một vật tư");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && adjustment) {
        await stockAdjustmentService.update(adjustment.id, payload);
        message.success("Cập nhật phiếu thành công");
        navigate(PATH_ROUTES.stockAdjustments.detail(adjustment.id), { replace: true });
      } else {
        const created = await stockAdjustmentService.create(payload);
        message.success("Tạo phiếu kiểm kê thành công");
        navigate(PATH_ROUTES.stockAdjustments.detail(created.id), { replace: true });
      }
    } catch (err) {
      message.error(getApiErrorMessage(err, "Không thể lưu phiếu"));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    const payload = buildPayload();
    if (payload.items.length === 0) {
      message.warning("Vui lòng nhập số lượng thực tế cho ít nhất một vật tư");
      return;
    }

    setConfirming(true);
    try {
      let adjustmentId = adjustment?.id;

      if (isEdit && adjustment) {
        await stockAdjustmentService.update(adjustment.id, payload);
      } else {
        const created = await stockAdjustmentService.create(payload);
        adjustmentId = created.id;
      }

      await stockAdjustmentService.confirm(adjustmentId!);
      message.success("Xác nhận kiểm kê và cập nhật tồn kho thành công");
      navigate(PATH_ROUTES.stockAdjustments.detail(adjustmentId!), { replace: true });
    } catch (err) {
      message.error(getApiErrorMessage(err, "Không thể xác nhận phiếu"));
    } finally {
      setConfirming(false);
    }
  };

  const getUnitOptions = (product: ProductDto) => {
    const options: { value: string; label: string }[] = [];
    if (product.volumeUnitId && product.volumeUnitName) {
      options.push({ value: product.volumeUnitId, label: product.volumeUnitName });
    }
    if (product.baseUnitId && product.baseUnitName) {
      options.push({ value: product.baseUnitId, label: product.baseUnitName });
    }
    if (product.packagingUnitId && product.packagingUnitName
      && !options.some(o => o.value === product.packagingUnitId)) {
      options.push({ value: product.packagingUnitId, label: product.packagingUnitName });
    }
    return options;
  };

  const formatStock = (product: ProductDto) => {
    const qty = product.availableQuantity;
    const storageUnit = product.packagingUnitName || "";
    const intPart = Math.floor(qty);
    const decPart = qty - intPart;

    if (decPart === 0 || !product.volumePerUnit || !product.volumeUnitName) {
      return `${qty} ${storageUnit}`.trim();
    }

    const consumableAmount = Math.round(decPart * product.volumePerUnit);
    return `${intPart} ${storageUnit} - ${consumableAmount} ${product.volumeUnitName}`;
  };

  const computeDifference = (product: ProductDto, item: InventoryItem) => {
    if (item.actualQuantity === null || item.actualQuantity === undefined) return null;

    const expectedInActualUnit = convertExpectedToActualUnit(product, item.actualUnitId);
    if (expectedInActualUnit === undefined) return null;

    return item.actualQuantity - expectedInActualUnit;
  };

  const renderWarehouseTable = (section: WarehouseSection) => {
    if (section.loading) {
      return <Spin tip="Đang tải vật tư..." />;
    }

    if (section.products.length === 0) {
      return <Empty description="Không có vật tư trong kho này" />;
    }

    const columns = [
      {
        title: "Tên vật tư",
        dataIndex: "name",
        width: 200,
        ellipsis: true,
      },
      {
        title: "Phân loại",
        dataIndex: "productType",
        width: 100,
        render: (type: number) => {
          const labels: Record<number, string> = {
            0: "Hóa chất", 1: "Sinh phẩm", 2: "VT tiêu hao",
            3: "Chất chuẩn", 4: "Dung môi", 5: "Thiết bị", 6: "DD pha",
          };
          return labels[type] || "-";
        },
      },
      {
        title: "Tồn kho",
        width: 160,
        align: "right" as const,
        render: (_: any, record: ProductDto) => formatStock(record),
      },
      {
        title: "Số lượng (đơn vị)",
        width: 160,
        align: "right" as const,
        render: (_: any, record: ProductDto) => {
          if (record.consumableImportedQuantity > 0 && record.volumeUnitName) {
            return `${record.consumableImportedQuantity.toLocaleString("vi-VN")} ${record.volumeUnitName}`;
          }
          return `${record.storageAvailableQuantity} ${record.baseUnitName || ""}`.trim();
        },
      },
      {
        title: "Tiêu hao LT",
        width: 130,
        align: "right" as const,
        render: (_: any, record: ProductDto) => {
          if (!record.theoreticalConsumption) return "-";
          const unit = record.volumeUnitName || record.baseUnitName || "";
          return `${record.theoreticalConsumption.toLocaleString("vi-VN")} ${unit}`.trim();
        },
      },
      {
        title: "Tồn kho dự kiến",
        width: 180,
        align: "right" as const,
        render: (_: any, record: ProductDto) => {
          const expected = record.expectedStockConsumable;
          if (!record.consumableImportedQuantity && !expected) return "-";

          const storageUnit = record.packagingUnitName || "";
          const volumeUnit = record.volumeUnitName || "";

          if (record.volumePerUnit && record.volumePerUnit > 0 && volumeUnit) {
            const volumeLine = `${expected.toLocaleString("vi-VN")} ${volumeUnit}`;
            if (expected < 0) {
              return (
                <div style={{ color: "#ff4d4f" }}>
                  <div>{volumeLine}</div>
                </div>
              );
            }
            const expectedBase = expected / record.volumePerUnit;
            const intPart = Math.floor(expectedBase);
            const decPart = expectedBase - intPart;
            const packagingLine = decPart === 0
              ? `${expectedBase.toLocaleString("vi-VN")} ${storageUnit}`
              : `${intPart.toLocaleString("vi-VN")} ${storageUnit} - ${Math.round(decPart * record.volumePerUnit).toLocaleString("vi-VN")} ${volumeUnit}`;
            return (
              <div>
                <div>{packagingLine}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{volumeLine}</div>
              </div>
            );
          }

          const unit = volumeUnit || record.baseUnitName || "";
          return `${expected.toLocaleString("vi-VN")} ${unit}`.trim();
        },
      },
      {
        title: "Số lượng thực tế",
        width: 220,
        render: (_: any, record: ProductDto) => {
          const item = section.items.find(i => i.productId === record.id);
          if (!item) return null;
          const unitOptions = getUnitOptions(record);

          return (
            <Space.Compact style={{ width: "100%" }}>
              <NumericFormat
                value={item.actualQuantity ?? ""}
                onValueChange={(values) => {
                  updateItem(section.warehouseId, record.id, "actualQuantity", values.floatValue ?? null);
                }}
                allowNegative={false}
                decimalScale={2}
                thousandSeparator="."
                decimalSeparator=","
                customInput={Input}
                style={{ flex: 1 }}
                placeholder="Nhập SL"
                disabled={isReadonly}
              />
              <Select
                value={item.actualUnitId}
                onChange={(v) => updateItem(section.warehouseId, record.id, "actualUnitId", v)}
                options={unitOptions}
                style={{ width: 90 }}
                disabled={isReadonly}
              />
            </Space.Compact>
          );
        },
      },
      {
        title: "Chênh lệch",
        width: 140,
        align: "right" as const,
        render: (_: any, record: ProductDto) => {
          const item = section.items.find(i => i.productId === record.id);
          if (!item) return null;
          const diff = computeDifference(record, item);
          if (diff === null) return "-";

          const unit = record.volumeUnitName || record.baseUnitName || "";
          const color = diff > 0 ? "#52c41a" : diff < 0 ? "#ff4d4f" : undefined;
          const sign = diff > 0 ? "+" : "";
          const expected = record.expectedStockConsumable;
          const pct = expected !== 0 ? ((diff / expected) * 100).toFixed(1) : null;

          return (
            <div style={{ color, fontWeight: diff !== 0 ? 600 : undefined }}>
              <div>{sign}{diff.toLocaleString("vi-VN")} {unit}</div>
              {pct !== null && <div style={{ fontSize: 12 }}>{sign}{pct}%</div>}
            </div>
          );
        },
      },
      {
        title: "Lý do",
        width: 180,
        render: (_: any, record: ProductDto) => {
          const item = section.items.find(i => i.productId === record.id);
          if (!item) return null;

          return (
            <Input.TextArea
              value={item.reason}
              onChange={(e) => updateItem(section.warehouseId, record.id, "reason", e.target.value)}
              rows={1}
              maxLength={1000}
              placeholder="Lý do"
              disabled={isReadonly}
              style={{ resize: "none" }}
            />
          );
        },
      },
    ];

    return (
      <Table
        dataSource={section.products}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 1400 }}
      />
    );
  };

  const availableWarehouses = warehouses.filter(
    w => !sections.some(s => s.warehouseId === w.id)
  );

  if (pageLoading) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  const handleGoBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          Quay lại
        </Button>
      </div>

      <Card
        className="list-card"
        title={
          <Space>
            {isView
              ? `Chi tiết phiếu kiểm kê ${adjustment?.code || ""}`
              : isEdit
                ? `Sửa phiếu kiểm kê ${adjustment?.code || ""}`
                : "Tạo phiếu kiểm kê kho"}
            {adjustment?.status === StockAdjustmentStatus.Confirmed && (
              <Tag color="green">Đã xác nhận</Tag>
            )}
          </Space>
        }
      >
        <div style={{ padding: "0 16px 16px" }}>
          {/* Header form */}
          <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>Ngày kiểm kê</div>
              <DatePicker
                value={inventoryDate}
                onChange={(d) => d && setInventoryDate(d)}
                format="DD/MM/YYYY"
                disabledDate={(d) => d.isAfter(dayjs())}
                disabled={isReadonly}
                style={{ width: 180 }}
              />
            </div>
            <div>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>Nhân viên kiểm kê</div>
              <Input
                value={adjustment?.inventoryUserName || currentUserName}
                disabled
                style={{ width: 220 }}
              />
            </div>
            {(isEdit || isView) && adjustment && (
              <div>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>Mã phiếu</div>
                <Input value={adjustment.code} disabled style={{ width: 220 }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>Ghi chú</div>
              <Input.TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
                maxLength={2000}
                disabled={isReadonly}
                placeholder="Ghi chú phiếu kiểm kê..."
                style={{ resize: "none" }}
              />
            </div>
          </div>

          {/* Warehouse selector */}
          {!isReadonly && (
            <div style={{ marginBottom: 16 }}>
              <Space>
                <span style={{ fontWeight: 500 }}>Thêm kho kiểm kê:</span>
                <Select
                  placeholder="Chọn kho"
                  style={{ width: 250 }}
                  options={availableWarehouses.map(w => ({
                    value: w.id,
                    label: w.name,
                  }))}
                  onChange={(whId) => {
                    const wh = warehouses.find(w => w.id === whId);
                    if (wh) addWarehouseSection(wh);
                  }}
                  value={undefined}
                  notFoundContent="Không còn kho nào"
                />
              </Space>
            </div>
          )}

          {/* Warehouse sections */}
          {sections.length === 0 ? (
            <Empty
              description="Chưa có kho nào được chọn. Vui lòng thêm kho để bắt đầu kiểm kê."
              style={{ margin: "40px 0" }}
            />
          ) : (
            <Collapse
              activeKey={activeKeys}
              onChange={(keys) => setActiveKeys(keys as string[])}
              items={sections.map(section => ({
                key: section.warehouseId,
                label: (
                  <Space>
                    <span style={{ fontWeight: 600 }}>{section.warehouseName}</span>
                    <Tag>{section.products.length} vật tư</Tag>
                  </Space>
                ),
                extra: !isReadonly && (
                  <Popconfirm
                    title="Xóa kho này khỏi phiếu kiểm kê?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      removeWarehouseSection(section.warehouseId);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                ),
                children: renderWarehouseTable(section),
              }))}
            />
          )}

          {/* Footer buttons */}
          {!isReadonly && (
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button onClick={handleGoBack}>
                Hủy
              </Button>
              <Button
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSaveDraft}
                disabled={confirming}
              >
                Lưu nháp
              </Button>
              <Popconfirm
                title="Xác nhận kiểm kê?"
                description="Sau khi xác nhận, tồn kho sẽ được cập nhật và không thể hoàn tác."
                onConfirm={handleConfirm}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={confirming}
                  disabled={saving}
                >
                  Xác nhận và cập nhật tồn kho
                </Button>
              </Popconfirm>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StockInventoryForm;
