import React, { useMemo, useState } from "react";
import { Card, Button, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useSupplierList, useSupplierActions } from "./hooks";
import { SupplierTable, SupplierModal, ColumnConfigPopover } from "./components";
import { getSupplierColumns, ALL_COLUMNS, COLUMN_VISIBILITY_KEY } from "./constants";
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

const SupplierList: React.FC = () => {
  const {
    suppliers,
    totalCount,
    loading,
    searchText,
    currentPage,
    pageSize,
    setSearchText,
    fetchData,
    handlePageChange,
  } = useSupplierList();

  const {
    modalOpen,
    editingSupplier,
    modalLoading,
    handleCreate,
    handleEdit,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  } = useSupplierActions({ fetchData });

  const canCreate = authService.hasPermission(PERMISSIONS.Suppliers.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.Suppliers.Edit);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(loadVisibleKeys);

  // Save to localStorage when changed
  const handleVisibilityChange = (keys: Set<string>) => {
    setVisibleKeys(keys);
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify([...keys]));
  };

  const columns = useMemo(
    () =>
      getSupplierColumns(
        visibleKeys,
        handleEdit,
        handleToggleActive,
        canEdit,
        currentPage,
        pageSize
      ),
    [visibleKeys, handleEdit, handleToggleActive, canEdit, currentPage, pageSize]
  );

  return (
    <div>
      <Card
        className="list-card"
        title="Quản lý danh sách nhà cung cấp"
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
        <SupplierTable
          loading={loading}
          data={suppliers}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          columns={columns}
          searchText={searchText}
          onSearchChange={setSearchText}
          onPaginationChange={handlePageChange}
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
