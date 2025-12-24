// @ts-nocheck
import React, { useState, useEffect } from "react";
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
  message,
  Popconfirm,
  Tabs,
  Statistic,
  Alert,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DatabaseOutlined,
  ImportOutlined,
  ExportOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  departmentService,
  specimenTypeService,
  testMethodService,
  storageLocationService,
  customerService,
  laboratoryService,
  masterDataStatisticsService,
  DepartmentDto,
  SpecimenTypeDto,
  TestMethodDto,
  StorageLocationDto,
  CustomerDto,
  LaboratoryDto,
  CreateUpdateDepartmentDto,
  CreateUpdateSpecimenTypeDto,
  CreateUpdateTestMethodDto,
  CreateUpdateStorageLocationDto,
  CreateUpdateCustomerDto,
  CreateUpdateLaboratoryDto,
  MasterDataStatisticsDto,
} from "../../services/masterDataService";
import ImportExcelModal, {
  ImportType,
} from "../../components/common/ImportExcelModal";
import {
  importService,
  downloadBlobAsFile,
} from "../../services/importService";
import { userService, UserLookupDto } from "../../services/userService";
import IndicatorsTab from "./IndicatorsTab";
import FormTemplatesTab from "./FormTemplatesTab";

// Unified type for all master data items
type MasterDataItem =
  | DepartmentDto
  | SpecimenTypeDto
  | TestMethodDto
  | StorageLocationDto
  | CustomerDto
  | LaboratoryDto;

const categoryLabels: Record<string, string> = {
  departments: "Phòng ban",
  laboratories: "Khoa phòng",
  specimenTypes: "Loại mẫu",
  testMethods: "Phương pháp thử",
  storageLocations: "Vị trí lưu kho",
  customers: "Khách hàng",
  indicators: "Nhóm chỉ tiêu",
  formTemplates: "Form mẫu",
};

// Categories that don't use server-side pagination (load all at once)
const NO_PAGINATION_CATEGORIES = ["departments", "laboratories"];
const DEFAULT_PAGE_SIZE = 50;

