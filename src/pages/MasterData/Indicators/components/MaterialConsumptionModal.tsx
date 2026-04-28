import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Select,
  Button,
  Table,
  Space,
  Row,
  Col,
  Input,
  message,
  Spin,
  Typography,
} from "antd";
import { NumericFormat } from "react-number-format";
import { CloseOutlined } from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import {
  testMethodService,
  MaterialConsumptionItemDto,
} from "../../../../services/masterDataService";
import {
  productService,
  ProductDto,
  ProductType,
  ProductTypeLabels,
} from "../../../../services/productService";
import { getApiErrorMessage } from "../../../../utils/errorHandler";
import type { ColumnsType } from "antd/es/table";

export interface PendingConsumptionItem {
  productId: string;
  productName: string;
  productType: ProductType;
  unitId: string;
  unitName: string;
  quantity: number;
}

interface UnitOption {
  id: string;
  name: string;
}

interface ConsumptionRow {
  key: string;
  productId: string;
  productName: string;
  productType: ProductType;
  unitId: string;
  availableUnits: UnitOption[];
  quantity: number;
}

interface MaterialConsumptionModalProps {
  open: boolean;
  indicatorGroupName: string;
  indicatorName: string;
  indicatorFormattedName?: string;
  testMethodName: string;
  testMethodFormattedName?: string;
  unit?: string;
  formattedUnit?: string;
  testMethodIndicatorId: string | undefined;
  pendingItems?: PendingConsumptionItem[];
  onSave: (items: PendingConsumptionItem[]) => void;
  onCancel: () => void;
}

