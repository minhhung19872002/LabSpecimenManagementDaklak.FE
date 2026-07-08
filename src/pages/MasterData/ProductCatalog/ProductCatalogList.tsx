import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FC, ReactNode } from "react";
import {
  Row,
  Col,
  Input,
  Select,
  Spin,
  Table,
  Tag,
  Space,
  Tooltip,
  Button,
  Empty,
  message,
} from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  productService,
  ProductDto,
  ProductSkuDto,
  ProductType,
  ProductTypeLabels,
} from "../../../services/productService";
import { useProductActions } from "../../Products/hooks/useProductActions";
import { ProductModal } from "../../Products/components";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { IndicatorName } from "../../../components/common";
import type { ProductCatalogActions, ProductCatalogTabProps } from ".";

const DEFAULT_PAGE_SIZE = 50;
const DEBOUNCE_MS = 400;

const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  [ProductType.Chemical]: "blue",
  [ProductType.Biological]: "green",
  [ProductType.Supply]: "orange",
  [ProductType.Standard]: "purple",
  [ProductType.Solvent]: "cyan",
  [ProductType.Equipment]: "magenta",
};

const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.Chemical, label: "Hóa chất" },
  { value: ProductType.Biological, label: "Sinh phẩm" },
  { value: ProductType.Supply, label: "Vật tư tiêu hao" },
  { value: ProductType.Standard, label: "Chất chuẩn" },
  { value: ProductType.Solvent, label: "Dung môi" },
  { value: ProductType.Equipment, label: "Thiết bị phòng Lab" },
];

