# THEO DÕI TIẾN ĐỘ PHÁT TRIỂN - HỆ THỐNG QUẢN LÝ MẪU PHÒNG THÍ NGHIỆM (FRONTEND)

> **Mục đích**: Theo dõi chi tiết từng bước phát triển, dễ dàng rollback khi có lỗi, và giúp các developer khác dễ follow
>
> **Cách sử dụng**:
> - Đánh dấu [x] khi hoàn thành một task
> - Ghi chú commit hash sau mỗi bước quan trọng
> - Ghi chú vấn đề phát sinh và cách giải quyết

---

## 🚀 BƯỚC TIẾP THEO NGAY BÂY GIỜ - KHỞI TẠO PROJECT

> **Nếu bạn đang bắt đầu từ đầu, hãy làm theo các bước này TRƯỚC KHI vào PHASE 0**

### Bước 1: Khởi tạo Git Repository

```bash
cd /Volumes/CrewDev/NextOne/lab-specimen-management-fe
git init
git add .
git commit -m "docs: initial documentation setup"
```

**Hoàn thành**: [ ]
**Ngày**: _________________

---

### Bước 2: Tạo Remote Repository (GitHub/GitLab)

- [ ] Tạo repository mới trên GitHub: `lab-specimen-management-fe`
- [ ] Copy HTTPS/SSH URL
- [ ] Add remote origin:
  ```bash
  git remote add origin <your-repo-url>
  git branch -M main
  git push -u origin main
  git checkout -b develop
  git push -u origin develop
  ```

**Repository URL**: _________________
**Hoàn thành**: [ ]

---

### Bước 3: Khởi tạo Vite + React + TypeScript Project

```bash
cd /Volumes/CrewDev/NextOne/lab-specimen-management-fe

# Tạo project với Vite (chọn React + TypeScript)
pnpm create vite . --template react-ts

# Hoặc nếu dùng npm
npm create vite@latest . -- --template react-ts

# Cài đặt dependencies
pnpm install
# hoặc: npm install
```

**Hoàn thành**: [ ]
**Ngày**: _________________

---

### Bước 4: Cài Đặt Dependencies Cơ Bản

```bash
# Router
pnpm add react-router-dom

# State Management
pnpm add @reduxjs/toolkit react-redux

# UI Framework
pnpm add antd

# HTTP Client
pnpm add axios

# Forms
pnpm add react-hook-form @hookform/resolvers zod

# i18n
pnpm add react-i18next i18next

# Utilities
pnpm add date-fns recharts

# Dev Dependencies
pnpm add -D @types/react @types/react-dom @types/node
pnpm add -D eslint prettier eslint-config-prettier eslint-plugin-react
```

**Hoàn thành**: [ ]

---

### Bước 5: Cấu Hình ESLint và Prettier

Tạo file `.eslintrc.json`:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "no-console": "warn"
  }
}
```

Tạo file `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Hoàn thành**: [ ]

---

### Bước 6: Tạo Environment Files

Tạo file `.env.development`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Quản Lý Mẫu Phòng Thí Nghiệm
VITE_APP_VERSION=1.0.0
```

Tạo file `.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Quản Lý Mẫu Phòng Thí Nghiệm
VITE_APP_VERSION=1.0.0
```

Tạo file `.env.example` (không chứa sensitive data):

```env
VITE_API_URL=
VITE_APP_NAME=
VITE_APP_VERSION=
```

**Hoàn thành**: [ ]

---

### Bước 7: Tạo Cấu Trúc Thư Mục

```bash
cd src
mkdir -p app features shared routes
mkdir -p features/auth/components features/auth/pages features/auth/services features/auth/slices
mkdir -p shared/components/layout shared/components/common shared/components/forms
mkdir -p shared/hooks shared/utils shared/types
```

**Hoàn thành**: [ ]

---

### Bước 8: Test Chạy Dev Server

```bash
pnpm dev
# hoặc: npm run dev

