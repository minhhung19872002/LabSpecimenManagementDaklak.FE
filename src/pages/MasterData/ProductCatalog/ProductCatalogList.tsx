import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Row, Col, Input, Select, Spin, Table, Tag, Space, Tooltip, Button, Switch } from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { message } from "antd";
import {
  productService,
  ProductDto,
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
};

const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.Chemical, label: "Hóa chất" },
  { value: ProductType.Biological, label: "Sinh phẩm" },
  { value: ProductType.Supply, label: "Vật tư tiêu hao" },
  { value: ProductType.Standard, label: "Chất chuẩn" },
  { value: ProductType.Solvent, label: "Dung môi" },
];

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
    useEffect(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      if (refreshKey !== undefined) {
        fetchData();
      }
    }, [refreshKey, fetchData]);

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
      handleToggleActive,
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
          title: "STT",
          key: "index",
          width: 60,
          align: "center",
          render: (_: any, __: ProductDto, index: number) =>
            (currentPage - 1) * pageSize + index + 1,
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
          title: "Tên vật tư",
          dataIndex: "name",
          key: "name",
          width: 250,
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
          title: "Phân loại",
          dataIndex: "productType",
          key: "productType",
          width: 130,
          render: (type: ProductType) => (
            <Tag color={PRODUCT_TYPE_COLORS[type]}>{ProductTypeLabels[type]}</Tag>
          ),
        },
        {
          title: "Trạng thái",
          dataIndex: "isActive",
          key: "isActive",
          width: 130,
          align: "center",
          render: (isActive: boolean, record: ProductDto) => (
            <Switch
              checked={isActive}
              checkedChildren="Hoạt động"
              unCheckedChildren="Ngừng"
              onChange={() => handleToggleActive(record)}
              disabled={!canEdit}
            />
          ),
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
    }, [currentPage, pageSize, canEdit, canDelete, handleEdit, handleDelete, handleToggleActive]);

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
            pagination={{
              current: currentPage,
              pageSize: pageSize,
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
  }
);

ProductCatalogList.displayName = "ProductCatalogList";
export default ProductCatalogList;
