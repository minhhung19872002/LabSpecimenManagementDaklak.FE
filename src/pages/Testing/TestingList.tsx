import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Row,
  Col,
  Select,
  Statistic,
  message,
  Typography,
} from "antd";
import {
  ExperimentOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { testingService } from "../../services/testingService";
import { laboratoryTaskService } from "../../services/laboratoryTaskService";
import {
  TestingListDto,
  TestingStatus,
  TestingStatusLabels,
  TestingStatusColors,
  TestingTabType,
} from "../../types/testing";
import { UserLookupDto } from "../../types/laboratoryTask";

const { Text } = Typography;

const TestingList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TestingListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestingStatus | undefined>(
    undefined
  );
  const [technicianFilter, setTechnicianFilter] = useState<string[]>([]);

  // Technicians for filter dropdown
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Load technicians for filter
  useEffect(() => {
    const loadTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        // Get all technicians (no laboratory filter)
        const result = await laboratoryTaskService.getTechniciansByLaboratory();
        setTechnicians(result || []);
      } catch (error) {
        console.error("Failed to load technicians:", error);
      } finally {
        setLoadingTechnicians(false);
      }
    };
    loadTechnicians();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await testingService.getList({
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        tab: TestingTabType.MyAssignments, // Always use MyAssignments
        search: searchText || undefined,
        statuses: statusFilter !== undefined ? [statusFilter] : undefined,
        technicianIds:
          technicianFilter.length > 0 ? technicianFilter : undefined,
      });

      setTasks(result.items);
      setPagination((prev) => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error("Failed to load testing tasks:", error);
      message.error("Không thể tải danh sách xét nghiệm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.current,
    pagination.pageSize,
    searchText,
    statusFilter,
    technicianFilter,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusTag = (status: TestingStatus) => {
    const label = TestingStatusLabels[status];
    const color = TestingStatusColors[status];

    const iconMap: Record<TestingStatus, React.ReactNode> = {
      [TestingStatus.Todo]: <ClockCircleOutlined />,
      [TestingStatus.InProgress]: <SyncOutlined spin />,
      [TestingStatus.Done]: <CheckCircleOutlined />,
    };

    return (
      <Tag color={color} icon={iconMap[status]}>
        {label}
      </Tag>
    );
  };

  // Statistics
  const stats = {
    total: pagination.total,
    todo: tasks.filter((t) => t.testingStatus === TestingStatus.Todo).length,
    inProgress: tasks.filter(
      (t) => t.testingStatus === TestingStatus.InProgress
    ).length,
    done: tasks.filter((t) => t.testingStatus === TestingStatus.Done).length,
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusFilterChange = (value: TestingStatus | undefined) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTechnicianFilterChange = (values: string[]) => {
    setTechnicianFilter(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleRefresh = () => {
    setSearchText("");
    setStatusFilter(undefined);
    setTechnicianFilter([]);
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData();
  };

  const columns: ColumnsType<TestingListDto> = [
    {
      title: "Số hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      width: 150,
      fixed: "left",
      render: (value: string) => value || "-",
    },
    {
      title: "Tổng mẫu",
      dataIndex: "totalSampleCount",
      key: "totalSampleCount",
      width: 100,
      align: "center",
    },
    {
      title: "Tổng CT",
      dataIndex: "totalIndicatorCount",
      key: "totalIndicatorCount",
      width: 100,
      align: "center",
    },
    {
      title: "Kỹ thuật viên",
      dataIndex: "technicianNames",
      key: "technicianNames",
      width: 180,
      ellipsis: true,
      render: (value: string) => value || "-",
    },
    {
      title: "Ngày chuyển đi",
      dataIndex: "transferDate",
      key: "transferDate",
      width: 140,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Ngày YC xong",
      dataIndex: "requestCompletionDate",
      key: "requestCompletionDate",
      width: 130,
      render: (date: string, record: TestingListDto) => {
        if (!date) return "-";
        const d = dayjs(date);
        // Highlight if urgent (<=5 days remaining) and not done
        const shouldHighlight = record.isUrgent && record.testingStatus !== TestingStatus.Done;
        return (
          <span
            style={{
              color: shouldHighlight ? "#ff4d4f" : undefined,
              fontWeight: shouldHighlight ? "bold" : undefined,
            }}
          >
            {d.format("DD/MM/YYYY")}
          </span>
        );
      },
    },
    {
      title: "Ngày thí nghiệm",
      dataIndex: "testDate",
      key: "testDate",
      width: 140,
      render: (date: string) =>
        date ? (
          dayjs(date).format("DD/MM/YYYY")
        ) : (
          <Text type="secondary">Chưa đặt</Text>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "testingStatus",
      key: "testingStatus",
      width: 140,
      render: (status: TestingStatus) => getStatusTag(status),
    },
  ];

  const renderTable = (data: TestingListDto[]) => (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        pageSizeOptions: [20, 50, 100],
        showSizeChanger: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} của ${total} xét nghiệm`,
      }}
      onChange={handleTableChange}
      scroll={{ x: 1000 }}
      onRow={(record) => ({
        onDoubleClick: () => navigate(`/testing/${record.laboratoryTaskId}`),
        style: { cursor: "pointer" },
      })}
      rowClassName={(record) => (record.isUrgent && record.testingStatus !== TestingStatus.Done ? "urgent-row" : "")}
    />
  );

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Tổng xét nghiệm"
              value={stats.total}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Cần làm"
              value={stats.todo}
              valueStyle={{ color: "#8c8c8c" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Đang thí nghiệm"
              value={stats.inProgress}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="Đã xong"
              value={stats.done}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ExperimentOutlined />
            Quản lý xét nghiệm
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Làm mới
          </Button>
        }
      >
        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Tìm theo số hợp đồng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              allowClear
              enterButton
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              allowClear
            >
              <Select.Option value={TestingStatus.Todo}>Cần làm</Select.Option>
              <Select.Option value={TestingStatus.InProgress}>
                Đang thí nghiệm
              </Select.Option>
              <Select.Option value={TestingStatus.Done}>Đã xong</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Kỹ thuật viên"
              value={technicianFilter}
              onChange={handleTechnicianFilterChange}
              allowClear
              loading={loadingTechnicians}
              maxTagCount={1}
              optionFilterProp="children"
              showSearch
            >
              {technicians.map((tech) => (
                <Select.Option key={tech.id} value={tech.id}>
                  {tech.displayName || tech.userName}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        {renderTable(tasks)}
      </Card>

      <style>{`
        .urgent-row > td {
          background-color: #fff2f0 !important;
        }
        .urgent-row:hover > td {
          background-color: #ffebe8 !important;
        }
      `}</style>
    </div>
  );
};

export default TestingList;
