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
  Modal,
  DatePicker,
  Form,
  Tooltip,
  Typography,
} from "antd";
import {
  ExperimentOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { laboratoryTaskService } from "../../services/laboratoryTaskService";
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
  LaboratoryTaskStatusLabels,
  LaboratoryTaskStatusColors,
  UpdateLaboratoryTaskDto,
} from "../../types/laboratoryTask";
import { PATH_ROUTES } from "../../constants";

const { Text } = Typography;

const TaskManagementList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<LaboratoryTaskDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    LaboratoryTaskStatus | undefined
  >(undefined);

  // Modal states
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LaboratoryTaskDto | null>(
    null
  );
  const [updateForm] = Form.useForm();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await laboratoryTaskService.getList({
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        status: statusFilter,
        search: searchText || undefined,
      });

      setTasks(result.items);
      setPagination((prev) => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error("Failed to load laboratory tasks:", error);
      message.error("Không thể tải danh sách công việc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, statusFilter, searchText]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusTag = (status: LaboratoryTaskStatus) => {
    const label = LaboratoryTaskStatusLabels[status];
    const color = LaboratoryTaskStatusColors[status];

    const iconMap: Record<LaboratoryTaskStatus, React.ReactNode> = {
      [LaboratoryTaskStatus.NotAssignedMethod]: <ClockCircleOutlined />,
      [LaboratoryTaskStatus.AssignedMethod]: <CheckCircleOutlined />,
      [LaboratoryTaskStatus.Testing]: <SyncOutlined spin />,
      [LaboratoryTaskStatus.PendingApproval]: <ClockCircleOutlined />,
      [LaboratoryTaskStatus.Approved]: <CheckCircleOutlined />,
      [LaboratoryTaskStatus.ResultSent]: <SendOutlined />,
      [LaboratoryTaskStatus.ResultRejected]: <ClockCircleOutlined />,
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
    notAssigned: tasks.filter(
      (t) => t.status === LaboratoryTaskStatus.NotAssignedMethod
    ).length,
    assigned: tasks.filter(
      (t) => t.status === LaboratoryTaskStatus.AssignedMethod
    ).length,
    testing: tasks.filter((t) => t.status === LaboratoryTaskStatus.Testing)
      .length,
    pendingApproval: tasks.filter(
      (t) => t.status === LaboratoryTaskStatus.PendingApproval
    ).length,
    approved: tasks.filter((t) => t.status === LaboratoryTaskStatus.Approved)
      .length,
    resultSent: tasks.filter(
      (t) => t.status === LaboratoryTaskStatus.ResultSent
    ).length,
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(
      value === "all" ? undefined : (Number(value) as LaboratoryTaskStatus)
    );
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
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData();
  };

  const handleOpenUpdateModal = (record: LaboratoryTaskDto) => {
    setSelectedTask(record);
    updateForm.setFieldsValue({
      testDate: record.testDate ? dayjs(record.testDate) : null,
      notes: record.notes,
    });
    setUpdateModalVisible(true);
  };

  const handleUpdateTask = async () => {
    try {
      const values = await updateForm.validateFields();
      if (!selectedTask) return;

      const updateData: UpdateLaboratoryTaskDto = {
        testDate: values.testDate
          ? values.testDate.format("YYYY-MM-DD")
          : undefined,
        notes: values.notes,
      };

      await laboratoryTaskService.update(selectedTask.id, updateData);
      message.success("Cập nhật công việc thành công");
      setUpdateModalVisible(false);
      loadData();
    } catch (error) {
      console.error("Failed to update task:", error);
      message.error("Không thể cập nhật công việc. Vui lòng thử lại.");
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa công việc này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await laboratoryTaskService.delete(id);
          message.success("Xóa công việc thành công");
          loadData();
        } catch (error) {
          console.error("Failed to delete task:", error);
          message.error("Không thể xóa công việc. Vui lòng thử lại.");
        }
      },
    });
  };

  const columns: ColumnsType<LaboratoryTaskDto> = [
    {
      title: "Số hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      width: 150,
      fixed: "left",
      render: (value: string) => value || "-",
    },
    {
      title: "Tổng số mẫu",
      dataIndex: "totalSampleCount",
      key: "totalSampleCount",
      width: 120,
      align: "center",
    },
    {
      title: "Quản lý kỹ thuật",
      dataIndex: "technicalManagerName",
      key: "technicalManagerName",
      width: 180,
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
      render: (date: string, record: LaboratoryTaskDto) => {
        if (!date) return "-";
        const d = dayjs(date);
        // Highlight if urgent (<=5 days remaining) and not done
        const daysRemaining = d.diff(dayjs(), "day");
        const isUrgent =
          daysRemaining <= 5 &&
          record.status !== LaboratoryTaskStatus.Approved &&
          record.status !== LaboratoryTaskStatus.ResultSent;
        return (
          <span
            style={{
              color: isUrgent ? "#ff4d4f" : undefined,
              fontWeight: isUrgent ? "bold" : undefined,
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
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (status: LaboratoryTaskStatus) => getStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_: any, record: LaboratoryTaskDto) => {
        // Chỉ cho phép edit khi: Chưa gắn PP hoặc Đã gán PP
        const canEdit =
          record.status === LaboratoryTaskStatus.NotAssignedMethod ||
          record.status === LaboratoryTaskStatus.AssignedMethod;

        const getLockedMessage = (status: LaboratoryTaskStatus) => {
          switch (status) {
            case LaboratoryTaskStatus.Testing:
              return "Không thể chỉnh sửa khi đang thí nghiệm";
            case LaboratoryTaskStatus.PendingApproval:
              return "Không thể chỉnh sửa khi đang chờ duyệt";
            case LaboratoryTaskStatus.Approved:
              return "Không thể chỉnh sửa khi đã duyệt";
            case LaboratoryTaskStatus.ResultSent:
              return "Không thể chỉnh sửa khi đã gửi kết quả";
            default:
              return "";
          }
        };

        const lockedReason = getLockedMessage(record.status);

        return (
          <Space size="small">
            <Tooltip title={!canEdit ? lockedReason : "Cập nhật"}>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenUpdateModal(record)}
                disabled={!canEdit}
              />
            </Tooltip>
            <Tooltip title={!canEdit ? lockedReason : "Xóa"}>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                disabled={!canEdit}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Helper to check if task is urgent (<=5 days remaining and not done)
  const isTaskUrgent = (record: LaboratoryTaskDto) => {
    if (!record.requestCompletionDate) return false;
    if (
      record.status === LaboratoryTaskStatus.Approved ||
      record.status === LaboratoryTaskStatus.ResultSent
    )
      return false;
    const daysRemaining = dayjs(record.requestCompletionDate).diff(dayjs(), "day");
    return daysRemaining <= 5;
  };

  const renderTable = (data: LaboratoryTaskDto[]) => (
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
          `${range[0]}-${range[1]} của ${total} công việc`,
      }}
      onChange={handleTableChange}
      scroll={{ x: 1100 }}
      onRow={(record) => ({
        onDoubleClick: () => navigate(PATH_ROUTES.tasks.detail(record.id)),
        style: { cursor: "pointer" },
      })}
      rowClassName={(record) => (isTaskUrgent(record) ? "urgent-row" : "")}
    />
  );

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Tổng công việc"
              value={stats.total}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Chưa gán PP"
              value={stats.notAssigned}
              valueStyle={{ color: "#8c8c8c" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Đã gán PP"
              value={stats.assigned}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Đang TN"
              value={stats.testing}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Chờ duyệt"
              value={stats.pendingApproval}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Đã duyệt"
              value={stats.approved}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Đã gửi KQ"
              value={stats.resultSent}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ExperimentOutlined />
            Quản lý công việc khoa phòng
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
              placeholder="Tìm theo số hợp đồng, quản lý kỹ thuật..."
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
              value={statusFilter !== undefined ? String(statusFilter) : "all"}
              onChange={handleStatusFilterChange}
            >
              <Select.Option value="all">Tất cả trạng thái</Select.Option>
              <Select.Option
                value={String(LaboratoryTaskStatus.NotAssignedMethod)}
              >
                Chưa gán phương pháp
              </Select.Option>
              <Select.Option
                value={String(LaboratoryTaskStatus.AssignedMethod)}
              >
                Đã gán phương pháp
              </Select.Option>
              <Select.Option value={String(LaboratoryTaskStatus.Testing)}>
                Đang thí nghiệm
              </Select.Option>
              <Select.Option
                value={String(LaboratoryTaskStatus.PendingApproval)}
              >
                Chờ duyệt kết quả
              </Select.Option>
              <Select.Option value={String(LaboratoryTaskStatus.Approved)}>
                Đã duyệt
              </Select.Option>
              <Select.Option value={String(LaboratoryTaskStatus.ResultSent)}>
                Đã gửi kết quả
              </Select.Option>
            </Select>
          </Col>
        </Row>
        {renderTable(tasks)}
      </Card>

      {/* Update Modal */}
      <Modal
        title="Cập nhật công việc"
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        onOk={handleUpdateTask}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
        centered
      >
        <Form form={updateForm} layout="vertical">
          <Form.Item
            name="testDate"
            label="Ngày thí nghiệm"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  const testDate = dayjs(value);
                  const transferDate = selectedTask?.transferDate
                    ? dayjs(selectedTask.transferDate)
                    : null;
                  const requestCompletionDate =
                    selectedTask?.requestCompletionDate
                      ? dayjs(selectedTask.requestCompletionDate)
                      : null;

                  if (transferDate && testDate.isBefore(transferDate, "day")) {
                    return Promise.reject(
                      new Error("Ngày thí nghiệm phải >= ngày chuyển đi")
                    );
                  }
                  if (
                    requestCompletionDate &&
                    testDate.isAfter(requestCompletionDate, "day")
                  ) {
                    return Promise.reject(
                      new Error("Ngày thí nghiệm phải <= ngày yêu cầu xong")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
            extra={
              selectedTask && (
                <span style={{ fontSize: 12, color: "#888" }}>
                  {selectedTask.transferDate &&
                    `Ngày chuyển: ${dayjs(selectedTask.transferDate).format(
                      "DD/MM/YYYY"
                    )}`}
                  {selectedTask.transferDate &&
                    selectedTask.requestCompletionDate &&
                    " - "}
                  {selectedTask.requestCompletionDate &&
                    `Ngày YC xong: ${dayjs(
                      selectedTask.requestCompletionDate
                    ).format("DD/MM/YYYY")}`}
                </span>
              )
            }
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              disabledDate={(current) => {
                if (!current || !selectedTask) return false;

                const transferDate = selectedTask.transferDate
                  ? dayjs(selectedTask.transferDate).startOf("day")
                  : null;
                const requestCompletionDate = selectedTask.requestCompletionDate
                  ? dayjs(selectedTask.requestCompletionDate).endOf("day")
                  : null;

                if (transferDate && current.isBefore(transferDate, "day")) {
                  return true;
                }
                if (
                  requestCompletionDate &&
                  current.isAfter(requestCompletionDate, "day")
                ) {
                  return true;
                }
                return false;
              }}
            />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

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

export default TaskManagementList;