const MasterDataList: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("departments");
  const [data, setData] = useState<Record<string, MasterDataItem[]>>({
    departments: [],
    laboratories: [],
    specimenTypes: [],
    testMethods: [],
    storageLocations: [],
    customers: [],
    indicators: [],
  });
  const [totalCount, setTotalCount] = useState<Record<string, number>>({
    departments: 0,
    laboratories: 0,
    specimenTypes: 0,
    testMethods: 0,
    storageLocations: 0,
    customers: 0,
    indicators: 0,
  });
  const [pagination, setPagination] = useState<
    Record<string, { current: number; pageSize: number }>
  >({
    specimenTypes: { current: 1, pageSize: DEFAULT_PAGE_SIZE },
    testMethods: { current: 1, pageSize: DEFAULT_PAGE_SIZE },
    storageLocations: { current: 1, pageSize: DEFAULT_PAGE_SIZE },
    customers: { current: 1, pageSize: DEFAULT_PAGE_SIZE },
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    departments: false,
    laboratories: false,
    specimenTypes: false,
    testMethods: false,
    storageLocations: false,
    customers: false,
    indicators: false,
  });
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(
    new Set()
  );
  const [statistics, setStatistics] = useState<MasterDataStatisticsDto | null>(
    null
  );
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [users, setUsers] = useState<UserLookupDto[]>([]);
  const [form] = Form.useForm();

  // Map category to import type (only customers and testMethods support import)
  const importTypeMap: Record<string, ImportType | null> = {
    customers: "customers",
    testMethods: "test-methods",
    departments: null,
    laboratories: null,
    specimenTypes: null,
    storageLocations: null,
  };

  const canImport = importTypeMap[activeCategory] !== null;

  // Fetch statistics from API
  const fetchStatistics = async () => {
    try {
      setStatisticsLoading(true);
      const stats = await masterDataStatisticsService.getStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error("Failed to fetch statistics:", err);
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Fetch data for a specific category with pagination support
  const fetchCategoryData = async (
    category: string,
    forceRefresh = false,
    page?: number,
    pageSize?: number
  ) => {
    // For paginated categories, always fetch when page/pageSize changes
    const isPaginated = !NO_PAGINATION_CATEGORIES.includes(category);
    const currentPagination = pagination[category] || {
      current: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    const targetPage = page ?? currentPagination.current;
    const targetPageSize = pageSize ?? currentPagination.pageSize;

    // Skip if already loaded and not forcing refresh (only for non-paginated categories)
    if (!forceRefresh && !isPaginated && loadedCategories.has(category)) {
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [category]: true }));
      setError(null);

      let result;
      const skipCount = isPaginated ? (targetPage - 1) * targetPageSize : 0;
      const maxResultCount = isPaginated ? targetPageSize : 1000;

      switch (category) {
        case "departments":
          result = await departmentService.getList({
            maxResultCount: 1000,
          });
          break;
        case "laboratories":
          const labItems = await laboratoryService.getAll();
          result = { items: labItems, totalCount: labItems.length };
          break;
        case "specimenTypes":
          result = await specimenTypeService.getList({
            skipCount,
            maxResultCount,
          });
          break;
        case "testMethods":
          result = await testMethodService.getList({
            skipCount,
            maxResultCount,
          });
          break;
        case "storageLocations":
          result = await storageLocationService.getList({
            skipCount,
            maxResultCount,
          });
          break;
        case "customers":
          result = await customerService.getList({
            skipCount,
            maxResultCount,
          });
          break;
        default:
          result = { items: [], totalCount: 0 };
      }

      setData((prev) => ({ ...prev, [category]: result.items }));
      setTotalCount((prev) => ({ ...prev, [category]: result.totalCount }));
      if (isPaginated) {
        setPagination((prev) => ({
          ...prev,
          [category]: { current: targetPage, pageSize: targetPageSize },
        }));
      }
      setLoadedCategories((prev) => new Set(prev).add(category));
    } catch (err: any) {
      console.error(`Failed to fetch ${category}:`, err);
      const errorMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        `Failed to load ${category}`;
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  // Handle table pagination change
  const handleTableChange = (page: number, pageSize: number) => {
    fetchCategoryData(activeCategory, true, page, pageSize);
  };

  // Load statistics on mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Load data for the initial active category
  useEffect(() => {
    fetchCategoryData(activeCategory);
  }, []);

  // Load users for Quản lý kỹ thuật dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await userService.getLookup();
        setUsers(userList);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };
    loadUsers();
  }, []);

  // Load data when switching tabs (lazy load)
  useEffect(() => {
    const isPaginated = !NO_PAGINATION_CATEGORIES.includes(activeCategory);
    // For paginated categories, load if no data; for non-paginated, check loadedCategories
    if (isPaginated) {
      if (data[activeCategory]?.length === 0) {
        fetchCategoryData(activeCategory);
      }
    } else if (!loadedCategories.has(activeCategory)) {
      fetchCategoryData(activeCategory);
    }
  }, [activeCategory]);

  const currentData = data[activeCategory] || [];
  const filteredData = searchText
    ? currentData.filter(
        (item) =>
          item.code?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.name?.toLowerCase().includes(searchText.toLowerCase())
      )
    : currentData;

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      sortOrder: currentData.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: MasterDataItem) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);

      switch (activeCategory) {
        case "departments":
          await departmentService.delete(id);
          break;
        case "laboratories":
          await laboratoryService.delete(id);
          break;
        case "specimenTypes":
          await specimenTypeService.delete(id);
          break;
        case "testMethods":
          await testMethodService.delete(id);
          break;
        case "storageLocations":
          await storageLocationService.delete(id);
          break;
        case "customers":
          await customerService.delete(id);
          break;
      }

      message.success("Xóa thành công!");
      // Refresh data and statistics
      await fetchCategoryData(activeCategory, true);
      fetchStatistics();
    } catch (err: any) {
      console.error("Failed to delete:", err);
      // Handle different error formats from ABP Framework
      let errorMsg = "Lỗi khi xóa dữ liệu";

      if (err?.response?.data) {
        const errorData = err.response.data;
        if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (errorData.general && Array.isArray(errorData.general)) {
          errorMsg = errorData.general.join(", ");
        } else if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat();
          errorMsg = (errorMessages as string[]).join(", ");
        } else if (typeof errorData === "object") {
          const allErrors = Object.values(errorData)
            .flat()
            .filter((e) => typeof e === "string");
          if (allErrors.length > 0) {
            errorMsg = (allErrors as string[]).join(", ");
          }
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      message.error(errorMsg);
    }
  };

  const handleModalOk = async () => {
    try {
      setModalLoading(true);
      setError(null);
      const values = await form.validateFields();

      if (editingItem) {
        // Update existing item
        switch (activeCategory) {
          case "departments":
            await departmentService.update(
              editingItem.id,
              values as CreateUpdateDepartmentDto
            );
            break;
          case "laboratories":
            await laboratoryService.update(
              editingItem.id,
              values as CreateUpdateLaboratoryDto
            );
            break;
          case "specimenTypes":
            await specimenTypeService.update(
              editingItem.id,
              values as CreateUpdateSpecimenTypeDto
            );
            break;
          case "testMethods":
            await testMethodService.update(
              editingItem.id,
              values as CreateUpdateTestMethodDto
            );
            break;
          case "storageLocations":
            await storageLocationService.update(
              editingItem.id,
              values as CreateUpdateStorageLocationDto
            );
            break;
          case "customers":
            await customerService.update(
              editingItem.id,
              values as CreateUpdateCustomerDto
            );
            break;
        }
        message.success("Cập nhật thành công!");
      } else {
        // Create new item
        switch (activeCategory) {
          case "departments":
            await departmentService.create(values as CreateUpdateDepartmentDto);
            break;
          case "laboratories":
            await laboratoryService.create(values as CreateUpdateLaboratoryDto);
            break;
          case "specimenTypes":
            await specimenTypeService.create(
              values as CreateUpdateSpecimenTypeDto
            );
            break;
          case "testMethods":
            await testMethodService.create(values as CreateUpdateTestMethodDto);
            break;
          case "storageLocations":
            await storageLocationService.create(
              values as CreateUpdateStorageLocationDto
            );
            break;
          case "customers":
            await customerService.create(values as CreateUpdateCustomerDto);
            break;
        }
        message.success("Thêm mới thành công!");
      }

      setIsModalOpen(false);
      form.resetFields();
      // Refresh data and statistics
      await fetchCategoryData(activeCategory, true);
      if (!editingItem) {
        // Only refresh statistics when creating new item
        fetchStatistics();
      }
    } catch (err: any) {
      console.error("Failed to save:", err);
      // Handle different error formats from ABP Framework
      let errorMsg = "Lỗi khi lưu dữ liệu";

      if (err?.response?.data) {
        const errorData = err.response.data;
        // ABP Framework format: { error: { message: "...", details: "..." } }
        if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        }
        // Alternative ABP format: { message: "..." }
        else if (errorData.message) {
          errorMsg = errorData.message;
        }
        // Custom format with general errors: { general: ["error1", "error2"] }
        else if (errorData.general && Array.isArray(errorData.general)) {
          errorMsg = errorData.general.join(", ");
        }
        // Validation errors format: { errors: { field: ["error1", "error2"] } }
        else if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat();
          errorMsg = (errorMessages as string[]).join(", ");
        }
        // Direct object with field arrays: { fieldName: ["error1"] }
        else if (typeof errorData === "object") {
          const allErrors = Object.values(errorData)
            .flat()
            .filter((e) => typeof e === "string");
          if (allErrors.length > 0) {
            errorMsg = (allErrors as string[]).join(", ");
          }
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleImportExcel = () => {
    if (canImport) {
      setImportModalOpen(true);
    } else {
      message.info(
        `Import Excel chưa hỗ trợ cho ${categoryLabels[activeCategory]}`
      );
    }
  };

  const handleDownloadTemplate = async () => {
    if (!canImport) {
      message.info(
        `Download template chưa hỗ trợ cho ${categoryLabels[activeCategory]}`
      );
      return;
    }

    setDownloadingTemplate(true);
    try {
      let blob: Blob;
      let filename: string;

      if (activeCategory === "customers") {
        blob = await importService.downloadCustomersTemplate();
        filename = "customers-template.xlsx";
      } else if (activeCategory === "testMethods") {
        blob = await importService.downloadTestMethodsTemplate();
        filename = "test-methods-template.xlsx";
      } else {
        throw new Error("Unsupported category for template download");
      }

      downloadBlobAsFile(blob, filename);
      message.success("Tải template thành công!");
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error("Không thể tải template. Vui lòng thử lại.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleExportExcel = () => {
    const blob = new Blob(["Mock Excel Data"], {
      type: "application/vnd.ms-excel",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `master_data_${activeCategory}.xlsx`;
    a.click();
    message.success("Xuất Excel thành công!");
  };

  // Dynamic columns based on category
  const getColumns = (): ColumnsType<MasterDataItem> => {
    const baseColumns: ColumnsType<MasterDataItem> = [
      {
        title: "STT",
        dataIndex: "sortOrder",
        key: "sortOrder",
        width: 60,
        render: (_, __, index) => index + 1,
      },
      {
        title: "Mã",
        dataIndex: "code",
        key: "code",
        width: 120,
      },
      {
        title: "Tên",
        dataIndex: "name",
        key: "name",
        width: 250,
      },
    ];

    // Add extra columns for specific categories
    if (activeCategory === "customers") {
      baseColumns.push(
        {
          title: "Địa chỉ",
          dataIndex: "address",
          key: "address",
          ellipsis: true,
        },
        {
          title: "Điện thoại",
          dataIndex: "phone",
          key: "phone",
          width: 130,
        },
        {
          title: "Email",
          dataIndex: "email",
          key: "email",
          width: 180,
          ellipsis: true,
        }
      );
    } else if (activeCategory === "storageLocations") {
      baseColumns.push(
        {
          title: "Mô tả",
          dataIndex: "description",
          key: "description",
          ellipsis: true,
        },
        {
          title: "Nhiệt độ",
          dataIndex: "temperature",
          key: "temperature",
          width: 100,
        }
      );
    } else if (activeCategory === "testMethods") {
      baseColumns.push(
        {
          title: "Mô tả",
          dataIndex: "description",
          key: "description",
          ellipsis: true,
        },
        {
          title: "Tiêu chuẩn",
          dataIndex: "standard",
          key: "standard",
          width: 150,
        }
      );
    } else if (activeCategory === "laboratories") {
      baseColumns.push({
        title: "Quản lý kỹ thuật",
        dataIndex: "technicalManagerName",
        key: "technicalManagerName",
        width: 180,
        render: (technicalManagerName: string, record: any) => {
          // If technicalManagerName is available, use it
          if (technicalManagerName) {
            return technicalManagerName;
          }
          // Otherwise, try to find from users list
          if (record.technicalManagerId) {
            const user = users.find((u) => u.id === record.technicalManagerId);
            return user?.displayName || "-";
          }
          return "-";
        },
      });
    } else {
      baseColumns.push({
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
      });
    }

    baseColumns.push(
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
              />
            </Popconfirm>
          </Space>
        ),
      }
    );

    return baseColumns;
  };

  // Get count from statistics for a category
  const getStatCount = (category: string): number => {
    if (!statistics) return 0;
    switch (category) {
      case "departments":
        return statistics.departmentCount;
      case "laboratories":
        return statistics.laboratoryCount;
      case "specimenTypes":
        return statistics.specimenTypeCount;
      case "testMethods":
        return statistics.testMethodCount;
      case "storageLocations":
        return statistics.storageLocationCount;
      case "customers":
        return statistics.customerCount;
      case "indicators":
        return statistics.indicatorCount;
      case "formTemplates":
        return statistics.formTemplateCount;
      default:
        return 0;
    }
  };

  // Calculate total items from statistics
  const totalItems = statistics
    ? statistics.departmentCount +
      statistics.laboratoryCount +
      statistics.specimenTypeCount +
      statistics.testMethodCount +
      statistics.storageLocationCount +
      statistics.customerCount +
      statistics.indicatorCount +
      statistics.formTemplateCount
    : 0;

  return (
    <div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Tổng danh mục"
              value={Object.keys(categoryLabels).length}
              prefix={<DatabaseOutlined />}
              loading={statisticsLoading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Tổng dữ liệu"
              value={totalItems}
              loading={statisticsLoading}
            />
          </Card>
        </Col>
        {Object.entries(categoryLabels)
          .slice(0, 3)
          .map(([key, label]) => (
            <Col xs={12} sm={8} md={4} key={key}>
              <Card>
                <Statistic
                  title={label}
                  value={getStatCount(key)}
                  loading={statisticsLoading}
                />
              </Card>
            </Col>
          ))}
      </Row>

      <Card
        title={
          <Space>
            <DatabaseOutlined />
            Ngân hàng dữ liệu (Master Data)
          </Space>
        }
        extra={
          activeCategory !== "indicators" &&
          activeCategory !== "formTemplates" && (
            <Space>
              {canImport && (
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  loading={downloadingTemplate}
                >
                  Tải Template
                </Button>
              )}
              <Button icon={<ImportOutlined />} onClick={handleImportExcel}>
                Import Excel
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExportExcel}>
                Export Excel
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Thêm mới
              </Button>
            </Space>
          )
        }
      >
        <Tabs
          activeKey={activeCategory}
          onChange={(key) => {
            setActiveCategory(key);
            setSearchText("");
          }}
          tabPosition="left"
          style={{ minHeight: 400 }}
          items={Object.entries(categoryLabels).map(([key, label]) => ({
            key,
            label: (
              <Space>
                {label}
                <Tag>{getStatCount(key)}</Tag>
              </Space>
            ),
            children:
              key === "indicators" ? (
                <IndicatorsTab onDataChange={() => fetchStatistics()} />
              ) : key === "formTemplates" ? (
                <FormTemplatesTab />
              ) : (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8}>
                      <Input
                        placeholder="Tìm kiếm theo mã, tên..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                      />
                    </Col>
                  </Row>

                  <Spin spinning={loading[key]} tip="Loading data...">
                    <Table
                      columns={getColumns()}
                      dataSource={filteredData}
                      rowKey="id"
                      pagination={
                        NO_PAGINATION_CATEGORIES.includes(activeCategory)
                          ? false
                          : {
                              current: pagination[activeCategory]?.current || 1,
                              pageSize:
                                pagination[activeCategory]?.pageSize ||
                                DEFAULT_PAGE_SIZE,
                              total: totalCount[activeCategory] || 0,
                              pageSizeOptions: ["50", "100", "150"],
                              showSizeChanger: true,
                              showTotal: (total, range) =>
                                `${range[0]}-${range[1]} của ${total} mục`,
                              onChange: handleTableChange,
                              onShowSizeChange: handleTableChange,
                            }
                      }
                      scroll={{
                        x: activeCategory === "customers" ? 900 : 700,
                      }}
                    />
                  </Spin>
                </>
              ),
          }))}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          editingItem
            ? `Chỉnh sửa ${categoryLabels[activeCategory]}`
            : `Thêm ${categoryLabels[activeCategory]} mới`
        }
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        width={600}
        okText={editingItem ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        centered
        confirmLoading={modalLoading}
      >
        <Form form={form} layout="vertical">
          {activeCategory !== "customers" && (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="code"
                  label="Mã"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập mã",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="name"
                  label="Tên"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập tên",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          )}
          {activeCategory === "customers" && (
            <>
              <Form.Item
                name="name"
                label="Tên khách hàng"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên khách hàng",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="phone" label="Điện thoại">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      {
                        type: "email",
                        message: "Email không hợp lệ",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="address" label="Địa chỉ">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="taxCode" label="Mã số thuế">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contactPerson" label="Người liên hệ">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
          {activeCategory !== "customers" &&
            activeCategory !== "laboratories" && (
              <>
                <Form.Item name="description" label="Mô tả">
                  <Input.TextArea rows={3} />
                </Form.Item>
                {activeCategory === "storageLocations" && (
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="temperature" label="Nhiệt độ">
                        <Input placeholder="VD: 2-8°C" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="humidity" label="Độ ẩm">
                        <Input placeholder="VD: 60-70%" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="capacity" label="Sức chứa">
                        <Input type="number" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
                {activeCategory === "testMethods" && (
                  <Form.Item name="standard" label="Tiêu chuẩn">
                    <Input placeholder="VD: TCVN 6663-6:2008" />
                  </Form.Item>
                )}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="sortOrder" label="Thứ tự sắp xếp">
                      <Input type="number" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="isActive" label="Trạng thái">
                      <Select>
                        <Select.Option value={true}>Hoạt động</Select.Option>
                        <Select.Option value={false}>Ngừng</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          {activeCategory === "laboratories" && (
            <>
              <Form.Item name="technicalManagerId" label="Quản lý kỹ thuật">
                <Select
                  showSearch
                  allowClear
                  placeholder="Chọn quản lý kỹ thuật"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {users.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.displayName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="isActive" label="Trạng thái">
                <Select>
                  <Select.Option value={true}>Hoạt động</Select.Option>
                  <Select.Option value={false}>Ngừng</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
          {activeCategory === "customers" && (
            <Form.Item name="isActive" label="Trạng thái">
              <Select>
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Ngừng</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Import Excel Modal */}
      {canImport && importTypeMap[activeCategory] && (
        <ImportExcelModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onSuccess={() => {
            setImportModalOpen(false);
            fetchCategoryData(activeCategory);
          }}
          importType={importTypeMap[activeCategory]!}
          title={`Import ${categoryLabels[activeCategory]}`}
        />
      )}
    </div>
  );
};

export default MasterDataList;
