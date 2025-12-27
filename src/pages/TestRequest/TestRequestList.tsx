// @ts-nocheck
import React, { useState, useEffect } from "react";
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
  EyeOutlined,
  ReloadOutlined,
  ImportOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import { testRequestService } from "../../services/testRequestService";
import { PATH_ROUTES } from "../../constants";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await testRequestService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: "creationTime desc",
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        expectedCompletionDateFrom:
          dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
        expectedCompletionDateTo:
          dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      });
      const items = result.items || [];
      setData(items);
      setTotalCount(result.totalCount || 0);
    } catch (error: any) {
      console.error("Error loading test requests:", error);
      message.error(
        "Không thể tải danh sách yêu cầu thử nghiệm. Vui lòng kiểm tra kết nối server."
      );
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load data when page, pageSize, searchText, statusFilter or dateRange changes
  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchText, statusFilter, dateRange]);

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
      await testRequestService.delete(id);
      message.success("Xóa yêu cầu thành công!");
      loadData(); // Reload data from server
    } catch (error: any) {
      console.error("Error deleting test request:", error);
      message.error("Không thể xóa yêu cầu. Vui lòng thử lại.");
    }
  };

  const handleCreate = () => {
    navigate(PATH_ROUTES.testRequests.create);
  };

  const handleEdit = (record: TestRequestDto) => {
    navigate(PATH_ROUTES.testRequests.edit(record.id));
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
    const daysRemaining = dayjs(record.expectedCompletionDate).diff(
      dayjs(),
      "day"
    );
    return daysRemaining <= 5;
  };

  const columns: ColumnsType<TestRequestDto> = [
    {
      title: "Số hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      width: 140,
      fixed: "left",
      render: (value: string) => value || "-",
      sorter: (a, b) =>
        (a.contractNumber || "").localeCompare(b.contractNumber || ""),
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
      fixed: "right" as const,
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
              title={
                !canEdit ? "Không thể chỉnh sửa ở trạng thái này" : "Chỉnh sửa"
              }
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
                disabled={!canDelete}
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
          <Button icon={<ReloadOutlined />} onClick={loadData}>
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
            <Select.Option value={TestRequestStatus.SampleSent}>
              {TestRequestStatusLabels[TestRequestStatus.SampleSent]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.InProgress}>
              {TestRequestStatusLabels[TestRequestStatus.InProgress]}
            </Select.Option>
            <Select.Option value={TestRequestStatus.PendingChangeApproval}>
              {TestRequestStatusLabels[TestRequestStatus.PendingChangeApproval]}
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
        loading={loading}
        rowClassName={(record) => (isUrgentRow(record) ? "urgent-row" : "")}
        onRow={(record) => ({
          onDoubleClick: () =>
            navigate(PATH_ROUTES.testRequests.detail(record.id)),
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
          loadData();
        }}
        importType="test-requests"
      />
    </Card>
  );
};

export default TestRequestList;
