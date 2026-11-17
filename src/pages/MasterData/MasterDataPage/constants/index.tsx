import { Button, Space, Tag, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { ImportType } from "../../../../components/common/ImportExcelModal";
import { MasterDataItem, UserLookupDto } from "../types";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";
import MasterDataHistoryButton from "../../../../components/common/MasterDataHistory/MasterDataHistoryButton";
import { isMasterDataHistoryEntityType } from "../../../../types/masterDataHistory";

const renderWarehouseTreeName = (name: string, record: any) => {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 32,
        fontWeight: record.level === 0 ? 600 : 400,
      }}
    >
      {name}
    </span>
  );
};

export const categoryPermissionMap: Record<string, string> = {
  warehouses: PERMISSIONS.Warehouses.Default,
  manufacturers: PERMISSIONS.Manufacturers.Default,
  sampleTypeCategories: PERMISSIONS.SampleTypeCategories.Default,
  units: PERMISSIONS.Units.Default,
  formTemplates: PERMISSIONS.FormTemplates.Default,
  laboratories: PERMISSIONS.Laboratories.Default,
  specimenTypes: PERMISSIONS.SpecimenTypes.Default,
  indicators: PERMISSIONS.Indicators.Default,
  departments: PERMISSIONS.Departments.Default,
  testMethods: PERMISSIONS.TestMethods.Default,
  notes: PERMISSIONS.Notes.Default,
  testResultValues: PERMISSIONS.TestResultValues.Default,
  standards: PERMISSIONS.Standards.Default,
  sampleConditions: PERMISSIONS.SampleConditions.Default,
  storageLocations: PERMISSIONS.StorageLocations.Default,
  products: PERMISSIONS.Products.Default,
};

// Sorted alphabetically by Vietnamese label (A-Z). Keep this order when adding new entries.
export const categoryLabels: Record<string, string> = {
  warehouses: "Danh mục kho",
  manufacturers: "Danh mục hãng sản xuất",
  sampleTypeCategories: "Danh mục loại mẫu",
  products: "Danh mục vật tư thiết bị",
  units: "Đơn vị hàng hóa",
  formTemplates: "Form mẫu",
  laboratories: "Khoa phòng",
  specimenTypes: "Loại mẫu",
  indicators: "Nhóm chỉ tiêu",
  departments: "Phòng ban",
  testMethods: "Phương pháp thử",
  notes: "Quản lý ghi chú",
  testResultValues: "Quản lý kết quả",
  standards: "Tiêu chuẩn",
  sampleConditions: "Tình trạng mẫu",
  storageLocations: "Vị trí lưu kho",
};

// Categories that don't use server-side pagination (load all at once)
export const NO_PAGINATION_CATEGORIES = ["departments", "laboratories", "warehouses"];
export const DEFAULT_PAGE_SIZE = 50;

// Map category to import type (only customers and testMethods support import)
export const importTypeMap: Record<string, ImportType | null> = {
  // customers: "customers",
  testMethods: "test-methods",
  standards: null,
  departments: null,
  laboratories: null,
  sampleTypeCategories: null,
  sampleConditions: null,
  specimenTypes: null,
  storageLocations: null,
  testResultValues: null,
  notes: null,
};

