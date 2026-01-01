# Frontend Architecture & Coding Conventions

> **IMPORTANT**: Tài liệu này là quy chuẩn code cho project. Claude phải tuân theo khi code.

## Project Structure (Thực tế)

```
src/
├── components/          # Reusable UI components
│   ├── common/          # Generic components (Loadable, etc.)
│   ├── layout/          # Layout components (MainLayout)
│   └── auth/            # Auth components (PrivateRoute, AuthRoute)
├── pages/               # Page components (one folder per feature)
│   └── [Feature]/
│       ├── [Feature]List.tsx      # List page
│       ├── [Feature]Detail.tsx    # Detail page
│       ├── [Feature]Form.tsx      # Create/Edit form (optional)
│       └── components/            # Page-specific components
├── services/            # API service layer
├── types/               # TypeScript interfaces & types
├── hooks/               # Custom React hooks
├── constants/           # Constants, enums, routes, roles
├── locales/             # i18n translations
└── App.tsx              # Main app with routes
```

---

## 1. Service Layer Pattern

### 1.1 Service Structure (QUAN TRỌNG)

```tsx
// services/[feature]Service.ts
import api from "./api";
import {
  FeatureDto,
  CreateFeatureDto,
  UpdateFeatureDto,
  GetFeatureListDto,
} from "../types/feature";

const BASE_URL = "/api/v1/features";

export const featureService = {
  // Get list with pagination
  getList: async (params: GetFeatureListDto): Promise<PagedResultDto<FeatureDto>> => {
    const response = await api.get<PagedResultDto<FeatureDto>>(BASE_URL, { params });
    return response.data;
  },

  // Get single item
  get: async (id: string): Promise<FeatureDto> => {
    const response = await api.get<FeatureDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Create
  create: async (data: CreateFeatureDto): Promise<FeatureDto> => {
    const response = await api.post<FeatureDto>(BASE_URL, data);
    return response.data;
  },

  // Update
  update: async (id: string, data: UpdateFeatureDto): Promise<FeatureDto> => {
    const response = await api.put<FeatureDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  // Delete
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Custom action với path parameter
  approve: async (id: string): Promise<FeatureDto> => {
    const response = await api.post<FeatureDto>(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  // Lookup - Handle cả array và { items: [] } response từ ABP
  getLookup: async (filterParam?: string): Promise<LookupDto[]> => {
    const response = await api.get<LookupDto[] | { items: LookupDto[] }>(
      `${BASE_URL}/lookup`,
      { params: filterParam ? { filter: filterParam } : undefined }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || [];
  },
};
```

---

## 2. Types Pattern

### 2.1 DTO Structure

```tsx
// types/[feature].ts

// Base DTO (response from API)
export interface FeatureDto {
  id: string;
  name: string;
  code: string;
  status: FeatureStatus;
  createdAt: string;

  // Role flags - Backend tính toán dựa trên CurrentUser
  isCurrentUserOwner?: boolean;
  isCurrentUserApprover?: boolean;
  canEdit?: boolean;
}

// Create DTO
export interface CreateFeatureDto {
  name: string;
  code: string;
}

// Update DTO (partial)
export interface UpdateFeatureDto {
  name?: string;
  code?: string;
  status?: FeatureStatus;
}

// List filter DTO - match với backend GetListDto
export interface GetFeatureListDto {
  skipCount?: number;
  maxResultCount?: number;
  search?: string;
  status?: FeatureStatus;
  sorting?: string;
}

// Enum - match với backend enum
export enum FeatureStatus {
  Draft = 0,
  Pending = 1,
  Approved = 2,
  Rejected = 3,
}

// Status Labels (Vietnamese)
export const FeatureStatusLabels: Record<FeatureStatus, string> = {
  [FeatureStatus.Draft]: "Nháp",
  [FeatureStatus.Pending]: "Chờ duyệt",
  [FeatureStatus.Approved]: "Đã duyệt",
  [FeatureStatus.Rejected]: "Từ chối",
};

// Status Colors (Ant Design tag colors)
export const FeatureStatusColors: Record<FeatureStatus, string> = {
  [FeatureStatus.Draft]: "default",
  [FeatureStatus.Pending]: "processing",
  [FeatureStatus.Approved]: "success",
  [FeatureStatus.Rejected]: "error",
};

// Lookup DTO
export interface FeatureLookupDto {
  id: string;
  name: string;
  displayName?: string;
}
```

