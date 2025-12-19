import { lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Loadable from './components/common/Loadable';
import PrivateRoute from './components/auth/PrivateRoute';
import { initTableGrabScroll } from './hooks/useTableGrabScroll';
import './App.css';

// Lazy load pages with code splitting
const Login = Loadable(lazy(() => import('./pages/Login/Login')));
const Dashboard = Loadable(lazy(() => import('./pages/Dashboard/Dashboard')));

// Test Request
const TestRequestList = Loadable(lazy(() => import('./pages/TestRequest/TestRequestList')));
const TestRequestForm = Loadable(lazy(() => import('./pages/TestRequest/TestRequestForm')));
const TestRequestDetail = Loadable(lazy(() => import('./pages/TestRequest/TestRequestDetail')));

// Specimen
const SpecimenList = Loadable(lazy(() => import('./pages/Specimen/SpecimenList')));
const SpecimenForm = Loadable(lazy(() => import('./pages/Specimen/SpecimenForm')));
const SpecimenDetail = Loadable(lazy(() => import('./pages/Specimen/SpecimenDetail')));

// Test
const TestList = Loadable(lazy(() => import('./pages/Test/TestList')));
const TestForm = Loadable(lazy(() => import('./pages/Test/TestForm')));
const TestDetail = Loadable(lazy(() => import('./pages/Test/TestDetail')));

// Test Result
const TestResultList = Loadable(lazy(() => import('./pages/TestResult/TestResultList')));
const TestResultForm = Loadable(lazy(() => import('./pages/TestResult/TestResultForm')));
const TestResultDetail = Loadable(lazy(() => import('./pages/TestResult/TestResultDetail')));

// Specimen History
const SpecimenHistoryList = Loadable(lazy(() => import('./pages/SpecimenHistory/SpecimenHistoryList')));
const SpecimenHistoryForm = Loadable(lazy(() => import('./pages/SpecimenHistory/SpecimenHistoryForm')));
const SpecimenHistoryDetail = Loadable(lazy(() => import('./pages/SpecimenHistory/SpecimenHistoryDetail')));

// Reports & Analytics
const ReportList = Loadable(lazy(() => import('./pages/Reports/ReportList')));
const StatisticsPage = Loadable(lazy(() => import('./pages/Statistics/StatisticsPage')));

// NCR
const NCRList = Loadable(lazy(() => import('./pages/NCR/NCRList')));

// Task Management - Quản lý công việc khoa phòng
const TaskManagementList = Loadable(lazy(() => import('./pages/TaskManagement/TaskManagementList')));
const TaskManagementDetail = Loadable(lazy(() => import('./pages/TaskManagement/TaskManagementDetail')));

// Subcontractor
const SubcontractorList = Loadable(lazy(() => import('./pages/Subcontractor/SubcontractorList')));

// Master Data
const MasterDataList = Loadable(lazy(() => import('./pages/MasterData/MasterDataList')));

// Organization
const OrganizationList = Loadable(lazy(() => import('./pages/Organization/OrganizationList')));

// Audit Log
const AuditLogList = Loadable(lazy(() => import('./pages/AuditLog/AuditLogList')));

// Administration
const EmployeeList = Loadable(lazy(() => import('./pages/Employees/EmployeeList')));
const SettingsPage = Loadable(lazy(() => import('./pages/Settings/SettingsPage')));

function App() {
  // Initialize grab-to-scroll for all tables
  useEffect(() => {
    const cleanup = initTableGrabScroll();
    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Test Request Routes */}
          <Route path="requests" element={<TestRequestList />} />
          <Route path="test-request/create" element={<TestRequestForm />} />
          <Route path="test-request/:id" element={<TestRequestDetail />} />
          <Route path="test-request/edit/:id" element={<TestRequestForm />} />

          {/* Specimen Routes */}
          <Route path="specimens" element={<SpecimenList />} />
          <Route path="specimen/create" element={<SpecimenForm />} />
          <Route path="specimen/:id" element={<SpecimenDetail />} />
          <Route path="specimen/edit/:id" element={<SpecimenForm />} />

          {/* Test Routes */}
          <Route path="tests" element={<TestList />} />
          <Route path="test/create" element={<TestForm />} />
          <Route path="test/:id" element={<TestDetail />} />
          <Route path="test/edit/:id" element={<TestForm />} />

          {/* Test Result Routes */}
          <Route path="test-results" element={<TestResultList />} />
          <Route path="test-result/create" element={<TestResultForm />} />
          <Route path="test-result/:id" element={<TestResultDetail />} />
          <Route path="test-result/edit/:id" element={<TestResultForm />} />

          {/* Specimen History Routes */}
          <Route path="specimen-histories" element={<SpecimenHistoryList />} />
          <Route path="specimen-histories/new" element={<SpecimenHistoryForm />} />
          <Route path="specimen-histories/:id" element={<SpecimenHistoryDetail />} />
          <Route path="specimen-histories/:id/edit" element={<SpecimenHistoryForm />} />

          {/* Reports & Analytics */}
          <Route path="reports" element={<ReportList />} />
          <Route path="statistics" element={<StatisticsPage />} />

          {/* NCR - Non-Conformance Reports */}
          <Route path="ncr" element={<NCRList />} />

          {/* Task Management - Quản lý công việc khoa phòng */}
          <Route path="tasks" element={<TaskManagementList />} />
          <Route path="task/:id" element={<TaskManagementDetail />} />
          <Route path="test-management" element={<div style={{ padding: '24px', textAlign: 'center', fontSize: '18px', color: '#666' }}>Đang phát triển</div>} />

          {/* Subcontractor Management - Nhà thầu phụ */}
          <Route path="subcontractors" element={<SubcontractorList />} />

          {/* Master Data - Ngân hàng dữ liệu */}
          <Route path="master-data" element={<MasterDataList />} />

          {/* Organization - Cơ sở/Doanh nghiệp */}
          <Route path="organizations" element={<OrganizationList />} />

          {/* Audit Log - Lịch sử thay đổi */}
          <Route path="audit-log" element={<AuditLogList />} />

          {/* Administration */}
          <Route path="employees" element={<EmployeeList />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Legacy route - redirect to test-results */}
          <Route path="results" element={<Navigate to="/test-results" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
