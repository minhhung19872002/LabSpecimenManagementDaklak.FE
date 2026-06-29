import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Input, Select, DatePicker, Button, Table, Tag, Spin, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useWarehouseImportList } from "./hooks/useWarehouseImportList";
import {
  WarehouseImportReceiptListDto,
  WarehouseImportReceiptStatus,
  WarehouseImportReceiptDisplayStatusFilter,
  WarehouseImportReceiptDisplayStatusFilterLabels,
} from "../../services/warehouseImportReceiptService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";
import "../TaskManagement/TaskManagement.css";

const { RangePicker } = DatePicker;

const DISPLAY_STATUS_OPTIONS = [
  { value: WarehouseImportReceiptDisplayStatusFilter.All, label: WarehouseImportReceiptDisplayStatusFilterLabels[WarehouseImportReceiptDisplayStatusFilter.All] },
  { value: WarehouseImportReceiptDisplayStatusFilter.InProgress, label: WarehouseImportReceiptDisplayStatusFilterLabels[WarehouseImportReceiptDisplayStatusFilter.InProgress] },
  { value: WarehouseImportReceiptDisplayStatusFilter.Completed, label: WarehouseImportReceiptDisplayStatusFilterLabels[WarehouseImportReceiptDisplayStatusFilter.Completed] },
  { value: WarehouseImportReceiptDisplayStatusFilter.Defective, label: WarehouseImportReceiptDisplayStatusFilterLabels[WarehouseImportReceiptDisplayStatusFilter.Defective] },
];

const WarehouseImportList: React.FC = () => {
  const navigate = useNavigate();
  const {
    data,
    totalCount,
    loading,
    searchText,
    displayStatusFilter,
    statCardSelected,
    filterDateRange,
    currentPage,
    pageSize,
    stats,
    statsLoading,
    setSearchText,
    handleDisplayStatusChange,
    handleFilterDateRangeChange,
    handleStatCardClick,
    handlePageChange,
  } = useWarehouseImportList();

  const canCreate = authService.hasPermission(PERMISSIONS.WarehouseImportReceipts.Create);

  const columns: ColumnsType<WarehouseImportReceiptListDto> = [
    {
      title: "Mã phiếu nhập",
      dataIndex: "code",
      key: "code",
      render: (code: string, record) => (
        <a onClick={() => navigate(`/warehouse-imports/edit/${record.id}`)}>{code}</a>
      ),
    },
    {
      title: "Phiếu mua hàng",
      dataIndex: "goodsReceiptCode",
      key: "goodsReceiptCode",
      render: (code: string, record) => (
        <a onClick={() => navigate(`/goods-receipts/${record.goodsReceiptId}`)}>{code}</a>
      ),
    },
    {
      title: "Ngày nhận thực tế",
      dataIndex: "actualImportDate",
      key: "actualImportDate",
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Thủ kho thực hiện",
      dataIndex: "warehouseKeeperName",
      key: "warehouseKeeperName",
      render: (value?: string) => value || "-",
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplierName",
      key: "supplierName",
      render: (value?: string) => value || "-",
    },
    {
      title: "Người liên hệ",
      dataIndex: "contactPersonName",
      key: "contactPersonName",
      render: (value?: string) => value || "-",
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => {
        const isCompleted = record.status === WarehouseImportReceiptStatus.Completed;
        const color = isCompleted ? (record.hasDefectiveItem ? "red" : "green") : "orange";
        const label = isCompleted ? (record.hasDefectiveItem ? "Hàng lỗi" : "Hoàn thành") : "Đang thực hiện";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/warehouse-imports/edit/${record.id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div className="dashboard-stats-grid">
        <Card
          className={`dashboard-stat-card task-stat-clickable${
            statCardSelected && displayStatusFilter === WarehouseImportReceiptDisplayStatusFilter.All ? " task-stat-active" : ""
          }`}
          bordered={false}
          onClick={() => handleStatCardClick(WarehouseImportReceiptDisplayStatusFilter.All)}
        >
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-title">Tổng phiếu nhập / tháng</span>
              <div className="dashboard-stat-value">{statsLoading ? <Spin size="small" /> : stats.totalReceipts}</div>
            </div>
          </div>
        </Card>
        <Card
          className={`dashboard-stat-card task-stat-clickable${
            statCardSelected && displayStatusFilter === WarehouseImportReceiptDisplayStatusFilter.Defective ? " task-stat-active" : ""
          }`}
          bordered={false}
          onClick={() => handleStatCardClick(WarehouseImportReceiptDisplayStatusFilter.Defective)}
        >
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-title">Lô hàng bị lỗi</span>
              <div className="dashboard-stat-value">{statsLoading ? <Spin size="small" /> : stats.defectiveLots}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card
        className="list-card"
        title="Quản lý nhập kho"
        extra={
          canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/warehouse-imports/create")}>
              Tạo phiếu nhập kho
            </Button>
          )
        }
      >
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo mã phiếu, nhà cung cấp..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Trạng thái"
              value={displayStatusFilter}
              onChange={handleDisplayStatusChange}
              allowClear
              style={{ width: "100%" }}
              options={DISPLAY_STATUS_OPTIONS}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: "100%" }}
              value={filterDateRange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              onChange={(dates) => handleFilterDateRangeChange(dates as any)}
            />
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            scroll={{ x: 1100 }}
            onRow={(record) => ({
              onDoubleClick: () => navigate(`/warehouse-imports/edit/${record.id}`),
              style: { cursor: "pointer" },
            })}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalCount,
              showSizeChanger: true,
              pageSizeOptions: [20, 50, 100],
              showTotal: (total, range) => (
                <>
                  Hiển thị <b>{range[0]}-{range[1]}/{total}</b>
                </>
              ),
              onChange: handlePageChange,
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default WarehouseImportList;