### 2.2 Common Types

```tsx
// types/common.ts

// ABP Paged result
export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

// ABP List result (non-paged)
export interface ListResultDto<T> {
  items: T[];
}

// User lookup (chuẩn cho tất cả user dropdowns)
export interface UserLookupDto {
  id: string;
  userName: string;
  name?: string;
  surname?: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
}
```

---

## 3. Container-Presentational Pattern

### 3.1 Concept

Tách components thành 2 loại:
- **Container**: Chứa logic, state, API calls
- **Presentational**: Chỉ render UI, nhận data qua props

### 3.2 Table Columns Pattern (QUAN TRỌNG)

Tách columns definition ra file riêng để giữ component chính gọn:

```
pages/[Feature]/
├── [Feature]List.tsx           # Container - chứa state, handlers
├── [Feature]Detail.tsx         # Container
└── components/
    ├── columns.tsx             # Columns definitions
    ├── [Feature]Table.tsx      # Presentational table (nếu cần)
    └── [Feature]Modal.tsx      # Modal component
```

**columns.tsx:**
```tsx
// pages/[Feature]/components/columns.tsx
import type { ColumnsType } from "antd/es/table";
import { Tag, Typography } from "antd";
import { FeatureDto, FeatureStatus, FeatureStatusLabels, FeatureStatusColors } from "../../../types/feature";
import { formatDate } from "../../../utils/formatters";

const { Link } = Typography;

interface GetColumnsOptions {
  onView?: (record: FeatureDto) => void;
  onEdit?: (record: FeatureDto) => void;
  onDelete?: (id: string) => void;
}

export const getFeatureColumns = (options?: GetColumnsOptions): ColumnsType<FeatureDto> => [
  {
    title: "Mã",
    dataIndex: "code",
    key: "code",
    width: 120,
    render: (text: string, record: FeatureDto) => (
      <Link onClick={() => options?.onView?.(record)}>{text}</Link>
    ),
  },
  {
    title: "Tên",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 120,
    render: (date: string) => formatDate(date),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: FeatureStatus) => (
      <Tag color={FeatureStatusColors[status]}>
        {FeatureStatusLabels[status]}
      </Tag>
    ),
  },
];
```

**Usage trong List component:**
```tsx
// pages/[Feature]/[Feature]List.tsx
import { getFeatureColumns } from "./components/columns";

const FeatureList: React.FC = () => {
  const navigate = useNavigate();

  // Columns với handlers
  const columns = useMemo(
    () => getFeatureColumns({
      onView: (record) => navigate(`/features/${record.id}`),
      onEdit: (record) => setEditingItem(record),
      onDelete: (id) => handleDelete(id),
    }),
    [navigate]
  );

  return (
    <Table columns={columns} dataSource={data} />
  );
};
```

### 3.3 Modal với Columns Pattern

Khi Modal có Table với columns riêng:

```tsx
// components/[Feature]Modal/columns.tsx
export const getModalColumns = (): ColumnsType<ItemDto> => [
  // ...column definitions
];

// components/[Feature]Modal/[Feature]Modal.tsx
import { getModalColumns } from "./columns";

const FeatureModal: React.FC<Props> = ({ open, onClose, tasks }) => {
  const columns = useMemo(() => getModalColumns(), []);

  return (
    <Modal open={open} onCancel={onClose}>
      <Table columns={columns} dataSource={tasks} />
    </Modal>
  );
};
```

### 3.4 Shared Columns Pattern

Khi nhiều components dùng chung columns format:

```tsx
// components/shared/tableColumns.ts
import { formatDate } from "../../utils/formatters";

// Reusable date column
export const dateColumn = (title: string, dataIndex: string) => ({
  title,
  dataIndex,
  key: dataIndex,
  width: 120,
  render: (date: string) => formatDate(date),
});

// Reusable status column
export const statusColumn = <T extends number | string>(
  labels: Record<T, string>,
  colors: Record<T, string>
) => ({
  title: "Trạng thái",
  dataIndex: "status",
  key: "status",
  width: 120,
  render: (status: T) => (
    <Tag color={colors[status]}>{labels[status]}</Tag>
  ),
});

// Usage
const columns: ColumnsType<TaskDto> = [
  dateColumn("Ngày tạo", "createdAt"),
  dateColumn("Ngày cập nhật", "updatedAt"),
  statusColumn(TaskStatusLabels, TaskStatusColors),
];
```

