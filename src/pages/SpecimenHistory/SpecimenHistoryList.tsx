import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Tag,
  Card,
  Input,
  Row,
  Col,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  SpecimenHistoryDto,
  SpecimenStatus,
} from "../../types/specimenHistory";

// RTK Query imports
import {
  useGetSpecimenHistoryListQuery,
  useCreateSpecimenHistoryMutation,
  useUpdateSpecimenHistoryMutation,
  useDeleteSpecimenHistoryMutation,
} from "../../store/api/specimenHistoryApi";
import { useGetSpecimenListQuery } from "../../store/api/specimenApi";
import { useGetActiveStorageLocationsQuery } from "../../store/api/masterDataApi";
import { useGetUserLookupQuery } from "../../store/api/userApi";

const SpecimenHistoryList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<SpecimenStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecimenHistoryDto | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // RTK Query hooks
  const { data: historyData, isLoading: loading, refetch } = useGetSpecimenHistoryListQuery({
    skipCount: (currentPage - 1) * pageSize,
    maxResultCount: pageSize,
    sorting: "creationTime desc",
    search: searchText || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { data: specimensData } = useGetSpecimenListQuery({ maxResultCount: 1000 });
  const { data: storageLocationsData } = useGetActiveStorageLocationsQuery();
  const { data: usersData } = useGetUserLookupQuery();

  // Mutations
  const [createSpecimenHistory] = useCreateSpecimenHistoryMutation();
  const [updateSpecimenHistory] = useUpdateSpecimenHistoryMutation();
  const [deleteSpecimenHistory] = useDeleteSpecimenHistoryMutation();

  // Derived data
  const data = useMemo(() => historyData?.items || [], [historyData]);
  const totalCount = historyData?.totalCount || 0;
  const specimens = useMemo(() => specimensData?.items || [], [specimensData]);
  const storageLocations = useMemo(() => storageLocationsData?.items || [], [storageLocationsData]);
  const users = useMemo(() => usersData || [], [usersData]);

  const actionOptions = [
    "Tiếp nhận mẫu",
    "Chuyển vào kho lạnh",
    "Lấy mẫu thử nghiệm",
    "Hoàn tất thử nghiệm",
    "Chuyển lưu kho",
    "Chuẩn bị hủy mẫu",
    "Đã hủy mẫu",
    "Trả mẫu cho khách hàng",
  ];

  // Handle search
  const handleSearch = () => {
    setSearchText(searchInput);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (value: SpecimenStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSpecimenHistory(id).unwrap();
      message.success("Xóa lịch sử thành công!");
    } catch (error) {
      console.error("Error deleting specimen history:", error);
      message.error("Không thể xóa lịch sử. Vui lòng thử lại.");
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      status: SpecimenStatus.Received,
      timestamp: dayjs(),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: SpecimenHistoryDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      timestamp: record.timestamp ? dayjs(record.timestamp) : dayjs(),
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        specimenId: values.specimenId,
        action: values.action,
        location: values.location,
        status: values.status,
        notes: values.notes || "",
        performedById: values.performedById || undefined,
        temperature: values.temperature || undefined,
        humidity: values.humidity || undefined,
        timestamp: values.timestamp ? values.timestamp.toISOString() : undefined,
      };

      if (editingItem) {
        await updateSpecimenHistory({ id: editingItem.id, data: payload }).unwrap();
        message.success("Cập nhật lịch sử thành công!");
      } else {
        await createSpecimenHistory(payload).unwrap();
        message.success("Thêm lịch sử mới thành công!");
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      console.error("Error saving specimen history:", error);
      message.error("Không thể lưu lịch sử. Vui lòng thử lại.");
    }
  };

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: "blue", label: "Đã nhận" },
      [SpecimenStatus.Testing]: { color: "processing", label: "Đang thử nghiệm" },
      [SpecimenStatus.Storage]: { color: "cyan", label: "Lưu kho" },
      [SpecimenStatus.Disposal]: { color: "warning", label: "Chờ hủy" },
      [SpecimenStatus.Destroyed]: { color: "error", label: "Đã hủy" },
      [SpecimenStatus.ReturnedToCustomer]: { color: "success", label: "Đã trả khách" },
    };

    const config = statusConfig[status];
    return <Tag color={config?.color || "default"}>{config?.label || status}</Tag>;
  };

  const columns = [
    {
      title: "Mã mẫu",
      dataIndex: "specimenCode",
      key: "specimenCode",
      width: 180,
      fixed: "left" as const,
      sorter: (a: SpecimenHistoryDto, b: SpecimenHistoryDto) =>
        (a.specimenCode || "").localeCompare(b.specimenCode || ""),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 180,
      render: (action: string) => (
        <Space>
          <HistoryOutlined />
          {action}
        </Space>
      ),
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      key: "location",
      width: 180,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: SpecimenStatus) => getStatusTag(status),
    },
    {
      title: "Người thực hiện",
      dataIndex: "performedByName",
      key: "performedByName",
      width: 140,
      render: (name: string) => name || "-",
    },
    {
      title: "Thời gian",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-"),
      sorter: (a: SpecimenHistoryDto, b: SpecimenHistoryDto) =>
        dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
    },
    {
      title: "Nhiệt độ",
      dataIndex: "temperature",
      key: "temperature",
      width: 100,
      render: (val: string) => val || "-",
    },
    {
      title: "Độ ẩm",
      dataIndex: "humidity",
      key: "humidity",
      width: 100,
      render: (val: string) => val || "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: SpecimenHistoryDto) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/specimen-histories/${record.id}`)}
          />
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Lịch sử mẫu thử nghiệm"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm lịch sử
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo mã mẫu, hành động, vị trí..."
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
            <Select.Option value={SpecimenStatus.Received}>Đã nhận</Select.Option>
            <Select.Option value={SpecimenStatus.Testing}>Đang thử nghiệm</Select.Option>
            <Select.Option value={SpecimenStatus.Storage}>Lưu kho</Select.Option>
            <Select.Option value={SpecimenStatus.Disposal}>Chờ hủy</Select.Option>
            <Select.Option value={SpecimenStatus.Destroyed}>Đã hủy</Select.Option>
            <Select.Option value={SpecimenStatus.ReturnedToCustomer}>Đã trả khách</Select.Option>
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
          showTotal: (total) => `Tổng ${total} bản ghi`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        scroll={{ x: 1500 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? "Chỉnh sửa lịch sử" : "Thêm lịch sử mẫu"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        okText={editingItem ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        centered
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="specimenId"
                label="Mẫu thử"
                rules={[{ required: true, message: "Vui lòng chọn mẫu" }]}
              >
                <Select placeholder="Chọn mẫu" showSearch optionFilterProp="children">
                  {specimens.map((s: any) => (
                    <Select.Option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="timestamp" label="Thời gian thực hiện">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="action"
                label="Hành động"
                rules={[{ required: true, message: "Vui lòng chọn hành động" }]}
              >
                <Select>
                  {actionOptions.map((a) => (
                    <Select.Option key={a} value={a}>
                      {a}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Vị trí"
                rules={[{ required: true, message: "Vui lòng chọn vị trí" }]}
              >
                <Select showSearch optionFilterProp="children">
                  <Select.Option value="Quầy tiếp nhận">Quầy tiếp nhận</Select.Option>
                  {storageLocations.map((l: any) => (
                    <Select.Option key={l.id} value={l.name}>
                      {l.code} - {l.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái mẫu">
                <Select>
                  <Select.Option value={SpecimenStatus.Received}>Đã nhận</Select.Option>
                  <Select.Option value={SpecimenStatus.Testing}>Đang thử nghiệm</Select.Option>
                  <Select.Option value={SpecimenStatus.Storage}>Lưu kho</Select.Option>
                  <Select.Option value={SpecimenStatus.Disposal}>Chờ hủy</Select.Option>
                  <Select.Option value={SpecimenStatus.Destroyed}>Đã hủy</Select.Option>
                  <Select.Option value={SpecimenStatus.ReturnedToCustomer}>Đã trả khách</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="performedById" label="Người thực hiện">
                <Select
                  placeholder="Chọn người thực hiện"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map((user: any) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.displayName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="temperature" label="Nhiệt độ (°C)">
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="VD: 25.5"
                  step={0.1}
                  precision={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="humidity" label="Độ ẩm (%)">
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="VD: 65"
                  min={0}
                  max={100}
                  step={1}
                  precision={1}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SpecimenHistoryList;