# Truy cập http://localhost:5173 (hoặc port khác nếu Vite assign)
# Kiểm tra app chạy được không
```

**Hoàn thành**: [ ]
**Có lỗi không?**: [ ] Có / [ ] Không

---

### Bước 9: Commit Lần 1

```bash
# Tạo .gitignore nếu chưa có
echo "node_modules
dist
.env.local
.DS_Store" > .gitignore

git add .
git commit -m "chore: initialize Vite React TypeScript project with dependencies"
git push origin develop
```

**Commit Hash**: _________________
**Hoàn thành**: [ ]

---

### ✅ CHECKLIST HOÀN THÀNH KHỞI TẠO

- [ ] Git repository đã được tạo và push lên remote
- [ ] Vite + React + TypeScript project đã được khởi tạo
- [ ] Dependencies cơ bản đã được cài đặt
- [ ] ESLint và Prettier đã được cấu hình
- [ ] Environment files đã được tạo
- [ ] Cấu trúc thư mục đã được tạo
- [ ] Dev server chạy thành công
- [ ] Đã commit và push code lên branch `develop`

**Khi hoàn thành tất cả, tiếp tục với PHASE 0 bên dưới** ⬇️

---

## PHASE 0: THIẾT LẬP DỰ ÁN BAN ĐẦU

### 0.1 Thiết Lập Môi Trường Phát Triển
- [ ] Cài đặt Node.js (phiên bản LTS mới nhất, >= 18.x)
- [ ] Cài đặt pnpm hoặc npm
- [ ] Cài đặt Visual Studio Code hoặc WebStorm
- [ ] Cài đặt các VS Code extensions:
  - ESLint
  - Prettier
  - TypeScript
  - ES7+ React/Redux/React-Native snippets
- [ ] Cài đặt Git và cấu hình
- [ ] Cài đặt React DevTools extension

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 0.2 Khởi Tạo Dự Án với Vite + React + TypeScript
- [ ] Chạy lệnh tạo project:
  ```bash
  pnpm create vite lab-specimen-management-fe --template react-ts
  ```
- [ ] Di chuyển vào thư mục project
- [ ] Cài đặt dependencies: `pnpm install`
- [ ] Chạy dev server: `pnpm dev`
- [ ] Truy cập http://localhost:5173 và kiểm tra app chạy được

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 0.3 Cài Đặt Dependencies Cơ Bản
- [ ] Cài đặt React Router:
  ```bash
  pnpm add react-router-dom
  ```
- [ ] Cài đặt Redux Toolkit và RTK Query:
  ```bash
  pnpm add @reduxjs/toolkit react-redux
  ```
- [ ] Cài đặt Ant Design (hoặc Material-UI):
  ```bash
  pnpm add antd
  ```
- [ ] Cài đặt Axios:
  ```bash
  pnpm add axios
  ```
- [ ] Cài đặt React Hook Form và Zod:
  ```bash
  pnpm add react-hook-form @hookform/resolvers zod
  ```
- [ ] Cài đặt i18next:
  ```bash
  pnpm add react-i18next i18next
  ```
- [ ] Cài đặt date-fns (để xử lý ngày tháng):
  ```bash
  pnpm add date-fns
  ```
- [ ] Cài đặt recharts (cho biểu đồ):
  ```bash
  pnpm add recharts
  ```

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 0.4 Cài Đặt Dev Dependencies
- [ ] Cài đặt TypeScript types:
  ```bash
  pnpm add -D @types/react @types/react-dom @types/node
  ```
- [ ] Cài đặt ESLint và Prettier:
  ```bash
  pnpm add -D eslint prettier eslint-config-prettier eslint-plugin-react
  ```
- [ ] Tạo file `.eslintrc.json`
- [ ] Tạo file `.prettierrc`
- [ ] Cấu hình format on save trong VS Code
- [ ] Test ESLint và Prettier hoạt động

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 0.5 Cấu Hình Cấu Trúc Thư Mục
- [ ] Tạo cấu trúc thư mục theo architecture:
  ```
  src/
  ├── app/
  ├── features/
  ├── shared/
  ├── routes/
  ├── App.tsx
  └── main.tsx
  ```
- [ ] Tạo các thư mục con trong `features/`
- [ ] Tạo các thư mục con trong `shared/`
- [ ] Commit initial structure

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 0.6 Thiết Lập Git Repository
- [ ] Khởi tạo Git: `git init`
- [ ] Tạo `.gitignore`
- [ ] Commit initial code
- [ ] Tạo repository trên GitHub/GitLab
- [ ] Push code lên remote
- [ ] Tạo branch `develop`

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 0.7 Cấu Hình Environment Variables
- [ ] Tạo file `.env.development`
  ```
  VITE_API_URL=http://localhost:5000/api
  VITE_APP_NAME=Quản Lý Mẫu Phòng Thí Nghiệm
  ```
- [ ] Tạo file `.env.production`
- [ ] Tạo file `.env.example` (không chứa sensitive data)
- [ ] Thêm `.env.*` vào `.gitignore`
- [ ] Test đọc env variables

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 1: THIẾT LẬP REDUX STORE & ROUTING (Tuần 1)

### 1.1 Cấu Hình Redux Store
- [ ] Tạo file `src/app/store.ts`
- [ ] Configure Redux store với configureStore
- [ ] Tạo file `src/app/rootReducer.ts`
- [ ] Wrap App với `<Provider store={store}>`
- [ ] Test Redux DevTools hoạt động

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 1.2 Thiết Lập React Router
- [ ] Tạo file `src/routes/index.tsx`
- [ ] Cấu hình BrowserRouter
- [ ] Tạo routes config trong `src/routes/routes.config.ts`
- [ ] Tạo basic routes:
  - `/` - Home/Dashboard
  - `/login` - Login page
  - `/test-requests` - Test requests list
- [ ] Test navigation hoạt động

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 1.3 Tạo Route Guards
- [ ] Tạo `PrivateRoute.tsx` component
- [ ] Tạo `PublicRoute.tsx` component
- [ ] Implement redirect logic
- [ ] Test routes với/không authentication

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 2: AUTHENTICATION MODULE (Tuần 1-2)

### 2.1 Tạo Auth Slice (Redux)
- [ ] Tạo `src/features/auth/slices/authSlice.ts`
- [ ] Định nghĩa AuthState interface
- [ ] Tạo reducers:
  - setCredentials
  - logout
  - setUser
- [ ] Export actions và selectors

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 2.2 Tạo Auth API (RTK Query)
- [ ] Tạo `src/features/auth/services/authApi.ts`
- [ ] Định nghĩa base query với axios
- [ ] Tạo endpoints:
  - login
  - logout
  - refreshToken
  - getCurrentUser
- [ ] Cấu hình token interceptor

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 2.3 Tạo Axios Configuration
- [ ] Tạo `src/shared/utils/api/axios.config.ts`
- [ ] Cấu hình base URL từ env
- [ ] Tạo axios instance
- [ ] Tạo `src/shared/utils/api/interceptors.ts`
- [ ] Implement request interceptor (thêm token)
- [ ] Implement response interceptor (handle 401, refresh token)
- [ ] Test interceptors

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 2.4 Tạo Login Form
- [ ] Tạo `src/features/auth/components/LoginForm.tsx`
- [ ] Sử dụng React Hook Form
- [ ] Tạo Zod schema validation:
  ```typescript
  const loginSchema = z.object({
    username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    rememberMe: z.boolean().optional(),
  });
  ```
- [ ] Implement submit handler
- [ ] Hiển thị loading state
- [ ] Hiển thị error messages
- [ ] Test login flow

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 2.5 Tạo Login Page
- [ ] Tạo `src/features/auth/pages/LoginPage.tsx`
- [ ] Design UI đẹp (logo, form, background)
- [ ] Responsive cho mobile
- [ ] Link đến forgot password
- [ ] Test UX

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 2.6 Tạo useAuth Hook
- [ ] Tạo `src/shared/hooks/useAuth.ts`
- [ ] Export:
  - user
  - isAuthenticated
  - login function
  - logout function
  - loading state
- [ ] Tái sử dụng trong components

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 2.7 Implement Persistent Login
- [ ] Lưu token vào localStorage (hoặc httpOnly cookie)
- [ ] Restore session khi reload page
- [ ] Auto logout khi token expire
- [ ] Test persistent login

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 3: LAYOUT COMPONENTS (Tuần 2)

### 3.1 Tạo App Layout
- [ ] Tạo `src/shared/components/layout/AppLayout.tsx`
- [ ] Structure: Header + Sidebar + Content + Footer
- [ ] Sử dụng Ant Design Layout component
- [ ] Responsive design

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 3.2 Tạo Header Component
- [ ] Tạo `src/shared/components/layout/Header.tsx`
- [ ] Logo
- [ ] User menu (dropdown)
  - Thông tin user
  - Đổi mật khẩu
  - Đăng xuất
- [ ] Notification bell
- [ ] Toggle sidebar button

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 3.3 Tạo Sidebar Component
- [ ] Tạo `src/shared/components/layout/Sidebar.tsx`
- [ ] Menu items theo permissions:
  - Dashboard
  - Phiếu yêu cầu
  - Quản lý mẫu
  - Phòng thí nghiệm
  - Báo cáo
  - Thống kê
  - Cài đặt
- [ ] Active menu highlight
- [ ] Collapsible sidebar
- [ ] Icons cho mỗi menu

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 3.4 Tạo Breadcrumb Component
- [ ] Tạo `src/shared/components/layout/Breadcrumb.tsx`
- [ ] Auto generate từ current route
- [ ] Clickable breadcrumbs
- [ ] Test với nested routes

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 3.5 Tạo Footer Component
- [ ] Tạo `src/shared/components/layout/Footer.tsx`
- [ ] Copyright info
- [ ] Version number
- [ ] Links (nếu cần)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 4: COMMON COMPONENTS (Tuần 2-3)

### 4.1 Tạo Table Component
- [ ] Tạo `src/shared/components/common/Table.tsx`
- [ ] Wrap Ant Design Table
- [ ] Props: data, columns, loading, pagination
- [ ] Implement sorting
- [ ] Implement filtering
- [ ] Implement row selection
- [ ] Export selected rows

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 4.2 Tạo Form Components
- [ ] Tạo `src/shared/components/forms/FormField.tsx`
- [ ] Integrate với React Hook Form
- [ ] Support input types: text, number, date, select, textarea
- [ ] Show validation errors
- [ ] Tạo `FormGroup.tsx` để group fields

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 4.3 Tạo Modal Component
- [ ] Tạo `src/shared/components/common/Modal.tsx`
- [ ] Wrap Ant Design Modal
- [ ] Props: title, content, onOk, onCancel
- [ ] Loading state
- [ ] Confirm modal variant

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 4.4 Tạo Loading Component
- [ ] Tạo `src/shared/components/common/Loading.tsx`
- [ ] Spinner animation
- [ ] Fullscreen variant
- [ ] Inline variant

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 4.5 Tạo Notification Service
- [ ] Tạo `src/shared/hooks/useNotification.ts`
- [ ] Wrap Ant Design notification
- [ ] Methods: success, error, warning, info
- [ ] Test notifications

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 4.6 Tạo Error Boundary
- [ ] Tạo `src/shared/components/common/ErrorBoundary.tsx`
- [ ] Catch React errors
- [ ] Display error UI
- [ ] Log errors to console (hoặc error tracking service)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 5: MODULE PHIẾU YÊU CẦU THỬ NGHIỆM (Tuần 3-5)

### 5.1 Định Nghĩa Types
- [ ] Tạo `src/features/test-requests/types/testRequest.types.ts`
- [ ] Định nghĩa interfaces:
  - TestRequest
  - TestRequestItem
  - TestRequestStatus (enum)
  - CreateTestRequestInput
  - UpdateTestRequestInput
  - TestRequestFilters

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.2 Tạo Test Request API
- [ ] Tạo `src/features/test-requests/services/testRequestApi.ts`
- [ ] RTK Query endpoints:
  - getTestRequests (với pagination, filter)
  - getTestRequest (by id)
  - createTestRequest
  - updateTestRequest
  - deleteTestRequest
  - cancelTestRequest
  - submitTestRequest
  - importExcel
  - exportExcel

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.3 Tạo Zod Validation Schema
- [ ] Tạo `src/features/test-requests/schemas/testRequest.schema.ts`
- [ ] Validation cho create/update form
- [ ] Validate required fields
- [ ] Validate dates
- [ ] Validate arrays (test items)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.4 Tạo Test Request List Component
- [ ] Tạo `src/features/test-requests/components/TestRequestList.tsx`
- [ ] Sử dụng Table component
- [ ] Columns: Request Number, Customer, Received Date, Due Date, Status, Actions
- [ ] Filter panel:
  - Search by request number
  - Filter by customer
  - Filter by status
  - Filter by date range
- [ ] Pagination
- [ ] Action buttons: View, Edit, Delete, Cancel

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.5 Tạo Test Request Form Component
- [ ] Tạo `src/features/test-requests/components/TestRequestForm.tsx`
- [ ] Form fields:
  - Customer selection (Select/Autocomplete)
  - Received date (DatePicker)
  - Sample info
  - Test items (dynamic array)
  - Attachments (file upload)
- [ ] Support mode: create/edit
- [ ] Real-time validation
- [ ] Calculate TAT automatically
- [ ] Preview due date

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.6 Tạo Test Item Table Component
- [ ] Tạo `src/features/test-requests/components/TestItemTable.tsx`
- [ ] Inline editable table
- [ ] Add/Remove rows dynamically
- [ ] Columns: Sample Name, Matrix, Method, Parameters, TAT
- [ ] Validation per row

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.7 Tạo File Upload Component
- [ ] Tạo `src/shared/components/data-display/FileUpload.tsx`
- [ ] Support multiple files
- [ ] Drag & drop
- [ ] Preview images
- [ ] File type validation (PDF, Excel, Word, Images)
- [ ] File size validation (max 10MB)
- [ ] Delete uploaded file

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.8 Tạo Excel Import Component
- [ ] Tạo `src/features/test-requests/components/ExcelImport.tsx`
- [ ] Upload Excel file
- [ ] Download template button
- [ ] Preview data trước khi import
- [ ] Show validation errors
- [ ] Confirm import
- [ ] Display import result (success count, error count)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.9 Tạo Test Request Detail Component
- [ ] Tạo `src/features/test-requests/components/TestRequestDetail.tsx`
- [ ] Display all information
- [ ] Show status badge
- [ ] Show timeline/history
- [ ] Show attachments
- [ ] Action buttons: Edit, Cancel, Print

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.10 Tạo Pages
- [ ] Tạo `src/features/test-requests/pages/TestRequestListPage.tsx`
- [ ] Tạo `src/features/test-requests/pages/CreateTestRequestPage.tsx`
- [ ] Tạo `src/features/test-requests/pages/TestRequestDetailPage.tsx`
- [ ] Integrate với routes
- [ ] Test navigation giữa các pages

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 5.11 Implement Permissions Check
- [ ] Tạo `src/shared/hooks/usePermission.ts`
- [ ] Check user permissions
- [ ] Hide/disable buttons theo permissions
- [ ] Test với different roles

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 6: MODULE QUẢN LÝ MẪU (Tuần 5-6)

### 6.1 Định Nghĩa Types
- [ ] Tạo `src/features/specimens/types/specimen.types.ts`
- [ ] Định nghĩa interfaces cho Specimen, SpecimenStatus, SpecimenHistory

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 6.2 Tạo Specimen API
- [ ] Tạo `src/features/specimens/services/specimenApi.ts`
- [ ] RTK Query endpoints:
  - getSpecimens
  - getSpecimen
  - updateLocation
  - dispose
  - returnToCustomer
  - getHistory

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 6.3 Tạo Specimen List Component
- [ ] Tạo `src/features/specimens/components/SpecimenList.tsx`
- [ ] Table với columns: Code, Sample Name, Status, Location, Actions
- [ ] Filter by status, location
- [ ] Search by code

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 6.4 Tạo Specimen Detail Component
- [ ] Tạo `src/features/specimens/components/SpecimenDetail.tsx`
- [ ] Display full information
- [ ] Show current location
- [ ] Show status badge
- [ ] Action buttons

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 6.5 Tạo Specimen History Component
- [ ] Tạo `src/features/specimens/components/SpecimenHistory.tsx`
- [ ] Timeline UI
- [ ] Show movement history
- [ ] Show status changes
- [ ] Show who handled

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 6.6 Tạo Status Badge Component
- [ ] Tạo `src/shared/components/data-display/StatusBadge.tsx`
- [ ] Color coding theo status
- [ ] Reusable cho Test Request, Specimen, etc.

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 6.7 Tạo Pages
- [ ] Tạo `SpecimenListPage.tsx`
- [ ] Tạo `SpecimenDetailPage.tsx`
- [ ] Integrate routes

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 7: MODULE PHÒNG THÍ NGHIỆM (Tuần 7-8)

### 7.1 Định Nghĩa Types
- [ ] Tạo `src/features/laboratory/types/`
- [ ] Types cho Assignment, TestResult

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 7.2 Tạo Laboratory API
- [ ] Tạo `src/features/laboratory/services/laboratoryApi.ts`
- [ ] Endpoints: assignments, results, approve

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 7.3 Tạo Assignment List Component
- [ ] Tạo `src/features/laboratory/components/AssignmentList.tsx`
- [ ] Danh sách công việc được giao
- [ ] Filter by status, date
- [ ] Accept assignment button

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 7.4 Tạo Result Entry Form
- [ ] Tạo `src/features/laboratory/components/ResultEntry.tsx`
- [ ] Dynamic form theo test parameters
- [ ] Input fields với validation
- [ ] Unit selection
- [ ] Save/Submit buttons

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 7.5 Tạo Result Chart Component
- [ ] Tạo `src/features/laboratory/components/ResultChart.tsx`
- [ ] Sử dụng Recharts
- [ ] Support line, bar, scatter charts
- [ ] Responsive design

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 7.6 Tạo Result Approval Component
- [ ] Tạo `src/features/laboratory/components/ResultApproval.tsx`
- [ ] Review results
- [ ] Approve/Reject buttons
- [ ] Comments field

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 7.7 Tạo Pages
- [ ] Tạo `LabWorkbench.tsx` (màn hình chính)
- [ ] Tạo `MyAssignments.tsx`
- [ ] Tạo `ResultApprovalPage.tsx`

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 8: MODULE BÁO CÁO (Tuần 9-10)

### 8.1 Định Nghĩa Types
- [ ] Tạo types cho Report, ReportApproval

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 8.2 Tạo Report API
- [ ] RTK Query endpoints cho reports
- [ ] Download PDF endpoint

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 8.3 Tạo Report Form Component
- [ ] Form tạo báo cáo từ test request
- [ ] Select template
- [ ] Add standards/regulations

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 8.4 Tạo Report Preview Component
- [ ] Preview báo cáo trước khi tạo
- [ ] Zoom in/out
- [ ] Print button

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 8.5 Tạo Report Approval Flow Component
- [ ] Visual workflow (step 1, step 2, released)
- [ ] Approve buttons theo step
- [ ] Comments section

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 8.6 Tạo QR Code Component
- [ ] Cài đặt `qrcode.react`
- [ ] Tạo `src/features/reports/components/QRCodeGenerator.tsx`
- [ ] Generate QR code cho report
- [ ] Download QR code image

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 8.7 Tạo QR Scanner Component
- [ ] Cài đặt `react-qr-reader` hoặc `html5-qrcode`
- [ ] Tạo `QRCodeScanner.tsx`
- [ ] Scan QR code
- [ ] Verify report

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 8.8 Tạo Pages
- [ ] Tạo `ReportListPage.tsx`
- [ ] Tạo `CreateReportPage.tsx`
- [ ] Tạo `ReportApprovalPage.tsx`
- [ ] Tạo `ReportVerifyPage.tsx`

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 9: MODULE THỐNG KÊ (Tuần 10-11)

### 9.1 Tạo Statistics API
- [ ] RTK Query endpoints cho statistics
- [ ] Dashboard data
- [ ] Charts data

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 9.2 Tạo Dashboard Component
- [ ] Tạo `src/features/statistics/components/Dashboard.tsx`
- [ ] Cards hiển thị tổng quan:
  - Tổng số mẫu
  - Tổng số yêu cầu
  - Mẫu đang xử lý
  - NCR count
- [ ] Responsive grid layout

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 9.3 Tạo Sample Matrix Chart
- [ ] Pie chart phân bố theo nền mẫu
- [ ] Interactive (click to drill down)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 9.4 Tạo TAT Compliance Chart
- [ ] Gauge chart cho TAT compliance rate
- [ ] Color coding (green/yellow/red)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 9.5 Tạo Department Workload Chart
- [ ] Bar chart workload theo department
- [ ] Filter by date range

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 9.6 Tạo Export Excel Component
- [ ] Tạo button export
- [ ] Download file Excel
- [ ] Custom filename với timestamp

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 9.7 Tạo Pages
- [ ] Tạo `DashboardPage.tsx`
- [ ] Tạo `ReportsPage.tsx` (statistics reports)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 10: INTERNATIONALIZATION (i18n) (Tuần 11)

### 10.1 Cấu Hình i18next
- [ ] Tạo `src/i18n/config.ts`
- [ ] Configure i18next
- [ ] Load translation files

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 10.2 Tạo Translation Files
- [ ] Tạo `public/locales/vi/translation.json`
- [ ] Translate tất cả UI text sang tiếng Việt
- [ ] Organize theo modules

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 10.3 Apply Translations
- [ ] Replace hardcoded text bằng `t()` function
- [ ] Test switching language (nếu support đa ngôn ngữ)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 11: OPTIMIZATION & PERFORMANCE (Tuần 12)

### 11.1 Code Splitting
- [ ] Lazy load routes:
  ```typescript
  const TestRequestListPage = lazy(() => import('./pages/TestRequestListPage'));
  ```
- [ ] Wrap với Suspense
- [ ] Test lazy loading

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 11.2 Memoization
- [ ] Apply useMemo cho expensive calculations
- [ ] Apply useCallback cho event handlers
- [ ] Apply React.memo cho components

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 11.3 Optimize Re-renders
- [ ] Sử dụng Redux selectors với memoization
- [ ] Avoid unnecessary prop passing
- [ ] Use React DevTools Profiler để identify bottlenecks

**Commit Hash**: _________________
**Ghi chó**: _____________________

---

### 11.4 Bundle Size Optimization
- [ ] Analyze bundle với `vite-plugin-visualizer`
- [ ] Remove unused dependencies
- [ ] Tree-shaking check
- [ ] Target bundle size < 500KB (gzipped)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 12: TESTING (Tuần 13)

### 12.1 Setup Testing Environment
- [ ] Cài đặt Vitest và React Testing Library
- [ ] Cấu hình `vitest.config.ts`
- [ ] Setup test utilities

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 12.2 Unit Tests
- [ ] Test utility functions
- [ ] Test custom hooks
- [ ] Test reducers
- [ ] Achieve >60% coverage

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 12.3 Component Tests
- [ ] Test common components (Button, Input, Table)
- [ ] Test forms with validation
- [ ] Test user interactions

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 12.4 Integration Tests
- [ ] Test complete user flows
- [ ] Mock API calls với MSW
- [ ] Test authentication flow

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 13: BUILD & DEPLOYMENT (Tuần 14)

### 13.1 Production Build
- [ ] Chạy `pnpm build`
- [ ] Kiểm tra build output
- [ ] Test production build locally: `pnpm preview`
- [ ] Fix build errors/warnings

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 13.2 Docker Configuration
- [ ] Tạo `Dockerfile` (multi-stage build)
- [ ] Tạo `.dockerignore`
- [ ] Build Docker image
- [ ] Test chạy container

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 13.3 Nginx Configuration
- [ ] Tạo `nginx.conf`
- [ ] Cấu hình reverse proxy
- [ ] Cấu hình routing cho SPA
- [ ] Cấu hình gzip compression

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 13.4 CI/CD Pipeline
- [ ] Tạo GitHub Actions workflow
- [ ] Build step
- [ ] Test step
- [ ] Deploy step
- [ ] Test automated deployment

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 13.5 Production Deployment
- [ ] Deploy lên production server
- [ ] Configure domain và SSL
- [ ] Test trên production
- [ ] Monitor errors

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

## PHASE 14: DOCUMENTATION & HANDOVER (Tuần 15)

### 14.1 Code Documentation
- [ ] Viết JSDoc comments cho functions/components quan trọng
- [ ] README cho mỗi feature module
- [ ] Storybook (optional)

**Commit Hash**: _________________
**Ghi chú**: _____________________

---

### 14.2 User Guide (Tiếng Việt)
- [ ] Hướng dẫn đăng nhập
- [ ] Hướng dẫn tạo phiếu yêu cầu
- [ ] Hướng dẫn quản lý mẫu
- [ ] Hướng dẫn nhập kết quả
- [ ] Hướng dẫn tạo báo cáo
- [ ] Hướng dẫn xem thống kê

**Ghi chú**: _____________________

---

### 14.3 Developer Guide
- [ ] Setup instructions
- [ ] Project structure
- [ ] Coding conventions
- [ ] How to add new feature

**Ghi chú**: _____________________

---

## VẤN ĐỀ PHÁT SINH & GIẢI PHÁP

| Ngày | Vấn đề | Giải pháp | Commit Hash | Người xử lý |
|------|--------|-----------|-------------|-------------|
|      |        |           |             |             |
|      |        |           |             |             |

---

## ROLLBACK LOG

| Ngày | Lý do rollback | Branch/Commit rollback về | Người thực hiện |
|------|----------------|---------------------------|-----------------|
|      |                |                           |                 |
|      |                |                           |                 |

---

## GHI CHÚ QUAN TRỌNG

### Quy tắc khi làm việc:
1. **LUÔN** commit sau mỗi feature hoàn thành
2. **LUÔN** test kỹ trước khi commit
3. **KHÔNG** commit code có lỗi ESLint
4. **SỬ DỤNG** feature branches
5. **GHI NHẬN** mọi vấn đề phát sinh

### Liên hệ khi có vấn đề:
- Frontend Lead: ___________________
- Project Manager: __________________
- UX/UI Designer: ___________________

---

**Document Version**: 1.0
**Tạo ngày**: 2025-12-10
**Cập nhật lần cuối**: 2025-12-10
