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
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="requests" element={<TestRequestList />} />
          <Route path="test-request/create" element={<TestRequestForm />} />
          <Route path="test-request/:id" element={<TestRequestDetail />} />
          <Route path="test-request/edit/:id" element={<TestRequestForm />} />
          <Route path="specimens" element={<SpecimenList />} />
          <Route path="specimen/create" element={<SpecimenForm />} />
          <Route path="specimen/:id" element={<SpecimenDetail />} />
          <Route path="specimen/edit/:id" element={<SpecimenForm />} />
          <Route path="tests" element={<TestList />} />
          <Route path="test/create" element={<TestForm />} />
          <Route path="test/:id" element={<TestDetail />} />
          <Route path="test/edit/:id" element={<TestForm />} />
          <Route path="test-results" element={<TestResultList />} />
          <Route path="test-result/create" element={<TestResultForm />} />
          <Route path="test-result/:id" element={<TestResultDetail />} />
          <Route path="test-result/edit/:id" element={<TestResultForm />} />
          <Route path="specimen-histories" element={<SpecimenHistoryList />} />
          <Route path="specimen-histories/new" element={<SpecimenHistoryForm />} />
          <Route path="specimen-histories/:id" element={<SpecimenHistoryDetail />} />
          <Route path="specimen-histories/:id/edit" element={<SpecimenHistoryForm />} />
          <Route path="results" element={<div>Results Page (Coming Soon)</div>} />
          <Route path="reports" element={<div>Reports Page (Coming Soon)</div>} />
          <Route path="ncr" element={<div>NCR Page (Coming Soon)</div>} />
          <Route path="statistics" element={<div>Statistics Page (Coming Soon)</div>} />
          <Route path="settings" element={<div>Settings Page (Coming Soon)</div>} />
          <Route path="users" element={<div>Users Page (Coming Soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
