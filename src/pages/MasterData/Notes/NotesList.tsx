import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  message,
  Input,
  Row,
  Col,
  Modal,
  Form,
  Popconfirm,
  Tag,
  Switch,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { noteService } from "../../../services/noteService";
import { NoteDto, CreateNoteDto, UpdateNoteDto } from "../../../types/note";

interface NotesTabProps {
  onDataChange?: () => void;
}

const DEFAULT_PAGE_SIZE = 50;

const NotesList: React.FC<NotesTabProps> = ({ onDataChange }) => {
  const [data, setData] = useState<NoteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<NoteDto | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(
    async (
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      search?: string,
      isActive?: boolean
    ) => {
      try {
        setLoading(true);
        const result = await noteService.getList({
          skipCount: (page - 1) * pageSize,
          maxResultCount: pageSize,
          sorting: "sortOrder asc, creationTime desc",
          search: search || undefined,
          isActive: isActive,
        });
        setData(result.items);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.totalCount,
        });
      } catch (err: unknown) {
        console.error("Failed to fetch notes:", err);
        message.error("Không thể tải danh sách ghi chú");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(1, pagination.pageSize, appliedSearch, statusFilter);
  }, [appliedSearch, statusFilter]);

  const handleSearch = () => {
    setAppliedSearch(searchText);
  };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    fetchData(
      paginationConfig.current || 1,
      paginationConfig.pageSize,
      appliedSearch,
      statusFilter
    );
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, sortOrder: 0 });
    setModalOpen(true);
  };

  const handleEdit = (record: NoteDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      content: record.content,
      isActive: record.isActive,
      sortOrder: record.sortOrder,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await noteService.delete(id);
      message.success("Đã xóa ghi chú");
      fetchData(pagination.current, pagination.pageSize, appliedSearch, statusFilter);
      onDataChange?.();
    } catch (err: unknown) {
      console.error("Failed to delete:", err);
      message.error("Không thể xóa ghi chú");
    }
  };

  const handleToggleActive = async (record: NoteDto) => {
    try {
      await noteService.toggleActive(record.id);
      message.success(
        record.isActive ? "Đã vô hiệu hóa ghi chú" : "Đã kích hoạt ghi chú"
      );
      fetchData(pagination.current, pagination.pageSize, appliedSearch, statusFilter);
      onDataChange?.();
    } catch (err: unknown) {
      console.error("Failed to toggle active:", err);
      message.error("Không thể thay đổi trạng thái");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      if (editingItem) {
        const input: UpdateNoteDto = {
          content: values.content,
          isActive: values.isActive,
          sortOrder: values.sortOrder || 0,
        };
        await noteService.update(editingItem.id, input);
        message.success("Đã cập nhật ghi chú");
      } else {
        const input: CreateNoteDto = {
          content: values.content,
          isActive: values.isActive,
          sortOrder: values.sortOrder || 0,
        };
        await noteService.create(input);
        message.success("Đã thêm ghi chú mới");
      }

      setModalOpen(false);
      form.resetFields();
      fetchData(pagination.current, pagination.pageSize, appliedSearch, statusFilter);
      onDataChange?.();
    } catch (err: unknown) {
      console.error("Failed to save:", err);
      const error = err as { errorFields?: unknown; response?: { data?: { general?: string[]; server?: string[]; message?: string } }; message?: string };
      if (error.errorFields) {
        return;
      }
      const responseData = error?.response?.data;
      let errorMessage = "Không thể lưu ghi chú";

      if (responseData?.general?.[0]) {
        errorMessage = responseData.general[0];
      } else if (responseData?.server?.[0]) {
        errorMessage = responseData.server[0];
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
  };

  const columns: ColumnsType<NoteDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 120,
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean, record) => (
        <Tag
          color={isActive ? "green" : "default"}
          style={{ cursor: "pointer" }}
          onClick={() => handleToggleActive(record)}
        >
          {isActive ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
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
    <>
      {/* Header Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo nội dung hoặc mã..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            allowClear
            enterButton
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="Trạng thái"
            style={{ width: "100%" }}
            allowClear
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { value: true, label: "Hoạt động" },
              { value: false, label: "Không hoạt động" },
            ]}
          />
        </Col>
        <Col flex="auto" />
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm mới
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} ghi chú`,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: "Không có ghi chú nào",
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? "Chỉnh sửa ghi chú" : "Thêm ghi chú mới"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={modalLoading}
        okText={editingItem ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        destroyOnHidden
        centered
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="Nội dung ghi chú"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung ghi chú" },
              { max: 1000, message: "Nội dung ghi chú tối đa 1000 ký tự" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập nội dung ghi chú..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Hoạt động"
              unCheckedChildren="Không hoạt động"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NotesList;
