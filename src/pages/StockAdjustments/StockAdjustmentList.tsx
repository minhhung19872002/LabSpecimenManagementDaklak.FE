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
import StockAdjustmentModal from "./components/StockAdjustmentModal";
import "../../styles/ListCard.css";

const { RangePicker } = DatePicker;

const StockAdjustmentList: React.FC = () => {
  const [data, setData] = useState<StockAdjustmentListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockAdjustmentStatus | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

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
      message.error("Không thể tải danh sách phiếu điều chỉnh");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setModalMode("create");
    setSelectedId(undefined);
    setModalOpen(true);
  };

  const handleView = (record: StockAdjustmentListDto) => {
    setModalMode("view");
    setSelectedId(record.id);
    setModalOpen(true);
  };

  const handleEdit = (record: StockAdjustmentListDto) => {
    if (record.status === StockAdjustmentStatus.Confirmed) {
      handleView(record);
      return;
    }
    setModalMode("edit");
    setSelectedId(record.id);
    setModalOpen(true);
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
      title: "ID phiếu điều chỉnh",
      dataIndex: "code",
      width: 200,
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
      width: 100,
      render: (_: any, record: StockAdjustmentListDto) => (
        <Space>
          {record.status === StockAdjustmentStatus.Draft && canEdit ? (
            <Tooltip title="Sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Xem">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleView(record)}
              />
            </Tooltip>
          )}
          {record.status === StockAdjustmentStatus.Draft && canDelete && (
            <Popconfirm
              title="Xóa phiếu điều chỉnh?"
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
        title="Điều chỉnh tồn kho"
        extra={
          canCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo phiếu điều chỉnh
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
            scroll={{ x: 700 }}
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

      <StockAdjustmentModal
        open={modalOpen}
        mode={modalMode}
        adjustmentId={selectedId}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default StockAdjustmentList;
