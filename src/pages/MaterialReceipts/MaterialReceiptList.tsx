import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  message,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/common/Icon";
import { PATH_ROUTES } from "../../constants/routes";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import {
  MaterialReceiptListDto,
  MaterialReceiptStatus,
  MaterialReceiptStatusColors,
  MaterialReceiptStatusLabels,
  materialReceiptService,
} from "../../services/materialReceiptService";
import { getApiErrorMessage } from "../../utils/errorHandler";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";
import "../GoodsReceipts/GoodsReceiptList.css";
import "./MaterialReceiptList.css";

const { Text, Link } = Typography;
const { RangePicker } = DatePicker;

const MaterialReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MaterialReceiptListDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MaterialReceiptStatus>();
  const [dateRange, setDateRange] = useState<[string, string]>();
  const [sorting, setSorting] = useState("creationTime desc");
  const [stats, setStats] = useState({ draft: 0, received: 0 });

  const canCreate = authService.hasPermission(PERMISSIONS.MaterialReceipts.Create);
  const canDelete = authService.hasPermission(PERMISSIONS.MaterialReceipts.Delete);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await materialReceiptService.getList({
        skipCount: (page - 1) * pageSize,
        maxResultCount: pageSize,
        sorting,
        search: search.trim() || undefined,
        status,
        fromDate: dateRange?.[0],
        toDate: dateRange?.[1],
      });
      setItems(result.items || []);
      setTotal(result.totalCount || 0);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể tải danh sách phiếu nhận vật tư"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sorting, search, status, dateRange]);

  const loadStats = useCallback(async () => {
    try {
      const result = await materialReceiptService.getStatistics();
      setStats({ draft: result.draftCount || 0, received: result.receivedCount || 0 });
    } catch {
      setStats({ draft: 0, received: 0 });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 300);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleDelete = useCallback((record: MaterialReceiptListDto) => {
    Modal.confirm({
      title: "Xóa phiếu nhận vật tư",
      content: `Bạn có chắc muốn xóa phiếu ${record.code}?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await materialReceiptService.delete(record.id);
          message.success("Đã xóa phiếu nhận vật tư");
          await Promise.all([loadData(), loadStats()]);
        } catch (error) {
          message.error(getApiErrorMessage(error, "Không thể xóa phiếu nhận vật tư"));
        }
      },
    });
  }, [loadData, loadStats]);

  const columns = useMemo<ColumnsType<MaterialReceiptListDto>>(() => [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Mã phiếu nhận vật tư",
      dataIndex: "code",
      sorter: true,
      width: 190,
      render: (code, record) => (
        <Link onClick={() => navigate(PATH_ROUTES.materialReceipts.detail(record.id))}>{code}</Link>
      ),
    },
    {
      title: "Ngày nhận vật tư",
      dataIndex: "receiptDate",
      sorter: true,
      width: 150,
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    { title: "Người nhận vật tư", dataIndex: "receiverName", sorter: true, width: 190 },
    { title: "Số vật tư", dataIndex: "itemCount", width: 110, align: "right" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      sorter: true,
      width: 120,
      render: (value: MaterialReceiptStatus) => (
        <Tag color={MaterialReceiptStatusColors[value]}>{MaterialReceiptStatusLabels[value]}</Tag>
      ),
    },
    { title: "Người tạo", dataIndex: "creatorName", width: 170, render: (value) => value || "—" },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <Button type="text" icon={<EyeOutlined />} title="Xem chi tiết" onClick={() => navigate(PATH_ROUTES.materialReceipts.detail(record.id))} />
          {canCreate && record.status === MaterialReceiptStatus.Draft && (
            <Button type="text" icon={<EditOutlined />} title="Chỉnh sửa" onClick={() => navigate(PATH_ROUTES.materialReceipts.edit(record.id))} />
          )}
          {canDelete && record.status === MaterialReceiptStatus.Draft && (
            <Button type="text" danger icon={<DeleteOutlined />} title="Xóa" onClick={() => handleDelete(record)} />
          )}
        </Space>
      ),
    },
  ], [page, pageSize, navigate, canCreate, canDelete, handleDelete]);

  const handleTableChange = (pagination: TablePaginationConfig, _filters: unknown, sorter: any) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 50);
    if (sorter?.field && sorter?.order) {
      setSorting(`${String(sorter.field)} ${sorter.order === "descend" ? "desc" : "asc"}`);
    }
  };

  const statCards = [
    { key: "draft", label: "Nháp", value: stats.draft, status: MaterialReceiptStatus.Draft, icon: "file-earmark-text", color: "blue" },
    { key: "received", label: "Đã nhận", value: stats.received, status: MaterialReceiptStatus.Confirmed, icon: "box-seam", color: "green" },
  ];

  return (
    <div>
      <div className="dashboard-stats-grid goods-receipt-stats-grid material-receipt-stats-grid">
        {statCards.map((card) => (
          <Card
            key={card.key}
            className={`dashboard-stat-card goods-receipt-stat-clickable${status === card.status ? " goods-receipt-stat-active" : ""}`}
            bordered={false}
            onClick={() => { setStatus(status === card.status ? undefined : card.status); setPage(1); }}
          >
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-info">
                <Text className="dashboard-stat-title">{card.label}</Text>
                <div className="dashboard-stat-value">{card.value}</div>
              </div>
              <div className={`dashboard-stat-icon ${card.color}`}><Icon name={card.icon} /></div>
            </div>
          </Card>
        ))}
      </div>

      <Card
        className="list-card"
        title="Danh sách phiếu nhận vật tư"
        extra={canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(PATH_ROUTES.materialReceipts.create)}>
            Thêm mới
          </Button>
        )}
      >
        <Row gutter={[12, 12]} style={{ marginBottom: 16, padding: "16px 16px 0" }}>
          <Col xs={24} md={8}>
            <Input placeholder="Tìm theo mã phiếu hoặc người nhận" prefix={<SearchOutlined />} allowClear value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày nhận", "Đến ngày nhận"]}
              onChange={(dates) => { setDateRange(dates?.[0] && dates?.[1] ? [dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")] : undefined); setPage(1); }}
            />
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1150 }}
          onRow={(record) => ({ onDoubleClick: () => navigate(PATH_ROUTES.materialReceipts.detail(record.id)), style: { cursor: "pointer" } })}
          onChange={handleTableChange}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, pageSizeOptions: [50, 100, 150], showTotal: (count, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{count}</b></> }}
        />
      </Card>
    </div>
  );
};

export default MaterialReceiptList;
