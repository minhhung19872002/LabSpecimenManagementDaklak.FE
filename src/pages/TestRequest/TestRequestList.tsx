import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Card,
  Input,
  Row,
  Col,
  Select,
  DatePicker,
} from "antd";
import type { Dayjs } from "dayjs";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ImportOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import {
  useGetTestRequestListQuery,
  useDeleteTestRequestMutation,
} from "../../store/api/testRequestApi";
import {
  TestRequestDto,
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestStatusColors,
  canEditTestRequest,
  canDeleteTestRequest,
  showActionsForTestRequest,
} from "../../types/testRequest";
import ImportExcelModal from "../../components/common/ImportExcelModal";
import {
  importService,
  downloadBlobAsFile,
} from "../../services/importService";
import dayjs from "dayjs";

const TestRequestList: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | "all">(
    "all"
  );
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  // RTK Query hooks
  const {
    data: testRequestData,
    isLoading: loading,
    isFetching,
    refetch,
  } = useGetTestRequestListQuery({
    skipCount: (currentPage - 1) * pageSize,
    maxResultCount: pageSize,
    sorting: "requestDate desc",
    search: searchText || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    expectedCompletionDateFrom:
      dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
    expectedCompletionDateTo:
      dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
  });

  const [deleteTestRequest, { isLoading: isDeleting }] = useDeleteTestRequestMutation();

  const data = useMemo(() => testRequestData?.items || [], [testRequestData]);
  const totalCount = testRequestData?.totalCount || 0;

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await importService.downloadTestRequestsTemplate();
      downloadBlobAsFile(blob, "test-requests-template.xlsx");
      message.success("Tải template thành công!");
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error("Không thể tải template. Vui lòng thử lại.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Handle search with debounce
  const handleSearch = () => {
    setSearchText(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle status filter change
  const handleStatusChange = (value: TestRequestStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle date range change
  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    setDateRange(dates);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTestRequest(id).unwrap();
      message.success("Xóa yêu cầu thành công!");
    } catch (error: any) {
      console.error("Error deleting test request:", error);
      message.error(error.data?.error?.message || "Không thể xóa yêu cầu. Vui lòng thử lại.");
    }
  };

  const handleCreate = () => {
    navigate("/test-request/create");
  };

  const handleEdit = (record: TestRequestDto) => {
    navigate(`/test-request/edit/${record.id}`);
  };

  const getStatusTag = (status: TestRequestStatus) => {
    const label = TestRequestStatusLabels[status] || status.toString();
    const color = TestRequestStatusColors[status] || "default";
    return <Tag color={color}>{label}</Tag>;
  };

  // Check if a row is urgent (expected completion date <= 5 days from today and not completed)
  const isUrgentRow = (record: TestRequestDto): boolean => {
    if (!record.expectedCompletionDate) return false;
    if (record.status >= TestRequestStatus.Completed) return false;
    const daysRemaining = dayjs(record.expectedCompletionDate).diff(dayjs(), "day");
    return daysRemaining <= 5;
  };

  const columns: ColumnsType<TestRequestDto> = [
    {
      title: "Số yêu cầu",
      dataIndex: "requestNumber",
      key: "requestNumber",
      width: 180,
      fixed: "left",
      sorter: (a, b) => a.requestNumber.localeCompare(b.requestNumber),
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "requestDate",
      key: "requestDate",
      width: 130,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) =>
        dayjs(a.requestDate).unix() - dayjs(b.requestDate).unix(),
    },
    {
      title: "Ngày hoàn thành dự kiến",
      dataIndex: "expectedCompletionDate",
      key: "expectedCompletionDate",
      width: 180,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Tên CS/DN",
      dataIndex: "customerName",
      key: "customerName",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Người liên hệ",
      dataIndex: "contactPerson",
      key: "contactPerson",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 130,
    },
    {
      title: "Số mẫu",
      dataIndex: "totalSampleCount",
      key: "totalSampleCount",
      width: 80,
      align: "center" as const,
      render: (value: number) => value || 0,
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 120,
      align: "right" as const,
      render: (value: number) =>
        value ? `${value.toLocaleString("vi-VN")}đ` : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: TestRequestStatus) => getStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_: any, record: TestRequestDto) => {
        const canEdit = canEditTestRequest(record.status);
        const canDelete = canDeleteTestRequest(record.status);
        const showActions = showActionsForTestRequest(record.status);

        // Hide actions column content when status = Completed
        if (!showActions) {
          return null;
        }

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={!canEdit}
              title={!canEdit ? "Không thể chỉnh sửa ở trạng thái này" : "Chỉnh sửa"}
            />
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
              disabled={!canDelete}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={!canDelete || isDeleting}
                title={!canDelete ? "Không thể xóa ở trạng thái này" : "Xóa"}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title="Danh sách yêu cầu thử nghiệm"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            Làm mới
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            loading={downloadingTemplate}
          >
            Tải Template
          </Button>
          <Button
            icon={<ImportOutlined />}
            onClick={() => setImportModalOpen(true)}
          >
            Import Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo mới
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo số YC, tên CS/DN, người liên hệ, SĐT..."
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
        <Col xs={24} sm={12} md={5}>
          <Select
            style={{ width: "100%" }}
            placeholder="Lọc theo trạng thái"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value={TestRequestStatus.New}>
              {TestRequestStatusLabels[TestRequestStatus.New]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.Pending}>
              {TestRequestStatusLabels[TestRequestStatus.Pending]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.InProgress}>
              {TestRequestStatusLabels[TestRequestStatus.InProgress]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.TestingCompleted}>
              {TestRequestStatusLabels[TestRequestStatus.TestingCompleted]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.PendingApproval}>
              {TestRequestStatusLabels[TestRequestStatus.PendingApproval]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.Approved}>
              {TestRequestStatusLabels[TestRequestStatus.Approved]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.ResultSent}>
              {TestRequestStatusLabels[TestRequestStatus.ResultSent]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.Completed}>
              {TestRequestStatusLabels[TestRequestStatus.Completed]}
            </Select.Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ whiteSpace: "nowrap", color: "#666" }}>
              Ngày HT dự kiến:
            </span>
            <DatePicker.RangePicker
              style={{ flex: 1 }}
              placeholder={["Từ ngày", "Đến ngày"]}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={handleDateRangeChange}
              allowClear
            />
          </div>
        </Col>
      </Row>

      <style>{`
        .urgent-row > td { background-color: #fff2f0 !important; }
        .urgent-row:hover > td { background-color: #ffebe8 !important; }
      `}</style>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading || isFetching}
        rowClassName={(record) => (isUrgentRow(record) ? "urgent-row" : "")}
        onRow={(record) => ({
          onDoubleClick: () => navigate(`/test-request/${record.id}`),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} yêu cầu`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        scroll={{ x: 1600 }}
      />

      {/* Import Excel Modal */}
      <ImportExcelModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          refetch();
        }}
        importType="test-requests"
      />
    </Card>
  );
};

export default TestRequestList;
