import React, { useState, useEffect, useMemo } from "react";
import {
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
  message,
  Popconfirm,
  Spin,
  Tooltip,
  Upload,
  Alert,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  FolderAddOutlined,
  MinusCircleOutlined,
  UploadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import type { ColumnsType } from "antd/es/table";
import {
  indicatorGroupService,
  indicatorService,
  IndicatorGroupDto,
  IndicatorDto,
  CreateUpdateIndicatorGroupDto,
  CreateIndicatorDto,
  UpdateIndicatorDto,
  CreateBulkIndicatorsDto,
  ImportIndicatorsResultDto,
  ImportIndicatorGroupsResultDto,
} from "../../services/masterDataService";

interface IndicatorsTabProps {
  onDataChange?: () => void;
}

const IndicatorsTab: React.FC<IndicatorsTabProps> = ({ onDataChange }) => {
  const [groups, setGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Modal states
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importGroupModalOpen, setImportGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IndicatorGroupDto | null>(
    null
  );
  const [editingIndicator, setEditingIndicator] = useState<IndicatorDto | null>(
    null
  );
  const [modalLoading, setModalLoading] = useState(false);
  const [importResult, setImportResult] =
    useState<ImportIndicatorsResultDto | null>(null);
  const [importGroupResult, setImportGroupResult] =
    useState<ImportIndicatorGroupsResultDto | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [groupFileList, setGroupFileList] = useState<UploadFile[]>([]);

  const [groupForm] = Form.useForm();
  const [indicatorForm] = Form.useForm();
  const [bulkForm] = Form.useForm();

  // Computed options for Select
  const groupOptions = useMemo(() => {
    console.log("Computing groupOptions, groups:", groups);
    return (groups || []).map((group) => ({
      value: group.id,
      label: group.name + (!group.isActive ? " (Ngừng)" : ""),
    }));
  }, [groups]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsData, indicatorsData] = await Promise.all([
        indicatorGroupService.getWithCount(),
        indicatorService.getList({ maxResultCount: 1000 }),
      ]);
      console.log("groupsData: ", groupsData);
      setGroups(groupsData || []);
      setIndicators(indicatorsData?.items || []);
      // Expand all groups by default
      setExpandedRowKeys((groupsData || []).map((g) => g.id));
    } catch (error) {
      console.error("Failed to fetch indicators data:", error);
      message.error("Không thể tải dữ liệu chỉ tiêu");
      setGroups([]);
      setIndicators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter indicators by search
  const filteredIndicators = searchText
    ? (indicators || []).filter(
        (item) =>
          item.code?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.indicatorGroupName
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
      )
    : indicators || [];

  // Group indicators by group for expandable table
  const groupedData = (groups || []).map((group) => ({
    ...group,
    key: group.id,
    indicators: filteredIndicators.filter(
      (ind) => ind.indicatorGroupId === group.id
    ),
  }));

  // Handle Group CRUD
  const handleCreateGroup = () => {
    setEditingGroup(null);
    groupForm.resetFields();
    groupForm.setFieldsValue({ isActive: true });
    setGroupModalOpen(true);
  };

  const handleEditGroup = (group: IndicatorGroupDto) => {
    setEditingGroup(group);
    groupForm.setFieldsValue(group);
    setGroupModalOpen(true);
  };

  const handleDeleteGroup = async (id: string) => {
    const groupIndicators = indicators.filter(
      (ind) => ind.indicatorGroupId === id
    );
    if (groupIndicators.length > 0) {
      message.error("Không thể xóa nhóm có chứa chỉ tiêu");
      return;
    }
    try {
      await indicatorGroupService.delete(id);
      message.success("Xóa nhóm thành công!");
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể xóa nhóm");
    }
  };

  const handleGroupModalOk = async () => {
    try {
      setModalLoading(true);
      const values = await groupForm.validateFields();

      if (editingGroup) {
        await indicatorGroupService.update(
          editingGroup.id,
          values as CreateUpdateIndicatorGroupDto
        );
        message.success("Cập nhật nhóm thành công!");
      } else {
        await indicatorGroupService.create(
          values as CreateUpdateIndicatorGroupDto
        );
        message.success("Thêm nhóm thành công!");
      }

      setGroupModalOpen(false);
      groupForm.resetFields();
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể lưu nhóm");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Indicator CRUD
  const handleEditIndicator = (indicator: IndicatorDto) => {
    setEditingIndicator(indicator);
    indicatorForm.setFieldsValue(indicator);
    setIndicatorModalOpen(true);
  };

  const handleDeleteIndicator = async (id: string) => {
    try {
      const canDelete = await indicatorService.canDelete(id);
      if (!canDelete) {
        message.error(
          "Không thể xóa chỉ tiêu này vì đã được sử dụng trong phiếu yêu cầu"
        );
        return;
      }
      await indicatorService.delete(id);
      message.success("Xóa chỉ tiêu thành công!");
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể xóa chỉ tiêu");
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await indicatorService.toggleActive(id);
      message.success("Cập nhật trạng thái thành công!");
      fetchData();
    } catch (error) {
      message.error("Không thể cập nhật trạng thái");
    }
  };

  // Batch operations
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} chỉ tiêu đã chọn?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setBatchLoading(true);
          const result = await indicatorService.batchDelete(selectedRowKeys);
          if (result.successCount > 0) {
            message.success(
              `Đã xóa ${result.successCount} chỉ tiêu thành công!`
            );
          }
          if (result.failedCount > 0) {
            const errorNames = result.errors.map((e) => e.name).join(", ");
            message.warning(
              `${result.failedCount} chỉ tiêu không thể xóa: ${errorNames}`
            );
          }
          setSelectedRowKeys([]);
          fetchData();
          onDataChange?.();
        } catch (error) {
          message.error("Không thể xóa chỉ tiêu");
        } finally {
          setBatchLoading(false);
        }
      },
    });
  };

  const handleBatchDeactivate = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    Modal.confirm({
      title: "Xác nhận ngưng hoạt động",
      content: `Bạn có chắc chắn muốn ngưng hoạt động ${selectedRowKeys.length} chỉ tiêu đã chọn?`,
      okText: "Ngưng hoạt động",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setBatchLoading(true);
          const result = await indicatorService.batchDeactivate(
            selectedRowKeys
          );
          message.success(
            `Đã ngưng hoạt động ${result.successCount} chỉ tiêu!`
          );
          setSelectedRowKeys([]);
          fetchData();
        } catch (error) {
          message.error("Không thể ngưng hoạt động chỉ tiêu");
        } finally {
          setBatchLoading(false);
        }
      },
    });
  };

  const handleBatchActivate = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    try {
      setBatchLoading(true);
      const result = await indicatorService.batchActivate(selectedRowKeys);
      message.success(`Đã kích hoạt ${result.successCount} chỉ tiêu!`);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error("Không thể kích hoạt chỉ tiêu");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleIndicatorModalOk = async () => {
    try {
      setModalLoading(true);
      const values = await indicatorForm.validateFields();

      if (editingIndicator) {
        await indicatorService.update(
          editingIndicator.id,
          values as UpdateIndicatorDto
        );
        message.success("Cập nhật chỉ tiêu thành công!");
      } else {
        await indicatorService.create(values as CreateIndicatorDto);
        message.success("Thêm chỉ tiêu thành công!");
      }

      setIndicatorModalOpen(false);
      indicatorForm.resetFields();
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể lưu chỉ tiêu");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Bulk Create
  const handleBulkCreate = () => {
    console.log("handleBulkCreate - groups:", groups);
    bulkForm.resetFields();
    bulkForm.setFieldsValue({ indicators: [{ name: "" }] });
    setBulkModalOpen(true);
  };

  const handleBulkModalOk = async () => {
    try {
      setModalLoading(true);
      const values = await bulkForm.validateFields();

      const data: CreateBulkIndicatorsDto = {
        indicatorGroupId: values.indicatorGroupId,
        indicators: values.indicators.filter((item: any) => item.name?.trim()),
      };

      if (data.indicators.length === 0) {
        message.error("Vui lòng nhập ít nhất 1 chỉ tiêu");
        return;
      }

      await indicatorService.createBulk(data);
      message.success(`Thêm ${data.indicators.length} chỉ tiêu thành công!`);

      setBulkModalOpen(false);
      bulkForm.resetFields();
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể thêm chỉ tiêu");
    } finally {
      setModalLoading(false);
    }
  };

  const handleImportExcel = async () => {
    if (fileList.length === 0) {
      message.error("Vui lòng chọn file Excel");
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) {
      message.error("File không hợp lệ");
      return;
    }

    try {
      setModalLoading(true);
      const result = await indicatorService.importFromExcel(file);
      setImportResult(result);

      if (result.successCount > 0) {
        message.success(`Import thành công ${result.successCount} chỉ tiêu!`);
        fetchData();
        onDataChange?.();
      }

      if (result.errorCount > 0) {
        message.warning(`Có ${result.errorCount} lỗi khi import`);
      }
    } catch (error) {
      message.error("Không thể import file");
    } finally {
      setModalLoading(false);
    }
  };

  const handleImportGroupExcel = async () => {
    if (groupFileList.length === 0) {
      message.error("Vui lòng chọn file Excel");
      return;
    }

    const file = groupFileList[0].originFileObj;
    if (!file) {
      message.error("File không hợp lệ");
      return;
    }

    try {
      setModalLoading(true);
      const result = await indicatorGroupService.importFromExcel(file);
      setImportGroupResult(result);

      if (result.successCount > 0) {
        message.success(
          `Import thành công ${result.successCount} nhóm chỉ tiêu!`
        );
        fetchData();
        onDataChange?.();
      }

      if (result.errorCount > 0) {
        message.warning(`Có ${result.errorCount} lỗi khi import`);
      }
    } catch (error) {
      message.error("Không thể import file");
    } finally {
      setModalLoading(false);
    }
  };

  // Columns for expanded indicator table
  const indicatorColumns: ColumnsType<IndicatorDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 100,
    },
    {
      title: "Tên chỉ tiêu",
      dataIndex: "name",
      key: "name",
      width: 250,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditIndicator(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? "Tắt hoạt động" : "Bật hoạt động"}>
            <Button
              type="link"
              size="small"
              icon={
                record.isActive ? <StopOutlined /> : <CheckCircleOutlined />
              }
              onClick={() => handleToggleActive(record.id)}
            />
          </Tooltip>
          {record.canDelete ? (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => handleDeleteIndicator(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          ) : (
            <Tooltip title="Không thể xóa vì đã được sử dụng">
              <Button
                type="link"
                size="small"
                disabled
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Columns for group table
  const groupColumns: ColumnsType<
    IndicatorGroupDto & { indicators: IndicatorDto[] }
  > = [
    {
      title: "Tên nhóm",
      dataIndex: "name",
      key: "name",
      width: 300,
    },
    {
      title: "Số chỉ tiêu",
      dataIndex: "indicatorCount",
      key: "indicatorCount",
      width: 120,
      render: (_, record) => record.indicators.length,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa nhóm">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditGroup(record)}
            />
          </Tooltip>
          {record.indicators.length === 0 ? (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa nhóm này?"
              onConfirm={() => handleDeleteGroup(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          ) : (
            <Tooltip title="Không thể xóa nhóm có chứa chỉ tiêu">
              <Button
                type="link"
                size="small"
                disabled
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Search and Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên, tên nhóm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={16} style={{ textAlign: "right" }}>
          <Space wrap>
            <Button icon={<FolderAddOutlined />} onClick={handleCreateGroup}>
              Thêm nhóm
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleBulkCreate}
            >
              Thêm chỉ tiêu
            </Button>
          </Space>
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={groupColumns}
          dataSource={groupedData}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => {
              // Lấy tất cả indicator ids trong group này
              const groupIndicatorIds = record.indicators.map(
                (ind: IndicatorDto) => ind.id
              );
              // Kiểm tra xem tất cả indicators trong group có được chọn không
              const allSelected =
                groupIndicatorIds.length > 0 &&
                groupIndicatorIds.every((id: string) =>
                  selectedRowKeys.includes(id)
                );
              // Kiểm tra xem có một số được chọn không (trong group này)
              const someSelected = groupIndicatorIds.some((id: string) =>
                selectedRowKeys.includes(id)
              );
              // Chỉ hiển thị overlay nếu có ít nhất 1 chỉ tiêu trong group này được chọn
              const hasSelectedInThisGroup = someSelected;

              return (
                <div style={{ position: "relative" }}>
                  {hasSelectedInThisGroup && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        right: 0,
                        height: 39,
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingLeft: 16,
                        paddingRight: 12,
                        zIndex: 100,
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected && !allSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newKeys = [
                                ...new Set([
                                  ...selectedRowKeys,
                                  ...groupIndicatorIds,
                                ]),
                              ];
                              setSelectedRowKeys(newKeys);
                            } else {
                              const newKeys = selectedRowKeys.filter(
                                (key) => !groupIndicatorIds.includes(key)
                              );
                              setSelectedRowKeys(newKeys);
                            }
                          }}
                        />
                        <span
                          style={{
                            marginLeft: 8,
                            color: "#1890ff",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Đã chọn {selectedRowKeys.length}
                        </span>
                      </div>
                      <Space size="small">
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={handleBatchActivate}
                          loading={batchLoading}
                        >
                          Kích hoạt
                        </Button>
                        <Button
                          size="small"
                          icon={<StopOutlined />}
                          onClick={handleBatchDeactivate}
                          loading={batchLoading}
                        >
                          Ngưng
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={handleBatchDelete}
                          loading={batchLoading}
                        >
                          Xóa
                        </Button>
                        <Button
                          size="small"
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => setSelectedRowKeys([])}
                        />
                      </Space>
                    </div>
                  )}
                  <Table
                    columns={indicatorColumns}
                    dataSource={record.indicators}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    rowSelection={{
                      selectedRowKeys,
                      onChange: (keys) => setSelectedRowKeys(keys as string[]),
                      columnTitle: (
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected && !allSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newKeys = [
                                ...new Set([
                                  ...selectedRowKeys,
                                  ...groupIndicatorIds,
                                ]),
                              ];
                              setSelectedRowKeys(newKeys);
                            } else {
                              const newKeys = selectedRowKeys.filter(
                                (key) => !groupIndicatorIds.includes(key)
                              );
                              setSelectedRowKeys(newKeys);
                            }
                          }}
                        />
                      ),
                    }}
                  />
                </div>
              );
            },
            rowExpandable: () => true,
            expandedRowKeys,
            onExpandedRowsChange: (keys) =>
              setExpandedRowKeys(keys as string[]),
          }}
          pagination={{
            pageSize: 50,
            showTotal: (total) => `Tổng ${total} nhóm`,
          }}
        />
      </Spin>

      {/* Group Modal */}
      <Modal
        title={editingGroup ? "Sửa nhóm chỉ tiêu" : "Thêm nhóm chỉ tiêu mới"}
        open={groupModalOpen}
        onOk={handleGroupModalOk}
        onCancel={() => {
          setGroupModalOpen(false);
          groupForm.resetFields();
        }}
        confirmLoading={modalLoading}
        okText={editingGroup ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        width={480}
        centered
        styles={{ body: { paddingTop: 16 } }}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item
            name="name"
            label="Tên nhóm"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên nhóm",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Trạng thái" initialValue={true}>
            <Select defaultValue={true}>
              <Select.Option value={true}>Hoạt động</Select.Option>
              <Select.Option value={false}>Ngừng</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Single Indicator Modal */}
      <Modal
        title={editingIndicator ? "Sửa chỉ tiêu" : "Thêm chỉ tiêu mới"}
        open={indicatorModalOpen}
        onOk={handleIndicatorModalOk}
        onCancel={() => {
          setIndicatorModalOpen(false);
          indicatorForm.resetFields();
        }}
        confirmLoading={modalLoading}
        okText={editingIndicator ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        width={480}
        centered
        styles={{ body: { paddingTop: 16 } }}
        forceRender
      >
        <Form form={indicatorForm} layout="vertical">
          <Form.Item
            name="indicatorGroupId"
            label="Nhóm chỉ tiêu"
            rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
          >
            <Select
              placeholder="Chọn nhóm"
              showSearch
              optionFilterProp="label"
              options={groupOptions}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên chỉ tiêu"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên chỉ tiêu",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Trạng thái">
            <Select>
              <Select.Option value={true}>Hoạt động</Select.Option>
              <Select.Option value={false}>Ngừng</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Create Modal */}
      <Modal
        title="Thêm nhiều chỉ tiêu"
        open={bulkModalOpen}
        onOk={handleBulkModalOk}
        onCancel={() => {
          setBulkModalOpen(false);
          bulkForm.resetFields();
        }}
        confirmLoading={modalLoading}
        okText="Thêm tất cả"
        cancelText="Hủy"
        width={560}
        centered
        styles={{ body: { paddingTop: 16 } }}
        forceRender
      >
        <Form form={bulkForm} layout="vertical">
          <Form.Item
            name="indicatorGroupId"
            label="Nhóm chỉ tiêu"
            rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
          >
            <Select
              placeholder="Chọn nhóm cho tất cả chỉ tiêu"
              showSearch
              optionFilterProp="label"
              options={groupOptions}
            />
          </Form.Item>

          <Form.List name="indicators">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} align="middle" wrap={false}>
                    <Col flex="auto">
                      <Form.Item
                        {...restField}
                        name={[name, "name"]}
                        rules={[
                          {
                            required: true,
                            message: "Nhập tên",
                          },
                        ]}
                        style={{ marginBottom: 8 }}
                      >
                        <Input placeholder="Tên chỉ tiêu" />
                      </Form.Item>
                    </Col>
                    <Col flex="24px">
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ color: "red" }}
                        />
                      )}
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ name: "" })}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm dòng
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Import Excel Modal */}
      <Modal
        title="Import chỉ tiêu từ Excel"
        open={importModalOpen}
        onOk={handleImportExcel}
        onCancel={() => {
          setImportModalOpen(false);
          setImportResult(null);
          setFileList([]);
        }}
        confirmLoading={modalLoading}
        okText="Import"
        cancelText="Đóng"
        width={600}
        centered
        styles={{ body: { paddingTop: 16 } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Alert
            message="Hướng dẫn"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Tải template Excel mẫu bằng nút "Template chỉ tiêu"</li>
                <li>Điền thông tin chỉ tiêu vào file Excel</li>
                <li>
                  Các cột bắt buộc: Tên chỉ tiêu, Đơn giá, Tên nhóm chỉ tiêu
                </li>
                <li>Tên nhóm chỉ tiêu phải khớp chính xác với nhóm đã tạo</li>
              </ul>
            }
            type="info"
            showIcon
          />

          <Upload.Dragger
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
            accept=".xlsx,.xls"
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            </p>
            <p className="ant-upload-text">
              Kéo thả file Excel hoặc click để chọn file
            </p>
            <p className="ant-upload-hint">Chỉ hỗ trợ file .xlsx, .xls</p>
          </Upload.Dragger>

          {importResult && (
            <Alert
              message={`Kết quả import: ${importResult.successCount}/${importResult.totalRows} thành công`}
              description={
                importResult.errors.length > 0 ? (
                  <div style={{ maxHeight: 200, overflow: "auto" }}>
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      {importResult.errors.map((err, idx) => (
                        <li key={idx} style={{ color: "#ff4d4f" }}>
                          Dòng {err.rowNumber}: {err.indicatorName} -{" "}
                          {err.errorMessage}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              }
              type={importResult.errorCount > 0 ? "warning" : "success"}
              showIcon
            />
          )}
        </Space>
      </Modal>

      {/* Import Group Excel Modal */}
      <Modal
        title="Import nhóm chỉ tiêu từ Excel"
        open={importGroupModalOpen}
        onOk={handleImportGroupExcel}
        onCancel={() => {
          setImportGroupModalOpen(false);
          setImportGroupResult(null);
          setGroupFileList([]);
        }}
        confirmLoading={modalLoading}
        okText="Import"
        cancelText="Đóng"
        width={600}
        centered
        styles={{ body: { paddingTop: 16 } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Alert
            message="Hướng dẫn"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Tải template Excel mẫu bằng nút "Template nhóm"</li>
                <li>Điền tên nhóm chỉ tiêu vào file Excel</li>
                <li>Mỗi dòng là một nhóm chỉ tiêu</li>
                <li>Tên nhóm chỉ tiêu không được trùng</li>
              </ul>
            }
            type="info"
            showIcon
          />

          <Upload.Dragger
            fileList={groupFileList}
            onChange={({ fileList }) => setGroupFileList(fileList)}
            beforeUpload={() => false}
            accept=".xlsx,.xls"
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            </p>
            <p className="ant-upload-text">
              Kéo thả file Excel hoặc click để chọn file
            </p>
            <p className="ant-upload-hint">Chỉ hỗ trợ file .xlsx, .xls</p>
          </Upload.Dragger>

          {importGroupResult && (
            <Alert
              message={`Kết quả import: ${importGroupResult.successCount}/${importGroupResult.totalRows} thành công`}
              description={
                importGroupResult.errors.length > 0 ? (
                  <div style={{ maxHeight: 200, overflow: "auto" }}>
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      {importGroupResult.errors.map((err, idx) => (
                        <li key={idx} style={{ color: "#ff4d4f" }}>
                          Dòng {err.rowNumber}: {err.groupName} -{" "}
                          {err.errorMessage}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              }
              type={importGroupResult.errorCount > 0 ? "warning" : "success"}
              showIcon
            />
          )}
        </Space>
      </Modal>
    </>
  );
};

export default IndicatorsTab;