const MaterialConsumptionModal: React.FC<MaterialConsumptionModalProps> = ({
  open,
  indicatorGroupName,
  indicatorName,
  indicatorFormattedName,
  testMethodName,
  testMethodFormattedName,
  unit,
  formattedUnit,
  testMethodIndicatorId,
  pendingItems,
  onSave,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [rows, setRows] = useState<ConsumptionRow[]>([]);
  const [productTypeFilter, setProductTypeFilter] = useState<
    ProductType | undefined
  >(undefined);
  const [selectedProductId, setSelectedProductId] = useState<
    string | undefined
  >(undefined);

  const getAvailableUnits = useCallback(
    (product: ProductDto): UnitOption[] => {
      const units: UnitOption[] = [
        { id: product.baseUnitId, name: product.baseUnitName || "ĐVT gốc" },
      ];
      if (product.unitConversions) {
        for (const uc of product.unitConversions) {
          if (uc.convertedUnitId !== product.baseUnitId) {
            units.push({
              id: uc.convertedUnitId,
              name: uc.convertedUnitName || "ĐVT quy đổi",
            });
          }
        }
      }
      return units;
    },
    []
  );

  useEffect(() => {
    if (!open) return;

    setRows([]);
    setProductTypeFilter(undefined);
    setSelectedProductId(undefined);

    const loadData = async () => {
      setLoading(true);
      try {
        if (!productsLoaded) {
          const activeProducts = await productService.getActive();
          setProducts(activeProducts);
          setProductsLoaded(true);
        }

        if (testMethodIndicatorId) {
          const existing =
            await testMethodService.getConsumption(testMethodIndicatorId);
          if (existing.length > 0) {
            const allProducts = productsLoaded
              ? products
              : await productService.getActive();
            const productMap = new Map(allProducts.map((p) => [p.id, p]));

            setRows(
              existing.map((item: MaterialConsumptionItemDto) => {
                const product = productMap.get(item.productId);
                return {
                  key: crypto.randomUUID(),
                  productId: item.productId,
                  productName: item.productName,
                  productType: item.productType as ProductType,
                  unitId: item.unitId,
                  availableUnits: product
                    ? getAvailableUnits(product)
                    : [{ id: item.unitId, name: item.unitName }],
                  quantity: item.quantity,
                };
              })
            );
          }
        } else if (pendingItems && pendingItems.length > 0) {
          const allProducts = productsLoaded
            ? products
            : await productService.getActive();
          const productMap = new Map(allProducts.map((p) => [p.id, p]));

          setRows(
            pendingItems.map((item) => {
              const product = productMap.get(item.productId);
              return {
                key: crypto.randomUUID(),
                productId: item.productId,
                productName: item.productName,
                productType: item.productType,
                unitId: item.unitId,
                availableUnits: product
                  ? getAvailableUnits(product)
                  : [{ id: item.unitId, name: item.unitName }],
                quantity: item.quantity,
              };
            })
          );
        }
      } catch (error) {
        console.error("Failed to load consumption data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, testMethodIndicatorId]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (productTypeFilter !== undefined) {
      result = result.filter((p) => p.productType === productTypeFilter);
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [products, productTypeFilter]);

  const productOptions = useMemo(() => {
    const existingProductIds = new Set(rows.map((r) => r.productId));
    return filteredProducts
      .filter((p) => !existingProductIds.has(p.id))
      .map((p) => ({
        value: p.id,
        label: p.name,
      }));
  }, [filteredProducts, rows]);

  const handleAddProduct = useCallback(() => {
    if (!selectedProductId) {
      message.warning("Vui lòng chọn sản phẩm");
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (rows.some((r) => r.productId === selectedProductId)) {
      message.warning("Sản phẩm đã được thêm");
      return;
    }

    const availableUnits = getAvailableUnits(product);
    setRows((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        productType: product.productType,
        unitId: product.baseUnitId,
        availableUnits,
        quantity: 0,
      },
    ]);
    setSelectedProductId(undefined);
  }, [selectedProductId, products, rows, getAvailableUnits]);

  const handleRemoveRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }, []);

  const handleUnitChange = useCallback((key: string, unitId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, unitId } : r))
    );
  }, []);

  const handleQuantityChange = useCallback(
    (key: string, quantity: number | null) => {
      setRows((prev) =>
        prev.map((r) => (r.key === key ? { ...r, quantity: quantity ?? 0 } : r))
      );
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (rows.length === 0) {
      message.warning("Vui lòng thêm ít nhất một vật liệu");
      return;
    }

    const invalidRows = rows.filter((r) => r.quantity <= 0);
    if (invalidRows.length > 0) {
      message.error("Số lượng phải lớn hơn 0");
      return;
    }

    const items: PendingConsumptionItem[] = rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      productType: r.productType,
      unitId: r.unitId,
      unitName:
        r.availableUnits.find((u) => u.id === r.unitId)?.name || "",
      quantity: r.quantity,
    }));

    if (testMethodIndicatorId) {
      try {
        setSaving(true);
        await testMethodService.saveConsumption(testMethodIndicatorId, {
          items: items.map((i) => ({
            productId: i.productId,
            unitId: i.unitId,
            quantity: i.quantity,
          })),
        });
        message.success("Lưu thiết lập tiêu hao thành công!");
        onSave(items);
      } catch (error) {
        message.error(
          getApiErrorMessage(error, "Không thể lưu thiết lập tiêu hao")
        );
      } finally {
        setSaving(false);
      }
    } else {
      onSave(items);
    }
  }, [rows, testMethodIndicatorId, onSave]);

  const columns: ColumnsType<ConsumptionRow> = [
    {
      title: "Tên vật liệu",
      dataIndex: "productName",
      key: "productName",
      ellipsis: true,
    },
    {
      title: "Đơn vị",
      key: "unitId",
      width: 150,
      render: (_, record) => (
        <Select
          value={record.unitId}
          onChange={(v) => handleUnitChange(record.key, v)}
          options={record.availableUnits.map((u) => ({
            value: u.id,
            label: u.name,
          }))}
          style={{ width: "100%" }}
          size="small"
        />
      ),
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 120,
      render: (_, record) => (
        <NumericFormat
          value={record.quantity}
          onValueChange={(values) =>
            handleQuantityChange(record.key, values.floatValue ?? 0)
          }
          allowNegative={false}
          decimalScale={2}
          customInput={Input}
          size="small"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "",
      key: "action",
      width: 40,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<CloseOutlined />}
          onClick={() => handleRemoveRow(record.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      title="Tiêu hao nguyên vật liệu"
      open={open}
      onCancel={onCancel}
      width={680}
      centered
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" onClick={handleSave} loading={saving}>
            Lưu
          </Button>
        </Space>
      }
      styles={{
        body: { paddingTop: 16, maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" },
      }}
    >
      <Spin spinning={loading}>
        <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12}>
            <Typography.Text type="secondary">Tên nhóm</Typography.Text>
            <div style={{ fontWeight: 500 }}>{indicatorGroupName}</div>
          </Col>
          <Col xs={24} sm={12}>
            <Typography.Text type="secondary">Tên chỉ tiêu</Typography.Text>
            <div style={{ fontWeight: 500 }}>
              <IndicatorName name={indicatorName} formattedName={indicatorFormattedName} />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <Typography.Text type="secondary">Phương pháp</Typography.Text>
            <div style={{ fontWeight: 500 }}>
              <IndicatorName name={testMethodName} formattedName={testMethodFormattedName} />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <Typography.Text type="secondary">Đơn vị</Typography.Text>
            <div style={{ fontWeight: 500 }}>
              {formattedUnit ? (
                <span dangerouslySetInnerHTML={{ __html: formattedUnit }} />
              ) : (
                unit || "-"
              )}
            </div>
          </Col>
        </Row>

        <Row gutter={[8, 8]} align="bottom" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={6}>
            <div style={{ fontSize: 13, color: "#8c8c8c", marginBottom: 4 }}>
              Loại sản phẩm
            </div>
            <Select
              value={productTypeFilter}
              onChange={(v) => {
                setProductTypeFilter(v);
                setSelectedProductId(undefined);
              }}
              allowClear
              placeholder="Tất cả"
              style={{ width: "100%" }}
              options={[
                { value: ProductType.Chemical, label: ProductTypeLabels[ProductType.Chemical] },
                { value: ProductType.Biological, label: ProductTypeLabels[ProductType.Biological] },
                { value: ProductType.Supply, label: ProductTypeLabels[ProductType.Supply] },
              ]}
            />
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ fontSize: 13, color: "#8c8c8c", marginBottom: 4 }}>
              Tên sản phẩm
            </div>
            <Select
              value={selectedProductId}
              onChange={setSelectedProductId}
              options={productOptions}
              placeholder="Tìm kiếm sản phẩm..."
              showSearch
              filterOption={(input, option) =>
                ((option?.label as string) ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              allowClear
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Button type="primary" onClick={handleAddProduct} style={{ width: "100%" }}>
              Thêm vào
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={rows}
          rowKey="key"
          pagination={false}
          size="small"
          scroll={{ x: "100%" }}
          locale={{ emptyText: "Chưa có vật liệu nào" }}
        />
      </Spin>
    </Modal>
  );
};

export default MaterialConsumptionModal;
