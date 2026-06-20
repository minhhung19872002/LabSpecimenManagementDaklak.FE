import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Table,
  InputNumber,
  Select,
  Button,
  message,
  Space,
  Spin,
  Tooltip,
  Typography,
} from "antd";
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

  const handleQuantityChange = (key: string, value: number | null) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const newQty = value ?? 0;
        return {
          ...l,
          actualQuantity: newQty,
          exceedsStock:
            l.productId != null &&
            l.availableQuantity != null &&
            newQty > l.availableQuantity,
        };
      }),
    );
  };

  const handleAddEmptyRow = () => {
    const newLine: EditableLine = {
      key: `new-${Date.now()}`,
      isNew: true,
      needsSelection: true,
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
          availableQuantity: product.availableQuantity,
          unitId: product.baseUnitId,
          unitName: product.baseUnitName,
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

    const consumptionLines = lines.map((l) => ({
      consumptionId: l.consumptionId,
      productId: l.productId,
      equipmentId: l.equipmentId,
      unitId: l.unitId,
      recommendedQuantity: l.recommendedQuantity,
      actualQuantity: l.actualQuantity,
    }));

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

  const columns: ColumnsType<EditableLine> = [
    {
      title: "Tên vật tư / hóa chất",
      key: "name",
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
      width: 110,
      render: (_, r) => {
        if (r.needsSelection) return "-";
        if (r.equipmentId) return "Thiết bị";
        return productTypeLabel(r.productType);
      },
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 160,
      render: (_, r) => {
        if (r.needsSelection) return "-";
        if (r.isDeducted) {
          return (
            <Text>
              {r.actualQuantity} {r.unitName || ""}
            </Text>
          );
        }
        return (
          <Space size={4}>
            <Tooltip
              title={
                r.exceedsStock
                  ? `Tiêu hao vượt mức tồn kho (tồn: ${r.availableQuantity})`
                  : undefined
              }
            >
              <InputNumber
                size="small"
                min={0}
                step={0.01}
                value={r.actualQuantity}
                onChange={(v) => handleQuantityChange(r.key, v)}
                style={{ width: 90 }}
                status={r.exceedsStock ? "error" : undefined}
              />
            </Tooltip>
            <Text type="secondary">{r.unitName || ""}</Text>
          </Space>
        );
      },
    },
    {
      title: "Sử dụng",
      key: "usage",
      width: 90,
      render: (_, r) => {
        if (r.needsSelection) return "-";
        return r.equipmentId ? "sử dụng" : "tiêu hao";
      },
    },
    {
      title: "",
      key: "actions",
      width: 40,
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

  const hasExceedsStock = lines.some((l) => l.exceedsStock);

  return (
    <Modal
      title="Nguyên liệu tiêu hao"
      open={open}
      onCancel={onClose}
      width={700}
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
            scroll={{ y: 350 }}
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
