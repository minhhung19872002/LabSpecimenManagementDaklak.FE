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
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import testResultValueService, {
  TestResultValueDto,
  CreateUpdateTestResultValueDto,
} from "../../../services/testResultValueService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

interface TestResultValuesTabProps {
  onDataChange?: () => void;
}

const DEFAULT_PAGE_SIZE = 50;

const TestResultValuesList: React.FC<TestResultValuesTabProps> = ({
  onDataChange,
}) => {
  const [data, setData] = useState<TestResultValueDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<TestResultValueDto | null>(
    null
  );
  const [form] = Form.useForm();

  const fetchData = useCallback(
    async (page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
      try {
        setLoading(true);
        const result = await testResultValueService.getList({
          skipCount: (page - 1) * pageSize,
          maxResultCount: pageSize,
          sorting: "creationTime desc",
        });
        setData(result.items);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.totalCount,
        });
      } catch (err: any) {
        console.error("Failed to fetch test result values:", err);
        message.error("Không thể tải danh sách kết quả");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    fetchData(paginationConfig.current || 1, paginationConfig.pageSize);
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: TestResultValueDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await testResultValueService.delete(id);
      message.success("Đã xóa kết quả");
      fetchData(pagination.current, pagination.pageSize);
      onDataChange?.();
    } catch (err: any) {
      console.error("Failed to delete:", err);
      message.error("Không thể xóa kết quả");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const input: CreateUpdateTestResultValueDto = {
        name: values.name,
        description: values.description,
      };

      if (editingItem) {
        await testResultValueService.update(editingItem.id, input);
        message.success("Đã cập nhật kết quả");
      } else {
        await testResultValueService.create(input);
        message.success("Đã thêm kết quả mới");
      }

      setModalOpen(false);
      form.resetFields();
      fetchData(pagination.current, pagination.pageSize);
      onDataChange?.();
    } catch (err: any) {
      console.error("Failed to save:", err);
      if (err.errorFields) {
        // Form validation error
        return;
      }
      // Extract error message from API response
      // API interceptor unwraps: err.response.data = { general: ["..."], server: ["..."] }
      const responseData = err?.response?.data;
      let errorMessage = "Không thể lưu kết quả";

      if (responseData?.general?.[0]) {
        errorMessage = responseData.general[0];
      } else if (responseData?.server?.[0]) {
        errorMessage = responseData.server[0];
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (err?.message) {
        errorMessage = err.message;
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

  // Filter data by search text
  const filteredData = searchText
    ? data.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.code.toLowerCase().includes(searchText.toLowerCase())
      )
    : data;

  const canEdit = authService.hasPermission(PERMISSIONS.TestResultValues.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.TestResultValues.Delete);

  const columns: ColumnsType<TestResultValueDto> = [
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
      width: 180,
    },
    {
      title: "Tên kết quả",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {canEdit && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          )}
          {canDelete && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Header Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo tên hoặc mã..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col flex="auto" />
        <Col>
          {authService.hasPermission(PERMISSIONS.TestResultValues.Create) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm mới
            </Button>
          )}
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: "Không có kết quả nào",
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? "Chỉnh sửa kết quả" : "Thêm kết quả mới"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={modalLoading}
        okText={editingItem ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        destroyOnHidden
        centered
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên kết quả"
            rules={[
              { required: true, message: "Vui lòng nhập tên kết quả" },
              { max: 200, message: "Tên kết quả tối đa 200 ký tự" },
            ]}
          >
            <Input placeholder="Ví dụ: Đạt, Không đạt, Phù hợp..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ max: 500, message: "Mô tả tối đa 500 ký tự" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả thêm về kết quả (không bắt buộc)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TestResultValuesList;
