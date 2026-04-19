import React, { useMemo, useState, useEffect } from "react";
import { Card, Button, Space } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useSupplierList, useSupplierActions } from "./hooks";
import { SupplierTable, SupplierModal, ColumnConfigPopover } from "./components";
import { getSupplierColumns, ALL_COLUMNS, COLUMN_VISIBILITY_KEY } from "./constants";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { supplierService } from "../../services/supplierService";
import "../../styles/ListCard.css";

const loadVisibleKeys = (): Set<string> => {
  try {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
};

const SupplierList: React.FC = () => {
  const {
    suppliers,
    totalCount,
    loading,
    searchText,
    supplierGroupFilter,
    currentPage,
    pageSize,
    setSearchText,
    handleSupplierGroupChange,
    handleSortChange,
    fetchData,
    handlePageChange,
  } = useSupplierList();

  const {
    modalOpen,
    editingSupplier,
    modalLoading,
    selectedRowKeys,
    setSelectedRowKeys,
    handleCreate,
    handleEdit,
    handleDelete,
    handleBatchDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  } = useSupplierActions({ fetchData });

  const canCreate = authService.hasPermission(PERMISSIONS.Suppliers.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.Suppliers.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.Suppliers.Delete);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(loadVisibleKeys);
  const [supplierGroups, setSupplierGroups] = useState<string[]>([]);

  useEffect(() => {
    supplierService.getGroups().then(setSupplierGroups).catch(() => setSupplierGroups([]));
  }, []);

  const handleVisibilityChange = (keys: Set<string>) => {
    setVisibleKeys(keys);
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify([...keys]));
  };

  const columns = useMemo(
    () =>
      getSupplierColumns(
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
        title="Quản lý danh sách nhà cung cấp"
        extra={
          <Space>
            {canDelete && selectedRowKeys.length > 0 && (
              <Button
                icon={<DeleteOutlined style={{ color: "#fff" }} />}
                onClick={handleBatchDelete}
                style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f", color: "#fff" }}
              >
                Xóa ({selectedRowKeys.length})
              </Button>
            )}
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
        <SupplierTable
          loading={loading}
          data={suppliers}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          columns={columns}
          searchText={searchText}
          supplierGroupFilter={supplierGroupFilter}
          supplierGroups={supplierGroups}
          canDelete={canDelete}
          selectedRowKeys={selectedRowKeys}
          onSearchChange={setSearchText}
          onSupplierGroupChange={handleSupplierGroupChange}
          onSortChange={handleSortChange}
          onPaginationChange={handlePageChange}
          onSelectionChange={setSelectedRowKeys}
        />
      </Card>

      <SupplierModal
        open={modalOpen}
        loading={modalLoading}
        editingSupplier={editingSupplier}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default SupplierList;
