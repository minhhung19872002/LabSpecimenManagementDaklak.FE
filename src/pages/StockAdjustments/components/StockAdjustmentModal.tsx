import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Table,
  Button,
  Space,
  message,
  Input,
  Row,
  Col,
  Tag,
  Divider,
  Popconfirm,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  stockAdjustmentService,
  StockAdjustmentDto,
  StockAdjustmentStatusLabels,
  StockAdjustmentStatusColors,
  CreateUpdateStockAdjustmentItemDto,
} from "../../../services/stockAdjustmentService";
import {
  productService,
  ProductDto,
  ProductType,
  ProductTypeLabels,
} from "../../../services/productService";
import dayjs from "dayjs";

interface StockAdjustmentModalProps {
  open: boolean;
  mode: "create" | "edit" | "view";
  adjustmentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemRow {
  key: string;
  productId: string;
  productName: string;
  unitName: string;
  quantityBefore: number;
  actualQuantity: number;
  adjustmentQuantity: number;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  open,
  mode,
  adjustmentId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [detail, setDetail] = useState<StockAdjustmentDto | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState<ProductType | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  const isReadonly = mode === "view";

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setNotes("");
    setDetail(null);
    setSelectedProductId(undefined);
    setProductTypeFilter(undefined);
    setProductSearch("");

    if ((mode === "edit" || mode === "view") && adjustmentId) {
      loadDetail(adjustmentId);
    }
    if (!isReadonly) {
      loadProducts();
    }
  }, [open, mode, adjustmentId]);

  const loadDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await stockAdjustmentService.get(id);
      setDetail(data);
      setNotes(data.notes || "");
      setItems(
        data.items.map((item) => ({
          key: item.id,
          productId: item.productId,
          productName: item.productName,
          unitName: item.unitName,
          quantityBefore: item.quantityBefore,
          actualQuantity: item.actualQuantity,
          adjustmentQuantity: item.adjustmentQuantity,
        }))
      );
    } catch {
      message.error("Không thể tải thông tin phiếu điều chỉnh");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await productService.getList({ limit: 1000, isDraft: false });
      setProducts(result.items || []);
    } catch {
      // ignore
    }
  };

  const availableProducts = useMemo(() => {
    const addedIds = new Set(items.map((i) => i.productId));
    return products.filter((p) => {
      if (addedIds.has(p.id)) return false;
      if (productTypeFilter !== undefined && p.productType !== productTypeFilter) return false;
      return true;
    });
  }, [products, items, productTypeFilter]);

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    setItems((prev) => [
      ...prev,
      {
        key: product.id,
        productId: product.id,
        productName: product.name,
        unitName: product.baseUnitName || "",
        quantityBefore: product.availableQuantity,
        actualQuantity: product.availableQuantity,
        adjustmentQuantity: 0,
      },
    ]);
    setSelectedProductId(undefined);
  };

  const handleRemoveItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleActualQuantityChange = (productId: string, value: number | null) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const actual = value ?? 0;
        return {
          ...item,
          actualQuantity: actual,
          adjustmentQuantity: item.quantityBefore - actual,
        };
      })
    );
  };

  const buildPayload = (): { notes?: string; items: CreateUpdateStockAdjustmentItemDto[] } => ({
    notes: notes || undefined,
    items: items.map((i) => ({
      productId: i.productId,
      actualQuantity: i.actualQuantity,
    })),
  });

  const handleSaveDraft = async () => {
    if (items.length === 0) {
      message.warning("Vui lòng thêm ít nhất một sản phẩm.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (mode === "edit" && adjustmentId) {
        await stockAdjustmentService.update(adjustmentId, payload);
      } else {
        await stockAdjustmentService.create(payload);
      }
      message.success("Lưu tạm phiếu thành công");
      onSuccess();
      onClose();
    } catch {
      message.error("Không thể lưu phiếu");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (items.length === 0) {
      message.warning("Vui lòng thêm ít nhất một sản phẩm.");
      return;
    }
    setConfirming(true);
    try {
      let id = adjustmentId;
      const payload = buildPayload();
      if (mode === "create") {
        const created = await stockAdjustmentService.create(payload);
        id = created.id;
      } else if (mode === "edit" && adjustmentId) {
        await stockAdjustmentService.update(adjustmentId, payload);
      }
      if (id) {
        await stockAdjustmentService.confirm(id);
      }
      message.success("Xác nhận điều chỉnh tồn kho thành công");
      onSuccess();
      onClose();
    } catch {
      message.error("Không thể xác nhận điều chỉnh");
    } finally {
      setConfirming(false);
    }
  };

  const columns = [
    {
      title: "Tên vật liệu",
      dataIndex: "productName",
      width: 200,
    },
    {
      title: "Đơn vị",
      dataIndex: "unitName",
      width: 100,
    },
    {
      title: "SL khả dụng",
      dataIndex: "quantityBefore",
      width: 120,
      render: (val: number) => val?.toLocaleString("vi-VN") ?? 0,
    },
    {
      title: "Số lượng thực tế",
      dataIndex: "actualQuantity",
      width: 150,
      render: (val: number, record: ItemRow) =>
        isReadonly ? (
          val?.toLocaleString("vi-VN") ?? 0
        ) : (
          <InputNumber
            min={0}
            value={val}
            onChange={(v) => handleActualQuantityChange(record.productId, v)}
            style={{ width: "100%" }}
          />
        ),
    },
    {
      title: "Điều chỉnh",
      dataIndex: "adjustmentQuantity",
      width: 120,
      render: (val: number) => {
        const color = val > 0 ? "#ff4d4f" : val < 0 ? "#52c41a" : undefined;
        return <span style={{ color, fontWeight: 500 }}>{val > 0 ? `-${val.toLocaleString("vi-VN")}` : val < 0 ? `+${Math.abs(val).toLocaleString("vi-VN")}` : "0"}</span>;
      },
    },
    ...(!isReadonly
      ? [
          {
            title: "",
            width: 50,
            render: (_: any, record: ItemRow) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveItem(record.productId)}
                size="small"
              />
            ),
          },
        ]
      : []),
  ];

  const title = mode === "create"
    ? "Tạo phiếu điều chỉnh tồn kho"
    : mode === "edit"
    ? "Sửa phiếu điều chỉnh tồn kho"
    : "Chi tiết phiếu điều chỉnh tồn kho";

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: 900 }}
      centered
      destroyOnClose
      loading={loading}
      footer={
        isReadonly
          ? null
          : [
              <Button
                key="draft"
                onClick={handleSaveDraft}
                loading={saving}
                disabled={confirming}
              >
                Lưu tạm phiếu
              </Button>,
              <Popconfirm
                key="confirm"
                title="Xác nhận điều chỉnh tồn kho?"
                description="Sau khi xác nhận, số lượng khả dụng của sản phẩm sẽ được cập nhật theo số lượng thực tế."
                onConfirm={handleConfirm}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  type="primary"
                  loading={confirming}
                  disabled={saving}
                >
                  Xác nhận điều chỉnh
                </Button>
              </Popconfirm>,
            ]
      }
    >
      {(mode === "edit" || mode === "view") && detail && (
        <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12}>
            <span style={{ color: "#888" }}>ID Phiếu:</span>{" "}
            <span style={{ fontWeight: 500 }}>{detail.code}</span>
          </Col>
          <Col xs={24} sm={12}>
            <span style={{ color: "#888" }}>Người tạo:</span>{" "}
            <span style={{ fontWeight: 500 }}>{detail.creatorName || "—"}</span>
          </Col>
          <Col xs={24} sm={12}>
            <span style={{ color: "#888" }}>Ngày tạo:</span>{" "}
            <span style={{ fontWeight: 500 }}>{dayjs(detail.creationTime).format("DD/MM/YYYY HH:mm")}</span>
          </Col>
          <Col xs={24} sm={12}>
            <span style={{ color: "#888" }}>Trạng thái:</span>{" "}
            <Tag color={StockAdjustmentStatusColors[detail.status]}>
              {StockAdjustmentStatusLabels[detail.status]}
            </Tag>
          </Col>
        </Row>
      )}

      {((mode === "edit" || mode === "view") && detail) && <Divider style={{ margin: "8px 0 16px" }} />}

      {!isReadonly && (
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="Loại sản phẩm"
              allowClear
              style={{ width: 150, minWidth: 120 }}
              value={productTypeFilter}
              onChange={(v) => {
                setProductTypeFilter(v);
                setSelectedProductId(undefined);
              }}
              options={Object.entries(ProductTypeLabels).map(([k, v]) => ({
                value: Number(k),
                label: v,
              }))}
            />
            <Select
              showSearch
              placeholder="Chọn sản phẩm"
              style={{ width: 350, minWidth: 200, maxWidth: "100%" }}
              value={selectedProductId}
              onChange={setSelectedProductId}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
              }
              searchValue={productSearch}
              onSearch={setProductSearch}
              options={availableProducts.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.baseUnitName || ""}) - SL: ${p.availableQuantity}`,
              }))}
            />
            <Button
              icon={<PlusOutlined />}
              onClick={handleAddProduct}
              disabled={!selectedProductId}
            >
              Thêm vào
            </Button>
          </Space>
        </div>
      )}

      <Table
        dataSource={items}
        columns={columns}
        rowKey="key"
        pagination={false}
        size="small"
        bordered
        scroll={{ x: 700, y: 400 }}
      />

    </Modal>
  );
};

export default StockAdjustmentModal;
