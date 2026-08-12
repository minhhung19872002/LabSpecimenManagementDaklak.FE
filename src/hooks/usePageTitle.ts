import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { matchPath, useLocation } from "react-router-dom";

export const APP_NAME = "LMS";

type PageTitleRoute = {
  path: string;
  title: string;
  end?: boolean;
};

type PageTitleOverrideContextValue = {
  pageTitleOverride: string;
  setPageTitleOverride: (title: string) => void;
  clearPageTitleOverride: () => void;
};

const ROUTE_TITLES: PageTitleRoute[] = [
  { path: "/dashboard", title: "Tổng quan", end: false },
  { path: "/quotations/create", title: "Tạo báo giá" },
  { path: "/quotations/duplicate/:id", title: "Nhân bản báo giá" },
  { path: "/quotations/edit/:id", title: "Sửa báo giá" },
  { path: "/quotations/view/:id", title: "Xem báo giá" },
  { path: "/quotations", title: "Báo giá", end: false },
  { path: "/test-requests/create", title: "Tạo mới phiếu thử nghiệm" },
  { path: "/test-requests/edit/:id", title: "Sửa phiếu yêu cầu" },
  { path: "/test-requests/:id", title: "Phiếu yêu cầu thử nghiệm" },
  { path: "/test-requests", title: "Phiếu yêu cầu thử nghiệm", end: false },
  { path: "/specimens/create", title: "Tạo mẫu" },
  { path: "/specimens/edit/:id", title: "Sửa mẫu" },
  { path: "/specimens/:id", title: "Quản lý mẫu" },
  { path: "/specimens", title: "Quản lý mẫu", end: false },
  { path: "/tests/create", title: "Tạo thử nghiệm" },
  { path: "/tests/edit/:id", title: "Sửa thử nghiệm" },
  { path: "/tests/:id", title: "Thử nghiệm" },
  { path: "/tests", title: "Thử nghiệm", end: false },
  { path: "/test-results/create", title: "Tạo kết quả" },
  { path: "/test-results/edit/:id", title: "Sửa kết quả" },
  { path: "/test-results/:id", title: "Kết quả thử nghiệm" },
  { path: "/test-results", title: "Kết quả thử nghiệm", end: false },
  { path: "/specimen-histories/create", title: "Tạo lịch sử mẫu" },
  { path: "/specimen-histories/edit/:id", title: "Sửa lịch sử mẫu" },
  { path: "/specimen-histories/:id", title: "Lịch sử mẫu" },
  { path: "/specimen-histories", title: "Lịch sử mẫu", end: false },
  { path: "/tasks/:id", title: "Quản lý công việc" },
  { path: "/tasks", title: "Quản lý công việc", end: false },
  { path: "/testing/:id", title: "Quản lý thử nghiệm" },
  { path: "/testing", title: "Quản lý thử nghiệm", end: false },
  { path: "/quality-management/:id", title: "Quản lý chất lượng" },
  { path: "/quality-management", title: "Quản lý chất lượng", end: false },
  { path: "/reports", title: "Báo cáo", end: false },
  { path: "/statistics", title: "Thống kê", end: false },
  { path: "/ncr", title: "Báo cáo NCR", end: false },
  { path: "/goods-receipts/create", title: "Tạo yêu cầu mua sắm" },
  { path: "/goods-receipts/edit/:id", title: "Sửa yêu cầu mua sắm" },
  { path: "/goods-receipts/:id", title: "Chi tiết phiếu dự trù và đặt hàng" },
  { path: "/goods-receipts", title: "Phiếu nhập hàng", end: false },
  { path: "/receipts/:id", title: "Phiếu thu" },
  { path: "/receipts", title: "Phiếu thu", end: false },
  { path: "/subcontractors", title: "Nhà thầu phụ", end: false },
  { path: "/master-data", title: "Ngân hàng dữ liệu", end: false },
  { path: "/organizations/:id", title: "Cơ sở / Doanh nghiệp" },
  { path: "/organizations", title: "Cơ sở / Doanh nghiệp", end: false },
  { path: "/audit-log", title: "Lịch sử thay đổi", end: false },
  { path: "/employees/:id", title: "Nhân viên" },
  { path: "/employees", title: "Nhân viên", end: false },
  { path: "/role-management/:id", title: "Phân quyền" },
  { path: "/role-management", title: "Phân quyền", end: false },
  { path: "/approval-process", title: "Quy trình phê duyệt", end: false },
  { path: "/settings", title: "Cài đặt", end: false },
  { path: "/login", title: "Đăng nhập" },
];

const PageTitleOverrideContext =
  createContext<PageTitleOverrideContextValue | null>(null);

export const PageTitleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pageTitleOverride, setPageTitleOverrideState] = useState("");

  const value = useMemo<PageTitleOverrideContextValue>(
    () => ({
      pageTitleOverride,
      setPageTitleOverride: (title: string) =>
        setPageTitleOverrideState(title.trim()),
      clearPageTitleOverride: () => setPageTitleOverrideState(""),
    }),
    [pageTitleOverride],
  );

  return React.createElement(
    PageTitleOverrideContext.Provider,
    { value },
    children,
  );
};

function usePageTitleContext(): PageTitleOverrideContextValue {
  const context = useContext(PageTitleOverrideContext);

  if (!context) {
    throw new Error("usePageTitle must be used within a PageTitleProvider");
  }

  return context;
}

export function getTitleForPath(pathname: string): string {
  for (const route of ROUTE_TITLES) {
    const matched = matchPath(
      { path: route.path, end: route.end ?? true },
      pathname,
    );

    if (matched) {
      return route.title;
    }
  }

  return "";
}

export const usePageTitle = (): string => {
  const { pathname } = useLocation();
  const { pageTitleOverride } = usePageTitleContext();

  return useMemo(() => {
    const title = pageTitleOverride || getTitleForPath(pathname);
    return title ? `${title} - ${APP_NAME}` : APP_NAME;
  }, [pageTitleOverride, pathname]);
};

export const usePageTitleOverride = (title?: string | null): void => {
  const { setPageTitleOverride, clearPageTitleOverride } = usePageTitleContext();

  useEffect(() => {
    const normalizedTitle = title?.trim();

    if (normalizedTitle) {
      setPageTitleOverride(normalizedTitle);
    } else {
      clearPageTitleOverride();
    }

    return () => {
      clearPageTitleOverride();
    };
  }, [clearPageTitleOverride, setPageTitleOverride, title]);
};

export default usePageTitle;
