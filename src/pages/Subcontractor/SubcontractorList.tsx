// @ts-nocheck
import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Row,
  Col,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tabs,
  List,
  Typography,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

// RTK Query imports
import {
  useGetSubcontractorListQuery,
  useCreateSubcontractorMutation,
  useUpdateSubcontractorMutation,
  useDeleteSubcontractorMutation,
  SubcontractorDto,
  SubcontractorCertificationDto,
} from "../../store/api/subcontractorApi";

const { Text } = Typography;

// Types
interface Subcontractor {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  taxCode: string;
  status: "active" | "inactive" | "pending";
  capabilities: string[];
  certifications: Certification[];
  evaluationScore: number;
  contractStartDate: string;
  contractEndDate: string;
  notes?: string;
  createdAt: string;
}

interface Certification {
  id: string;
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  status: "valid" | "expired" | "expiring";
}

const SubcontractorList: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subcontractor | null>(null);
  const [selectedItem, setSelectedItem] = useState<Subcontractor | null>(null);
  const [form] = Form.useForm();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });

  const allCapabilities = [
    "Xét nghiệm COVID-19 khẳng định",
    "Giải trình tự gen virus",
    "Xét nghiệm bệnh nhiệt đới",
    "Xét nghiệm HIV khẳng định",
    "Xét nghiệm Viêm gan B/C",
    "Nuôi cấy vi khuẩn đặc biệt",
    "Kiểm nghiệm vắc xin",
    "Kiểm nghiệm sinh phẩm",
    "Thử nghiệm sinh học",
    "Đánh giá an toàn sinh phẩm",
    "Xét nghiệm kháng thuốc",
    "PCR định lượng virus",
    "Western Blot",
    "ELISA chuyên sâu",
  ];

  // Debounce search text
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Build query params
  const queryParams = useMemo(() => ({
    skipCount: (pagination.current - 1) * pagination.pageSize,
    maxResultCount: pagination.pageSize,
    filter: debouncedSearchText || undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  }), [pagination.current, pagination.pageSize, debouncedSearchText, statusFilter]);

  // RTK Query hooks
  const { data: subcontractorsData, isLoading: loading, refetch } = useGetSubcontractorListQuery(queryParams);
  const [createSubcontractor, { isLoading: creating }] = useCreateSubcontractorMutation();
  const [updateSubcontractor, { isLoading: updating }] = useUpdateSubcontractorMutation();
  const [deleteSubcontractor] = useDeleteSubcontractorMutation();

  const modalLoading = creating || updating;

  // Helper to parse capabilities JSON string to array
  const parseCapabilities = (
    capabilities: string | string[] | null | undefined
  ): string[] => {
    if (!capabilities) return [];
    if (Array.isArray(capabilities)) return capabilities;
    try {
      const parsed = JSON.parse(capabilities);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Transform data
  const data = useMemo(() => {
    return (subcontractorsData?.items || []).map((sub: SubcontractorDto) => ({
      id: sub.id,
      code: sub.code,
      name: sub.name,
      address: sub.address || "",
      phone: sub.phone || "",
      email: sub.email || "",
      contactPerson: sub.contactPerson || "",
      taxCode: sub.taxCode || "",
      status: sub.isActive === false ? "inactive" : "active",
      capabilities: parseCapabilities(sub.capabilities),
      certifications: (sub.certifications || []).map((cert: SubcontractorCertificationDto) => ({
        ...cert,
        status: dayjs(cert.expiryDate).isBefore(dayjs()) ? "expired" :
                dayjs(cert.expiryDate).diff(dayjs(), "month") < 3 ? "expiring" : "valid",
      })),
      evaluationScore: sub.evaluationScore || 0,
      contractStartDate: sub.contractStartDate || "",
      contractEndDate: sub.contractEndDate || "",
      notes: sub.notes,
      createdAt: sub.creationTime,
    })) as Subcontractor[];
  }, [subcontractorsData]);

  const totalCount = subcontractorsData?.totalCount || 0;

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle table pagination change
  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchText("");
    setDebouncedSearchText("");
    setStatusFilter("all");
    setPagination(prev => ({ ...prev, current: 1 }));
    refetch();
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      code: `NTP-${String(data.length + 1).padStart(3, "0")}`,
      status: "pending",
      contractStartDate: dayjs(),
      contractEndDate: dayjs().add(1, "year"),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: Subcontractor) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      contractStartDate: dayjs(record.contractStartDate),
      contractEndDate: dayjs(record.contractEndDate),
    });
    setIsModalOpen(true);
  };

  const handleView = (record: Subcontractor) => {
    setSelectedItem(record);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubcontractor(id).unwrap();
      message.success("Xóa nhà thầu phụ thành công!");
    } catch (error) {
      console.error("Error deleting subcontractor:", error);
      message.error("Không thể xóa nhà thầu phụ. Vui lòng thử lại.");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      // Convert capabilities array to JSON string for backend
      const capabilitiesJson =
        values.capabilities && values.capabilities.length > 0
          ? JSON.stringify(values.capabilities)
          : null;

      // Backend DTO doesn't have 'code' field - it's auto-generated
      const payload = {
        name: values.name,
        address: values.address,
        phone: values.phone,
        email: values.email,
        contactPerson: values.contactPerson,
        taxCode: values.taxCode,
        isActive: values.status === "active",
        capabilities: capabilitiesJson,
        contractStartDate: values.contractStartDate?.toISOString(),
        contractEndDate: values.contractEndDate?.toISOString(),
        notes: values.notes || "",
      };

      if (editingItem) {
        await updateSubcontractor({ id: editingItem.id, data: payload }).unwrap();
        message.success("Cập nhật nhà thầu phụ thành công!");
      } else {
        await createSubcontractor(payload).unwrap();
        message.success("Thêm nhà thầu phụ thành công!");
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      console.error("Error saving subcontractor:", error);
      message.error("Không thể lưu nhà thầu phụ. Vui lòng thử lại.");
    }
  };

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      active: { color: "green", text: "Đang hoạt động" },
      inactive: { color: "red", text: "Ngừng hoạt động" },
      pending: { color: "orange", text: "Chờ đánh giá" },
    };
    return <Tag color={config[status]?.color}>{config[status]?.text}</Tag>;
  };

  const columns: ColumnsType<Subcontractor> = [
    {
      title: "Mã NTP",
      dataIndex: "code",
      key: "code",
      width: 100,
      fixed: "left",
    },
    {
      title: "Tên nhà thầu phụ",
      dataIndex: "name",
      key: "name",
      width: 280,
      ellipsis: true,
    },
    {
      title: "Người liên hệ",
      dataIndex: "contactPerson",
      key: "contactPerson",
      width: 150,
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 140,
    },
    {
      title: "Năng lực",
      dataIndex: "capabilities",
      key: "capabilities",
      width: 250,
      render: (caps: string[]) => (
        <Space wrap size={[0, 4]}>
          {caps.slice(0, 2).map((cap) => (
            <Tag key={cap} color="blue">
              {cap}
            </Tag>
          ))}
          {caps.length > 2 && <Tag>+{caps.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Hết hạn HĐ",
      dataIndex: "contractEndDate",
      key: "contractEndDate",
      width: 120,
      render: (date: string) => {
        if (!date) return "-";
        const d = dayjs(date);
        const isExpiring = d.diff(dayjs(), "month") < 3;
        return (
          <Text type={isExpiring ? "danger" : undefined}>
            {d.format("DD/MM/YYYY")}
          </Text>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
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
    <div>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            Quản lý Nhà thầu phụ
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm nhà thầu phụ
            </Button>
          </Space>
        }
      >
        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo mã, tên, người liên hệ..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="active">Đang hoạt động</Select.Option>
              <Select.Option value="inactive">Ngừng hoạt động</Select.Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: totalCount,
            pageSizeOptions: [20, 50, 100],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} nhà thầu phụ`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? "Chỉnh sửa nhà thầu phụ" : "Thêm nhà thầu phụ mới"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText={editingItem ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        centered
        confirmLoading={modalLoading}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="code"
                label="Mã nhà thầu phụ"
                rules={[{ required: true }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên nhà thầu phụ"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactPerson"
                label="Người liên hệ"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Điện thoại"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taxCode" label="Mã số thuế">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="capabilities" label="Năng lực thử nghiệm">
            <Select mode="multiple" placeholder="Chọn năng lực">
              {allCapabilities.map((cap) => (
                <Select.Option key={cap} value={cap}>
                  {cap}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  <Select.Option value="active">Đang hoạt động</Select.Option>
                  <Select.Option value="pending">Chờ đánh giá</Select.Option>
                  <Select.Option value="inactive">
                    Ngừng hoạt động
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractStartDate" label="Ngày bắt đầu HĐ">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractEndDate" label="Ngày kết thúc HĐ">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết nhà thầu phụ: ${selectedItem?.name}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={900}
        centered
      >
        {selectedItem && (
          <Tabs
            items={[
              {
                key: "info",
                label: "Thông tin chung",
                children: (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Mã NTP">
                      {selectedItem.code}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      {getStatusTag(selectedItem.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tên" span={2}>
                      {selectedItem.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      {selectedItem.address}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người liên hệ">
                      {selectedItem.contactPerson}
                    </Descriptions.Item>
                    <Descriptions.Item label="Điện thoại">
                      {selectedItem.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {selectedItem.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã số thuế">
                      {selectedItem.taxCode}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bắt đầu HĐ">
                      {selectedItem.contractStartDate ? dayjs(selectedItem.contractStartDate).format("DD/MM/YYYY") : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Kết thúc HĐ">
                      {selectedItem.contractEndDate ? dayjs(selectedItem.contractEndDate).format("DD/MM/YYYY") : "-"}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: "capabilities",
                label: "Năng lực thử nghiệm",
                children: (
                  <List
                    dataSource={selectedItem.capabilities}
                    renderItem={(item) => (
                      <List.Item>
                        <CheckCircleOutlined
                          style={{ color: "#52c41a", marginRight: 8 }}
                        />
                        {item}
                      </List.Item>
                    )}
                  />
                ),
              },
              {
                key: "certifications",
                label: "Chứng nhận",
                children: (
                  <Table
                    dataSource={selectedItem.certifications}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      {
                        title: "Tên chứng nhận",
                        dataIndex: "name",
                        key: "name",
                      },
                      {
                        title: "Cấp bởi",
                        dataIndex: "issuedBy",
                        key: "issuedBy",
                      },
                      {
                        title: "Ngày cấp",
                        dataIndex: "issuedDate",
                        key: "issuedDate",
                        render: (d) => dayjs(d).format("DD/MM/YYYY"),
                      },
                      {
                        title: "Ngày hết hạn",
                        dataIndex: "expiryDate",
                        key: "expiryDate",
                        render: (d) => dayjs(d).format("DD/MM/YYYY"),
                      },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        key: "status",
                        render: (s) => (
                          <Tag
                            color={
                              s === "valid"
                                ? "green"
                                : s === "expiring"
                                ? "orange"
                                : "red"
                            }
                          >
                            {s === "valid"
                              ? "Còn hiệu lực"
                              : s === "expiring"
                              ? "Sắp hết hạn"
                              : "Hết hạn"}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default SubcontractorList;
