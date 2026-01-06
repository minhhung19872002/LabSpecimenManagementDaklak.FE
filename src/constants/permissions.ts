import { ROLES } from './roles';
import { PATH_ROUTES } from './routes';

/**
 * Route permissions configuration
 *
 * Permission Matrix:
 * - Admin: Tất cả các chức năng
 * - Kỹ thuật viên (KTV): Quản lý thử nghiệm, Quản lý mẫu
 * - Quản lý chất lượng (QLCL): Dashboard, Quản lý phiếu yêu cầu, Quản lý công việc,
 *                              Quản lý thử nghiệm, Quản lý mẫu, Quản lý chất lượng
 * - Bộ phận giao nhận mẫu: Quản lý phiếu yêu cầu
 * - Quản lý kỹ thuật (QLKT): Dashboard, Quản lý công việc, Quản lý thử nghiệm, Quản lý mẫu
 *
 * Các trang còn lại: Chỉ Admin
 */

// Routes that specific roles can access (besides Admin who has access to all)
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // ============================================
  // Dashboard - Admin, QLCL, QLKT
  // ============================================
  [PATH_ROUTES.dashboard]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
  ],

  // ============================================
  // Quản lý phiếu yêu cầu - Admin, QLCL, BP Giao nhận
  // ============================================
  [PATH_ROUTES.testRequests.index]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.SAMPLE_RECEIVER,
  ],

  // ============================================
  // Quản lý công việc - QLKT (A), Admin (V)
  // Theo Permission Matrix: QLKT có full quyền, Admin chỉ View
  // QLCL, KTV, BP Giao nhận KHÔNG có quyền truy cập
  // ============================================
  [PATH_ROUTES.tasks.index]: [
    ROLES.ADMIN,
    ROLES.LAB_TECHNICAL_MANAGER,
  ],

  // ============================================
  // Quản lý thử nghiệm - KTV (A), QLKT (V), Admin (V)
  // Theo Permission Matrix: KTV có full quyền, QLKT và Admin chỉ View
  // QLCL KHÔNG có quyền truy cập
  // ============================================
  [PATH_ROUTES.testing.index]: [
    ROLES.ADMIN,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.LAB_TECHNICIAN,
  ],

  // ============================================
  // Quản lý chất lượng - Admin, QLCL
  // ============================================
  [PATH_ROUTES.qualityManagement]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
  ],

  // ============================================
  // Quản lý mẫu - Admin, QLCL, QLKT, KTV
  // ============================================
  [PATH_ROUTES.specimens.index]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.LAB_TECHNICIAN,
  ],

  // ============================================
  // Lịch sử lưu mẫu - Admin, QLCL
  // ============================================
  [PATH_ROUTES.specimenHistories.index]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
  ],

  // ============================================
  // Các trang còn lại - Chỉ Admin
  // ============================================

  // Thống kê
  [PATH_ROUTES.statistics]: [ROLES.ADMIN],

  // Báo cáo
  [PATH_ROUTES.reports]: [ROLES.ADMIN],

  // NCR - Admin, QLCL
  [PATH_ROUTES.ncr]: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],

  // Nhà thầu phụ
  [PATH_ROUTES.subcontractors]: [ROLES.ADMIN],

  // Dữ liệu chủ (Master Data)
  [PATH_ROUTES.masterData]: [ROLES.ADMIN],

  // Tổ chức/Doanh nghiệp
  [PATH_ROUTES.organizations]: [ROLES.ADMIN],

  // Audit Log
  [PATH_ROUTES.auditLog]: [ROLES.ADMIN],

  // Nhân viên
  [PATH_ROUTES.employees]: [ROLES.ADMIN],

  // ============================================
  // Quản lý phiếu thu - Kế toán (A), Admin (A)
  // Theo Permission Matrix: Kế toán và Admin có full quyền
  // ============================================
  [PATH_ROUTES.receipts.index]: [
    ROLES.ADMIN,
    ROLES.ACCOUNTANT,
  ],

  // ============================================
  // Báo giá - Tất cả roles đều có quyền
  // ============================================
  [PATH_ROUTES.quotations.index]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.SAMPLE_RECEIVER,
    ROLES.LAB_TECHNICIAN,
    ROLES.ACCOUNTANT,
  ],

  // ============================================
  // Cài đặt - Tất cả roles (mỗi role sẽ thấy tab phù hợp)
  // ============================================
  [PATH_ROUTES.settings]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.SAMPLE_RECEIVER,
    ROLES.LAB_TECHNICIAN,
    ROLES.ACCOUNTANT,
  ],
};

// Default route for each role (where to redirect after login or from 403)
export const DEFAULT_ROUTE_BY_ROLE: Record<string, string> = {
  [ROLES.ADMIN]: PATH_ROUTES.dashboard,
  [ROLES.QUALITY_MANAGER]: PATH_ROUTES.dashboard,
  [ROLES.LAB_TECHNICAL_MANAGER]: PATH_ROUTES.dashboard,
  [ROLES.SAMPLE_RECEIVER]: PATH_ROUTES.testRequests.index,
  [ROLES.LAB_TECHNICIAN]: PATH_ROUTES.testing.index,
};

// Routes that supporters can access (in addition to their role-based permissions)
export const SUPPORTER_ALLOWED_ROUTES = [
  PATH_ROUTES.tasks.index,
  PATH_ROUTES.testing.index,
];

// Check if user has permission to access a route
export const hasRoutePermission = (pathname: string, userRoles: string[], isSupporter?: boolean): boolean => {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Admin has access to everything
  if (userRoles.includes(ROLES.ADMIN)) {
    return true;
  }

  // Check exact match first
  const allowedRoles = ROUTE_PERMISSIONS[pathname];
  if (allowedRoles) {
    if (userRoles.some(role => allowedRoles.includes(role))) {
      return true;
    }
  }

  // Check prefix match for nested routes (e.g., /test-requests/123)
  for (const route of Object.keys(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route + '/') || pathname.startsWith(route + '?')) {
      if (userRoles.some(role => ROUTE_PERMISSIONS[route].includes(role))) {
        return true;
      }
    }
  }

  // Check supporter access for supporter-allowed routes
  if (isSupporter) {
    // Check exact match
    if (SUPPORTER_ALLOWED_ROUTES.includes(pathname)) {
      return true;
    }
    // Check prefix match for nested routes (e.g., /tasks/123)
    for (const route of SUPPORTER_ALLOWED_ROUTES) {
      if (pathname.startsWith(route + '/') || pathname.startsWith(route + '?')) {
        return true;
      }
    }
  }

  // If route is not in permissions config, only Admin can access
  return false;
};

// Get default route for user based on their roles
export const getDefaultRouteForUser = (userRoles: string[]): string | null => {
  if (!userRoles || userRoles.length === 0) {
    return null;
  }

  // Check each role in order of priority
  for (const role of userRoles) {
    if (DEFAULT_ROUTE_BY_ROLE[role]) {
      return DEFAULT_ROUTE_BY_ROLE[role];
    }
  }

  return null;
};
