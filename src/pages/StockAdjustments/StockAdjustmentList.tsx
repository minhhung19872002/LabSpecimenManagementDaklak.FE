import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  stockAdjustmentService,
  StockAdjustmentListDto,
  StockAdjustmentStatus,
  STOCK_ADJUSTMENT_STATUS_OPTIONS,
  StockAdjustmentStatusLabels,
  StockAdjustmentStatusColors,
} from "../../services/stockAdjustmentService";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { PATH_ROUTES } from "../../constants/routes";
import "../../styles/ListCard.css";

const { RangePicker } = DatePicker;

const StockAdjustmentList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<StockAdjustmentListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockAdjustmentStatus | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const canCreate = authService.hasPermission(PERMISSIONS.StockAdjustments.Create);
  const canEdit = authService.hasPermission(PERMISSIONS.StockAdjustments.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.StockAdjustments.Delete);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await stockAdjustmentService.getList({
        page: currentPage,
        limit: pageSize,
        search: searchText || undefined,
        status: statusFilter,
        fromDate: dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
        toDate: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      });
      setData(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch {
      message.error("Không thể tải danh sách phiếu kiểm kê");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    navigate(PATH_ROUTES.stockAdjustments.create);
  };

  const handleView = (record: StockAdjustmentListDto) => {
    navigate(PATH_ROUTES.stockAdjustments.detail(record.id), {
      state: { mode: "view" },
    });
  };

  const handleEdit = (record: StockAdjustmentListDto) => {
    if (record.status === StockAdjustmentStatus.Confirmed) {
      handleView(record);
      return;
    }
    navigate(PATH_ROUTES.stockAdjustments.edit(record.id));
  };

  const handleDelete = async (id: string) => {
    try {
      await stockAdjustmentService.delete(id);
      message.success("Xóa phiếu thành công");
      fetchData();
    } catch {
      message.error("Không thể xóa phiếu");
    }
  };

  const columns = [
    {
      title: "STT",
      width: 60,
      render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "ID phiếu kiểm kê",
      dataIndex: "code",
      width: 200,
    },
    {
      title: "Ngày kiểm kê",
      dataIndex: "inventoryDate",
      width: 130,
      render: (val: string) => val ? dayjs(val).format("DD/MM/YYYY") : "—",
    },
    {
      title: "Nhân viên kiểm kê",
      dataIndex: "inventoryUserName",
      width: 180,
      render: (val: string) => val || "—",
    },
    {
      title: "Người tạo phiếu",
      dataIndex: "creatorName",
      width: 180,
      render: (val: string) => val || "—",
    },
    {
      title: "Trạng thái phiếu",
      dataIndex: "status",
      width: 160,
      render: (status: StockAdjustmentStatus) => (
        <Tag color={StockAdjustmentStatusColors[status]}>
          {StockAdjustmentStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo phiếu",
      dataIndex: "creationTime",
      width: 160,
      render: (val: string) => dayjs(val).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "",
      width: 130,
      render: (_: any, record: StockAdjustmentListDto) => (
        <Space>
          <Tooltip title="Xem">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => { e.stopPropagation(); handleView(record); }}
            />
          </Tooltip>
          {record.status === StockAdjustmentStatus.Draft && canEdit && (
            <Tooltip title="Sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
              />
            </Tooltip>
          )}
          {record.status === StockAdjustmentStatus.Draft && canDelete && (
            <Popconfirm
              title="Xóa phiếu kiểm kê?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Tooltip title="Xóa">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        className="list-card"
        title="Điều chỉnh kho"
        extra={
          canCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo phiếu kiểm kê
            </Button>
          ) : undefined
        }
      >
        <div style={{ padding: "0 16px 16px" }}>
          <Space wrap style={{ marginBottom: 16 }}>
            <Input
              placeholder="Tìm theo mã phiếu, tên sản phẩm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: 180 }}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              options={STOCK_ADJUSTMENT_STATUS_OPTIONS}
            />
            <RangePicker
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                setCurrentPage(1);
              }}
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Space>

          <Table
            loading={loading}
            dataSource={data}
            columns={columns}
            rowKey="id"
            size="small"
            scroll={{ x: 900 }}
            onRow={(record) => ({
              onDoubleClick: () => handleView(record),
              style: { cursor: "pointer" },
            })}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalCount,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} phiếu`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default StockAdjustmentList;
