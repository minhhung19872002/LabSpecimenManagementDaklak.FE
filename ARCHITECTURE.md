# Kiến Trúc Frontend - Hệ Thống Quản Lý Mẫu Phòng Thí Nghiệm

## 1. Tổng Quan Kiến Trúc

### 1.1 Technology Stack
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit + RTK Query
- **Routing**: React Router v6
- **UI Framework**: Ant Design / Material-UI
- **Form Management**: React Hook Form + Zod
- **Data Fetching**: Axios + RTK Query
- **Charts**: Recharts / Apache ECharts
- **i18n**: react-i18next (Tiếng Việt)
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier

### 1.2 Kiến Trúc Tổng Thể
```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Desktop    │  │    Tablet    │  │     Mobile       │  │
│  │  (Responsive)│  │  (Responsive)│  │   (Responsive)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Components (Pages)                  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │  Login   │ │Dashboard │ │TestReq   │ │Specimen  │ │ │
│  │  │  /Auth   │ │  /Stats  │ │  /Lab    │ │  /Report │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Reusable Components Library                 │ │
│  │  - Tables (with filter, sort, pagination)             │ │
│  │  - Forms (with validation)                            │ │
│  │  - Modals, Drawers, Cards                             │ │
│  │  - Charts, Graphs                                     │ │
│  │  - File Upload, QR Scanner                            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                    Application Layer                         │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  Redux Store   │  │  React Router  │  │  RTK Query    │ │
│  │  - Auth State  │  │  - Navigation  │  │  - API Cache  │ │
│  │  - User Prefs  │  │  - Guards      │  │  - Mutations  │ │
│  │  - UI State    │  │  - Lazy Load   │  │  - Queries    │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  Hooks         │  │  Utils         │  │  Validators   │ │
│  │  - useAuth     │  │  - formatDate  │  │  - Zod Schema │ │
│  │  - useForm     │  │  - formatNum   │  │  - Rules      │ │
│  │  - useTable    │  │  - helpers     │  │               │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │  API Services  │  │  WebSocket     │  │  Local Storage│ │
│  │  - REST APIs   │  │  - Real-time   │  │  - Token      │ │
│  │  - Interceptors│  │  - Notifications│ │  - Settings   │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 2. Cấu Trúc Project

```
lab-specimen-management-fe/
├── public/
│   ├── locales/
│   │   └── vi/
│   │       └── translation.json
│   └── assets/
│       ├── images/
│       └── icons/
├── src/
│   ├── app/
│   │   ├── store.ts                     # Redux store configuration
│   │   └── rootReducer.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── PasswordReset.tsx
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── ProfilePage.tsx
│   │   │   ├── slices/
│   │   │   │   └── authSlice.ts
│   │   │   ├── services/
│   │   │   │   └── authApi.ts           # RTK Query
│   │   │   └── hooks/
│   │   │       └── useAuth.ts
│   │   │
│   │   ├── test-requests/
│   │   │   ├── components/
│   │   │   │   ├── TestRequestForm.tsx
│   │   │   │   ├── TestRequestList.tsx
│   │   │   │   ├── TestRequestDetail.tsx
│   │   │   │   ├── TestItemTable.tsx
│   │   │   │   └── ExcelImport.tsx
│   │   │   ├── pages/
│   │   │   │   ├── TestRequestListPage.tsx
│   │   │   │   ├── CreateTestRequestPage.tsx
│   │   │   │   └── TestRequestDetailPage.tsx
│   │   │   ├── services/
│   │   │   │   └── testRequestApi.ts
│   │   │   ├── types/
│   │   │   │   └── testRequest.types.ts
│   │   │   └── utils/
│   │   │       └── tatCalculator.ts
│   │   │
│   │   ├── specimens/
│   │   │   ├── components/
│   │   │   │   ├── SpecimenList.tsx
│   │   │   │   ├── SpecimenDetail.tsx
│   │   │   │   ├── SpecimenHistory.tsx
│   │   │   │   ├── SpecimenLocationMap.tsx
│   │   │   │   └── SpecimenStatusBadge.tsx
│   │   │   ├── pages/
│   │   │   │   ├── SpecimenListPage.tsx
│   │   │   │   └── SpecimenDetailPage.tsx
│   │   │   └── services/
│   │   │       └── specimenApi.ts
│   │   │
│   │   ├── laboratory/
│   │   │   ├── components/
│   │   │   │   ├── AssignmentList.tsx
│   │   │   │   ├── ResultEntry.tsx
│   │   │   │   ├── ResultApproval.tsx
│   │   │   │   └── ResultChart.tsx
│   │   │   ├── pages/
│   │   │   │   ├── LabWorkbench.tsx
│   │   │   │   ├── MyAssignments.tsx
│   │   │   │   └── ResultApprovalPage.tsx
│   │   │   └── services/
│   │   │       └── laboratoryApi.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── components/
│   │   │   │   ├── ReportForm.tsx
│   │   │   │   ├── ReportPreview.tsx
│   │   │   │   ├── ReportApprovalFlow.tsx
│   │   │   │   ├── QRCodeGenerator.tsx
│   │   │   │   └── QRCodeScanner.tsx
│   │   │   ├── pages/
│   │   │   │   ├── CreateReportPage.tsx
│   │   │   │   ├── ReportApprovalPage.tsx
│   │   │   │   ├── ReportListPage.tsx
│   │   │   │   └── ReportVerifyPage.tsx
│   │   │   └── services/
│   │   │       └── reportApi.ts
│   │   │
│   │   ├── non-conformance/
│   │   │   ├── components/
│   │   │   │   ├── NCRForm.tsx
│   │   │   │   ├── NCRWorkflow.tsx
│   │   │   │   └── CorrectiveActionForm.tsx
│   │   │   ├── pages/
│   │   │   │   ├── NCRListPage.tsx
│   │   │   │   └── NCRDetailPage.tsx
│   │   │   └── services/
│   │   │       └── ncrApi.ts
│   │   │
│   │   ├── statistics/
│   │   │   ├── components/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── SampleMatrixChart.tsx
│   │   │   │   ├── TATComplianceChart.tsx
│   │   │   │   ├── DepartmentWorkload.tsx
│   │   │   │   └── ExportExcel.tsx
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   └── ReportsPage.tsx
│   │   │   └── services/
│   │   │       └── statisticsApi.ts
│   │   │
│   │   └── settings/
│   │       ├── components/
│   │       │   ├── UserPreferences.tsx
│   │       │   ├── SystemSettings.tsx
│   │       │   └── BackupConfig.tsx
│   │       └── pages/
│   │           └── SettingsPage.tsx
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Breadcrumb.tsx
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Drawer.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── Notification.tsx
│   │   │   │   ├── Loading.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   ├── forms/
│   │   │   │   ├── FormField.tsx
│   │   │   │   ├── FormGroup.tsx
│   │   │   │   └── FormValidation.tsx
│   │   │   └── data-display/
│   │   │       ├── StatusBadge.tsx
│   │   │       ├── Timeline.tsx
│   │   │       ├── AuditTrail.tsx
│   │   │       └── FileUpload.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePermission.ts
│   │   │   ├── useTable.ts
│   │   │   ├── useForm.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useNotification.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── api/
│   │   │   │   ├── axios.config.ts
│   │   │   │   └── interceptors.ts
│   │   │   ├── formatters/
│   │   │   │   ├── dateFormatter.ts
│   │   │   │   ├── numberFormatter.ts
│   │   │   │   └── currencyFormatter.ts
│   │   │   ├── validators/
│   │   │   │   ├── schemas.ts           # Zod schemas
│   │   │   │   └── customValidators.ts
│   │   │   ├── constants/
│   │   │   │   ├── permissions.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── enums.ts
│   │   │   └── helpers/
│   │   │       ├── downloadFile.ts
│   │   │       ├── generatePDF.ts
│   │   │       └── qrCode.ts
│   │   │
│   │   └── types/
│   │       ├── api.types.ts
│   │       ├── common.types.ts
│   │       └── index.ts
│   │
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── PrivateRoute.tsx
│   │   ├── PublicRoute.tsx
│   │   └── routes.config.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env.development
├── .env.production
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

