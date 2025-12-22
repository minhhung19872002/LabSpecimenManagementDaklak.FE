import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Descriptions,
  Timeline,
  Row,
  Col,
  Statistic,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

// RTK Query imports
import {
  useGetNCRListQuery,
  useCreateNCRMutation,
  useUpdateNCRMutation,
  useDeleteNCRMutation,
  NCRDto,
  CreateNCRDto,
  UpdateNCRDto,
  NCRType,
  NCRSeverity,
  NCRStatus,
} from "../../store/api/ncrApi";
import { useGetActiveDepartmentsQuery } from "../../store/api/masterDataApi";

const { TextArea } = Input;

const ncrTypes = [
  { value: NCRType.Equipment, label: "Thiết bị", color: "orange" },
  { value: NCRType.Process, label: "Quy trình", color: "magenta" },
  { value: NCRType.Personnel, label: "Nhân sự", color: "purple" },
  { value: NCRType.Environment, label: "Môi trường", color: "cyan" },
  { value: NCRType.Material, label: "Vật liệu", color: "blue" },
  { value: NCRType.Other, label: "Khác", color: "default" },
];

const severityConfig: Record<number, { color: string; text: string }> = {
  [NCRSeverity.Minor]: { color: "green", text: "Nhẹ" },
  [NCRSeverity.Major]: { color: "orange", text: "Nghiêm trọng" },
  [NCRSeverity.Critical]: { color: "red", text: "Rất nghiêm trọng" },
};

const statusConfig: Record<
  number,
  { color: string; text: string; icon: React.ReactNode }
> = {
  [NCRStatus.Open]: {
    color: "red",
    text: "Mở",
    icon: <ExclamationCircleOutlined />,
  },
  [NCRStatus.InProgress]: {
    color: "blue",
    text: "Đang xử lý",
    icon: <ClockCircleOutlined />,
  },
  [NCRStatus.Resolved]: {
    color: "orange",
    text: "Đã giải quyết",
    icon: <CheckCircleOutlined />,
  },
  [NCRStatus.Closed]: {
    color: "green",
    text: "Đã đóng",
    icon: <CheckCircleOutlined />,
  },
  [NCRStatus.Cancelled]: {
    color: "default",
    text: "Đã hủy",
    icon: <ExclamationCircleOutlined />,
  },
};

interface NCRDisplay extends NCRDto {
  reportedByName?: string;
  assignedToName?: string;
  closedByName?: string;
}

