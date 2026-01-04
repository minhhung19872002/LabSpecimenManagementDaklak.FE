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
  // Quản lý công việc - Admin, QLCL, QLKT, KTV, BPGN (supporter có thể được thêm từ bất kỳ role nào)
  // ============================================
  [PATH_ROUTES.tasks.index]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.LAB_TECHNICIAN,
    ROLES.SAMPLE_RECEIVER,
  ],

  // ============================================
  // Quản lý thử nghiệm/thử nghiệm - Admin, QLCL, QLKT, KTV
  // ============================================
  [PATH_ROUTES.testing.index]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
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
  // Các trang còn lại - Chỉ Admin
  // ============================================

  // Thống kê
  [PATH_ROUTES.statistics]: [ROLES.ADMIN],

  // Báo cáo
  [PATH_ROUTES.reports]: [ROLES.ADMIN],

  // NCR
  [PATH_ROUTES.ncr]: [ROLES.ADMIN],

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
  // Cài đặt - Tất cả roles (mỗi role sẽ thấy tab phù hợp)
  // ============================================
  [PATH_ROUTES.settings]: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.SAMPLE_RECEIVER,
    ROLES.LAB_TECHNICIAN,
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

// Check if user has permission to access a route
export const hasRoutePermission = (pathname: string, userRoles: string[]): boolean => {
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
    return userRoles.some(role => allowedRoles.includes(role));
  }

  // Check prefix match for nested routes (e.g., /test-requests/123)
  for (const route of Object.keys(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route + '/') || pathname.startsWith(route + '?')) {
      return userRoles.some(role => ROUTE_PERMISSIONS[route].includes(role));
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
