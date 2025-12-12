import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import TestRequestList from './pages/TestRequest/TestRequestList';
import TestRequestForm from './pages/TestRequest/TestRequestForm';
import TestRequestDetail from './pages/TestRequest/TestRequestDetail';
import SpecimenList from './pages/Specimen/SpecimenList';
import SpecimenForm from './pages/Specimen/SpecimenForm';
import SpecimenDetail from './pages/Specimen/SpecimenDetail';
import TestList from './pages/Test/TestList';
import TestForm from './pages/Test/TestForm';
import TestDetail from './pages/Test/TestDetail';
import TestResultList from './pages/TestResult/TestResultList';
import TestResultForm from './pages/TestResult/TestResultForm';
import TestResultDetail from './pages/TestResult/TestResultDetail';
import SpecimenHistoryList from './pages/SpecimenHistory/SpecimenHistoryList';
import SpecimenHistoryForm from './pages/SpecimenHistory/SpecimenHistoryForm';
import SpecimenHistoryDetail from './pages/SpecimenHistory/SpecimenHistoryDetail';
import UserList from './pages/Users/UserList';
import ReportList from './pages/Reports/ReportList';
import NCRList from './pages/NCR/NCRList';
import StatisticsPage from './pages/Statistics/StatisticsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import SubcontractorList from './pages/Subcontractor/SubcontractorList';
import TaskAssignmentList from './pages/TaskAssignment/TaskAssignmentList';
import MasterDataList from './pages/MasterData/MasterDataList';
import AuditLogList from './pages/AuditLog/AuditLogList';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
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

          {/* Task Assignment - Giao việc */}
          <Route path="tasks" element={<TaskAssignmentList />} />

          {/* Subcontractor Management - Nhà thầu phụ */}
          <Route path="subcontractors" element={<SubcontractorList />} />

          {/* Master Data - Ngân hàng dữ liệu */}
          <Route path="master-data" element={<MasterDataList />} />

          {/* Audit Log - Lịch sử thay đổi */}
          <Route path="audit-log" element={<AuditLogList />} />

          {/* Administration */}
          <Route path="users" element={<UserList />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Legacy route - redirect to test-results */}
          <Route path="results" element={<Navigate to="/test-results" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
