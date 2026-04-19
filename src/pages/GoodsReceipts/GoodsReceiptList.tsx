import React, { useMemo, useState, useCallback } from "react";
import { Card, Button, Space, message } from "antd";
import { PlusOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { useGoodsReceiptList, useGoodsReceiptActions } from "./hooks";
import { GoodsReceiptTable, ColumnConfigPopover } from "./components";
import { getGoodsReceiptColumns, ALL_COLUMNS, COLUMN_VISIBILITY_KEY } from "./constants";
import {
  goodsReceiptService,
  WarehouseStatusLabels,
  OrderStatusLabels,
  PaymentStatusLabels,
} from "../../services/goodsReceiptService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import "../../styles/ListCard.css";

const loadVisibleKeys = (): Set<string> => {
  try {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
};

const GoodsReceiptList: React.FC = () => {
  const {
    data,
    totalCount,
    loading,
    searchText,
    warehouseStatusFilter,
    orderStatusFilter,
    paymentStatusFilter,
    currentPage,
    pageSize,
    setSearchText,
    handleWarehouseStatusChange,
    handleOrderStatusChange,
    handlePaymentStatusChange,
    handleDateRangeChange,
    handleSortChange,
    fetchData,
    handlePageChange,
  } = useGoodsReceiptList();

  const {
    selectedRowKeys,
    setSelectedRowKeys,
    handleCreate,
    handleView,
    handleEdit,
    handleDelete,
    handleBatchDelete,
  } = useGoodsReceiptActions({ fetchData });

  const canCreate = authService.hasPermission(PERMISSIONS.GoodsReceipts.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.GoodsReceipts.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.GoodsReceipts.Delete);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(loadVisibleKeys);
  const [exporting, setExporting] = useState(false);

  const handleVisibilityChange = (keys: Set<string>) => {
    setVisibleKeys(keys);
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify([...keys]));
  };

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const filters = {
        search: searchText || undefined,
        warehouseStatus: warehouseStatusFilter,
        orderStatus: orderStatusFilter,
        paymentStatus: paymentStatusFilter,
      };
      const PAGE_LIMIT = 200;
      let allItems: typeof data = [];
      let page = 1;
      let total = 0;
      do {
        const result = await goodsReceiptService.getList({ ...filters, page, limit: PAGE_LIMIT });
        const items = result?.items || [];
        allItems = [...allItems, ...items];
        total = result?.totalCount || 0;
        page++;
      } while (allItems.length < total);

      if (allItems.length === 0) {
        message.warning("Không có dữ liệu để xuất");
        return;
      }

      const rows = allItems.map((item, idx) => ({
        STT: idx + 1,
        "ID đặt hàng": item.code,
        "Tên nhà cung cấp": item.supplierName,
        "Ngày cấp chứng từ": item.documentDate
          ? new Date(item.documentDate).toLocaleDateString("vi-VN")
          : "",
        "Trạng thái kho": WarehouseStatusLabels[item.warehouseStatus] || "",
        "Trạng thái đơn": OrderStatusLabels[item.orderStatus] || "",
        "Trạng thái thanh toán": PaymentStatusLabels[item.paymentStatus] || "",
        "Tổng tiền sau VAT": item.totalAmountAfterVat,
        "Người tạo": item.creatorName || "",
        "Ghi chú": item.notes || "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Phiếu nhập hàng");
      XLSX.writeFile(wb, `phieu-nhap-hang_${new Date().toISOString().slice(0, 10)}.xlsx`);
      message.success("Xuất Excel thành công");
    } catch {
      message.error("Không thể xuất Excel");
    } finally {
      setExporting(false);
    }
  }, [searchText, warehouseStatusFilter, orderStatusFilter, paymentStatusFilter]);

  const columns = useMemo(
    () =>
      getGoodsReceiptColumns(
        visibleKeys,
        handleView,
        handleEdit,
        handleDelete,
        canEdit,
        canDelete,
        currentPage,
        pageSize
      ),
    [visibleKeys, handleView, handleEdit, handleDelete, canEdit, canDelete, currentPage, pageSize]
  );

  return (
    <div>
      <Card
        className="list-card"
        title="Quản lý phiếu nhập hàng"
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
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              loading={exporting}
            >
              Xuất Excel
            </Button>
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
        <GoodsReceiptTable
          loading={loading}
          data={data}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          columns={columns}
          searchText={searchText}
          warehouseStatusFilter={warehouseStatusFilter}
          orderStatusFilter={orderStatusFilter}
          paymentStatusFilter={paymentStatusFilter}
          canDelete={canDelete}
          selectedRowKeys={selectedRowKeys}
          onSearchChange={setSearchText}
          onWarehouseStatusChange={handleWarehouseStatusChange}
          onOrderStatusChange={handleOrderStatusChange}
          onPaymentStatusChange={handlePaymentStatusChange}
          onDateRangeChange={handleDateRangeChange}
          onSortChange={handleSortChange}
          onPaginationChange={handlePageChange}
          onSelectionChange={setSelectedRowKeys}
        />
      </Card>
    </div>
  );
};

export default GoodsReceiptList;
