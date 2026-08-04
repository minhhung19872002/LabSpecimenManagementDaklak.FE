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
import { testMethodService } from "../../../../services/masterDataService";
import {
  productService,
  ProductDto,
  ProductType,
  ProductTypeLabels,
} from "../../../../services/productService";
import {
  equipmentService,
  EquipmentListDto,
  EquipmentStatus,
} from "../../../../services/equipmentService";
import { getApiErrorMessage } from "../../../../utils/errorHandler";
import type { ColumnsType } from "antd/es/table";

export interface PendingConsumptionItem {
  isEquipment: boolean;
  productId?: string;
  productName?: string;
  productType?: ProductType;
  equipmentId?: string;
  equipmentName?: string;
  equipmentSerialNumber?: string;
  unitId?: string;
  unitName?: string;
  quantity: number;
}

interface UnitOption {
  id: string;
  name: string;
}

interface ProductRow {
  key: string;
  productId: string;
  productName: string;
  productType: ProductType;
  unitId: string;
  unitName: string;
  quantity: number;
}

interface EquipmentRow {
  key: string;
  equipmentId: string;
  equipmentName: string;
  equipmentSerialNumber: string;
  quantity: number;
}

const EQUIPMENT_FILTER_VALUE = "__equipment__";
const EQUIPMENT_PREFIX = "eq__";

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
  const [equipments, setEquipments] = useState<EquipmentListDto[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [equipmentsLoaded, setEquipmentsLoaded] = useState(false);
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);

  const isEquipmentMode = typeFilter === EQUIPMENT_FILTER_VALUE;
  const isAllMode = typeFilter === undefined;

  const selectLabel = isEquipmentMode
    ? "Tên thiết bị"
    : isAllMode
      ? "Tên vật tư / thiết bị"
      : "Tên sản phẩm";

  const selectPlaceholder = isEquipmentMode
    ? "Tìm theo serial hoặc tên thiết bị..."
    : isAllMode
      ? "Tìm kiếm sản phẩm hoặc thiết bị..."
      : "Tìm kiếm sản phẩm...";

  const getConsumptionUnit = useCallback(
    (product: ProductDto): UnitOption => {
      if (product.volumeUnitId && product.volumeUnitName) {
        return { id: product.volumeUnitId, name: product.volumeUnitName };
      }
      return { id: product.baseUnitId, name: product.baseUnitName || "" };
    },
    []
  );

  useEffect(() => {
    if (!open) return;

    setProductRows([]);
    setEquipmentRows([]);
    setTypeFilter(undefined);
    setSelectedItemId(undefined);

    const loadData = async () => {
      setLoading(true);
      try {
        let allProducts = products;
        if (!productsLoaded) {
          allProducts = await productService.getActive();
          setProducts(allProducts);
          setProductsLoaded(true);
        }

        if (!equipmentsLoaded) {
          const result = await equipmentService.getList({ limit: 1000 });
          const activeEquipments = result.items.filter(
            (e) => e.status === EquipmentStatus.InStock || e.status === EquipmentStatus.InUse
          );
          setEquipments(activeEquipments);
          setEquipmentsLoaded(true);
        }

        if (testMethodIndicatorId) {
          const existing =
            await testMethodService.getConsumption(testMethodIndicatorId);
          if (existing.length > 0) {
            const productMap = new Map(allProducts.map((p) => [p.id, p]));
            const pRows: ProductRow[] = [];
            const eRows: EquipmentRow[] = [];

            for (const item of existing) {
              if (item.isEquipment) {
                eRows.push({
                  key: crypto.randomUUID(),
                  equipmentId: item.equipmentId!,
                  equipmentName: item.equipmentName || "",
                  equipmentSerialNumber: item.equipmentSerialNumber || "",
                  quantity: item.quantity,
                });
              } else {
                const product = productMap.get(item.productId!);
                const unit = product
                  ? getConsumptionUnit(product)
                  : { id: item.unitId!, name: item.unitName || "" };
                pRows.push({
                  key: crypto.randomUUID(),
                  productId: item.productId!,
                  productName: item.productName || "",
                  productType: item.productType as ProductType,
                  unitId: unit.id,
                  unitName: unit.name,
                  quantity: item.quantity,
                });
              }
            }
            setProductRows(pRows);
            setEquipmentRows(eRows);
          }
        } else if (pendingItems && pendingItems.length > 0) {
          const productMap = new Map(allProducts.map((p) => [p.id, p]));
          const pRows: ProductRow[] = [];
          const eRows: EquipmentRow[] = [];

          for (const item of pendingItems) {
            if (item.isEquipment) {
              eRows.push({
                key: crypto.randomUUID(),
                equipmentId: item.equipmentId!,
                equipmentName: item.equipmentName || "",
                equipmentSerialNumber: item.equipmentSerialNumber || "",
                quantity: item.quantity,
              });
            } else {
              const product = productMap.get(item.productId!);
              const unit = product
                ? getConsumptionUnit(product)
                : { id: item.unitId!, name: item.unitName || "" };
              pRows.push({
                key: crypto.randomUUID(),
                productId: item.productId!,
                productName: item.productName || "",
                productType: item.productType!,
                unitId: unit.id,
                unitName: unit.name,
                quantity: item.quantity,
              });
            }
          }
          setProductRows(pRows);
          setEquipmentRows(eRows);
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
    if (isEquipmentMode) return [];
    let result = products;
    if (typeFilter !== undefined) {
      result = result.filter((p) => p.productType === Number(typeFilter));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [products, typeFilter, isEquipmentMode]);

  const selectOptions = useMemo(() => {
    const existingProductIds = new Set(productRows.map((r) => r.productId));
    const existingEquipmentIds = new Set(equipmentRows.map((r) => r.equipmentId));

    const pOpts = isEquipmentMode
      ? []
      : filteredProducts
          .filter((p) => !existingProductIds.has(p.id))
          .map((p) => ({
            value: p.id,
            label: p.name,
          }));

    const eOpts = (!isAllMode && !isEquipmentMode)
      ? []
      : equipments
          .filter((e) => !existingEquipmentIds.has(e.id))
          .map((e) => ({
            value: EQUIPMENT_PREFIX + e.id,
            label: `[TB] ${e.serialNumber} - ${e.name}`,
          }));

    return [...pOpts, ...eOpts];
  }, [filteredProducts, equipments, productRows, equipmentRows, isEquipmentMode, isAllMode]);

  const handleAdd = useCallback(() => {
    if (!selectedItemId) {
      message.warning("Vui lòng chọn sản phẩm hoặc thiết bị");
      return;
    }

    if (selectedItemId.startsWith(EQUIPMENT_PREFIX)) {
      const eqId = selectedItemId.slice(EQUIPMENT_PREFIX.length);
      const equipment = equipments.find((e) => e.id === eqId);
      if (!equipment) return;

      if (equipmentRows.some((r) => r.equipmentId === eqId)) {
        message.warning("Thiết bị đã được thêm");
        return;
      }

      setEquipmentRows((prev) => [
        ...prev,
        {
          key: crypto.randomUUID(),
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          equipmentSerialNumber: equipment.serialNumber,
          quantity: 1,
        },
      ]);
    } else {
      const product = products.find((p) => p.id === selectedItemId);
      if (!product) return;

      if (productRows.some((r) => r.productId === selectedItemId)) {
        message.warning("Sản phẩm đã được thêm");
        return;
      }

      const unit = getConsumptionUnit(product);
      setProductRows((prev) => [
        ...prev,
        {
          key: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          productType: product.productType,
          unitId: unit.id,
          unitName: unit.name,
          quantity: 0,
        },
      ]);
    }

    setSelectedItemId(undefined);
  }, [selectedItemId, equipments, products, equipmentRows, productRows, getConsumptionUnit]);

  const handleRemoveProduct = useCallback((key: string) => {
    setProductRows((prev) => prev.filter((r) => r.key !== key));
  }, []);

  const handleRemoveEquipment = useCallback((key: string) => {
    setEquipmentRows((prev) => prev.filter((r) => r.key !== key));
  }, []);

  const handleProductQuantityChange = useCallback(
    (key: string, quantity: number | null) => {
      setProductRows((prev) =>
        prev.map((r) => (r.key === key ? { ...r, quantity: quantity ?? 0 } : r))
      );
    },
    []
  );

  const handleEquipmentQuantityChange = useCallback(
    (key: string, quantity: number | null) => {
      setEquipmentRows((prev) =>
        prev.map((r) => (r.key === key ? { ...r, quantity: quantity ?? 0 } : r))
      );
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (productRows.length === 0 && equipmentRows.length === 0) {
      message.warning("Vui lòng thêm ít nhất một vật liệu hoặc thiết bị");
      return;
    }

    const invalidProducts = productRows.filter((r) => r.quantity <= 0);
    const invalidEquipments = equipmentRows.filter((r) => r.quantity <= 0);
    if (invalidProducts.length > 0 || invalidEquipments.length > 0) {
      message.error("Số lượng phải lớn hơn 0");
      return;
    }

    const items: PendingConsumptionItem[] = [
      ...productRows.map((r) => ({
        isEquipment: false,
        productId: r.productId,
        productName: r.productName,
        productType: r.productType,
        unitId: r.unitId,
        unitName: r.unitName,
        quantity: r.quantity,
      })),
      ...equipmentRows.map((r) => ({
        isEquipment: true,
        equipmentId: r.equipmentId,
        equipmentName: r.equipmentName,
        equipmentSerialNumber: r.equipmentSerialNumber,
        quantity: r.quantity,
      })),
    ];

    if (testMethodIndicatorId) {
      try {
        setSaving(true);
        await testMethodService.saveConsumption(testMethodIndicatorId, {
          items: items.map((i) => ({
            isEquipment: i.isEquipment,
            productId: i.productId,
            equipmentId: i.equipmentId,
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
  }, [productRows, equipmentRows, testMethodIndicatorId, onSave]);

  const productColumns: ColumnsType<ProductRow> = [
    {
      title: "Tên vật liệu",
      dataIndex: "productName",
      key: "productName",
      ellipsis: true,
    },
    {
      title: "Đơn vị",
      dataIndex: "unitName",
      key: "unitName",
      width: 150,
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 120,
      render: (_, record) => (
        <NumericFormat
          value={record.quantity}
          onValueChange={(values) =>
            handleProductQuantityChange(record.key, values.floatValue ?? 0)
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
          onClick={() => handleRemoveProduct(record.key)}
        />
      ),
    },
  ];

  const equipmentColumns: ColumnsType<EquipmentRow> = [
    {
      title: "Serial number",
      dataIndex: "equipmentSerialNumber",
      key: "equipmentSerialNumber",
      width: 160,
    },
    {
      title: "Tên thiết bị",
      dataIndex: "equipmentName",
      key: "equipmentName",
      ellipsis: true,
    },
    {
      title: "Lượt sử dụng",
      key: "quantity",
      width: 120,
      render: (_, record) => (
        <NumericFormat
          value={record.quantity}
          onValueChange={(values) =>
            handleEquipmentQuantityChange(record.key, values.floatValue ?? 0)
          }
          allowNegative={false}
          decimalScale={0}
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
          onClick={() => handleRemoveEquipment(record.key)}
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
      <style>{`
        .consumption-table-wrap {
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .consumption-table-wrap .ant-table-thead > tr > th,
        .consumption-table-wrap .ant-table-thead > tr > td {
          border-radius: 0 !important;
        }
      `}</style>
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
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setSelectedItemId(undefined);
              }}
              allowClear
              placeholder="Tất cả"
              style={{ width: "100%" }}
              options={[
                { value: String(ProductType.Chemical), label: ProductTypeLabels[ProductType.Chemical] },
                { value: String(ProductType.Biological), label: ProductTypeLabels[ProductType.Biological] },
                { value: String(ProductType.Supply), label: ProductTypeLabels[ProductType.Supply] },
                { value: String(ProductType.Standard), label: ProductTypeLabels[ProductType.Standard] },
                { value: String(ProductType.Solvent), label: ProductTypeLabels[ProductType.Solvent] },
                { value: EQUIPMENT_FILTER_VALUE, label: ProductTypeLabels[ProductType.Equipment] },
                { value: String(ProductType.PreparedSolution), label: ProductTypeLabels[ProductType.PreparedSolution] },
              ]}
            />
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ fontSize: 13, color: "#8c8c8c", marginBottom: 4 }}>
              {selectLabel}
            </div>
            <Select
              value={selectedItemId}
              onChange={setSelectedItemId}
              options={selectOptions}
              placeholder={selectPlaceholder}
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
            <Button type="primary" onClick={handleAdd} style={{ width: "100%" }}>
              Thêm vào
            </Button>
          </Col>
        </Row>

        <div className="consumption-table-wrap">
          <Table
            columns={productColumns}
            dataSource={productRows}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: "100%" }}
            locale={{ emptyText: "Chưa có vật liệu nào" }}
          />
        </div>

        {equipmentRows.length > 0 && (
          <div className="consumption-table-wrap" style={{ marginTop: 16 }}>
            <Table
              columns={equipmentColumns}
              dataSource={equipmentRows}
              rowKey="key"
              pagination={false}
              size="small"
              scroll={{ x: "100%" }}
            />
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default MaterialConsumptionModal;
