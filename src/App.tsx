import { lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Loadable from "./components/common/Loadable";
import PrivateRoute from "./components/auth/PrivateRoute";
import { initTableGrabScroll } from "./hooks/useTableGrabScroll";
import { PageTitleProvider } from "./hooks/usePageTitle";
import { getDefaultRouteForUser, PATH_ROUTES, STORAGE_KEYS } from "./constants";
import { UserInfo } from "./services/authService";
import { prefetchMasterData } from "./services/offline/prefetchService";
import AppUpdateNotification from "./components/common/AppUpdateNotification";
import "./App.css";

// Helper component to redirect to user's default route based on their role
const DefaultRouteRedirect = () => {
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
  let defaultRoute = PATH_ROUTES.dashboard;

  if (storedUser) {
    try {
      const userInfo: UserInfo = JSON.parse(storedUser);
      defaultRoute =
        getDefaultRouteForUser(userInfo.roles) || PATH_ROUTES.dashboard;
    } catch {
      // Ignore parsing errors
    }
  }

  return <Navigate to={defaultRoute} replace />;
};

// Lazy load pages with code splitting
const Login = Loadable(lazy(() => import("./pages/Login/Login")));
const Dashboard = Loadable(lazy(() => import("./pages/Dashboard/Dashboard")));

// Quotation - Báo giá
const QuotationList = Loadable(
  lazy(() => import("./pages/Quotation/QuotationList")),
);
const QuotationView = Loadable(
  lazy(() => import("./pages/Quotation/QuotationView")),
);
const QuotationForm = Loadable(
  lazy(() => import("./pages/Quotation/QuotationForm")),
);

// Test Request
const TestRequestList = Loadable(
  lazy(() => import("./pages/TestRequest/TestRequestList")),
);
const TestRequestForm = Loadable(
  lazy(() => import("./pages/TestRequest/TestRequestForm")),
);
const TestRequestDetail = Loadable(
  lazy(() => import("./pages/TestRequest/TestRequestDetail")),
);

// Specimen
const SpecimenList = Loadable(
  lazy(() => import("./pages/Specimen/SpecimenList")),
);
const SpecimenForm = Loadable(
  lazy(() => import("./pages/Specimen/SpecimenForm")),
);
const SpecimenDetail = Loadable(
  lazy(() => import("./pages/Specimen/SpecimenDetail")),
);

// Test
const TestList = Loadable(lazy(() => import("./pages/Test/TestList")));
const TestForm = Loadable(lazy(() => import("./pages/Test/TestForm")));
const TestDetail = Loadable(lazy(() => import("./pages/Test/TestDetail")));

// Test Result
const TestResultList = Loadable(
  lazy(() => import("./pages/TestResult/TestResultList")),
);
const TestResultForm = Loadable(
  lazy(() => import("./pages/TestResult/TestResultForm")),
);
const TestResultDetail = Loadable(
  lazy(() => import("./pages/TestResult/TestResultDetail")),
);

// Specimen History
const SpecimenHistoryList = Loadable(
  lazy(() => import("./pages/SpecimenHistory/SpecimenHistoryList")),
);
const SpecimenHistoryForm = Loadable(
  lazy(() => import("./pages/SpecimenHistory/SpecimenHistoryForm")),
);
const SpecimenHistoryDetail = Loadable(
  lazy(() => import("./pages/SpecimenHistory/SpecimenHistoryDetail")),
);

// Reports & Analytics
const ReportList = Loadable(lazy(() => import("./pages/Reports/ReportList")));
const StatisticsPage = Loadable(
  lazy(() => import("./pages/Statistics/StatisticsPage")),
);
const LabReportPage = Loadable(
  lazy(() => import("./pages/Statistics/LabReportPage")),
);

// NCR
const NCRList = Loadable(lazy(() => import("./pages/NCR/NCRList")));

// Receipt - Phiếu thu
const ReceiptList = Loadable(lazy(() => import("./pages/Receipt/ReceiptList")));
const ReceiptDetail = Loadable(
  lazy(() => import("./pages/Receipt/ReceiptDetail")),
);

// Task Management - Quản lý công việc khoa phòng
const TaskManagementList = Loadable(
  lazy(() => import("./pages/TaskManagement/TaskManagementList")),
);
const TaskManagementDetail = Loadable(
  lazy(() => import("./pages/TaskManagement/TaskManagementDetail")),
);

// Testing - Quản lý thử nghiệm (KTV view)
const TestingList = Loadable(lazy(() => import("./pages/Testing/TestingList")));
const TestingDetail = Loadable(
  lazy(() => import("./pages/Testing/TestingDetail")),
);

// Quality Management - Quản lý chất lượng (QLCL view)
const QualityManagementList = Loadable(
  lazy(() => import("./pages/QualityManagement/QualityManagementList")),
);
const QualityManagementDetail = Loadable(
  lazy(() => import("./pages/QualityManagement/QualityManagementDetail")),
);

// Subcontractor
const SubcontractorList = Loadable(
  lazy(() => import("./pages/Subcontractor/SubcontractorList")),
);

// Suppliers
const SupplierList = Loadable(
  lazy(() => import("./pages/Suppliers/SupplierList")),
);
const SupplierDetail = Loadable(
  lazy(() => import("./pages/Suppliers/SupplierDetail")),
);

// Goods Receipts - Phiếu nhập hàng
const GoodsReceiptList = Loadable(
  lazy(() => import("./pages/GoodsReceipts/GoodsReceiptList")),
);
const GoodsReceiptForm = Loadable(
  lazy(() => import("./pages/GoodsReceipts/GoodsReceiptForm")),
);
const GoodsReceiptDetail = Loadable(
  lazy(() => import("./pages/GoodsReceipts/GoodsReceiptDetail")),
);

// Stock Adjustments - Điều chỉnh tồn kho
const StockAdjustmentList = Loadable(
  lazy(() => import("./pages/StockAdjustments/StockAdjustmentList")),
);
const StockInventoryForm = Loadable(
  lazy(() => import("./pages/StockAdjustments/StockInventoryForm")),
);
const StockAdjustmentDetail = Loadable(
  lazy(() => import("./pages/StockAdjustments/StockAdjustmentDetail")),
);

// Warehouse Imports - Quản lý nhập kho
const WarehouseImportList = Loadable(
  lazy(() => import("./pages/WarehouseImports/WarehouseImportList")),
);
const WarehouseImportForm = Loadable(
  lazy(() => import("./pages/WarehouseImports/WarehouseImportForm")),
);
const WarehouseImportDetail = Loadable(
  lazy(() => import("./pages/WarehouseImports/WarehouseImportDetail")),
);

// Equipments - Quản lý thiết bị
const EquipmentList = Loadable(
  lazy(() => import("./pages/Equipments/EquipmentList")),
);
const EquipmentDetailPage = Loadable(
  lazy(() => import("./pages/Equipments/EquipmentDetailPage")),
);

// Products
const ProductList = Loadable(
  lazy(() => import("./pages/Products/ProductList")),
);

// Material Receipts - Mẫu nhận vật tư
const MaterialReceiptList = Loadable(
  lazy(() => import("./pages/MaterialReceipts/MaterialReceiptList")),
);
const MaterialReceiptForm = Loadable(
  lazy(() => import("./pages/MaterialReceipts/MaterialReceiptForm")),
);
const MaterialReceiptDetail = Loadable(
  lazy(() => import("./pages/MaterialReceipts/MaterialReceiptDetail")),
);

// Prepared Solutions
const PreparedSolutionList = Loadable(
  lazy(() => import("./pages/PreparedSolutions/PreparedSolutionListPage")),
);

// Supplementary Tasks
const SupplementaryTaskPage = Loadable(
  lazy(() => import("./pages/SupplementaryTasks/SupplementaryTaskPage")),
);
const ProductSourceList = Loadable(
  lazy(() => import("./pages/Products/ProductSourceList")),
);
const ProductDetailPage = Loadable(
  lazy(() => import("./pages/Products/ProductDetailPage")),
);

// Master Data
const MasterDataList = Loadable(
  lazy(() => import("./pages/MasterData/MasterDataList")),
);

// Organization
const OrganizationList = Loadable(
  lazy(() => import("./pages/Organization/OrganizationList")),
);
const OrganizationDetail = Loadable(
  lazy(() => import("./pages/Organization/OrganizationDetail")),
);

// Audit Log
const AuditLogList = Loadable(
  lazy(() => import("./pages/AuditLog/AuditLogList")),
);

// Administration
const EmployeeList = Loadable(
  lazy(() => import("./pages/Employees/EmployeeList")),
);
const EmployeeDetail = Loadable(
  lazy(() => import("./pages/Employees/EmployeeDetail")),
);
const RoleManagementList = Loadable(
  lazy(() => import("./pages/RoleManagement/RoleManagementList")),
);
const RoleManagementDetail = Loadable(
  lazy(() => import("./pages/RoleManagement/RoleManagementDetail")),
);
const SettingsPage = Loadable(
  lazy(() => import("./pages/Settings/SettingsPage")),
);
const ApprovalProcessPage = Loadable(
  lazy(() => import("./pages/ApprovalProcess/ApprovalProcessPage")),
);

// 404 Not Found
const NotFound = Loadable(lazy(() => import("./pages/NotFound/NotFound")));

// 403 Forbidden
const Forbidden = Loadable(lazy(() => import("./pages/Forbidden/Forbidden")));

// 401 Unauthorized
const Unauthorized = Loadable(
  lazy(() => import("./pages/Unauthorized/Unauthorized")),
);

// Document Editor (OnlyOffice)
const DocumentEditor = Loadable(lazy(() => import("./pages/DocumentEditor")));

function App() {
  // Initialize grab-to-scroll for all tables
  useEffect(() => {
    const cleanup = initTableGrabScroll();
    return cleanup;
  }, []);

  // Prefetch master data for offline use
  useEffect(() => {
    // Only prefetch if user is logged in
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (storedUser && navigator.onLine) {
      // Delay prefetch slightly to not block initial render
      const timer = setTimeout(() => {
        prefetchMasterData();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <BrowserRouter>
      <AppUpdateNotification />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/401" element={<Unauthorized />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/document-editor" element={<DocumentEditor />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <PageTitleProvider>
                <MainLayout />
              </PageTitleProvider>
            </PrivateRoute>
          }
        >
          <Route index element={<DefaultRouteRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Quotation Routes - Báo giá */}
          <Route path="quotations" element={<QuotationList />} />
          <Route path="quotations/create" element={<QuotationForm />} />
          <Route path="quotations/duplicate/:id" element={<QuotationForm />} />
          <Route path="quotations/view/:id" element={<QuotationView />} />
          <Route path="quotations/edit/:id" element={<QuotationForm />} />

          {/* Test Request Routes */}
          <Route path="test-requests" element={<TestRequestList />} />
          <Route path="test-requests/create" element={<TestRequestForm />} />
          <Route path="test-requests/:id" element={<TestRequestDetail />} />
          <Route path="test-requests/edit/:id" element={<TestRequestForm />} />

          {/* Specimen Routes */}
          <Route path="specimens" element={<SpecimenList />} />
          <Route path="specimens/create" element={<SpecimenForm />} />
          <Route path="specimens/:id" element={<SpecimenDetail />} />
          <Route path="specimens/edit/:id" element={<SpecimenForm />} />

          {/* Test Routes */}
          <Route path="tests" element={<TestList />} />
          <Route path="tests/create" element={<TestForm />} />
          <Route path="tests/:id" element={<TestDetail />} />
          <Route path="tests/edit/:id" element={<TestForm />} />

          {/* Test Result Routes */}
          <Route path="test-results" element={<TestResultList />} />
          <Route path="test-results/create" element={<TestResultForm />} />
          <Route path="test-results/:id" element={<TestResultDetail />} />
          <Route path="test-results/edit/:id" element={<TestResultForm />} />

          {/* Specimen History Routes */}
          <Route path="specimen-histories" element={<SpecimenHistoryList />} />
          <Route
            path="specimen-histories/create"
            element={<SpecimenHistoryForm />}
          />
          <Route
            path="specimen-histories/:id"
            element={<SpecimenHistoryDetail />}
          />
          <Route
            path="specimen-histories/edit/:id"
            element={<SpecimenHistoryForm />}
          />

          {/* Reports & Analytics */}
          <Route path="reports" element={<ReportList />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="lab-report" element={<LabReportPage />} />

          {/* NCR - Non-Conformance Reports */}
          <Route path="ncr" element={<NCRList />} />

          {/* Receipt - Phiếu thu */}
          <Route path="receipts" element={<ReceiptList />} />
          <Route path="receipts/:id" element={<ReceiptDetail />} />

          {/* Task Management - Quản lý công việc khoa phòng */}
          <Route path="tasks" element={<TaskManagementList />} />
          <Route path="tasks/:id" element={<TaskManagementDetail />} />

          {/* Testing - Quản lý thử nghiệm (KTV view) */}
          <Route path="testing" element={<TestingList />} />
          <Route path="testing/:id" element={<TestingDetail />} />

          {/* Quality Management - Quản lý chất lượng (QLCL view) */}
          <Route
            path="quality-management"
            element={<QualityManagementList />}
          />
          <Route
            path="quality-management/:id"
            element={<QualityManagementDetail />}
          />

          {/* Subcontractor Management - Nhà thầu phụ */}
          <Route path="subcontractors" element={<SubcontractorList />} />

          {/* Goods Receipts - Phiếu nhập hàng */}
          <Route path="goods-receipts" element={<GoodsReceiptList />} />
          <Route path="goods-receipts/create" element={<GoodsReceiptForm />} />
          <Route path="goods-receipts/:id" element={<GoodsReceiptDetail />} />
          <Route
            path="goods-receipts/edit/:id"
            element={<GoodsReceiptForm />}
          />

          {/* Stock Adjustments - Điều chỉnh tồn kho */}
          <Route path="stock-adjustments" element={<StockAdjustmentList />} />
          <Route path="stock-adjustments/create" element={<StockInventoryForm />} />
          <Route path="stock-adjustments/:id" element={<StockAdjustmentDetail />} />
          <Route path="stock-adjustments/edit/:id" element={<StockInventoryForm />} />

          {/* Warehouse Imports - Quản lý nhập kho */}
          <Route path="warehouse-imports" element={<WarehouseImportList />} />
          <Route
            path="warehouse-imports/create"
            element={<WarehouseImportForm />}
          />
          <Route
            path="warehouse-imports/:id"
            element={<WarehouseImportDetail />}
          />
          <Route
            path="warehouse-imports/edit/:id"
            element={<WarehouseImportForm />}
          />

          {/* Material Receipts - Mẫu nhận vật tư */}
          <Route path="material-receipts" element={<MaterialReceiptList />} />
          <Route path="material-receipts/create" element={<MaterialReceiptForm />} />
          <Route path="material-receipts/:id" element={<MaterialReceiptDetail />} />
          <Route
            path="material-receipts/edit/:id"
            element={<MaterialReceiptForm />}
          />

          {/* Equipments - Quản lý thiết bị */}
          <Route path="equipments" element={<EquipmentList />} />
          <Route path="equipments/:id" element={<EquipmentDetailPage />} />

          {/* Suppliers - Quản lý nhà cung cấp */}
          <Route path="suppliers-management" element={<SupplierList />} />
          <Route path="suppliers-management/:id" element={<SupplierDetail />} />

          {/* Products - Quản lý vật tư */}
          <Route path="products" element={<ProductList />} />

          {/* Prepared Solutions - Pha dung dịch */}
          <Route path="prepared-solutions" element={<PreparedSolutionList />} />

          {/* Supplementary Tasks - Công việc bổ sung */}
          <Route
            path="supplementary-tasks"
            element={<SupplementaryTaskPage />}
          />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="products/:id/sources" element={<ProductSourceList />} />

          {/* Master Data - Ngân hàng dữ liệu */}
          <Route path="master-data" element={<MasterDataList />} />

          {/* Organization - Cơ sở/Doanh nghiệp */}
          <Route path="organizations" element={<OrganizationList />} />
          <Route path="organizations/:id" element={<OrganizationDetail />} />

          {/* Audit Log - Lịch sử thay đổi */}
          <Route path="audit-log" element={<AuditLogList />} />

          {/* Administration */}
          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="role-management" element={<RoleManagementList />} />
          <Route
            path="role-management/:id"
            element={<RoleManagementDetail />}
          />
          <Route path="approval-process" element={<ApprovalProcessPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Legacy route - redirect to test-results */}
          <Route
            path="results"
            element={<Navigate to="/test-results" replace />}
          />

          {/* 404 - Catch all unmatched routes inside MainLayout */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* 404 - Catch all unmatched routes outside MainLayout */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
