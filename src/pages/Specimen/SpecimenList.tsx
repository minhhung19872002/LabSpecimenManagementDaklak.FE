// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Card,
  Input,
  Row,
  Col,
  Select,
} from "antd";
import { ReloadOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { sampleStorageService } from "../../services/sampleStorageService";
import type { SampleStorageDto } from "../../types/sampleStorage";
import {
  SampleStorageStatus,
  SampleStorageStatusLabels,
  SampleStorageStatusColors,
} from "../../types/sampleStorage";
import SampleStorageDetailModal from "./components/SampleStorageDetailModal";
import { formatDate } from "../../utils/formatters";
import "./SpecimenList.css";

const SpecimenList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleStorageDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<SampleStorageStatus | "all">(
    "all"
  );

  // Modal state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await sampleStorageService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setData(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (error: any) {
      console.error("Error loading sample storage:", error);
      message.error("Không thể tải danh sách quản lý mẫu.");
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load data when filters change
  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchText, statusFilter]);

  // Handle search
  const handleSearch = () => {
    setSearchText(searchInput);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (value: SampleStorageStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Handle row double click - open modal
  const handleRowDoubleClick = (record: SampleStorageDto) => {
    setSelectedId(record.id);
    setModalOpen(true);
  };

  // Handle view button click
  const handleViewClick = (record: SampleStorageDto) => {
    setSelectedId(record.id);
    setModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedId(null);
  };

  // Handle modal success (after cancel action)
  const handleModalSuccess = () => {
    loadData();
  };

  const getStatusTag = (status: SampleStorageStatus) => (
    <Tag color={SampleStorageStatusColors[status]}>
      {SampleStorageStatusLabels[status]}
    </Tag>
  );

  const columns: ColumnsType<SampleStorageDto> = [
    {
      title: "Số hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      width: 200,
      fixed: "left",
      sorter: (a, b) => a.contractNumber.localeCompare(b.contractNumber),
    },
    {
      title: "Tổng số mẫu",
      dataIndex: "totalSampleCount",
      key: "totalSampleCount",
      width: 120,
      align: "center",
      render: (count: number, record: SampleStorageDto) => {
        if (record.cancelledCount > 0) {
          return (
            <span>
              {count}{" "}
              <span style={{ color: "#999", fontSize: 12 }}>
                (đã hủy: {record.cancelledCount})
              </span>
            </span>
          );
        }
        return count;
      },
    },
    {
      title: "Ngày lưu kho",
      dataIndex: "storageDate",
      key: "storageDate",
      width: 150,
      render: (date: string | null) => formatDate(date),
      sorter: (a, b) => {
        if (!a.storageDate) return 1;
        if (!b.storageDate) return -1;
        return dayjs(a.storageDate).unix() - dayjs(b.storageDate).unix();
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: SampleStorageStatus) => getStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_: any, record: SampleStorageDto) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewClick(record)}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản lý mẫu"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            Làm mới
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo số hợp đồng, khách hàng..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            allowClear
            onClear={() => {
              setSearchInput("");
              setSearchText("");
              setCurrentPage(1);
            }}
            enterButton
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            style={{ width: "100%" }}
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value={SampleStorageStatus.Received}>
              {SampleStorageStatusLabels[SampleStorageStatus.Received]}
            </Select.Option>
            <Select.Option value={SampleStorageStatus.PendingDisposal}>
              {SampleStorageStatusLabels[SampleStorageStatus.PendingDisposal]}
            </Select.Option>
            <Select.Option value={SampleStorageStatus.Disposed}>
              {SampleStorageStatusLabels[SampleStorageStatus.Disposed]}
            </Select.Option>
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} hợp đồng`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onDoubleClick: () => handleRowDoubleClick(record),
          className:
            record.status === SampleStorageStatus.PendingDisposal
              ? "row-pending-disposal"
              : "",
        })}
        rowClassName={(record) =>
          record.status === SampleStorageStatus.PendingDisposal
            ? "row-pending-disposal"
            : ""
        }
      />

      {/* Detail Modal */}
      <SampleStorageDetailModal
        open={modalOpen}
        testRequestId={selectedId}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </Card>
  );
};

export default SpecimenList;
