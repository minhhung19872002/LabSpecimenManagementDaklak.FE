# Hệ Thống Quản Lý Mẫu Phòng Thí Nghiệm - FRONTEND

> Frontend Application cho hệ thống quản lý mẫu phòng thí nghiệm theo tiêu chuẩn ISO/IEC 17025:2017

[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant_Design-5.0+-0170FE?logo=antdesign)](https://ant.design/)

## 📋 Mục Lục

- [Giới Thiệu](#giới-thiệu)
- [Tính Năng](#tính-năng)
- [Technology Stack](#technology-stack)
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [State Management](#state-management)
- [Routing](#routing)
- [Styling](#styling)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)
- [Tài Liệu Tham Khảo](#tài-liệu-tham-khảo)

---

## 🎯 Giới Thiệu

Ứng dụng Frontend được xây dựng với React + TypeScript, cung cấp giao diện người dùng hiện đại, responsive và dễ sử dụng cho hệ thống quản lý mẫu phòng thí nghiệm.

### Đặc Điểm Nổi Bật

- ⚡ **Hiệu suất cao** với Vite build tool
- 🎨 **UI/UX đẹp mắt** với Ant Design
- 📱 **Responsive** - hoạt động tốt trên desktop, tablet, mobile
- 🔒 **Bảo mật** - JWT authentication, role-based access control
- 🌐 **Đa ngôn ngữ** - Tiếng Việt (có thể mở rộng)
- ♿ **Accessibility** - tuân thủ WCAG AA
- 🧪 **Type-safe** - TypeScript cho code quality

---

## ✨ Tính Năng

### 🔐 Authentication
- Đăng nhập/đăng xuất
- Remember me
- Reset mật khẩu
- Session management
- Auto refresh token

### 📊 Dashboard
- Tổng quan hệ thống theo vai trò
- Biểu đồ thống kê real-time
- Quick actions
- Notifications

### 📝 Quản Lý Phiếu Yêu Cầu
- Tạo/sửa/xóa phiếu yêu cầu
- Import từ Excel
- Export ra Excel
- Đính kèm files (PDF, Excel, hình ảnh)
- Filter và search nâng cao
- Timeline tracking

### 🧪 Quản Lý Mẫu
- Danh sách mẫu với filter đa tiêu chí
- Chi tiết mẫu
- Lịch sử di chuyển (Timeline)
- Cập nhật vị trí
- Quản lý tình trạng

### 🔬 Phòng Thí Nghiệm
- Danh sách công việc được giao
- Nhận/từ chối công việc
- Nhập kết quả thử nghiệm
- Biểu đồ kết quả
- Duyệt kết quả (QA/QC)

### 📑 Báo Cáo
- Tạo báo cáo từ kết quả
- Preview báo cáo
- Workflow phê duyệt 2 bước
- Download PDF
- Sinh QR code
- Quét QR code để verify
- Gửi email tự động

### ⚠️ NCR (Non-Conformance Reports)
- Tạo và quản lý NCR
- Workflow tracking
- Phân quyền xử lý

### 📈 Thống Kê & Reports
- Dashboard tổng quan
- Biểu đồ phân bố theo nền mẫu
- TAT compliance chart
- Workload theo bộ phận
- Export Excel

### ⚙️ Cài Đặt
- Cài đặt user preferences
- Cấu hình hệ thống
- Backup configuration

---

## 🛠️ Technology Stack

### Core
- **React 18+** - UI Library
- **TypeScript 5.0+** - Type safety
- **Vite 5.0+** - Build tool & dev server

### State Management
- **Redux Toolkit** - Global state
- **RTK Query** - API caching & data fetching
- **React Context** - Local state

### Routing
- **React Router v6** - Client-side routing

### UI Framework
- **Ant Design 5.0+** - Component library
- **Ant Design Icons** - Icon set

### Form Management
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Data Fetching
- **Axios** - HTTP client
- **RTK Query** - Caching layer

### Charts & Visualization
- **Recharts** - Chart library
- **QRCode.react** - QR code generation

### Internationalization
- **react-i18next** - i18n framework
- **i18next** - Translation engine

### Utilities
- **date-fns** - Date manipulation
- **lodash** - Utility functions
- **clsx** - Conditional classnames

### Development
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing (optional)

---

## 💻 Yêu Cầu Hệ Thống

### Development
- **Node.js**: >= 18.x LTS (khuyến nghị 20.x)
- **pnpm**: >= 8.x (hoặc npm >= 10.x, yarn >= 4.x)
- **Git**: >= 2.30
- **VS Code** (khuyến nghị) hoặc WebStorm

### VS Code Extensions (Khuyến nghị)
- ESLint
- Prettier
- TypeScript
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense (nếu dùng Tailwind)

### Production
- **Web Server**: Nginx, Apache, hoặc CDN
- **Node.js**: >= 18.x (để build)

---

## 🚀 Cài Đặt

### 1. Clone Repository

```bash
git clone https://github.com/your-org/lab-specimen-management-fe.git
cd lab-specimen-management-fe
```

### 2. Cài Đặt Dependencies

**Với pnpm (khuyến nghị):**
```bash
pnpm install
```

**Với npm:**
```bash
npm install
```

**Với yarn:**
```bash
yarn install
```

### 3. Cấu Hình Environment Variables

Tạo file `.env.development`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Quản Lý Mẫu Phòng Thí Nghiệm
VITE_APP_VERSION=1.0.0
```

---

## ⚙️ Cấu Hình

### Environment Files

```
.env                    # Default
.env.development        # Development
.env.production         # Production
.env.local              # Local override (không commit)
```

### Cấu Hình Vite

`vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### Cấu Hình TypeScript

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 🏃 Chạy Ứng Dụng

### Development Mode

```bash
pnpm dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### Build Production

```bash
pnpm build
```

Build output: `dist/`

### Preview Production Build

```bash
pnpm preview
```

### Linting

```bash
pnpm lint        # Check linting
pnpm lint:fix    # Fix linting issues
```

### Format Code

```bash
pnpm format
```

---

## 📁 Cấu Trúc Dự Án

```
lab-specimen-management-fe/
├── public/
│   ├── locales/              # Translation files
│   │   └── vi/
│   │       └── translation.json
│   └── assets/               # Static assets
│       ├── images/
│       └── icons/
│
├── src/
│   ├── app/                  # Redux store setup
│   │   ├── store.ts
│   │   └── rootReducer.ts
│   │
│   ├── features/             # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/     # RTK Query APIs
│   │   │   ├── slices/       # Redux slices
│   │   │   └── types/
│   │   ├── test-requests/
│   │   ├── specimens/
│   │   ├── laboratory/
│   │   ├── reports/
│   │   └── statistics/
│   │
│   ├── shared/               # Shared resources
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   └── data-display/
│   │   ├── hooks/
│   │   ├── utils/
│   │   │   ├── api/
│   │   │   ├── formatters/
│   │   │   ├── validators/
│   │   │   └── constants/
│   │   └── types/
│   │
│   ├── routes/               # Routing config
│   │   ├── index.tsx
│   │   ├── PrivateRoute.tsx
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

---

## 🗂️ State Management

### Redux Store Structure

```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean
  },
  ui: {
    sidebarCollapsed: boolean,
    theme: 'light' | 'dark'
  },
  // RTK Query cache
  testRequestApi: { ... },
  specimenApi: { ... },
  // ...
}
```

### RTK Query Example

```typescript
// services/testRequestApi.ts
export const testRequestApi = createApi({
  reducerPath: 'testRequestApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getTestRequests: builder.query<TestRequestListResponse, Filters>({
      query: (filters) => ({ url: '/test-requests', params: filters }),
    }),
    createTestRequest: builder.mutation<TestRequest, CreateInput>({
      query: (data) => ({
        url: '/test-requests',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGetTestRequestsQuery, useCreateTestRequestMutation } = testRequestApi;
```

---

## 🛣️ Routing

### Route Configuration

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
  },
  // ...
};
```

### Protected Routes

```typescript
<Route element={<PrivateRoute requiredPermissions={['TestRequests.View']} />}>
  <Route path={ROUTES.TEST_REQUESTS.LIST} element={<TestRequestListPage />} />
</Route>
```

---

## 🎨 Styling

### Ant Design Theming

```typescript
// App.tsx
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
  },
};

<ConfigProvider locale={viVN} theme={theme}>
  <App />
</ConfigProvider>
```

### Custom CSS

Dùng CSS Modules hoặc Styled Components (tùy preference).

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
pnpm test              # Run tests
pnpm test:ui           # Run with UI
pnpm test:coverage     # Generate coverage
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';

test('renders login form', () => {
  render(<LoginForm />);
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
});
```

### E2E Tests (Playwright - Optional)

```bash
pnpm test:e2e
```

---

## 🚢 Build & Deployment

### Production Build

```bash
pnpm build
```

Output: `dist/` folder

### Build Analysis

```bash
pnpm build --mode production
```

Dùng `vite-plugin-visualizer` để analyze bundle size.

### Docker Deployment

**Dockerfile:**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build & Run:**

```bash
docker build -t lab-management-fe:1.0.0 .
docker run -d -p 80:80 lab-management-fe:1.0.0
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend-api:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### CI/CD (GitHub Actions Example)

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
```

---

## 📖 Tài Liệu Tham Khảo

### Tài Liệu Dự Án
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Kiến trúc chi tiết
- [DEVELOPMENT-TRACKING.md](./DEVELOPMENT-TRACKING.md) - Tracking tiến độ

### External Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Ant Design Components](https://ant.design/components/overview/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Router](https://reactrouter.com/)

---

## 🎨 UI/UX Guidelines

### Design Principles
- **Simplicity**: Giao diện đơn giản, dễ sử dụng
- **Consistency**: Nhất quán về màu sắc, font, spacing
- **Feedback**: Luôn có feedback cho user actions
- **Accessibility**: Tuân thủ WCAG AA

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Color Palette
- **Primary**: #1890ff (Blue)
- **Success**: #52c41a (Green)
- **Warning**: #faad14 (Orange)
- **Error**: #f5222d (Red)
- **Info**: #1890ff (Blue)

---

## 🐛 Debugging

### React DevTools
Cài extension React DevTools cho Chrome/Firefox.

### Redux DevTools
Cài extension Redux DevTools để debug state.

### Network Debugging
Dùng Browser DevTools > Network tab để debug API calls.

---

## 🔧 Troubleshooting

### Common Issues

**1. Port 3000 đã được sử dụng**
```bash
# Thay đổi port trong vite.config.ts
server: {
  port: 3001
}
```

**2. Build fails với TypeScript errors**
```bash
# Clean và rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

**3. API calls fail với CORS error**
- Kiểm tra backend CORS configuration
- Kiểm tra proxy trong `vite.config.ts`

---

## 👥 Team

- **Project Manager**: ___________________
- **Frontend Lead**: ___________________
- **Frontend Developers**: ___________________
- **UI/UX Designer**: ___________________
- **QA/Testers**: ___________________

---

## 📝 License

Proprietary - Bản quyền thuộc về [Tên Công Ty]

---

## 🤝 Contributing

### Code Style
- Tuân thủ ESLint rules
- Format với Prettier trước khi commit
- Viết meaningful commit messages (Conventional Commits)
- Viết tests cho features mới

### Git Workflow
1. Create feature branch từ `develop`
2. Implement feature
3. Run tests và linting
4. Commit và push
5. Create Pull Request
6. Code review
7. Merge sau khi approve

---

## 📞 Support

- **Technical Support**: support@company.com
- **Bug Reports**: [GitHub Issues](https://github.com/your-org/lab-specimen-management-fe/issues)

---

## 📋 Changelog

Xem [CHANGELOG.md](./CHANGELOG.md) cho version history.

---

**Phiên bản**: 1.0.0
**Cập nhật lần cuối**: 2025-12-10
# Force rebuild Tue Feb  3 13:43:41 +07 2026
