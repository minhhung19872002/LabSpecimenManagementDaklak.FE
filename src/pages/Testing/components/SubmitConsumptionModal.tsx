import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import {
  Modal,
  Table,
  Select,
  Input,
  Button,
  message,
  Space,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import { NumericFormat } from "react-number-format";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  WarningOutlined,
} from "../../../components/common/Icon";
import testBatchService from "../../../services/testBatchService";
import {
  productService,
  ProductTypeLabels,
  type ProductDto,
} from "../../../services/productService";
import type {
  ConsumptionPreviewLineDto,
  SubmitWithConsumptionDto,
} from "../../../types/testBatch";

const { Text } = Typography;

interface EditableLine extends ConsumptionPreviewLineDto {
  key: string;
  isNew?: boolean;
  needsSelection?: boolean;
}

interface Props {
  open: boolean;
  batchId: string;
  batchCode?: string;
  batchName?: string;
  selectedItemIds: string[];
  onClose: () => void;
  onSubmitted: () => void;
}

function getUnitsForProduct(product: ProductDto) {
  const units: { value: string; label: string }[] = [];
  const seen = new Set<string>();
  const add = (id?: string, name?: string) => {
    if (id && name && !seen.has(id)) {
      seen.add(id);
      units.push({ value: id, label: name });
    }
  };
  add(product.packagingUnitId, product.packagingUnitName);
  add(product.baseUnitId, product.baseUnitName);
  add(product.volumeUnitId, product.volumeUnitName);
  for (const sku of product.skus || []) {
    add(sku.packagingUnitId, sku.packagingUnitName);
    add(sku.baseUnitId, sku.baseUnitName);
    add(sku.volumeUnitId, sku.volumeUnitName);
  }
  return units;
}

function getUnitsPerStorage(product: ProductDto, unitId: string): number {
  if (unitId === product.packagingUnitId) return 1;
  if (unitId === product.volumeUnitId && product.volumePerUnit)
    return product.volumePerUnit;
  if (unitId === product.baseUnitId && product.packagingQuantity)
    return 1 / product.packagingQuantity;
  for (const sku of product.skus || []) {
    if (unitId === sku.packagingUnitId) return 1;
    if (unitId === sku.volumeUnitId && sku.volumePerUnit)
      return sku.volumePerUnit;
    if (unitId === sku.baseUnitId && sku.packagingQuantity)
      return 1 / sku.packagingQuantity;
  }
  return 1;
}

