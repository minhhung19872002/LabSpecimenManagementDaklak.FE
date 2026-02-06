import { ROLES } from './roles';
import { PATH_ROUTES } from './routes';
import { ROUTE_PERMISSION_MAP, ROUTE_DETAIL_PERMISSION_MAP, PERMISSIONS, isDetailRoute } from './permissionMapping';
import { authService } from '../services/authService';

/**
 * Route permissions configuration
 *
 * UPDATED: Hệ thống hiện sử dụng permission-based checking
 * - hasRoutePermission() kiểm tra cả role-based (backward compatibility) và permission-based
 * - ROUTE_PERMISSIONS: Role-based config (legacy)
 * - ROUTE_PERMISSION_MAP: Permission-based config (new)
 *
 * Permission Matrix:
 * - Admin: Tất cả các chức năng
 * - Thử nghiệm viên (KTV): Quản lý thử nghiệm, Quản lý mẫu
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
  [PATH_ROUTES.qualityManagement.index]: [
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

  // Quản lý phân quyền
  [PATH_ROUTES.roleManagement.index]: [ROLES.ADMIN],

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
  [ROLES.ACCOUNTANT]: PATH_ROUTES.receipts.index,
};

// Routes that supporters can access (in addition to their role-based permissions)
export const SUPPORTER_ALLOWED_ROUTES = [
  PATH_ROUTES.tasks.index,
  PATH_ROUTES.testing.index,
];

// Check if user has permission to access a route
// Updated: Sử dụng permission-based checking với backward compatibility cho role-based
export const hasRoutePermission = (pathname: string, userRoles: string[], isSupporter?: boolean): boolean => {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Admin has access to everything
  if (userRoles.includes(ROLES.ADMIN)) {
    return true;
  }

  // === NEW: Check for detail routes first ===
  // Detail routes (e.g., /tasks/123) may require different permissions than list routes
  const { isDetail, baseRoute } = isDetailRoute(pathname);
  if (isDetail && baseRoute && ROUTE_DETAIL_PERMISSION_MAP[baseRoute]) {
    const detailPermissions = ROUTE_DETAIL_PERMISSION_MAP[baseRoute];
    if (authService.hasAnyPermission(detailPermissions)) {
      return true;
    }
    // Check if supporter has access to this detail route
    if (isSupporter && SUPPORTER_ALLOWED_ROUTES.includes(baseRoute)) {
      return true;
    }
    // If user doesn't have detail permission and not a supporter, deny access
    // They explicitly don't have access to detail page
    return false;
  }

  // === Permission-based checking ===
  // Check nếu user có permission tương ứng với route
  const checkPermissionBased = (): boolean => {
    // Get required permissions for this route
    let requiredPermissions = ROUTE_PERMISSION_MAP[pathname];

    // Check prefix match for nested routes (e.g., /test-requests/create)
    if (!requiredPermissions) {
      for (const route of Object.keys(ROUTE_PERMISSION_MAP)) {
        if (pathname.startsWith(route + '/') || pathname.startsWith(route + '?')) {
          requiredPermissions = ROUTE_PERMISSION_MAP[route];
          break;
        }
      }
    }

    // If route has required permissions, check if user has any of them
    if (requiredPermissions && requiredPermissions.length > 0) {
      return authService.hasAnyPermission(requiredPermissions);
    }

    return false;
  };

  // Try permission-based check first
  if (checkPermissionBased()) {
    return true;
  }

  // === LEGACY: Role-based checking (backward compatibility) ===
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

// Re-export PERMISSIONS and ROUTE_PERMISSION_MAP for convenience
export { PERMISSIONS, ROUTE_PERMISSION_MAP, ROUTE_DETAIL_PERMISSION_MAP, isDetailRoute };

// Priority order of routes to try when finding default route
// These are list routes (not detail routes) that are commonly accessible
const DEFAULT_ROUTE_PRIORITY = [
  PATH_ROUTES.dashboard,
  PATH_ROUTES.testRequests.index,
  PATH_ROUTES.tasks.index,
  PATH_ROUTES.testing.index,
  PATH_ROUTES.qualityManagement.index,
  PATH_ROUTES.specimens.index,
  PATH_ROUTES.receipts.index,
  PATH_ROUTES.quotations.index,
  PATH_ROUTES.reports,
  PATH_ROUTES.ncr,
  PATH_ROUTES.specimenHistories.index,
  PATH_ROUTES.statistics,
  PATH_ROUTES.subcontractors,
  PATH_ROUTES.masterData,
  PATH_ROUTES.organizations,
  PATH_ROUTES.employees,
  PATH_ROUTES.roleManagement.index,
  PATH_ROUTES.auditLog,
  PATH_ROUTES.settings,
];

// Get default route for user based on their permissions
// Updated: Check actual permissions instead of just roles
export const getDefaultRouteForUser = (userRoles: string[]): string | null => {
  if (!userRoles || userRoles.length === 0) {
    return null;
  }

  // Admin has access to dashboard
  if (userRoles.includes(ROLES.ADMIN)) {
    return PATH_ROUTES.dashboard;
  }

  // First try the role-based default route and verify permission
  for (const role of userRoles) {
    const defaultRoute = DEFAULT_ROUTE_BY_ROLE[role];
    if (defaultRoute) {
      // Check if user actually has permission to this route
      const requiredPermissions = ROUTE_PERMISSION_MAP[defaultRoute];
      if (requiredPermissions && authService.hasAnyPermission(requiredPermissions)) {
        return defaultRoute;
      }
      // Also check role-based permission
      const allowedRoles = ROUTE_PERMISSIONS[defaultRoute];
      if (allowedRoles && userRoles.some(r => allowedRoles.includes(r))) {
        return defaultRoute;
      }
    }
  }

  // If role-based default doesn't work, find the first accessible route
  for (const route of DEFAULT_ROUTE_PRIORITY) {
    // Check permission-based access
    const requiredPermissions = ROUTE_PERMISSION_MAP[route];
    if (requiredPermissions && authService.hasAnyPermission(requiredPermissions)) {
      return route;
    }
    // Check role-based access
    const allowedRoles = ROUTE_PERMISSIONS[route];
    if (allowedRoles && userRoles.some(r => allowedRoles.includes(r))) {
      return route;
    }
  }

  // No accessible route found
  return null;
};