const NCRList: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingNCR, setEditingNCR] = useState<NCRDisplay | null>(null);
  const [selectedNCR, setSelectedNCR] = useState<NCRDisplay | null>(null);
  const [form] = Form.useForm();

  // RTK Query hooks
  const { data: ncrData, isLoading: loading } = useGetNCRListQuery({ maxResultCount: 1000 });
  const { data: departmentsData } = useGetActiveDepartmentsQuery();
  const [createNCR] = useCreateNCRMutation();
  const [updateNCR] = useUpdateNCRMutation();
  const [deleteNCR] = useDeleteNCRMutation();

  const ncrs = useMemo(() => (ncrData?.items || []) as NCRDisplay[], [ncrData]);
  const departments = useMemo(() => departmentsData?.items || [], [departmentsData]);

  // Stats
  const openCount = ncrs.filter((n) => n.status === NCRStatus.Open).length;
  const inProgressCount = ncrs.filter(
    (n) => n.status === NCRStatus.InProgress
  ).length;
  const closedCount = ncrs.filter((n) => n.status === NCRStatus.Closed).length;

  const handleAdd = () => {
    setEditingNCR(null);
    form.resetFields();
    form.setFieldsValue({
      dueDate: dayjs().add(7, "day"),
      severity: NCRSeverity.Minor,
      type: NCRType.Other,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: NCRDisplay) => {
    setEditingNCR(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      type: record.type,
      severity: record.severity,
      status: record.status,
      assignedToId: record.assignedToId,
      department: record.department,
      relatedEntityCode: record.relatedEntityCode,
      rootCause: record.rootCause,
      correctiveAction: record.correctiveAction,
      preventiveAction: record.preventiveAction,
      dueDate: dayjs(record.dueDate),
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleView = (record: NCRDisplay) => {
    setSelectedNCR(record);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNCR(id).unwrap();
      message.success("Đã xóa NCR");
    } catch (error) {
      console.error("Failed to delete NCR:", error);
      message.error("Không thể xóa NCR. Vui lòng thử lại.");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingNCR) {
        const updateData: UpdateNCRDto = {
          title: values.title,
          description: values.description,
          type: values.type,
          severity: values.severity,
          status: values.status,
          assignedToId: values.assignedToId,
          department: values.department,
          relatedEntityCode: values.relatedEntityCode,
          rootCause: values.rootCause,
          correctiveAction: values.correctiveAction,
          preventiveAction: values.preventiveAction,
          dueDate: values.dueDate.toISOString(),
          notes: values.notes,
        };
        await updateNCR({ id: editingNCR.id, data: updateData }).unwrap();
        message.success("Đã cập nhật NCR");
      } else {
        const createData: CreateNCRDto = {
          title: values.title,
          description: values.description,
          type: values.type,
          severity: values.severity,
          department: values.department,
          relatedEntityCode: values.relatedEntityCode,
          dueDate: values.dueDate.toISOString(),
          notes: values.notes,
        };
        await createNCR(createData).unwrap();
        message.success("Đã tạo NCR mới");
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save NCR:", error);
      message.error("Không thể lưu NCR. Vui lòng thử lại.");
    }
  };

  const filteredNCRs = ncrs.filter((n) => {
    const matchSearch =
      n.ncrNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      n.title.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === null || n.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      title: "Mã NCR",
      dataIndex: "ncrNumber",
      key: "ncrNumber",
      width: 180,
      fixed: "left" as const,
      render: (text: string, record: NCRDisplay) => (
        <a onClick={() => handleView(record)}>
          <Space>
            <WarningOutlined style={{ color: "#faad14" }} />
            {text}
          </Space>
        </a>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (type: number) => {
        const config = ncrTypes.find((t) => t.value === type);
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
    },
    {
      title: "Mức độ",
      dataIndex: "severity",
      key: "severity",
      width: 120,
      render: (severity: number) => (
        <Tag color={severityConfig[severity]?.color}>
          {severityConfig[severity]?.text}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: number) => (
        <Tag
          color={statusConfig[status]?.color}
          icon={statusConfig[status]?.icon}
        >
          {statusConfig[status]?.text}
        </Tag>
      ),
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
      width: 140,
    },
    {
      title: "Hạn xử lý",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (date: string, record: NCRDisplay) => {
        const isOverdue =
          record.status !== NCRStatus.Closed && dayjs(date).isBefore(dayjs());
        return (
          <span style={{ color: isOverdue ? "#cf1322" : undefined }}>
            {dayjs(date).format("DD/MM/YYYY")}
          </span>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: unknown, record: NCRDisplay) => {
        const isLocked = record.status === NCRStatus.Closed || record.status === NCRStatus.Cancelled;
        const lockedReason = record.status === NCRStatus.Closed
          ? "Không thể chỉnh sửa NCR đã đóng"
          : record.status === NCRStatus.Cancelled
          ? "Không thể chỉnh sửa NCR đã hủy"
          : "";
        return (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={isLocked}
              title={lockedReason}
            />
            <Popconfirm
              title="Xóa NCR?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              disabled={isLocked}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={isLocked}
                title={lockedReason}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="NCR đang mở"
              value={openCount}
              styles={{ content: { color: "#cf1322" } }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đang xử lý"
              value={inProgressCount}
              styles={{ content: { color: "#1890ff" } }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã đóng"
              value={closedCount}
              styles={{ content: { color: "#52c41a" } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {openCount > 0 && (
        <Alert
          message={`Có ${openCount} NCR đang chờ xử lý`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title="Quản lý Công việc không phù hợp (NCR)"
        extra={
          <Space>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Select.Option value={NCRStatus.Open}>Mở</Select.Option>
              <Select.Option value={NCRStatus.InProgress}>
                Đang xử lý
              </Select.Option>
              <Select.Option value={NCRStatus.Resolved}>
                Đã giải quyết
              </Select.Option>
              <Select.Option value={NCRStatus.Closed}>Đã đóng</Select.Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Tạo NCR
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredNCRs}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1290 }}
          pagination={{
            pageSize: 50,
            pageSizeOptions: [50, 100, 150],
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} NCR`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingNCR ? "Cập nhật NCR" : "Tạo NCR mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        centered
        styles={{ body: { maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Mô tả ngắn gọn vấn đề" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại NCR"
                rules={[{ required: true, message: "Vui lòng chọn loại" }]}
              >
                <Select placeholder="Chọn loại">
                  {ncrTypes.map((t) => (
                    <Select.Option key={t.value} value={t.value}>
                      {t.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="severity"
                label="Mức độ"
                rules={[{ required: true, message: "Vui lòng chọn mức độ" }]}
              >
                <Select placeholder="Chọn mức độ">
                  <Select.Option value={NCRSeverity.Minor}>Nhẹ</Select.Option>
                  <Select.Option value={NCRSeverity.Major}>
                    Nghiêm trọng
                  </Select.Option>
                  <Select.Option value={NCRSeverity.Critical}>
                    Rất nghiêm trọng
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="Phòng ban">
                <Select placeholder="Chọn phòng ban">
                  {departments.map((d) => (
                    <Select.Option key={d.id} value={d.name}>
                      {d.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Hạn xử lý"
                rules={[{ required: true, message: "Vui lòng chọn hạn xử lý" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="relatedEntityCode"
            label="Mã liên quan (Test/Specimen/Equipment)"
          >
            <Input placeholder="TEST-xxx, SPE-xxx, EQP-xxx" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả chi tiết"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <TextArea
              rows={3}
              placeholder="Mô tả chi tiết vấn đề không phù hợp"
            />
          </Form.Item>
          {editingNCR && (
            <>
              <Form.Item name="assignedToId" label="Người xử lý">
                <Input placeholder="ID người xử lý" />
              </Form.Item>
              <Form.Item name="rootCause" label="Nguyên nhân gốc">
                <TextArea rows={2} placeholder="Phân tích nguyên nhân gốc rễ" />
              </Form.Item>
              <Form.Item name="correctiveAction" label="Hành động khắc phục">
                <TextArea
                  rows={2}
                  placeholder="Mô tả các hành động khắc phục"
                />
              </Form.Item>
              <Form.Item name="preventiveAction" label="Hành động phòng ngừa">
                <TextArea
                  rows={2}
                  placeholder="Mô tả các hành động phòng ngừa"
                />
              </Form.Item>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Select.Option value={NCRStatus.Open}>Mở</Select.Option>
                  <Select.Option value={NCRStatus.InProgress}>
                    Đang xử lý
                  </Select.Option>
                  <Select.Option value={NCRStatus.Resolved}>
                    Đã giải quyết
                  </Select.Option>
                  <Select.Option value={NCRStatus.Closed}>
                    Đã đóng
                  </Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={2} placeholder="Ghi chú bổ sung" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết NCR: ${selectedNCR?.ncrNumber}`}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={<Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>}
        width={800}
        centered
        styles={{ body: { maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" } }}
      >
        {selectedNCR && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã NCR">
                {selectedNCR.ncrNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusConfig[selectedNCR.status]?.color}>
                  {statusConfig[selectedNCR.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu đề" span={2}>
                {selectedNCR.title}
              </Descriptions.Item>
              <Descriptions.Item label="Loại">
                {ncrTypes.find((t) => t.value === selectedNCR.type)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ">
                <Tag color={severityConfig[selectedNCR.severity]?.color}>
                  {severityConfig[selectedNCR.severity]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                {selectedNCR.department || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày báo cáo">
                {dayjs(selectedNCR.reportedAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn xử lý">
                {dayjs(selectedNCR.dueDate).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Mã liên quan" span={2}>
                {selectedNCR.relatedEntityCode || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {selectedNCR.description}
              </Descriptions.Item>
              {selectedNCR.rootCause && (
                <Descriptions.Item label="Nguyên nhân gốc" span={2}>
                  {selectedNCR.rootCause}
                </Descriptions.Item>
              )}
              {selectedNCR.correctiveAction && (
                <Descriptions.Item label="Hành động khắc phục" span={2}>
                  {selectedNCR.correctiveAction}
                </Descriptions.Item>
              )}
              {selectedNCR.preventiveAction && (
                <Descriptions.Item label="Hành động phòng ngừa" span={2}>
                  {selectedNCR.preventiveAction}
                </Descriptions.Item>
              )}
              {selectedNCR.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {selectedNCR.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card title="Lịch sử xử lý" style={{ marginTop: 16 }} size="small">
              <Timeline
                items={[
                  {
                    color: "red",
                    children: `${dayjs(selectedNCR.reportedAt).format(
                      "DD/MM/YYYY HH:mm"
                    )} - NCR được tạo`,
                  },
                  ...(selectedNCR.status !== NCRStatus.Open
                    ? [
                        {
                          color: "blue",
                          children:
                            "Đang xử lý - Phân tích nguyên nhân và thực hiện khắc phục",
                        },
                      ]
                    : []),
                  ...(selectedNCR.status === NCRStatus.Closed &&
                  selectedNCR.closedAt
                    ? [
                        {
                          color: "green",
                          children: `${dayjs(selectedNCR.closedAt).format(
                            "DD/MM/YYYY HH:mm"
                          )} - Đã đóng`,
                        },
                      ]
                    : []),
                ]}
              />
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
};

export default NCRList;