const SubmitConsumptionModal: React.FC<Props> = ({
  open,
  batchId,
  batchCode,
  batchName,
  selectedItemIds,
  onClose,
  onSubmitted,
}) => {
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isFirstSubmit, setIsFirstSubmit] = useState(true);

  const checkExceedsStock = (line: EditableLine): boolean => {
    if (!line.productId || !line.actualQuantity || line.storageAvailableQuantity == null)
      return false;
    const product = products.find((p) => p.id === line.productId);
    if (!product) return false;

    let unitId = line.unitId;
    if (!unitId) {
      const unitOptions = getUnitsForProduct(product);
      unitId = unitOptions[0]?.value;
    }
    if (!unitId) return false;

    const factor = getUnitsPerStorage(product, unitId);
    return line.actualQuantity / factor > line.storageAvailableQuantity;
  };

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await testBatchService.getConsumptionPreview(batchId);
      const data = res.data;
      setIsFirstSubmit(data.isFirstSubmit);
      setLines(
        data.lines.map((l, i) => ({
          ...l,
          key: l.consumptionId || `template-${i}`,
        })),
      );
    } catch {
      message.error("Lỗi tải dữ liệu tiêu hao");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  const loadProducts = useCallback(async () => {
    try {
      const data = await productService.getActive();
      setProducts(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadPreview();
      loadProducts();
    } else {
      setLines([]);
      setProducts([]);
      setIsFirstSubmit(true);
    }
  }, [open, loadPreview, loadProducts]);

  useLayoutEffect(() => {
    if (!products.length || loading) return;
    setLines((prev) => {
      let changed = false;
      const next = prev.map((l) => {
        if (!l.productId || l.needsSelection || l.isDeducted) return l;
        const product = products.find((p) => p.id === l.productId);
        if (!product) return l;
        const unitOptions = getUnitsForProduct(product);
        if (!unitOptions.length) return l;
        if (l.unitId && unitOptions.some((u) => u.value === l.unitId)) return l;
        changed = true;
        return {
          ...l,
          unitId: unitOptions[0].value,
          unitName: unitOptions[0].label,
        };
      });
      return changed ? next : prev;
    });
  }, [products, loading]);

  const handleQuantityChange = (key: string, value: number | null) => {
    setLines((prev) =>
      prev.map((l) =>
        l.key === key ? { ...l, actualQuantity: value ?? 0 } : l,
      ),
    );
  };

  const handleUnitChange = (key: string, unitId: string) => {
    const product = products.find((p) =>
      lines.some((l) => l.key === key && l.productId === p.id),
    );
    const unitName =
      getUnitsForProduct(product!).find((u) => u.value === unitId)?.label || "";

    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, unitId, unitName } : l)),
    );
  };

  const handleAddEmptyRow = () => {
    const newLine: EditableLine = {
      key: `new-${Date.now()}`,
      isNew: true,
      needsSelection: true,
      storageAvailableQuantity: 0,
      recommendedQuantity: 0,
      actualQuantity: 0,
      isDeducted: false,
      exceedsStock: false,
    };
    setLines((prev) => [...prev, newLine]);
  };

  const handleSelectProduct = (key: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const exists = lines.some(
      (l) => l.key !== key && l.productId === productId,
    );
    if (exists) {
      message.warning("Vật tư này đã có trong danh sách");
      return;
    }

    const defaultUnitId = product.packagingUnitId || product.baseUnitId;
    const defaultUnitName = product.packagingUnitName || product.baseUnitName;

    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        return {
          ...l,
          needsSelection: false,
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          productType: product.productType,
          storageAvailableQuantity: product.availableQuantity,
          storageUnitName: product.packagingUnitName || product.baseUnitName,
          availableQuantity: product.availableQuantity,
          unitId: defaultUnitId,
          unitName: defaultUnitName,
        };
      }),
    );
  };

  const handleRemoveLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const handleSubmit = async () => {
    const pendingSelection = lines.some((l) => l.needsSelection);
    if (pendingSelection) {
      message.warning("Vui lòng chọn vật tư cho dòng mới hoặc xóa dòng trống");
      return;
    }

    const consumptionLines = lines.map((l) => {
      let unitId = l.unitId;
      if (!unitId && l.productId) {
        const product = products.find((p) => p.id === l.productId);
        if (product) unitId = getUnitsForProduct(product)[0]?.value;
      }
      return {
        consumptionId: l.consumptionId,
        productId: l.productId,
        equipmentId: l.equipmentId,
        unitId,
        recommendedQuantity: l.recommendedQuantity,
        actualQuantity: l.actualQuantity,
      };
    });

    const dto: SubmitWithConsumptionDto = {
      itemIds: selectedItemIds,
      consumptionLines,
    };

    setSubmitting(true);
    try {
      await testBatchService.submitWithConsumption(batchId, dto);
      message.success(
        `Gửi kết quả và trừ tiêu hao thành công (${selectedItemIds.length} chỉ tiêu)`,
      );
      onSubmitted();
    } catch (err: any) {
      message.error(
        err?.response?.data?.error?.message || "Lỗi gửi kết quả",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const productTypeLabel = (type?: number) => {
    if (type == null) return "-";
    return ProductTypeLabels[type as keyof typeof ProductTypeLabels] || "-";
  };

  const availableProducts = products.filter(
    (p) => !lines.some((l) => l.productId === p.id),
  );

  const hasExceedsStock = lines.some((l) => checkExceedsStock(l));

  const columns: ColumnsType<EditableLine> = [
    {
      title: "Tên vật tư / hóa chất",
      key: "name",
      width: 200,
      ellipsis: true,
      render: (_, r) => {
        if (r.needsSelection) {
          return (
            <Select
              placeholder="Chọn vật tư..."
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              onChange={(v) => handleSelectProduct(r.key, v)}
              options={availableProducts.map((p) => ({
                value: p.id,
                label: [p.identificationCode, p.name].filter(Boolean).join(" - ") || " - ",
              }))}
              autoFocus
            />
          );
        }
        return (
          <Text strong>{r.productName || r.equipmentName || "-"}</Text>
        );
      },
    },
    {
      title: "Loại vật tư",
      key: "type",
      width: 100,
      render: (_, r) => {
        if (r.needsSelection) return "-";
        if (r.equipmentId) return "Thiết bị";
        return productTypeLabel(r.productType);
      },
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 100,
      render: (_, r) => {
        if (r.needsSelection) return "-";
        if (r.isDeducted) {
          return (
            <Text>
              {r.actualQuantity} {r.unitName || ""}
            </Text>
          );
        }
        const exceeds = checkExceedsStock(r);
        return (
          <Tooltip
            title={
              exceeds
                ? `Vượt mức tồn kho (${r.storageAvailableQuantity?.toLocaleString("vi-VN")} ${r.storageUnitName || ""})`
                : undefined
            }
          >
            <NumericFormat
              value={r.actualQuantity ?? ""}
              onValueChange={(values) =>
                handleQuantityChange(r.key, values.floatValue ?? null)
              }
              allowNegative={false}
              decimalScale={2}
              thousandSeparator="."
              decimalSeparator=","
              customInput={Input}
              size="small"
              style={{ width: "100%" }}
              status={exceeds ? "error" : undefined}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Đơn vị",
      key: "unit",
      width: 95,
      render: (_, r) => {
        if (r.needsSelection) return "-";
        if (r.equipmentId) return "-";
        if (r.isDeducted) return r.unitName || "-";

        const product = products.find((p) => p.id === r.productId);
        if (!product) return r.unitName || "-";

        const unitOptions = getUnitsForProduct(product);
        if (r.unitId && !unitOptions.some((u) => u.value === r.unitId)) {
          unitOptions.push({ value: r.unitId, label: r.unitName || r.unitId });
        }
        if (!unitOptions.length) return r.unitName || "-";

        return (
          <Select
            size="small"
            value={r.unitId || unitOptions[0]?.value}
            onChange={(v) => handleUnitChange(r.key, v)}
            style={{ width: "100%" }}
            options={unitOptions}
          />
        );
      },
    },
    {
      title: "Tồn kho",
      key: "stock",
      width: 130,
      align: "right" as const,
      render: (_, r) => {
        if (r.needsSelection || r.storageAvailableQuantity == null) return "-";
        return `${r.storageAvailableQuantity.toLocaleString("vi-VN")} ${r.storageUnitName || ""}`.trim();
      },
    },
    {
      title: "Sử dụng",
      key: "usage",
      width: 80,
      render: (_, r) => {
        if (r.needsSelection) return "-";
        return r.equipmentId ? "sử dụng" : "tiêu hao";
      },
    },
    {
      title: "",
      key: "actions",
      width: 50,
      fixed: "right" as const,
      render: (_, r) => {
        if (r.isDeducted) return null;
        if (r.isNew) {
          return (
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveLine(r.key)}
            />
          );
        }
        return null;
      },
    },
  ];

  return (
    <Modal
      title="Nguyên liệu tiêu hao"
      open={open}
      onCancel={onClose}
      width={900}
      centered
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={loading}
          >
            Lưu
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">
              {batchCode} - {batchName}
            </Text>
          </div>

          {!isFirstSubmit && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 12px",
                background: "#fffbe6",
                borderRadius: 6,
                border: "1px solid #ffe58f",
              }}
            >
              <WarningOutlined style={{ color: "#faad14", marginRight: 8 }} />
              <Text type="secondary">
                Tiêu hao đã được trừ trước đó. Không trừ thêm.
              </Text>
            </div>
          )}

          {hasExceedsStock && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 12px",
                background: "#fff2f0",
                borderRadius: 6,
                border: "1px solid #ffccc7",
              }}
            >
              <WarningOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
              <Text type="danger">
                Có vật tư tiêu hao vượt mức tồn kho
              </Text>
            </div>
          )}

          <Table
            columns={columns}
            dataSource={lines}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 900, y: 350 }}
          />

          {isFirstSubmit && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddEmptyRow}
              style={{ marginTop: 12 }}
            >
              Thêm nguyên liệu
            </Button>
          )}
        </>
      )}
    </Modal>
  );
};

export default SubmitConsumptionModal;
