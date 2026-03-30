import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const APP_NAME = 'LMS';

/**
 * Route-to-title mapping.
 * Matches from most specific to least specific (longest prefix wins).
 */
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Tổng quan',
  '/quotations/create': 'Tạo báo giá',
  '/quotations/edit': 'Sửa báo giá',
  '/quotations/view': 'Xem báo giá',
  '/quotations': 'Báo giá',
  '/test-requests/create': 'Tạo phiếu yêu cầu',
  '/test-requests/edit': 'Sửa phiếu yêu cầu',
  '/test-requests': 'Phiếu yêu cầu thử nghiệm',
  '/specimens/create': 'Tạo mẫu',
  '/specimens/edit': 'Sửa mẫu',
  '/specimens': 'Quản lý mẫu',
  '/tests/create': 'Tạo thử nghiệm',
  '/tests/edit': 'Sửa thử nghiệm',
  '/tests': 'Thử nghiệm',
  '/test-results/create': 'Tạo kết quả',
  '/test-results/edit': 'Sửa kết quả',
  '/test-results': 'Kết quả thử nghiệm',
  '/specimen-histories/create': 'Tạo lịch sử mẫu',
  '/specimen-histories/edit': 'Sửa lịch sử mẫu',
  '/specimen-histories': 'Lịch sử mẫu',
  '/tasks': 'Quản lý công việc',
  '/testing': 'Quản lý thử nghiệm',
  '/quality-management': 'Quản lý chất lượng',
  '/reports': 'Báo cáo',
  '/statistics': 'Thống kê',
  '/ncr': 'Báo cáo NCR',
  '/receipts': 'Phiếu thu',
  '/subcontractors': 'Nhà thầu phụ',
  '/master-data': 'Ngân hàng dữ liệu',
  '/organizations': 'Cơ sở / Doanh nghiệp',
  '/audit-log': 'Lịch sử thay đổi',
  '/employees': 'Nhân viên',
  '/role-management': 'Phân quyền',
  '/settings': 'Cài đặt',
  '/login': 'Đăng nhập',
};

// Pre-sort keys by length descending for efficient matching
const SORTED_ROUTE_KEYS = Object.keys(ROUTE_TITLES).sort((a, b) => b.length - a.length);

/**
 * Find the best matching title for a given pathname.
 * Matches the longest prefix first (e.g., /test-requests/create beats /test-requests).
 */
export function getTitleForPath(pathname: string): string {
  for (const route of SORTED_ROUTE_KEYS) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return ROUTE_TITLES[route];
    }
  }
  return '';
}

/**
 * Returns the full page title string for the current route.
 * Use with <Helmet><title>{pageTitle}</title></Helmet>
 */
export const usePageTitle = (): string => {
  const { pathname } = useLocation();

  return useMemo(() => {
    const title = getTitleForPath(pathname);
    return title ? `${title} - ${APP_NAME}` : APP_NAME;
  }, [pathname]);
};

export default usePageTitle;
