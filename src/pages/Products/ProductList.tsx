import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Button, Space, Tree, Spin, Tooltip, Typography } from "antd";
import type { TreeDataNode } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useProductList, useProductActions } from "./hooks";
import { ProductTable, ProductModal, ColumnConfigPopover } from "./components";
import { getProductColumns, ALL_COLUMNS, COLUMN_VISIBILITY_KEY } from "./constants";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { PATH_ROUTES } from "../../constants/routes";
import { warehouseService, WarehouseDto } from "../../services/masterDataService";
import "../../styles/ListCard.css";
import "./ProductList.css";

const { Text } = Typography;

const EllipsisTooltip: React.FC<{ text: string }> = ({ text }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  const handleMouseEnter = () => {
    if (ref.current) {
      setIsOverflow(ref.current.scrollWidth > ref.current.clientWidth);
    }
  };

  return (
    <Tooltip title={isOverflow ? text : undefined} mouseEnterDelay={0.3}>
      <span ref={ref} className="tree-node-title" onMouseEnter={handleMouseEnter}>
        {text}
      </span>
    </Tooltip>
  );
};

const loadVisibleKeys = (): Set<string> => {
  try {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
};

const buildTree = (warehouses: WarehouseDto[]): TreeDataNode[] => {
  const map = new Map<string, TreeDataNode & { name: string }>();
  for (const w of warehouses) {
    map.set(w.id, {
      key: w.id,
      title: <EllipsisTooltip text={w.name} />,
      children: [],
      name: w.name,
    });
  }
  const roots: (TreeDataNode & { name: string })[] = [];
  for (const w of warehouses) {
    const node = map.get(w.id)!;
    if (w.parentWarehouseId && map.has(w.parentWarehouseId)) {
      (map.get(w.parentWarehouseId)!.children as any[]).push(node);
    } else {
      roots.push(node);
    }
  }
  const sortNodes = (nodes: (TreeDataNode & { name: string })[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    for (const n of nodes) {
      if (n.children && (n.children as any[]).length > 0) sortNodes(n.children as any[]);
    }
  };
  sortNodes(roots);
  return roots;
};

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    totalCount,
    loading,
    searchText,
    productTypeFilter,
    isDraftFilter,
    warehouseId,
    currentPage,
    pageSize,
    setSearchText,
    setProductTypeFilter,
    setIsDraftFilter,
    setWarehouseId,
    handleSortChange,
    fetchData,
    handlePageChange,
  } = useProductList();

  const {
    modalOpen,
    editingProduct,
    modalLoading,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  } = useProductActions({ fetchData });

  const canEdit = authService.hasPermission(PERMISSIONS.Products.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.Products.Delete);
  const canCreateGoodsReceipt = authService.hasPermission(PERMISSIONS.GoodsReceipts.Create);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(loadVisibleKeys);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    const loadWarehouses = async () => {
      setWarehouseLoading(true);
      try {
        const list = await warehouseService.getActive();
        setWarehouses(list);
        const roots = list.filter((w) => w.level === 0).sort((a, b) => a.name.localeCompare(b.name, "vi"));
        if (roots.length > 0 && !warehouseId) {
          setWarehouseId(roots[0].id);

        }
      } catch {
        // ignore
      } finally {
        setWarehouseLoading(false);
      }
    };
    loadWarehouses();
  }, []);

  const treeData = useMemo(() => buildTree(warehouses), [warehouses]);

  const handleTreeSelect = useCallback(
    (selectedKeys: React.Key[]) => {
      if (selectedKeys.length > 0) {
        const id = selectedKeys[0] as string;
        setWarehouseId(id);
      }
    },
    [warehouses, setWarehouseId]
  );

  const handleVisibilityChange = (keys: Set<string>) => {
    setVisibleKeys(keys);
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify([...keys]));
  };

  const columns = useMemo(
    () =>
      getProductColumns(
        visibleKeys,
        handleEdit,
        handleDelete,
        handleToggleActive,
        canEdit,
        canDelete,
        currentPage,
        pageSize
      ),
    [visibleKeys, handleEdit, handleDelete, handleToggleActive, canEdit, canDelete, currentPage, pageSize]
  );

  return (
    <div className="product-list-layout">
      {!treeCollapsed && (
        <div className="product-tree-panel">
          <div className="product-tree-header">
            <Text strong>Sơ đồ kho</Text>
            <Button
              type="text"
              size="small"
              icon={<MenuFoldOutlined />}
              onClick={() => setTreeCollapsed(true)}
            />
          </div>
          <div className="product-tree-content">
            {warehouseLoading ? (
              <div style={{ textAlign: "center", padding: 24 }}><Spin size="small" /></div>
            ) : (
              <Tree
                treeData={treeData}
                selectedKeys={warehouseId ? [warehouseId] : []}
                onSelect={handleTreeSelect}
                defaultExpandAll
                blockNode
              />
            )}
          </div>
        </div>
      )}

      {treeCollapsed && (
        <Button
          className="tree-expand-btn"
          icon={<MenuUnfoldOutlined />}
          onClick={() => setTreeCollapsed(false)}
          size="small"
        >
          Sơ đồ kho
        </Button>
      )}

      <div className="product-table-panel">
        <Card
          className="list-card"
          title="Quản lý danh sách vật tư"
          extra={
            <Space>
              {canCreateGoodsReceipt && (
                selectedRowKeys.length > 0 ? (
                  <Button
                    type="primary"
                    onClick={() =>
                      navigate(PATH_ROUTES.goodsReceipts.create, {
                        state: { preselectedProductIds: selectedRowKeys.map(String) },
                      })
                    }
                  >
                    Tạo phiếu dự trù ({selectedRowKeys.length})
                  </Button>
                ) : (
                  <Button disabled style={{ backgroundColor: "#d9d9d9", borderColor: "#d9d9d9", color: "rgba(0,0,0,0.45)" }}>
                    Tạo phiếu dự trù
                  </Button>
                )
              )}
              <ColumnConfigPopover
                visibleKeys={visibleKeys}
                onChange={handleVisibilityChange}
              />
            </Space>
          }
        >
          <ProductTable
            loading={loading}
            data={products}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            columns={columns}
            searchText={searchText}
            productTypeFilter={productTypeFilter}
            isDraftFilter={isDraftFilter}
            selectedRowKeys={selectedRowKeys}
            onSearchChange={setSearchText}
            onProductTypeChange={setProductTypeFilter}
            onIsDraftChange={setIsDraftFilter}
            onSortChange={handleSortChange}
            onPaginationChange={handlePageChange}
            onSelectionChange={setSelectedRowKeys}
            onRowDoubleClick={(record) => navigate(`/products/${record.id}/sources`)}
          />
        </Card>
      </div>

      <ProductModal
        open={modalOpen}
        loading={modalLoading}
        editingProduct={editingProduct}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default ProductList;