---

## 4. Page Component Patterns

### 4.1 List Page Structure

```tsx
// pages/[Feature]/[Feature]List.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Table, Button, Space, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { featureService } from "../../services/featureService";
import { FeatureDto, FeatureStatus, FeatureStatusLabels } from "../../types/feature";
import { PATH_ROUTES } from "../../constants";

const FeatureList: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [data, setData] = useState<FeatureDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Load data với useCallback
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await featureService.getList({
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
      });
      setData(result.items);
      setPagination(prev => {
        if (prev.total === result.totalCount) return prev;
        return { ...prev, total: result.totalCount };
      });
    } catch (error) {
      console.error("Failed to load:", error);
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Columns với useMemo
  const columns: ColumnsType<FeatureDto> = useMemo(() => [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: FeatureStatus) => FeatureStatusLabels[status],
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button onClick={() => navigate(PATH_ROUTES.feature.detail(record.id))}>
          Chi tiết
        </Button>
      ),
    },
  ], [navigate]);

  return (
    <Card title="Danh sách">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bản ghi`,
        }}
        onChange={(p) => setPagination(prev => ({
          ...prev,
          current: p.current || 1,
          pageSize: p.pageSize || 20,
        }))}
      />
    </Card>
  );
};

export default FeatureList;
```

### 4.2 Detail Page Structure

```tsx
// pages/[Feature]/[Feature]Detail.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spin, Button, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { featureService } from "../../services/featureService";
import { FeatureDto } from "../../types/feature";
import { PATH_ROUTES } from "../../constants";
import { ROLES } from "../../constants/roles";

const FeatureDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<FeatureDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Check admin role
  const isAdmin = useMemo(() => {
    try {
      const userInfoStr = localStorage.getItem("user_info");
      if (!userInfoStr) return false;
      const userInfo = JSON.parse(userInfoStr);
      return userInfo.roles?.includes(ROLES.ADMIN) ?? false;
    } catch {
      return false;
    }
  }, []);

  // Permission check: sử dụng flag từ backend + admin
  const canEdit = useMemo(() => {
    return isAdmin || data?.isCurrentUserOwner || data?.canEdit;
  }, [isAdmin, data]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await featureService.get(id);
      setData(result);
    } catch (error) {
      console.error("Failed to load:", error);
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <Spin size="large" />;
  }

  if (!data) {
    return <div>Không tìm thấy dữ liệu</div>;
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(PATH_ROUTES.feature.index)}
        style={{ marginBottom: 16 }}
      >
        Quay lại
      </Button>

      <Card title="Chi tiết">
        {/* Content */}

        {/* Conditional button based on permission */}
        {canEdit && (
          <Button type="primary" onClick={handleEdit}>
            Chỉnh sửa
          </Button>
        )}
      </Card>
    </div>
  );
};

export default FeatureDetail;
```

### 4.3 Modal Component Pattern

```tsx
// pages/[Feature]/components/FeatureModal.tsx
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, message, Spin } from "antd";
import { featureService } from "../../../services/featureService";
import { FeatureDto, CreateFeatureDto } from "../../../types/feature";

interface FeatureModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // Context data (ví dụ: taskId để filter)
  parentId?: string;
  // Edit mode
  initialData?: FeatureDto;
}

