import React, { useState, useMemo } from 'react';
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
  Modal,
  Form,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

// RTK Query imports
import {
  useGetOrganizationListQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  OrganizationDto,
  CreateUpdateOrganizationDto,
} from '../../store/api/organizationApi';

const OrganizationList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<OrganizationDto | null>(null);
  const [form] = Form.useForm();

  // RTK Query hooks
  const { data: organizationsData, isLoading: loading, refetch } = useGetOrganizationListQuery({
    skipCount: (currentPage - 1) * pageSize,
    maxResultCount: pageSize,
    sorting: 'sortOrder asc, name asc',
    search: searchText || undefined,
  });

  // Mutations
  const [createOrganization, { isLoading: isCreating }] = useCreateOrganizationMutation();
  const [updateOrganization, { isLoading: isUpdating }] = useUpdateOrganizationMutation();
  const [deleteOrganization] = useDeleteOrganizationMutation();

  // Derived data
  const data = useMemo(() => organizationsData?.items || [], [organizationsData]);
  const totalCount = organizationsData?.totalCount || 0;
  const submitting = isCreating || isUpdating;

  const handleSearch = () => {
    setSearchText(searchInput);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrganization(id).unwrap();
      message.success('Xóa thành công!');
    } catch (error: any) {
      console.error('Error deleting:', error);
      message.error('Không thể xóa. Vui lòng thử lại.');
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: OrganizationDto) => {
    setModalMode('edit');
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      isActive: record.isActive,
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      const payload: CreateUpdateOrganizationDto = {
        name: values.name,
        isActive: values.isActive,
      };

      if (modalMode === 'create') {
        await createOrganization(payload).unwrap();
        message.success('Tạo mới thành công!');
      } else if (editingRecord) {
        await updateOrganization({ id: editingRecord.id, data: payload }).unwrap();
        message.success('Cập nhật thành công!');
      }

      setModalVisible(false);
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      console.error('Error saving:', error);
      message.error('Không thể lưu. Vui lòng thử lại.');
    }
  };

  const columns: ColumnsType<OrganizationDto> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Tên CS/DN',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      align: 'center',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'creationTime',
      key: 'creationTime',
      width: 150,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record: OrganizationDto) => (
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
    <Card
      title="Quản lý Cơ sở / Doanh nghiệp"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm mới
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            allowClear
            onClear={() => {
              setSearchInput('');
              setSearchText('');
              setCurrentPage(1);
            }}
            enterButton
          />
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
          pageSizeOptions: [20, 50, 100],
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={modalMode === 'create' ? 'Thêm mới CS/DN' : 'Cập nhật CS/DN'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        okText={modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
        cancelText="Hủy"
        width={500}
        centered
        styles={{ body: { paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên CS/DN"
            rules={[
              { required: true, message: 'Vui lòng nhập tên!' },
              { max: 256, message: 'Tên không được quá 256 ký tự!' },
            ]}
          >
            <Input placeholder="Nhập tên cơ sở / doanh nghiệp" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default OrganizationList;
