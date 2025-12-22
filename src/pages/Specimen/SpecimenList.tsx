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
  Modal,
  Form,
  InputNumber,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  MinusCircleOutlined,
  ImportOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import {
  useGetSpecimenListQuery,
  useCreateSpecimenMutation,
  useUpdateSpecimenMutation,
  useDeleteSpecimenMutation,
} from "../../store/api/specimenApi";
import {
  useGetActiveSpecimenTypesQuery,
  useGetActiveStorageLocationsQuery,
} from "../../store/api/masterDataApi";
import { useGetTestRequestListQuery } from "../../store/api/testRequestApi";
import { SpecimenDto, SpecimenStatus } from "../../types/specimen";
import { importService, downloadBlobAsFile } from "../../services/importService";
import dayjs from "dayjs";
import ImportExcelModal from "../../components/common/ImportExcelModal";

const SpecimenList: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<SpecimenStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecimenDto | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [form] = Form.useForm();

  // RTK Query hooks
  const {
    data: specimenData,
    isLoading: loading,
    isFetching,
    refetch,
  } = useGetSpecimenListQuery({
    skipCount: (currentPage - 1) * pageSize,
    maxResultCount: pageSize,
    sorting: "receivedDate desc",
    search: searchText || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const { data: specimenTypesData } = useGetActiveSpecimenTypesQuery();
  const { data: storageLocationsData } = useGetActiveStorageLocationsQuery();
  const { data: testRequestsData } = useGetTestRequestListQuery({ maxResultCount: 1000 });

  const [createSpecimen, { isLoading: isCreating }] = useCreateSpecimenMutation();
  const [updateSpecimen, { isLoading: isUpdating }] = useUpdateSpecimenMutation();
  const [deleteSpecimen, { isLoading: isDeleting }] = useDeleteSpecimenMutation();

  // Derived data
  const data = useMemo(() => specimenData?.items || [], [specimenData]);
  const totalCount = specimenData?.totalCount || 0;
  const specimenTypes = useMemo(
    () => specimenTypesData?.items?.map((t) => t.name) || [],
    [specimenTypesData]
  );
  const storageLocations = useMemo(
    () => storageLocationsData?.items || [],
    [storageLocationsData]
  );
  const testRequests = useMemo(
    () => testRequestsData?.items || [],
    [testRequestsData]
  );

  const actionLoading = isCreating || isUpdating || isDeleting || isFetching;

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await importService.downloadSpecimensTemplate();
      downloadBlobAsFile(blob, "specimens-template.xlsx");
      message.success("Tải template thành công!");
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error("Không thể tải template. Vui lòng thử lại.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

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

  // Handle type filter change
  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSpecimen(id).unwrap();
      message.success("Xóa mẫu thành công!");
    } catch (error: any) {
      console.error("Error deleting specimen:", error);
      message.error(error.data?.error?.message || "Không thể xóa mẫu. Vui lòng thử lại.");
    }
  };

  const generateSpecimenCode = (index: number) => {
    return `SPE-${dayjs().format("YYYYMMDD")}-${String(
      data.length + index + 1
    ).padStart(4, "0")}`;
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      testRequestId: undefined,
      specimens: [
        {
          code: generateSpecimenCode(0),
          receivedDate: dayjs(),
          name: "",
          type: undefined,
          quantity: 1,
          unit: "mẫu",
          status: SpecimenStatus.Received,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: SpecimenDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      testRequestId: record.testRequestId,
      specimens: [
        {
          code: record.code,
          receivedDate: dayjs(record.receivedDate),
          name: record.name,
          type: record.type,
          quantity: record.quantity,
          unit: record.unit,
          status: record.status,
        },
      ],
      storageLocation: record.storageLocation,
      description: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingItem) {
        // Edit mode - only one specimen
        const specimen = values.specimens[0];
        const updateData = {
          code: specimen.code,
          name: specimen.name,
          type: specimen.type,
          receivedDate: specimen.receivedDate.toISOString(),
          testRequestId: values.testRequestId,
          quantity: specimen.quantity,
          unit: specimen.unit,
          status: specimen.status,
          storageLocation: values.storageLocation,
          notes: values.description,
        };
        await updateSpecimen({ id: editingItem.id, data: updateData }).unwrap();
        message.success("Cập nhật mẫu thành công!");
      } else {
        // Create mode - multiple specimens
        for (const specimen of values.specimens) {
          const createData = {
            code: specimen.code,
            name: specimen.name,
            type: specimen.type,
            receivedDate: specimen.receivedDate.toISOString(),
            testRequestId: values.testRequestId,
            quantity: specimen.quantity,
            unit: specimen.unit,
            status: specimen.status,
            storageLocation: values.storageLocation,
            notes: values.description,
          };
          await createSpecimen(createData).unwrap();
        }
        message.success(`Thêm ${values.specimens.length} mẫu mới thành công!`);
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      console.error("Error saving specimen:", error);
      message.error(error.data?.error?.message || "Không thể lưu mẫu. Vui lòng thử lại.");
    }
  };

  const getStatusTag = (status: SpecimenStatus) => {
    const statusConfig = {
      [SpecimenStatus.Received]: { color: "blue", text: "Đã nhận" },
      [SpecimenStatus.Testing]: { color: "processing", text: "Đang thử nghiệm" },
      [SpecimenStatus.Storage]: { color: "cyan", text: "Lưu kho" },
      [SpecimenStatus.Disposal]: { color: "warning", text: "Chờ hủy" },
      [SpecimenStatus.Destroyed]: { color: "error", text: "Đã hủy" },
      [SpecimenStatus.ReturnedToCustomer]: { color: "success", text: "Đã trả khách" },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<SpecimenDto> = [
    {
      title: "Mã mẫu",
      dataIndex: "code",
      key: "code",
      width: 180,
      fixed: "left",
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: "Tên mẫu",
      dataIndex: "name",
      key: "name",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Loại mẫu",
      dataIndex: "type",
      key: "type",
      width: 120,
    },
    {
      title: "Ngày nhận",
      dataIndex: "receivedDate",
      key: "receivedDate",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.receivedDate).unix() - dayjs(b.receivedDate).unix(),
    },
    {
      title: "Số yêu cầu",
      dataIndex: "testRequestNumber",
      key: "testRequestNumber",
      width: 180,
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 100,
      render: (_: any, record: SpecimenDto) => `${record.quantity} ${record.unit}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: SpecimenStatus) => getStatusTag(status),
    },
    {
      title: "Vị trí lưu",
      dataIndex: "storageLocation",
      key: "storageLocation",
      width: 120,
      render: (text: string) => text || "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_: any, record: SpecimenDto) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/specimen/${record.id}`)}
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
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={isDeleting}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Danh sách mẫu thử nghiệm"
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
          <Button icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
            Import Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm mẫu
          </Button>
        </Space>
      }
    >
      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm theo mã, tên, loại mẫu..."
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
            placeholder="Loại mẫu"
            value={typeFilter}
            onChange={handleTypeChange}
          >
            <Select.Option value="all">Tất cả loại</Select.Option>
            {specimenTypes.map((t) => (
              <Select.Option key={t} value={t}>
                {t}
              </Select.Option>
            ))}
          </Select>
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
        loading={loading || isFetching}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          pageSizeOptions: [50, 100, 150],
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} mẫu`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        scroll={{ x: 1500 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? "Chỉnh sửa mẫu" : "Thêm mẫu mới"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={900}
        okText={editingItem ? "Cập nhật" : "Thêm mẫu"}
        cancelText="Hủy"
        centered
        confirmLoading={actionLoading}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        <Form form={form} layout="vertical">
          {/* Số yêu cầu thử nghiệm - Dropdown chung cho tất cả mẫu */}
          <Form.Item
            name="testRequestId"
            label="Số yêu cầu thử nghiệm"
            rules={[{ required: true, message: "Vui lòng chọn phiếu yêu cầu" }]}
          >
            <Select
              placeholder="Chọn phiếu yêu cầu thử nghiệm"
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {testRequests.map((tr) => (
                <Select.Option key={tr.id} value={tr.id}>
                  {tr.requestNumber} - {tr.customerName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Danh sách mẫu */}
          <Form.List name="specimens">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card
                    key={key}
                    size="small"
                    title={`Mẫu ${index + 1}`}
                    style={{ marginBottom: 16 }}
                    extra={
                      !editingItem && fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        >
                          Xóa
                        </Button>
                      )
                    }
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, "code"]}
                          label="Mã mẫu"
                          rules={[{ required: true, message: "Vui lòng nhập mã mẫu" }]}
                        >
                          <Input disabled />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, "receivedDate"]}
                          label="Ngày nhận"
                          rules={[{ required: true, message: "Vui lòng chọn ngày nhận" }]}
                        >
                          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, "name"]}
                          label="Tên mẫu"
                          rules={[{ required: true, message: "Vui lòng nhập tên mẫu" }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, "type"]}
                          label="Loại mẫu"
                          rules={[{ required: true, message: "Vui lòng chọn loại mẫu" }]}
                        >
                          <Select placeholder="Chọn loại mẫu">
                            {specimenTypes.map((t) => (
                              <Select.Option key={t} value={t}>
                                {t}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          label="Số lượng"
                          rules={[{ required: true, message: "Nhập số lượng" }]}
                        >
                          <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "unit"]}
                          label="Đơn vị"
                          rules={[{ required: true, message: "Chọn đơn vị" }]}
                        >
                          <Select>
                            <Select.Option value="mẫu">mẫu</Select.Option>
                            <Select.Option value="ml">ml</Select.Option>
                            <Select.Option value="L">L</Select.Option>
                            <Select.Option value="g">g</Select.Option>
                            <Select.Option value="kg">kg</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, "status"]}
                          label="Trạng thái"
                          rules={[{ required: true, message: "Chọn trạng thái" }]}
                        >
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
                    </Row>
                  </Card>
                ))}

                {/* Nút thêm mẫu mới - chỉ hiển thị khi tạo mới */}
                {!editingItem && (
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => {
                        const currentSpecimens = form.getFieldValue("specimens") || [];
                        add({
                          code: generateSpecimenCode(currentSpecimens.length),
                          receivedDate: dayjs(),
                          name: "",
                          type: undefined,
                          quantity: 1,
                          unit: "mẫu",
                          status: SpecimenStatus.Received,
                        });
                      }}
                      block
                      icon={<PlusOutlined />}
                    >
                      Thêm mẫu
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>

          {/* Thông tin chung */}
          <Card size="small" title="Thông tin chung" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="storageLocation" label="Vị trí lưu kho">
                  <Select allowClear placeholder="Chọn vị trí lưu kho">
                    {storageLocations.map((loc) => (
                      <Select.Option key={loc.id} value={loc.name}>
                        {loc.code} - {loc.name} ({loc.temperature || "N/A"})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="storageCondition" label="Điều kiện bảo quản">
                  <Select allowClear placeholder="Chọn điều kiện bảo quản">
                    <Select.Option value="2-8°C">2-8°C (Lạnh)</Select.Option>
                    <Select.Option value="-20°C">-20°C (Đông lạnh)</Select.Option>
                    <Select.Option value="Nhiệt độ phòng">Nhiệt độ phòng</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Card>
        </Form>
      </Modal>

      {/* Import Excel Modal */}
      <ImportExcelModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          refetch();
        }}
        importType="specimens"
        title="Import mẫu thử nghiệm"
      />
    </Card>
  );
};

export default SpecimenList;