## 3. Module Chi Tiết

### 3.1 Authentication Module
**Chức năng:**
- Login/Logout
- Remember me
- Password reset
- Session management
- Token refresh tự động

**State Management:**
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  permissions: string[];
}
```

**Components:**
- `LoginForm`: Form đăng nhập với validation
- `PasswordReset`: Reset mật khẩu
- `ProfilePage`: Thông tin cá nhân, đổi mật khẩu

### 3.2 Test Request Module
**Chức năng:**
- Tạo/sửa/xóa phiếu yêu cầu
- Import từ Excel
- Đính kèm hình ảnh, tài liệu
- Tính toán TAT tự động
- Theo dõi trạng thái

**Key Components:**
```typescript
// TestRequestForm.tsx
interface TestRequestFormProps {
  mode: 'create' | 'edit';
  initialData?: TestRequest;
  onSubmit: (data: TestRequestInput) => void;
}

// TestRequestList.tsx
interface TestRequestListProps {
  filters?: TestRequestFilters;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// ExcelImport.tsx
interface ExcelImportProps {
  templateUrl: string;
  onImport: (file: File) => Promise<void>;
}
```

### 3.3 Specimen Management Module
**Chức năng:**
- Danh sách mẫu với filter, search
- Chi tiết mẫu
- Lịch sử di chuyển (timeline)
- Cập nhật vị trí
- Quản lý tình trạng mẫu

**Components:**
- `SpecimenList`: Table với pagination, filter
- `SpecimenDetail`: Thông tin chi tiết
- `SpecimenHistory`: Timeline lịch sử
- `SpecimenLocationMap`: Sơ đồ vị trí lưu mẫu

### 3.4 Laboratory Module
**Chức năng:**
- Danh sách công việc được giao
- Nhận công việc
- Nhập kết quả (với validation)
- Biểu diễn kết quả (charts)
- Duyệt kết quả

**Components:**
```typescript
// ResultEntry.tsx
interface ResultEntryProps {
  testAssignment: TestAssignment;
  onSave: (results: TestResult[]) => void;
}

// ResultChart.tsx
interface ResultChartProps {
  data: TestResult[];
  type: 'line' | 'bar' | 'scatter';
}
```

### 3.5 Report Module
**Chức năng:**
- Tạo báo cáo từ kết quả
- Preview báo cáo trước khi phê duyệt
- Workflow phê duyệt 2 bước
- Sinh QR code
- Quét QR code để xác thực
- Download PDF

**Components:**
- `ReportForm`: Form tạo báo cáo
- `ReportPreview`: Xem trước báo cáo
- `ReportApprovalFlow`: Quy trình phê duyệt
- `QRCodeGenerator`: Tạo QR code
- `QRCodeScanner`: Quét QR code

### 3.6 Statistics & Dashboard Module
**Chức năng:**
- Dashboard tổng quan theo vai trò
- Biểu đồ thống kê
- Export Excel
- Filter theo ngày, bộ phận, nền mẫu

**Charts:**
- Số lượng mẫu/phép thử theo thời gian (Line/Bar chart)
- Phân bố theo nền mẫu (Pie chart)
- TAT compliance (Gauge chart)
- Workload theo bộ phận (Bar chart)
- NCR trends (Line chart)

## 4. State Management với Redux Toolkit

### 4.1 Store Structure
```typescript
// app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import authReducer from '@/features/auth/slices/authSlice';
import uiReducer from '@/shared/slices/uiSlice';
import { authApi } from '@/features/auth/services/authApi';
import { testRequestApi } from '@/features/test-requests/services/testRequestApi';
// ... other APIs

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [testRequestApi.reducerPath]: testRequestApi.reducer,
    // ... other API reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      testRequestApi.middleware,
      // ... other API middlewares
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 4.2 RTK Query API Services
```typescript
// features/test-requests/services/testRequestApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const testRequestApi = createApi({
  reducerPath: 'testRequestApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['TestRequest'],
  endpoints: (builder) => ({
    getTestRequests: builder.query<TestRequestListResponse, TestRequestFilters>({
      query: (filters) => ({
        url: '/test-requests',
        params: filters,
      }),
      providesTags: ['TestRequest'],
    }),
    getTestRequest: builder.query<TestRequest, string>({
      query: (id) => `/test-requests/${id}`,
      providesTags: (result, error, id) => [{ type: 'TestRequest', id }],
    }),
    createTestRequest: builder.mutation<TestRequest, CreateTestRequestInput>({
      query: (data) => ({
        url: '/test-requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['TestRequest'],
    }),
    updateTestRequest: builder.mutation<TestRequest, UpdateTestRequestInput>({
      query: ({ id, ...data }) => ({
        url: `/test-requests/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'TestRequest', id }],
    }),
    deleteTestRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `/test-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TestRequest'],
    }),
  }),
});

export const {
  useGetTestRequestsQuery,
  useGetTestRequestQuery,
  useCreateTestRequestMutation,
  useUpdateTestRequestMutation,
  useDeleteTestRequestMutation,
} = testRequestApi;
```