const FeatureModal: React.FC<FeatureModalProps> = ({
  open,
  onClose,
  onSuccess,
  parentId,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lookupData, setLookupData] = useState<LookupDto[]>([]);
  const [loadingLookup, setLoadingLookup] = useState(false);

  // Load lookup data when modal opens
  useEffect(() => {
    if (open && parentId) {
      loadLookupData();
    }
  }, [open, parentId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.setFieldsValue(initialData);
      } else {
        form.resetFields();
      }
    }
  }, [open, initialData, form]);

  const loadLookupData = async () => {
    setLoadingLookup(true);
    try {
      const data = await featureService.getLookup(parentId);
      setLookupData(data);
    } catch (error) {
      console.error("Failed to load lookup:", error);
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (initialData) {
        await featureService.update(initialData.id, values);
        message.success("Cập nhật thành công");
      } else {
        await featureService.create(values);
        message.success("Tạo mới thành công");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed:", error);
      // ABP error format
      message.error(
        error.response?.data?.error?.message || "Có lỗi xảy ra"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initialData ? "Chỉnh sửa" : "Tạo mới"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, message: "Vui lòng nhập tên" }]}
        >
          <Input placeholder="Nhập tên..." />
        </Form.Item>

        <Form.Item
          name="typeId"
          label="Loại"
          rules={[{ required: true, message: "Vui lòng chọn loại" }]}
        >
          <Select
            placeholder="Chọn loại..."
            loading={loadingLookup}
            options={lookupData.map(item => ({
              value: item.id,
              label: item.displayName || item.name,
            }))}
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            showSearch
            allowClear
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FeatureModal;
```

---

## 4. Authorization Pattern

### 4.1 Backend Role Flags trong DTO

Backend PHẢI return role flags trong DTO để FE control UI:

```tsx
// Backend DTO
interface TaskDto {
  id: string;
  // ... fields

  // Role flags - Backend tính dựa trên CurrentUser
  isCurrentUserTechnicalManager?: boolean;  // User là QLKT của task này
  isCurrentUserSupporter?: boolean;         // User là Supporter
  canEdit?: boolean;                        // User có quyền edit
  canApprove?: boolean;                     // User có quyền approve
}
```

### 4.2 Frontend Permission Check

```tsx
// Trong component
const isAdmin = useMemo(() => {
  try {
    const userInfoStr = localStorage.getItem("user_info");
    if (!userInfoStr) return false;
    const userInfo = JSON.parse(userInfoStr);
    return userInfo.roles?.includes(ROLES.ADMIN) ?? false;
  } catch {
    return false;
  }
}, []);

// Kết hợp backend flag + admin check
const canManage = isAdmin || task?.isCurrentUserTechnicalManager;

// Render conditional
return (
  <>
    {canManage && (
      <Button onClick={handleManage}>Quản lý</Button>
    )}
  </>
);
```

---

## 5. Constants Pattern

### 5.1 Routes

```tsx
// constants/routes.ts
export const PATH_ROUTES = {
  dashboard: "/dashboard",

  // Nested routes với helper functions
  feature: {
    index: "/features",
    create: "/features/create",
    detail: (id: string) => `/features/${id}`,
    edit: (id: string) => `/features/edit/${id}`,
  },

  // Simple routes
  settings: "/settings",
};
```

### 5.2 Roles

```tsx
// constants/roles.ts
export const ROLES = {
  ADMIN: "admin",
  LAB_TECHNICAL_MANAGER: "LabTechnicalManager",
  SAMPLE_RECEIVER: "SampleReceiver",
  QUALITY_MANAGER: "QualityManager",
  LAB_TECHNICIAN: "LabTechnician",
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES = Object.values(ROLES);

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [ROLES.ADMIN]: "Quản trị viên",
  [ROLES.LAB_TECHNICAL_MANAGER]: "Quản lý kỹ thuật",
  [ROLES.SAMPLE_RECEIVER]: "Bộ phận giao nhận mẫu",
  [ROLES.QUALITY_MANAGER]: "Quản lý chất lượng",
  [ROLES.LAB_TECHNICIAN]: "Kỹ thuật viên",
};
```

---

## 6. Error Handling Pattern

```tsx
try {
  await featureService.create(data);
  message.success("Tạo mới thành công");
  onSuccess();
} catch (error: any) {
  console.error("Failed:", error);

  // ABP error format
  const errorMessage =
    error.response?.data?.error?.message ||
    error.message ||
    "Có lỗi xảy ra";

  message.error(errorMessage);
}
```

---

## 7. Sidebar Menu Pattern

```tsx
// MainLayout.tsx - Menu item với roles
{
  key: "featureName",
  icon: <FeatureIcon />,
  label: menuLabel("Tên chức năng"),
  onClick: () => navigate(PATH_ROUTES.feature.index),
  roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],  // Roles được phép
},
```

---

## 8. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component File | PascalCase | `FeatureList.tsx` |
| Service File | camelCase + Service | `featureService.ts` |
| Type File | camelCase | `feature.ts` |
| Hook File | camelCase với `use` | `useFeatureData.ts` |
| Interface/Type | PascalCase + Dto/Props | `FeatureDto`, `FeatureModalProps` |
| Enum | PascalCase | `FeatureStatus` |
| Constant | SCREAMING_SNAKE | `BASE_URL`, `ROLES` |
| Function | camelCase | `loadData`, `handleSubmit` |

---

## 9. Best Practices

1. **useCallback cho functions trong useEffect dependencies**
2. **useMemo cho expensive computations và derived state**
3. **Backend handles authorization, FE uses returned flags**
4. **Handle loading và error states explicitly**
5. **Vietnamese cho user messages, English cho logs**
6. **Không import unused dependencies**
7. **Sử dụng Ant Design components consistently**
8. **API calls PHẢI ở service layer, KHÔNG trong components**
9. **Pagination state update cẩn thận để tránh re-render loop**
10. **Cleanup trong useEffect khi cần (subscriptions, timers)**

---

## 10. File Checklist khi tạo Feature mới

- [ ] `types/[feature].ts` - DTOs, enums, labels, colors
- [ ] `services/[feature]Service.ts` - API calls
- [ ] `pages/[Feature]/[Feature]List.tsx` - List page
- [ ] `pages/[Feature]/[Feature]Detail.tsx` - Detail page
- [ ] `pages/[Feature]/components/` - Feature-specific modals, tables
- [ ] `constants/routes.ts` - Thêm routes
- [ ] `constants/permissions.ts` - Thêm permissions (nếu cần)
- [ ] `App.tsx` - Thêm Route components
- [ ] `MainLayout.tsx` - Thêm menu item với roles

---

## 10. Custom Hooks Pattern (QUAN TRỌNG)

### 10.1 Concept

Tách logic (state, API calls, handlers) ra custom hooks riêng để:
- Component UI gọn gàng, dễ đọc
- Logic có thể reuse
- Dễ test

### 10.2 Hook Structure cho List Pages

```
pages/[Feature]/
├── [Feature]List.tsx           # UI Component - chỉ render
├── hooks/
│   └── useFeatureList.ts       # Logic hook - state, API, handlers
└── components/
    └── columns.tsx             # Column definitions
