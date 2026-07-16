import React, { useMemo, useState, useCallback } from "react";
import { Card, Button, Space, Dropdown, Typography, message } from "antd";
import { PlusOutlined, DownloadOutlined, DownOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { useGoodsReceiptList, useGoodsReceiptActions } from "./hooks";
import { GoodsReceiptTable, ColumnConfigPopover } from "./components";
import { getGoodsReceiptColumns, ALL_COLUMNS, COLUMN_VISIBILITY_KEY } from "./constants";
import {
  goodsReceiptService,
  GoodsReceiptType,
  GoodsReceiptOrderStatus,
  OrderStatusLabels,
  ReceiptTypeLabels,
} from "../../services/goodsReceiptService";
import dayjs from "dayjs";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import Icon from "../../components/common/Icon";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";
import "./GoodsReceiptList.css";

const { Text } = Typography;

const loadVisibleKeys = (): Set<string> => {
  try {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
};

const STAT_CARDS = [
  {
    key: "ordering",
    title: "Đang đặt hàng",
    iconBg: "blue",
    icon: "cart-check",
    filterValue: GoodsReceiptOrderStatus.Ordering,
  },
  {
    key: "waitingReceipt",
    title: "Chờ nhận & Nghiệm thu",
    iconBg: "green",
    icon: "box-seam",
    filterValue: GoodsReceiptOrderStatus.WaitingReceipt,
  },
];

const GoodsReceiptList: React.FC = () => {
  const {
    data,
    totalCount,
    loading,
    searchText,
    orderStatusFilter,
    receiptTypeFilter,
    currentPage,
    pageSize,
    stats,
    setSearchText,
    handleOrderStatusChange,
    handleReceiptTypeChange,
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

  const handleStatCardClick = useCallback((filterValue: GoodsReceiptOrderStatus) => {
    if (orderStatusFilter === filterValue) {
      handleOrderStatusChange(undefined);
    } else {
      handleOrderStatusChange(filterValue);
    }
  }, [orderStatusFilter, handleOrderStatusChange]);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const filters = {
        search: searchText || undefined,
        orderStatus: orderStatusFilter,
        receiptType: receiptTypeFilter,
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
        "Loại phiếu": ReceiptTypeLabels[item.receiptType] || "",
        "Ngày cần hàng": item.expectedDeliveryDate
          ? dayjs(item.expectedDeliveryDate).format("DD/MM/YYYY")
          : "",
        "Trạng thái": OrderStatusLabels[item.orderStatus] || "",
        "Người tạo": item.creatorName || "",
        "Ghi chú": item.notes || "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Đặt hàng");
      XLSX.writeFile(wb, `dat-hang_${new Date().toISOString().slice(0, 10)}.xlsx`);
      message.success("Xuất Excel thành công");
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể xuất Excel"));
    } finally {
      setExporting(false);
    }
  }, [searchText, orderStatusFilter, receiptTypeFilter]);

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
      <div className="dashboard-stats-grid goods-receipt-stats-grid">
        {STAT_CARDS.map((stat) => {
          const value = stats[stat.key as keyof typeof stats];
          const isActive = orderStatusFilter === stat.filterValue;
          return (
            <Card
              key={stat.key}
              className={`dashboard-stat-card task-stat-clickable${isActive ? " task-stat-active" : ""}`}
              bordered={false}
              onClick={() => handleStatCardClick(stat.filterValue)}
            >
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-info">
                  <Text className="dashboard-stat-title">{stat.title}</Text>
                  <div className="dashboard-stat-value">{value}</div>
                </div>
                <div className={`dashboard-stat-icon ${stat.iconBg}`}>
                  <Icon name={stat.icon} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card
        className="list-card"
        title="Danh sách đặt hàng"
        extra={
          <Space>
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
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "goods",
                      label: "Tạo yêu cầu mua sắm",
                      onClick: () => handleCreate(GoodsReceiptType.Goods),
                    },
                    {
                      key: "equipment",
                      label: "Tạo phiếu nhập thiết bị",
                      onClick: () => handleCreate(GoodsReceiptType.Equipment),
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <Button type="primary" icon={<PlusOutlined />}>
                  Thêm mới <DownOutlined />
                </Button>
              </Dropdown>
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
          receiptTypeFilter={receiptTypeFilter}
          canDelete={false}
          selectedRowKeys={selectedRowKeys}
          onSearchChange={setSearchText}
          onReceiptTypeChange={handleReceiptTypeChange}
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
