import { Button, Space, Tag, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { ImportType } from "../../../../components/common/ImportExcelModal";
import { MasterDataItem, UserLookupDto } from "../types";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";

export const categoryLabels: Record<string, string> = {
  departments: "Phòng ban",
  laboratories: "Khoa phòng",
  sampleTypeCategories: "Danh mục loại mẫu",
  sampleConditions: "Tình trạng mẫu",
  specimenTypes: "Loại mẫu",
  testMethods: "Phương pháp thử",
  standards: "Tiêu chuẩn",
  storageLocations: "Vị trí lưu kho",
  // customers: "Khách hàng",
  indicators: "Nhóm chỉ tiêu",
  formTemplates: "Form mẫu",
  testResultValues: "Quản lý kết quả",
  notes: "Quản lý ghi chú",
  units: "Đơn vị hàng hóa",
};

// Categories that don't use server-side pagination (load all at once)
export const NO_PAGINATION_CATEGORIES = ["departments", "laboratories"];
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
  handleDelete: (id: string) => void
): ColumnsType<MasterDataItem> => {
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

  // Only show actions column if user has at least one permission
  if (canEdit || canDelete) {
    baseColumns.push({
      title: "Thao tác",
      key: "actions",
      width: 100,
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
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return baseColumns;
};

// Get count from statistics for a category
export const getStatCount = (
  category: string,
  statistics: any | null
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
    default:
      return 0;
  }
};