## 5. Routing & Navigation

### 5.1 Route Configuration
```typescript
// routes/routes.config.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',

  TEST_REQUESTS: {
    LIST: '/test-requests',
    CREATE: '/test-requests/create',
    DETAIL: '/test-requests/:id',
    EDIT: '/test-requests/:id/edit',
  },

  SPECIMENS: {
    LIST: '/specimens',
    DETAIL: '/specimens/:id',
  },

  LABORATORY: {
    WORKBENCH: '/laboratory',
    ASSIGNMENTS: '/laboratory/assignments',
    RESULTS: '/laboratory/results',
    APPROVAL: '/laboratory/approval',
  },

  REPORTS: {
    LIST: '/reports',
    CREATE: '/reports/create',
    DETAIL: '/reports/:id',
    APPROVAL: '/reports/approval',
    VERIFY: '/reports/verify/:code',
  },

  NCR: {
    LIST: '/ncr',
    CREATE: '/ncr/create',
    DETAIL: '/ncr/:id',
  },

  STATISTICS: {
    DASHBOARD: '/statistics/dashboard',
    REPORTS: '/statistics/reports',
  },

  SETTINGS: '/settings',
};
```

### 5.2 Protected Routes
```typescript
// routes/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface PrivateRouteProps {
  requiredPermissions?: string[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  requiredPermissions
}) => {
  const { isAuthenticated, hasPermissions } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions && !hasPermissions(requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

## 6. Form Management với React Hook Form + Zod

### 6.1 Validation Schema
```typescript
// features/test-requests/schemas/testRequest.schema.ts
import { z } from 'zod';