const ConversionChain: FC<{ sku: ProductSkuDto }> = ({ sku }) => {
  if (!sku.packagingQuantity || !sku.packagingUnitName) return <>-</>;
  const hasVolume = sku.volumePerUnit && sku.volumeUnitName;
  const arrow = <span style={{ color: "#8c8c8c", margin: "0 4px" }}>→</span>;

  const parts: ReactNode[] = [];
  if (sku.baseUnitName) {
    parts.push(<Tag color="blue" key="base">{sku.baseUnitName}</Tag>);
    parts.push(<span key="a1">{arrow}</span>);
  }
  parts.push(<Tag color="orange" key="pkg">{sku.packagingQuantity} {sku.packagingUnitName}</Tag>);
  if (hasVolume) {
    const total = (sku.packagingQuantity * sku.volumePerUnit!).toLocaleString();
    parts.push(<span key="a2">{arrow}</span>);
    parts.push(<Tag color="green" key="vol">{total} {sku.volumeUnitName}</Tag>);
  }
  return <span style={{ display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>{parts}</span>;
};

const ConversionRate: FC<{ sku: ProductSkuDto }> = ({ sku }) => {
  if (!sku.packagingUnitName || !sku.volumePerUnit || !sku.volumeUnitName) return <>-</>;
  const arrow = <span style={{ color: "#8c8c8c", margin: "0 4px" }}>→</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
      <Tag color="orange">1 {sku.packagingUnitName}</Tag>
      {arrow}
      <Tag color="green">{sku.volumePerUnit.toLocaleString()} {sku.volumeUnitName}</Tag>
    </span>
  );
};

const ProductCatalogList = forwardRef<ProductCatalogActions, ProductCatalogTabProps>(
  ({ onDataChange, refreshKey }, ref) => {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [productTypeFilter, setProductTypeFilter] = useState<ProductType | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, []);

    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const result = await productService.getList({
          page: currentPage,
          limit: pageSize,
          search: debouncedSearch || undefined,
          productType: productTypeFilter,
        });
        setProducts(result?.items || []);
        setTotalCount(result?.totalCount || 0);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        message.error("Không thể tải danh sách vật tư");
        setProducts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }, [currentPage, pageSize, debouncedSearch, productTypeFilter]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    const isFirstMount = useRef(true);
    const fetchDataRef = useRef(fetchData);
    useLayoutEffect(() => { fetchDataRef.current = fetchData; });

    useEffect(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      if (refreshKey !== undefined) {
        fetchDataRef.current();
      }
    }, [refreshKey]);

    const fetchDataAndNotify = useCallback(async () => {
      await fetchData();
      onDataChange?.();
    }, [fetchData, onDataChange]);

    const {
      modalOpen,
      editingProduct,
      modalLoading,
      handleCreate,
      handleEdit,
      handleDelete,
      handleToggleActive: _handleToggleActive,
      handleModalOk,
      handleModalCancel,
    } = useProductActions({ fetchData: fetchDataAndNotify });

    const canEdit = authService.hasPermission(PERMISSIONS.Products.Edit);
    const canDelete = authService.hasPermission(PERMISSIONS.Products.Delete);

    useImperativeHandle(ref, () => ({
      handleCreate,
    }));

    const columns = useMemo((): ColumnsType<ProductDto> => {
      const cols: ColumnsType<ProductDto> = [
        {
          title: "Tên vật tư / Hóa chất",
          dataIndex: "name",
          key: "name",
          ellipsis: true,
          render: (_: string, record: ProductDto) => (
            <Space size={4}>
              <IndicatorName name={record.name} formattedName={record.formattedName} />
              {record.isDraft && (
                <Tag color="warning" style={{ fontSize: 11, lineHeight: "18px", padding: "0 4px" }}>
                  Nháp
                </Tag>
              )}
            </Space>
          ),
        },
        {
          title: "Mã nhận dạng",
          dataIndex: "identificationCode",
          key: "identificationCode",
          width: 160,
          ellipsis: true,
          render: (v: string) => v || "-",
        },
        {
          title: "Loại sản phẩm",
          dataIndex: "productType",
          key: "productType",
          width: 140,
          render: (type: ProductType) => (
            <Tag color={PRODUCT_TYPE_COLORS[type]}>{ProductTypeLabels[type]}</Tag>
          ),
        },
        {
          title: "Đơn vị tiêu hao",
          key: "consumableUnit",
          width: 140,
          render: (_: any, record: ProductDto) => {
            const firstSku = record.skus?.[0];
            return firstSku?.volumeUnitName || "-";
          },
        },
        {
          title: "Điều kiện bảo quản",
          dataIndex: "storageConditions",
          key: "storageConditions",
          width: 180,
          ellipsis: true,
          render: (v: string) => v || "-",
        },
        {
          title: "Số SKU",
          dataIndex: "skuCount",
          key: "skuCount",
          width: 80,
          align: "center",
          render: (count: number) => count || 0,
        },
      ];

      if (canEdit || canDelete) {
        cols.push({
          title: "Thao tác",
          key: "actions",
          width: 100,
          align: "center",
          render: (_: any, record: ProductDto) => (
            <Space size="small">
              {canEdit && (
                <Tooltip title="Sửa">
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  />
                </Tooltip>
              )}
              {canDelete && (
                <Tooltip title="Xóa">
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record)}
                  />
                </Tooltip>
              )}
            </Space>
          ),
        });
      }

      return cols;
    }, [canEdit, canDelete, handleEdit, handleDelete]);

    const skuColumns = useMemo((): ColumnsType<ProductSkuDto> => {
      const cols: ColumnsType<ProductSkuDto> = [
        {
          title: "SKU Hãng sản xuất",
          dataIndex: "manufacturerCode",
          key: "manufacturerCode",
          width: 160,
          render: (v: string) => v || "-",
        },
        {
          title: "Hãng sản xuất",
          dataIndex: "manufacturerName",
          key: "manufacturerName",
          width: 180,
          ellipsis: true,
          render: (v: string) => v || "-",
        },
        {
          title: "Chuỗi quy đổi đơn vị tính",
          key: "conversionChain",
          width: 350,
          render: (_: any, record: ProductSkuDto) => <ConversionChain sku={record} />,
        },
        {
          title: "Định mức quy đổi lẻ",
          key: "unitConversion",
          width: 250,
          render: (_: any, record: ProductSkuDto) => <ConversionRate sku={record} />,
        },
      ];

      return cols;
    }, []);

    return (
      <>
        <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "16px 16px 0" }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo mã, tên vật tư..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => {
                const value = e.target.value;
                setSearchText(value);
                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                debounceTimer.current = setTimeout(() => {
                  setDebouncedSearch(value);
                  setCurrentPage(1);
                }, DEBOUNCE_MS);
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Loại sản phẩm"
              value={productTypeFilter}
              onChange={(value) => {
                setProductTypeFilter(value);
                setCurrentPage(1);
              }}
              options={PRODUCT_TYPE_OPTIONS}
              style={{ width: "100%" }}
              allowClear
            />
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={products}
            rowKey="id"
            expandable={{
              expandedRowRender: (record) => {
                const skus = record.skus || [];
                return (
                  <div style={{ padding: "8px 0", marginLeft: 16 }}>
                    {skus.length > 0 ? (
                      <Table
                        columns={skuColumns}
                        dataSource={skus}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Chưa có SKU nào"
                      />
                    )}
                  </div>
                );
              },
              rowExpandable: () => true,
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
            }}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalCount,
              showSizeChanger: true,
              pageSizeOptions: [50, 100, 150],
              showTotal: (total, range) => (
                <>
                  Hiển thị{" "}
                  <b>
                    {range[0]}-{range[1]}/{total}
                  </b>
                </>
              ),
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
          />
        </Spin>

        <ProductModal
          open={modalOpen}
          loading={modalLoading}
          editingProduct={editingProduct}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
        />
      </>
    );
  },
);

ProductCatalogList.displayName = "ProductCatalogList";
export default ProductCatalogList;
