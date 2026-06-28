import React, { useMemo, useState } from "react";
import { Card, Button, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useProductList, useProductActions } from "./hooks";
import { ProductTable, ProductModal, ColumnConfigPopover } from "./components";
import { getProductColumns, ALL_COLUMNS, COLUMN_VISIBILITY_KEY } from "./constants";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import "../../styles/ListCard.css";

// Load visibility from localStorage
const loadVisibleKeys = (): Set<string> => {
  try {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
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
    currentPage,
    pageSize,
    setSearchText,
    setProductTypeFilter,
    setIsDraftFilter,
    handleSortChange,
    fetchData,
    handlePageChange,
  } = useProductList();

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
  } = useProductActions({ fetchData });

  const canCreate = authService.hasPermission(PERMISSIONS.Products.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.Products.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.Products.Delete);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(loadVisibleKeys);

  // Save to localStorage when changed
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
    <div>
      <Card
        className="list-card"
        title="Quản lý danh sách vật tư"
        extra={
          <Space>
            <ColumnConfigPopover
              visibleKeys={visibleKeys}
              onChange={handleVisibilityChange}
            />
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Thêm mới
              </Button>
            )}
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
          onSearchChange={setSearchText}
          onProductTypeChange={setProductTypeFilter}
          onIsDraftChange={setIsDraftFilter}
          onSortChange={handleSortChange}
          onPaginationChange={handlePageChange}
          onRowDoubleClick={(record) => navigate(`/products/${record.id}/sources`)}
        />
      </Card>

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