export const testRequestSchema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  sampleName: z.string().min(1, 'Vui lòng nhập tên mẫu'),
  sampleMatrix: z.string().min(1, 'Vui lòng chọn nền mẫu'),
  receivedDate: z.date(),
  requestedTests: z.array(z.object({
    testMethodId: z.string(),
    parameters: z.array(z.string()).min(1, 'Chọn ít nhất 1 thông số'),
  })).min(1, 'Chọn ít nhất 1 phép thử'),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url(),
  })).optional(),
});

export type TestRequestFormData = z.infer<typeof testRequestSchema>;
```

### 6.2 Form Component
```typescript
// features/test-requests/components/TestRequestForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const TestRequestForm: React.FC<TestRequestFormProps> = ({
  onSubmit,
  initialData
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<TestRequestFormData>({
    resolver: zodResolver(testRequestSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## 7. UI/UX Guidelines

### 7.1 Responsive Design
- Mobile-first approach
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### 7.2 Theme & Styling
```typescript
// theme.config.ts
export const theme = {
  colors: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff',
  },
  fonts: {
    body: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    heading: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};
```

### 7.3 Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance (WCAG AA)

### 7.4 User Preferences
- Lưu layout preferences (sidebar collapsed/expanded)
- Table column visibility
- Default filters
- Theme preference (light/dark)

## 8. Performance Optimization

### 8.1 Code Splitting
```typescript
// Lazy load routes
const TestRequestListPage = lazy(() =>
  import('@/features/test-requests/pages/TestRequestListPage')
);

// Suspense wrapper
<Suspense fallback={<Loading />}>
  <TestRequestListPage />
</Suspense>
```

### 8.2 Memoization
```typescript
// useMemo for expensive calculations
const filteredData = useMemo(() =>
  data.filter(item => item.status === 'active'),
  [data]
);

// useCallback for event handlers
const handleDelete = useCallback((id: string) => {
  // delete logic
}, []);
```

### 8.3 Virtual Scrolling
- Sử dụng react-window cho danh sách lớn
- Pagination cho tables
- Infinite scroll cho feeds

## 9. Internationalization (i18n)

### 9.1 Translation Files
```json
// public/locales/vi/translation.json
{
  "common": {
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa",
    "edit": "Sửa",
    "create": "Tạo mới"
  },
  "testRequest": {
    "title": "Phiếu yêu cầu thử nghiệm",
    "create": "Tạo phiếu yêu cầu",
    "list": "Danh sách yêu cầu"
  }
}
```

### 9.2 Usage
```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();

  return <h1>{t('testRequest.title')}</h1>;
};
```

## 10. Error Handling

### 10.1 Error Boundary
```typescript
// shared/components/common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage />;
    }
    return this.props.children;
  }
}
```

### 10.2 API Error Handling
```typescript
// Axios interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    if (error.response?.status === 403) {
      // Show permission error
    }
    if (error.response?.status >= 500) {
      // Show server error
    }
    return Promise.reject(error);
  }
);
```

## 11. Testing Strategy

### 11.1 Unit Tests
```typescript
// features/test-requests/components/TestRequestForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TestRequestForm } from './TestRequestForm';

describe('TestRequestForm', () => {
  it('validates required fields', async () => {
    render(<TestRequestForm onSubmit={jest.fn()} />);

    fireEvent.click(screen.getByText('Lưu'));

    expect(await screen.findByText('Vui lòng chọn khách hàng')).toBeInTheDocument();
  });
});
```

### 11.2 Integration Tests
- Test API calls với MSW (Mock Service Worker)
- Test Redux state changes
- Test navigation flows

### 11.3 E2E Tests (Playwright/Cypress)
- Critical user journeys
- Create test request → Lab work → Report approval → Customer delivery

## 12. Security Measures

### 12.1 XSS Prevention
- Sanitize user input
- Use dangerouslySetInnerHTML carefully
- Content Security Policy headers

### 12.2 CSRF Protection
- CSRF tokens trong forms
- SameSite cookies

### 12.3 Secure Storage
- Token storage trong httpOnly cookies (nếu có thể)
- Sensitive data không lưu trong localStorage
- Encrypt sensitive data trước khi lưu

## 13. Build & Deployment

### 13.1 Environment Variables
```bash
# .env.development
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Lab Specimen Management

# .env.production
VITE_API_URL=https://api.labmanagement.vn/api
VITE_APP_NAME=Lab Specimen Management
```

### 13.2 Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['antd'],
        },
      },
    },
  },
});
```

### 13.3 Deployment
- Docker container
- Nginx reverse proxy
- CI/CD pipeline (GitHub Actions)
- Automated testing before deploy

## 14. Monitoring & Analytics

### 14.1 Error Tracking
- Sentry integration
- Custom error reporting

### 14.2 Performance Monitoring
- Web Vitals tracking
- Lighthouse scores
- Bundle size monitoring

### 14.3 User Analytics
- User behavior tracking
- Feature usage statistics
- Performance metrics

## 15. Development Workflow

### 15.1 Git Workflow
- Feature branches
- Pull requests with code review
- Conventional commits

### 15.2 Code Quality Tools
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "react/prop-types": "off"
  }
}
```

### 15.3 Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-10
**Author:** Development Team
**Status:** Draft
