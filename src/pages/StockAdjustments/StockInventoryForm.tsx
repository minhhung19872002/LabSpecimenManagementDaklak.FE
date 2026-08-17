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
  WarehouseProductLotDto,
} from "../../services/stockAdjustmentService";
import { ProductTypeLabels } from "../../services/productService";
import { warehouseService, WarehouseDto } from "../../services/masterDataService";
import { authService } from "../../services/authService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { PATH_ROUTES } from "../../constants/routes";
import { formatStockPackaging, formatConsumption, renderExpectedStock } from "./utils";
import "../../styles/ListCard.css";

interface WarehouseSection {
  warehouseId: string;
  warehouseName: string;
  lots: WarehouseProductLotDto[];
  loading: boolean;
  items: InventoryItem[];
}

interface InventoryItem {
  productId: string;
  lotNumber: string | null;
  manufacturerName: string | null;
  actualQuantityStorage: number | null;
  actualQuantityConsumable: number | null;
  reason: string;
}

function lotKey(productId: string, lotNumber: string | null): string {
  return `${productId}::${lotNumber ?? ""}`;
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

        let lots: WarehouseProductLotDto[] = [];
        try {
          lots = await stockAdjustmentService.getWarehouseProductLots(whId);
        } catch { /* fallback empty */ }

        const items: InventoryItem[] = lots.map(lot => {
          const existing = whItems.find(i =>
            i.productId === lot.productId && (i.lotNumber ?? "") === (lot.lotNumber ?? "")
          );
          if (!existing) {
            return {
              productId: lot.productId,
              lotNumber: lot.lotNumber,
              manufacturerName: lot.manufacturerName,
              actualQuantityStorage: null,
              actualQuantityConsumable: null,
              reason: "",
            };
          }

          const hasVolume = lot.volumePerUnit && lot.volumePerUnit > 0;
          let storage: number | null = null;
          let consumable: number | null = null;

          if (hasVolume && (!existing.actualUnitId || existing.actualUnitId === lot.volumeUnitId)) {
            storage = Math.floor(existing.actualQuantity / lot.volumePerUnit!);
            consumable = Math.round((existing.actualQuantity - storage * lot.volumePerUnit!) * 100) / 100;
          } else {
            storage = existing.actualQuantity;
          }

          return {
            productId: lot.productId,
            lotNumber: lot.lotNumber,
            manufacturerName: lot.manufacturerName,
            actualQuantityStorage: storage,
            actualQuantityConsumable: consumable,
            reason: existing.reason || "",
          };
        });

        newSections.push({
          warehouseId: whId,
          warehouseName,
          lots,
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
      lots: [],
      loading: true,
      items: [],
    };

    setSections(prev => [...prev, newSection]);
    setActiveKeys(prev => [...prev, warehouse.id]);

    try {
      const lots = await stockAdjustmentService.getWarehouseProductLots(warehouse.id);

      const items: InventoryItem[] = lots.map(lot => ({
        productId: lot.productId,
        lotNumber: lot.lotNumber,
        manufacturerName: lot.manufacturerName,
        actualQuantityStorage: null,
        actualQuantityConsumable: null,
        reason: "",
      }));

      setSections(prev => prev.map(s =>
        s.warehouseId === warehouse.id
          ? { ...s, lots, items, loading: false }
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
    lotNumber: string | null,
    field: keyof InventoryItem,
    value: any,
  ) => {
    setSections(prev => prev.map(s => {
      if (s.warehouseId !== warehouseId) return s;
      return {
        ...s,
        items: s.items.map(item =>
          item.productId === productId && (item.lotNumber ?? "") === (lotNumber ?? "")
            ? { ...item, [field]: value }
            : item
        ),
      };
    }));
  }, []);

  const combineActualQuantity = (lot: WarehouseProductLotDto, item: InventoryItem): number | null => {
    const hasStorage = item.actualQuantityStorage !== null;
    const hasConsumable = item.actualQuantityConsumable !== null;
    if (!hasStorage && !hasConsumable) return null;

    const hasVolume = lot.volumePerUnit && lot.volumePerUnit > 0 && lot.volumeUnitId;
    if (hasVolume) {
      return (item.actualQuantityStorage ?? 0) * lot.volumePerUnit! + (item.actualQuantityConsumable ?? 0);
    }
    return item.actualQuantityStorage ?? 0;
  };

  const buildPayload = (): CreateUpdateStockAdjustmentDto => {
    const allItems = sections.flatMap(s =>
      s.items.map(item => {
        const lot = s.lots.find(l =>
          l.productId === item.productId && (l.lotNumber ?? "") === (item.lotNumber ?? "")
        );
        const hasVolume = lot && lot.volumePerUnit && lot.volumePerUnit > 0 && lot.volumeUnitId;

        const combined = lot ? combineActualQuantity(lot, item) : null;
        const expectedStock = lot ? lot.consumableQuantity - (lot.theoreticalConsumption || 0) : 0;
        const actualQuantity = combined ?? expectedStock;
        const actualUnitId = hasVolume ? lot.volumeUnitId : lot?.baseUnitId || undefined;

        return {
          productId: item.productId,
          actualQuantity,
          warehouseId: s.warehouseId,
          actualUnitId: actualUnitId || undefined,
          reason: item.reason || undefined,
          expectedStock: lot ? expectedStock : undefined,
          lotNumber: item.lotNumber || undefined,
          manufacturerName: item.manufacturerName || undefined,
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
    if (sections.length === 0) {
      message.warning("Vui lòng thêm ít nhất một kho để kiểm kê");
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
    if (sections.length === 0) {
      message.warning("Vui lòng thêm ít nhất một kho để kiểm kê");
      return;
    }
    const payload = buildPayload();

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

  const computeDifference = (lot: WarehouseProductLotDto, item: InventoryItem) => {
    const actual = combineActualQuantity(lot, item);
    if (actual === null) return null;

    const expected = lot.consumableQuantity - (lot.theoreticalConsumption || 0);
    if (!expected && expected !== 0) return null;

    return actual - expected;
  };

  const renderWarehouseTable = (section: WarehouseSection) => {
    if (section.loading) {
      return <Spin tip="Đang tải vật tư..." />;
    }

    if (section.lots.length === 0) {
      return <Empty description="Không có vật tư trong kho này" />;
    }

    const columns = [
      {
        title: "Tên vật tư",
        dataIndex: "productName",
        width: 200,
        ellipsis: true,
      },
      {
        title: "Phân loại",
        dataIndex: "productType",
        width: 100,
        render: (type: number) => ProductTypeLabels[type as keyof typeof ProductTypeLabels] || "-",
      },
      {
        title: "Số lô",
        dataIndex: "lotNumber",
        width: 120,
        ellipsis: true,
        render: (v: string | null) => v || "-",
      },
      {
        title: "Hãng sản xuất",
        dataIndex: "manufacturerName",
        width: 140,
        ellipsis: true,
        render: (v: string | null) => v || "-",
      },
      {
        title: "Tồn kho đầu kỳ",
        width: 160,
        align: "right" as const,
        render: (_: any, record: WarehouseProductLotDto) => {
          return formatStockPackaging(record.remainingBaseQuantity, record);
        },
      },
      {
        title: "Tồn kho đầu kỳ (số lượng)",
        width: 160,
        align: "right" as const,
        render: (_: any, record: WarehouseProductLotDto) => {
          if (record.volumePerUnit && record.volumePerUnit > 0 && record.volumeUnitName) {
            return `${record.consumableQuantity.toLocaleString("vi-VN")} ${record.volumeUnitName}`;
          }
          return `${record.remainingBaseQuantity.toLocaleString("vi-VN")} ${record.baseUnitName || ""}`.trim();
        },
      },
      {
        title: "Tiêu hao trong kỳ",
        width: 130,
        align: "right" as const,
        render: (_: any, record: WarehouseProductLotDto) => {
          return formatConsumption(record.theoreticalConsumption, record);
        },
      },
      {
        title: "Tồn kho cuối kỳ (Dự kiến)",
        width: 180,
        align: "right" as const,
        render: (_: any, record: WarehouseProductLotDto) => {
          const expected = record.consumableQuantity - (record.theoreticalConsumption || 0);
          return renderExpectedStock(expected, record);
        },
      },
      {
        title: "Số lượng thực tế",
        width: 320,
        render: (_: any, record: WarehouseProductLotDto) => {
          const item = section.items.find(i =>
            i.productId === record.productId && (i.lotNumber ?? "") === (record.lotNumber ?? "")
          );
          if (!item) return null;

          const hasVolume = record.volumePerUnit && record.volumePerUnit > 0 && record.volumeUnitName;
          const storageUnitName = record.packagingUnitName || record.baseUnitName || "";

          return (
            <div style={{ display: "flex", gap: 6 }}>
              <Space.Compact style={{ flex: 1 }}>
                <NumericFormat
                  value={item.actualQuantityStorage ?? ""}
                  onValueChange={(values) => {
                    updateItem(section.warehouseId, record.productId, record.lotNumber, "actualQuantityStorage", values.floatValue ?? null);
                  }}
                  allowNegative
                  decimalScale={2}
                  thousandSeparator="."
                  decimalSeparator=","
                  customInput={Input}
                  style={{ flex: 1 }}
                  placeholder="Nhập SL"
                  disabled={isReadonly}
                />
                <Input
                  value={storageUnitName}
                  disabled
                  style={{ width: 65, textAlign: "center" }}
                />
              </Space.Compact>
              {hasVolume && (
                <Space.Compact style={{ flex: 1 }}>
                  <NumericFormat
                    value={item.actualQuantityConsumable ?? ""}
                    onValueChange={(values) => {
                      updateItem(section.warehouseId, record.productId, record.lotNumber, "actualQuantityConsumable", values.floatValue ?? null);
                    }}
                    allowNegative
                    decimalScale={2}
                    thousandSeparator="."
                    decimalSeparator=","
                    customInput={Input}
                    style={{ flex: 1 }}
                    placeholder="Nhập SL"
                    disabled={isReadonly}
                  />
                  <Input
                    value={record.volumeUnitName ?? ""}
                    disabled
                    style={{ width: 65, textAlign: "center" }}
                  />
                </Space.Compact>
              )}
            </div>
          );
        },
      },
      {
        title: "Chênh lệch",
        width: 140,
        align: "right" as const,
        render: (_: any, record: WarehouseProductLotDto) => {
          const item = section.items.find(i =>
            i.productId === record.productId && (i.lotNumber ?? "") === (record.lotNumber ?? "")
          );
          if (!item) return null;
          const diff = computeDifference(record, item);
          if (diff === null) return "-";

          const unit = record.volumeUnitName || record.baseUnitName || "";
          const color = diff > 0 ? "#52c41a" : diff < 0 ? "#ff4d4f" : undefined;
          const sign = diff > 0 ? "+" : "";
          const expected = record.consumableQuantity - (record.theoreticalConsumption || 0);
          const pct = expected !== 0 ? ((diff / Math.abs(expected)) * 100).toFixed(1) : null;

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
        render: (_: any, record: WarehouseProductLotDto) => {
          const item = section.items.find(i =>
            i.productId === record.productId && (i.lotNumber ?? "") === (record.lotNumber ?? "")
          );
          if (!item) return null;

          return (
            <Input.TextArea
              value={item.reason}
              onChange={(e) => updateItem(section.warehouseId, record.productId, record.lotNumber, "reason", e.target.value)}
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
        dataSource={section.lots}
        columns={columns}
        rowKey={(record) => lotKey(record.productId, record.lotNumber)}
        size="small"
        pagination={false}
        scroll={{ x: 1800 }}
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
    const from = location.state?.from || searchParams.get("from");
    if (from) {
      navigate(from);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(PATH_ROUTES.stockAdjustments.index);
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
                    <Tag>{section.lots.length} vật tư</Tag>
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
