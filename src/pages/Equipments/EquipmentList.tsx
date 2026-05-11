import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tooltip,
  message,
} from "antd";
import {
  ToolOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  equipmentService,
  EquipmentListDto,
  EquipmentStatus,
  EQUIPMENT_STATUS_OPTIONS,
} from "../../services/equipmentService";
import { ALL_COLUMNS, COLUMN_VISIBILITY_KEY, getEquipmentColumns } from "./constants";
import ColumnConfigPopover from "./components/ColumnConfigPopover";
import EquipmentDetailModal from "./components/EquipmentDetailModal";
import "../../styles/ListCard.css";

const loadVisibleKeys = (): Set<string> => {
  try {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
};

const EquipmentList: React.FC = () => {
  const [data, setData] = useState<EquipmentListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | undefined>(undefined);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(loadVisibleKeys);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await equipmentService.getList({
        page: currentPage,
        limit: pageSize,
        search: searchText || undefined,
        status: statusFilter,
      });
      setData(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch {
      message.error("Không thể tải danh sách thiết bị");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleView = (id: string) => {
    setSelectedId(id);
    setDetailModalOpen(true);
  };

  const handleVisibilityChange = (keys: Set<string>) => {
    setVisibleKeys(keys);
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify([...keys]));
  };

  const columns = useMemo(
    () => getEquipmentColumns(visibleKeys, handleView),
    [visibleKeys]
  );

  return (
    <div className="list-card-container">
      <Card
        title="Quản lý thiết bị"
        extra={
          <Space>
            <ColumnConfigPopover visibleKeys={visibleKeys} onChange={handleVisibilityChange} />
            <Tooltip title="Chức năng đang phát triển">
              <Button icon={<ToolOutlined />} disabled>
                Tạo phiếu bảo dưỡng
              </Button>
            </Tooltip>
          </Space>
        }
      >
        <div className="list-card-filters" style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input
            placeholder="Tìm theo mã, tên, serial..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
            style={{ width: 180 }}
            allowClear
            options={EQUIPMENT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            showTotal: (total) => `Tổng ${total} thiết bị`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          onRow={(record) => ({
            onDoubleClick: () => handleView(record.id),
            style: { cursor: "pointer" },
          })}
        />
      </Card>

      <EquipmentDetailModal
        open={detailModalOpen}
        equipmentId={selectedId}
        onClose={() => { setDetailModalOpen(false); setSelectedId(undefined); }}
        onUpdated={fetchData}
      />
    </div>
  );
};

export default EquipmentList;