// Dynamic columns based on category
export const getColumns = (
  activeCategory: string,
  users: UserLookupDto[],
  handleEdit: (record: MasterDataItem) => void,
  handleDelete: (id: string) => void,
  handleToggleActive?: (record: MasterDataItem) => void,
): ColumnsType<MasterDataItem> => {
  // Warehouses render as a tree (Tên + Thao tác only) — Mã/Vị trí vật lý/Trạng thái are hidden in this view
  if (activeCategory === "warehouses") {
    const baseColumns: ColumnsType<MasterDataItem> = [
      {
        title: "Tên",
        dataIndex: "name",
        key: "name",
        render: (name: string, record: any) => renderWarehouseTreeName(name, record),
      },
    ];

    const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
    const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

    if (canEdit || canDelete) {
      baseColumns.push({
        title: "Thao tác",
        key: "actions",
        width: 150,
        render: (_, record) => {
          const isDefaultWarehouse = (record as any).isDefault;
          return (
            <Space size="small">
              {canEdit && handleToggleActive && !isDefaultWarehouse && (
                <Tooltip title={record.isActive ? "Tắt hoạt động" : "Bật hoạt động"}>
                  <Button
                    type="link"
                    size="small"
                    icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                    onClick={() => handleToggleActive(record)}
                  />
                </Tooltip>
              )}
              {canEdit && !isDefaultWarehouse && (
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              )}
              {canDelete && !isDefaultWarehouse && (
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
          );
        },
      });
    }

    return baseColumns;
  }

  const baseColumns: ColumnsType<MasterDataItem> = [
    {
      title: "STT",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    ...(activeCategory !== "manufacturers"
      ? [
          {
            title: "Mã",
            dataIndex: "code",
            key: "code",
            width: 120,
          },
        ]
      : []),
    {
      title: activeCategory === "laboratories" ? "Phòng ban" : "Tên",
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
      },
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
      },
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
      },
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

  baseColumns.push({
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    width: 100,
    render: (isActive: boolean) => (
      <Tag color={isActive ? "green" : "red"}>
        {isActive ? "Hoạt động" : "Ngừng"}
      </Tag>
    ),
  });

  // Check permissions for Edit and Delete - Use unified MasterData permissions
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

  const historyEntityType = isMasterDataHistoryEntityType(activeCategory)
    ? activeCategory
    : null;

  // Cột thao tác: Lịch sử (ai xem được danh mục đều xem được) + Sửa/Xóa theo quyền
  if (canEdit || canDelete || historyEntityType) {
    baseColumns.push({
      title: "Thao tác",
      key: "actions",
      width: activeCategory === "manufacturers" ? 180 : 130,
      render: (_, record) => {
        const isSystemRecord = activeCategory === "manufacturers" && (record as any).isSystem;
        return (
          <Space size="small">
            {historyEntityType && (
              <MasterDataHistoryButton
                entityType={historyEntityType}
                entityId={record.id}
                title={record.name}
              />
            )}
            {canEdit && activeCategory === "manufacturers" && handleToggleActive && !isSystemRecord && (
              <Tooltip
                title={record.isActive ? "Tắt hoạt động" : "Bật hoạt động"}
              >
                <Button
                  type="link"
                  size="small"
                  icon={
                    record.isActive ? <StopOutlined /> : <CheckCircleOutlined />
                  }
                  onClick={() => handleToggleActive(record)}
                />
              </Tooltip>
            )}
            {canEdit && !isSystemRecord && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            )}
            {canDelete && !isSystemRecord && (
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
            )}
            {isSystemRecord && (
              <Tag color="gold" style={{ margin: 0 }}>Hệ thống</Tag>
            )}
          </Space>
        );
      },
    });
  }

  return baseColumns;
};

// Get count from statistics for a category
export const getStatCount = (
  category: string,
  statistics: any | null,
): number => {
  if (!statistics) return 0;
  switch (category) {
    case "departments":
      return statistics.departmentCount;
    case "laboratories":
      return statistics.laboratoryCount;
    case "sampleTypeCategories":
      return statistics.sampleTypeCategoryCount || 0;
    case "sampleConditions":
      return statistics.sampleConditionCount || 0;
    case "specimenTypes":
      return statistics.specimenTypeCount;
    case "testMethods":
      return statistics.testMethodCount;
    case "standards":
      return statistics.standardCount;
    case "storageLocations":
      return statistics.storageLocationCount;
    case "customers":
      return statistics.customerCount;
    case "indicators":
      return statistics.indicatorCount;
    case "formTemplates":
      return statistics.formTemplateCount;
    case "testResultValues":
      return statistics.testResultValueCount || 0;
    case "notes":
      return statistics.noteCount || 0;
    case "units":
      return statistics.unitCount || 0;
    case "warehouses":
      return statistics.warehouseCount || 0;
    case "manufacturers":
      return statistics.manufacturerCount || 0;
    case "products":
      return statistics.productCount || 0;
    default:
      return 0;
  }
};