```

**hooks/useFeatureList.ts:**
```tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { featureService } from "../../../services/featureService";
import { FeatureDto, FeatureStatus } from "../../../types/feature";

interface UseFeatureListReturn {
  // State
  data: FeatureDto[];
  loading: boolean;
  pagination: { current: number; pageSize: number; total: number };
  searchText: string;
  statusFilter: FeatureStatus | undefined;

  // Handlers
  loadData: () => Promise<void>;
  handleSearch: (value: string) => void;
  handleStatusChange: (value: FeatureStatus | undefined) => void;
  handleTableChange: (pagination: any) => void;
  handleDelete: (id: string) => Promise<void>;
  handleRefresh: () => void;
}

export const useFeatureList = (): UseFeatureListReturn => {
  const [data, setData] = useState<FeatureDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeatureStatus | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await featureService.getList({
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        search: searchText || undefined,
        status: statusFilter,
      });
      setData(result.items);
      setPagination(prev => {
        if (prev.total === result.totalCount) return prev;
        return { ...prev, total: result.totalCount };
      });
    } catch (error) {
      console.error("Failed to load:", error);
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value: FeatureStatus | undefined) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      await featureService.delete(id);
      message.success("Xóa thành công");
      loadData();
    } catch (error) {
      console.error("Failed to delete:", error);
      message.error("Không thể xóa");
    }
  };

  const handleRefresh = () => {
    setSearchText("");
    setStatusFilter(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  return {
    data,
    loading,
    pagination,
    searchText,
    statusFilter,
    loadData,
    handleSearch,
    handleStatusChange,
    handleTableChange,
    handleDelete,
    handleRefresh,
  };
};
```

**Usage trong List component:**
```tsx
// pages/[Feature]/[Feature]List.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Table, Button, Space, Input, Select, Row, Col } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useFeatureList } from "./hooks/useFeatureList";
import { getFeatureColumns } from "./components/columns";
import { FeatureStatus, FeatureStatusLabels } from "../../types/feature";

const FeatureList: React.FC = () => {
  const navigate = useNavigate();
  const {
    data,
    loading,
    pagination,
    searchText,
    statusFilter,
    loadData,
    handleSearch,
    handleStatusChange,
    handleTableChange,
    handleDelete,
    handleRefresh,
  } = useFeatureList();

  const columns = useMemo(
    () => getFeatureColumns({
      onEdit: (record) => navigate(`/features/${record.id}/edit`),
      onDelete: handleDelete,
    }),
    [navigate, handleDelete]
  );

  return (
    <Card
      title="Danh sách"
      extra={<Button icon={<ReloadOutlined />} onClick={handleRefresh}>Làm mới</Button>}
    >
      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Tìm kiếm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearch}
            allowClear
            enterButton
          />
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Select
            style={{ width: "100%" }}
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={handleStatusChange}
            allowClear
          >
            {Object.entries(FeatureStatusLabels).map(([key, label]) => (
              <Select.Option key={key} value={Number(key)}>
                {label}
              </Select.Option>
            ))}
          </Select>
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
          showTotal: (total) => `Tổng ${total} mục`,
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default FeatureList;
```

---

## 11. React Hook Form + Yup Pattern (QUAN TRỌNG)

### 11.1 Dependencies

```bash
npm install react-hook-form yup @hookform/resolvers
```

### 11.2 Form với React Hook Form + Yup

```
pages/[Feature]/
├── [Feature]Form.tsx           # Form UI
├── hooks/
│   └── useFeatureForm.ts       # Form logic hook
└── schemas/
    └── featureSchema.ts        # Yup validation schema
```

**schemas/featureSchema.ts:**
```tsx
import * as yup from "yup";

export const featureSchema = yup.object({
  name: yup
    .string()
    .required("Tên là bắt buộc")
    .min(3, "Tên tối thiểu 3 ký tự")
    .max(100, "Tên tối đa 100 ký tự"),
  code: yup
    .string()
    .required("Mã là bắt buộc")
    .matches(/^[A-Z0-9]+$/, "Mã chỉ chứa chữ in hoa và số"),
  email: yup
    .string()
    .email("Email không hợp lệ")
    .nullable(),
  phone: yup
    .string()
    .matches(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ")
    .nullable(),
  status: yup
    .number()
    .required("Trạng thái là bắt buộc"),
  startDate: yup
    .date()
    .required("Ngày bắt đầu là bắt buộc"),
  endDate: yup
    .date()
    .nullable()
    .min(yup.ref("startDate"), "Ngày kết thúc phải sau ngày bắt đầu"),
}).required();

export type FeatureFormData = yup.InferType<typeof featureSchema>;
```

**hooks/useFeatureForm.ts:**
```tsx
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { featureService } from "../../../services/featureService";
import { featureSchema, FeatureFormData } from "../schemas/featureSchema";
import { FeatureDto } from "../../../types/feature";

interface UseFeatureFormProps {
  initialData?: FeatureDto;
  isEditMode?: boolean;
}

export const useFeatureForm = ({ initialData, isEditMode }: UseFeatureFormProps = {}) => {
  const navigate = useNavigate();

  const form = useForm<FeatureFormData>({
    resolver: yupResolver(featureSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      code: initialData.code,
      email: initialData.email,
      phone: initialData.phone,
      status: initialData.status,
      startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
      endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
    } : {
      name: "",
      code: "",
      status: 0,
    },
  });

  const onSubmit = async (data: FeatureFormData) => {
    try {
      if (isEditMode && initialData) {
        await featureService.update(initialData.id, data);
        message.success("Cập nhật thành công");
      } else {
        await featureService.create(data);
        message.success("Tạo mới thành công");
      }
      navigate(-1);
    } catch (error: any) {
      console.error("Failed to save:", error);
      const errorMessage = error.response?.data?.error?.message || "Có lỗi xảy ra";
      message.error(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    handleCancel,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
  };
};
```

**FeatureForm.tsx (với Ant Design):**
```tsx
import React from "react";
import { Card, Form, Input, Select, DatePicker, Button, Space, Row, Col } from "antd";
import { Controller } from "react-hook-form";
import dayjs from "dayjs";
import { useFeatureForm } from "./hooks/useFeatureForm";
import { FeatureStatusLabels } from "../../types/feature";

interface FeatureFormProps {
  initialData?: FeatureDto;
  isEditMode?: boolean;
}

const FeatureForm: React.FC<FeatureFormProps> = ({ initialData, isEditMode }) => {
  const { form, onSubmit, handleCancel, isSubmitting, errors } = useFeatureForm({
    initialData,
    isEditMode,
  });

  return (
    <Card title={isEditMode ? "Chỉnh sửa" : "Tạo mới"}>
      <Form layout="vertical" onFinish={onSubmit}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Tên"
              required
              validateStatus={errors.name ? "error" : ""}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Nhập tên" />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Mã"
              required
              validateStatus={errors.code ? "error" : ""}
              help={errors.code?.message}
            >
              <Controller
                name="code"
                control={form.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Nhập mã" disabled={isEditMode} />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Trạng thái"
              required
              validateStatus={errors.status ? "error" : ""}
              help={errors.status?.message}
            >
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select {...field} placeholder="Chọn trạng thái">
                    {Object.entries(FeatureStatusLabels).map(([key, label]) => (
                      <Select.Option key={key} value={Number(key)}>
                        {label}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Ngày bắt đầu"
              required
              validateStatus={errors.startDate ? "error" : ""}
              help={errors.startDate?.message}
            >
              <Controller
                name="startDate"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.toDate())}
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {isEditMode ? "Cập nhật" : "Tạo mới"}
            </Button>
            <Button onClick={handleCancel}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FeatureForm;
```

### 11.3 Common Yup Validators

```tsx
// schemas/commonValidators.ts
import * as yup from "yup";

// Vietnamese phone number
export const phoneSchema = yup
  .string()
  .matches(/^(0[0-9]{9,10})$/, "Số điện thoại không hợp lệ")
  .nullable();

// Vietnamese ID number (CCCD/CMND)
export const idNumberSchema = yup
  .string()
  .matches(/^[0-9]{9,12}$/, "Số CCCD/CMND không hợp lệ")
  .nullable();

// Required string with min/max
export const requiredString = (min = 1, max = 255) =>
  yup
    .string()
    .required("Trường này là bắt buộc")
    .min(min, `Tối thiểu ${min} ký tự`)
    .max(max, `Tối đa ${max} ký tự`);

// Optional positive number
export const optionalPositiveNumber = yup
  .number()
  .positive("Giá trị phải lớn hơn 0")
  .nullable()
  .transform((value) => (isNaN(value) ? null : value));

// Date range validation
export const dateRangeSchema = (startField: string) =>
  yup
    .date()
    .nullable()
    .when(startField, (startDate, schema) =>
      startDate
        ? schema.min(startDate, "Ngày kết thúc phải sau ngày bắt đầu")
        : schema
    );
```

---

## 12. File Structure Summary

```
pages/[Feature]/
├── [Feature]List.tsx           # List UI (stateless)
├── [Feature]Detail.tsx         # Detail UI (stateless)
├── [Feature]Form.tsx           # Form UI (stateless)
├── hooks/
│   ├── useFeatureList.ts       # List logic
│   ├── useFeatureDetail.ts     # Detail logic
│   └── useFeatureForm.ts       # Form logic (RHF + Yup)
├── schemas/
│   └── featureSchema.ts        # Yup validation
└── components/
    ├── columns.tsx             # Table columns
    └── [Feature]Modal.tsx      # Modals
```

---

## Checklist Feature Mới

- [ ] `types/[feature].ts` - DTOs, enums, status labels/colors
- [ ] `services/[feature]Service.ts` - API calls
- [ ] `pages/[Feature]/hooks/useFeatureList.ts` - List logic hook
- [ ] `pages/[Feature]/hooks/useFeatureForm.ts` - Form logic hook (RHF)
- [ ] `pages/[Feature]/schemas/featureSchema.ts` - Yup schema
- [ ] `pages/[Feature]/components/columns.tsx` - Table columns
- [ ] `pages/[Feature]/[Feature]List.tsx` - List UI
- [ ] `pages/[Feature]/[Feature]Detail.tsx` - Detail UI
- [ ] `pages/[Feature]/[Feature]Form.tsx` - Form UI (optional)
- [ ] `constants/routes.ts` - Thêm routes
- [ ] `constants/permissions.ts` - Thêm permissions (nếu cần)
- [ ] `App.tsx` - Thêm Route components
- [ ] `MainLayout.tsx` - Thêm menu item với roles

---

**Version:** 4.0
**Updated:** 2026-01-01
**Changes:**
- v3.0: Added Container-Presentational Pattern (Section 3)
- v4.0: Added Custom Hooks Pattern (Section 10), React Hook Form + Yup Pattern (Section 11)