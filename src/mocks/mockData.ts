/**
 * Centralized Mock Data for Lab Specimen Management System
 * All mock data is consistent and properly related across modules
 */

import dayjs from 'dayjs';

// =====================================================
// ENUMS & CONSTANTS
// =====================================================

export enum TestRequestStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
}

export enum SpecimenStatus {
  Received = 0,
  Testing = 1,
  Storage = 2,
  Disposal = 3,
  Destroyed = 4,
  ReturnedToCustomer = 5,
}

export enum TestStatus {
  Pending = 0,
  Assigned = 1,
  InProgress = 2,
  Completed = 3,
  Reviewed = 4,
  Approved = 5,
}

export enum ResultApprovalStatus {
  Draft = 0,
  Submitted = 1,
  Step1Reviewed = 2,
  Step2Approved = 3,
  Rejected = 4,
}

export enum NCRStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum NCRSeverity {
  Critical = 'critical',
  Major = 'major',
  Minor = 'minor',
}

export enum ReportStatus {
  Draft = 'draft',
  PendingApproval = 'pending_approval',
  Approved = 'approved',
  Rejected = 'rejected',
  Issued = 'issued',
}

export enum TaskStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  InProgress = 'in_progress',
  Completed = 'completed',
  Rejected = 'rejected',
}

export enum UserRole {
  Admin = 'Admin',
  LabManager = 'LabManager',
  Technician = 'Technician',
  Reviewer = 'Reviewer',
  Approver = 'Approver',
  Viewer = 'Viewer',
}

// =====================================================
// MASTER DATA
// =====================================================

export const mockUsers = [
  {
    id: 'user-001',
    username: 'admin',
    fullName: 'Nguyễn Văn Admin',
    email: 'admin@labdaklak.vn',
    phone: '0905123456',
    role: 'Admin',
    department: 'Quản lý',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    lastLogin: '2025-12-12T10:30:00.000Z',
  },
  {
    id: 'user-002',
    username: 'nguyen.van.a',
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@labdaklak.vn',
    phone: '0905234567',
    role: 'LabManager',
    department: 'Phòng Hóa học',
    isActive: true,
    createdAt: '2025-02-15T00:00:00.000Z',
    lastLogin: '2025-12-12T09:15:00.000Z',
  },
  {
    id: 'user-003',
    username: 'tran.thi.b',
    fullName: 'Trần Thị B',
    email: 'tranthib@labdaklak.vn',
    phone: '0905345678',
    role: 'Technician',
    department: 'Phòng Vi sinh',
    isActive: true,
    createdAt: '2025-03-20T00:00:00.000Z',
    lastLogin: '2025-12-12T08:45:00.000Z',
  },
  {
    id: 'user-004',
    username: 'le.van.c',
    fullName: 'Lê Văn C',
    email: 'levanc@labdaklak.vn',
    phone: '0905456789',
    role: 'Technician',
    department: 'Phòng Hóa học',
    isActive: true,
    createdAt: '2025-04-10T00:00:00.000Z',
    lastLogin: '2025-12-11T16:30:00.000Z',
  },
  {
    id: 'user-005',
    username: 'pham.thi.d',
    fullName: 'Phạm Thị D',
    email: 'phamthid@labdaklak.vn',
    phone: '0905567890',
    role: 'Reviewer',
    department: 'Phòng Hóa học',
    isActive: true,
    createdAt: '2025-05-05T00:00:00.000Z',
    lastLogin: '2025-12-12T07:00:00.000Z',
  },
  {
    id: 'user-006',
    username: 'hoang.van.e',
    fullName: 'Hoàng Văn E',
    email: 'hoangvane@labdaklak.vn',
    phone: '0905678901',
    role: 'Approver',
    department: 'Ban Giám đốc',
    isActive: true,
    createdAt: '2025-06-15T00:00:00.000Z',
    lastLogin: '2025-12-12T08:00:00.000Z',
  },
];

export const mockCustomers = [
  {
    id: 'cust-001',
    name: 'Công ty TNHH Cà phê Tây Nguyên',
    email: 'info@capheTN.com.vn',
    phone: '0262 3852 115',
    address: '123 Lê Duẩn, TP. Buôn Ma Thuột, Đắk Lắk',
  },
  {
    id: 'cust-002',
    name: 'HTX Nông nghiệp Ea H\'leo',
    email: 'htxeahleo@gmail.com',
    phone: '0262 3777 222',
    address: 'Xã Ea Hiao, Huyện Ea H\'leo, Đắk Lắk',
  },
  {
    id: 'cust-003',
    name: 'Viện Nghiên cứu Khoa học Tây Nguyên',
    email: 'viennc@taynguyen.gov.vn',
    phone: '0262 3856 789',
    address: '45 Nguyễn Tất Thành, TP. Buôn Ma Thuột, Đắk Lắk',
  },
  {
    id: 'cust-004',
    name: 'Công ty CP Phân bón Đắk Lắk',
    email: 'phanbondaklak@gmail.com',
    phone: '0262 3859 999',
    address: 'KCN Hòa Phú, TP. Buôn Ma Thuột, Đắk Lắk',
  },
  {
    id: 'cust-005',
    name: 'Sở Tài nguyên và Môi trường Đắk Lắk',
    email: 'stnmt@daklak.gov.vn',
    phone: '0262 3851 234',
    address: '18 Lê Duẩn, TP. Buôn Ma Thuột, Đắk Lắk',
  },
];

export const mockDepartments = [
  { id: 'dept-001', name: 'Quản lý', code: 'QL' },
  { id: 'dept-002', name: 'Ban Giám đốc', code: 'BGD' },
  { id: 'dept-003', name: 'Phòng Hóa học', code: 'PHH' },
  { id: 'dept-004', name: 'Phòng Vi sinh', code: 'PVS' },
  { id: 'dept-005', name: 'Phòng Vật lý', code: 'PVL' },
  { id: 'dept-006', name: 'Phòng Môi trường', code: 'PMT' },
  { id: 'dept-007', name: 'Tiếp nhận mẫu', code: 'TNM' },
];

export const mockSpecimenTypes = [
  { id: 'stype-001', code: 'NN', name: 'Nước ngầm' },
  { id: 'stype-002', code: 'NM', name: 'Nước mặt' },
  { id: 'stype-003', code: 'NT', name: 'Nước thải' },
  { id: 'stype-004', code: 'DAT', name: 'Đất' },
  { id: 'stype-005', code: 'TP', name: 'Thực phẩm' },
  { id: 'stype-006', code: 'PB', name: 'Phân bón' },
  { id: 'stype-007', code: 'CP', name: 'Cà phê' },
  { id: 'stype-008', code: 'RC', name: 'Rau củ' },
];

export const mockTestMethods = [
  { id: 'method-001', code: 'TCVN6492', name: 'TCVN 6492:2011 - Xác định pH' },
  { id: 'method-002', code: 'TCVN4559', name: 'TCVN 4559:1998 - Xác định EC' },
  { id: 'method-003', code: 'TCVN6638', name: 'TCVN 6638:2000 - Xác định Nitơ tổng' },
  { id: 'method-004', code: 'TCVN6187', name: 'TCVN 6187-1:2019 - Xác định Coliform' },
  { id: 'method-005', code: 'AOAC950', name: 'AOAC 950.40 - Xác định Caffeine' },
  { id: 'method-006', code: 'TCVN6193', name: 'TCVN 6193:1996 - Xác định kim loại nặng' },
];

export const mockStorageLocations = [
  { id: 'loc-001', code: 'KLA1', name: 'Tủ lạnh 2-8°C - Phòng A1', temperature: '2-8°C' },
  { id: 'loc-002', code: 'KLA2', name: 'Tủ đông -20°C - Phòng A2', temperature: '-20°C' },
  { id: 'loc-003', code: 'KLB1', name: 'Tủ đông -80°C - Lưu trữ dài hạn', temperature: '-80°C' },
  { id: 'loc-004', code: 'PMT1', name: 'Phòng mẫu nhiệt độ thường', temperature: '25°C' },
  { id: 'loc-005', code: 'KHC1', name: 'Kho hóa chất', temperature: '20-25°C' },
];

// =====================================================
// TEST REQUESTS (Root entity)
// =====================================================

export const mockTestRequests = [
  {
    id: 'req-001',
    requestNumber: 'REQ-20251201-0001',
    requestDate: '2025-12-01T08:00:00.000Z',
    customerId: 'cust-001',
    customerName: 'Công ty TNHH Cà phê Tây Nguyên',
    customerEmail: 'info@capheTN.com.vn',
    customerPhone: '0262 3852 115',
    customerAddress: '123 Lê Duẩn, TP. Buôn Ma Thuột, Đắk Lắk',
    status: TestRequestStatus.Completed,
    expectedCompletionDate: '2025-12-08T17:00:00.000Z',
    notes: 'Khách hàng yêu cầu kết quả gấp',
    createdAt: '2025-12-01T08:00:00.000Z',
    createdBy: 'user-002',
  },
  {
    id: 'req-002',
    requestNumber: 'REQ-20251203-0002',
    requestDate: '2025-12-03T09:30:00.000Z',
    customerId: 'cust-002',
    customerName: 'HTX Nông nghiệp Ea H\'leo',
    customerEmail: 'htxeahleo@gmail.com',
    customerPhone: '0262 3777 222',
    customerAddress: 'Xã Ea Hiao, Huyện Ea H\'leo, Đắk Lắk',
    status: TestRequestStatus.InProgress,
    expectedCompletionDate: '2025-12-10T17:00:00.000Z',
    notes: '',
    createdAt: '2025-12-03T09:30:00.000Z',
    createdBy: 'user-002',
  },
  {
    id: 'req-003',
    requestNumber: 'REQ-20251205-0003',
    requestDate: '2025-12-05T10:00:00.000Z',
    customerId: 'cust-003',
    customerName: 'Viện Nghiên cứu Khoa học Tây Nguyên',
    customerEmail: 'viennc@taynguyen.gov.vn',
    customerPhone: '0262 3856 789',
    customerAddress: '45 Nguyễn Tất Thành, TP. Buôn Ma Thuột, Đắk Lắk',
    status: TestRequestStatus.InProgress,
    expectedCompletionDate: '2025-12-12T17:00:00.000Z',
    notes: 'Mẫu nghiên cứu đặc biệt',
    createdAt: '2025-12-05T10:00:00.000Z',
    createdBy: 'user-002',
  },
  {
    id: 'req-004',
    requestNumber: 'REQ-20251208-0004',
    requestDate: '2025-12-08T08:30:00.000Z',
    customerId: 'cust-004',
    customerName: 'Công ty CP Phân bón Đắk Lắk',
    customerEmail: 'phanbondaklak@gmail.com',
    customerPhone: '0262 3859 999',
    customerAddress: 'KCN Hòa Phú, TP. Buôn Ma Thuột, Đắk Lắk',
    status: TestRequestStatus.Pending,
    expectedCompletionDate: '2025-12-15T17:00:00.000Z',
    notes: '',
    createdAt: '2025-12-08T08:30:00.000Z',
    createdBy: 'user-002',
  },
  {
    id: 'req-005',
    requestNumber: 'REQ-20251210-0005',
    requestDate: '2025-12-10T14:00:00.000Z',
    customerId: 'cust-005',
    customerName: 'Sở Tài nguyên và Môi trường Đắk Lắk',
    customerEmail: 'stnmt@daklak.gov.vn',
    customerPhone: '0262 3851 234',
    customerAddress: '18 Lê Duẩn, TP. Buôn Ma Thuột, Đắk Lắk',
    status: TestRequestStatus.Pending,
    expectedCompletionDate: '2025-12-17T17:00:00.000Z',
    notes: 'Yêu cầu quan trắc định kỳ',
    createdAt: '2025-12-10T14:00:00.000Z',
    createdBy: 'user-002',
  },
];

// =====================================================
// SPECIMENS (Linked to TestRequests)
// =====================================================

export const mockSpecimens = [
  // Specimens for REQ-001
  {
    id: 'spe-001',
    code: 'SPE-20251201-0001',
    name: 'Mẫu cà phê nhân - Lô A001',
    type: 'Cà phê',
    typeId: 'stype-007',
    receivedDate: '2025-12-01T08:30:00.000Z',
    testRequestId: 'req-001',
    testRequestNumber: 'REQ-20251201-0001',
    quantity: 2,
    unit: 'kg',
    status: SpecimenStatus.Storage,
    storageLocationId: 'loc-004',
    storageLocation: 'Phòng mẫu nhiệt độ thường',
    storageCondition: '25°C',
    description: 'Mẫu cà phê nhân sống, lô thu hoạch tháng 11/2025',
    createdAt: '2025-12-01T08:30:00.000Z',
    createdBy: 'user-003',
  },
  {
    id: 'spe-002',
    code: 'SPE-20251201-0002',
    name: 'Mẫu cà phê bột - Lô A001',
    type: 'Cà phê',
    typeId: 'stype-007',
    receivedDate: '2025-12-01T08:35:00.000Z',
    testRequestId: 'req-001',
    testRequestNumber: 'REQ-20251201-0001',
    quantity: 500,
    unit: 'g',
    status: SpecimenStatus.Storage,
    storageLocationId: 'loc-004',
    storageLocation: 'Phòng mẫu nhiệt độ thường',
    storageCondition: '25°C',
    description: 'Mẫu cà phê bột rang xay',
    createdAt: '2025-12-01T08:35:00.000Z',
    createdBy: 'user-003',
  },
  // Specimens for REQ-002
  {
    id: 'spe-003',
    code: 'SPE-20251203-0003',
    name: 'Mẫu đất nông nghiệp - Khu vực A',
    type: 'Đất',
    typeId: 'stype-004',
    receivedDate: '2025-12-03T10:00:00.000Z',
    testRequestId: 'req-002',
    testRequestNumber: 'REQ-20251203-0002',
    quantity: 3,
    unit: 'kg',
    status: SpecimenStatus.Testing,
    storageLocationId: 'loc-004',
    storageLocation: 'Phòng mẫu nhiệt độ thường',
    storageCondition: '25°C',
    description: 'Mẫu đất trồng cà phê, độ sâu 0-30cm',
    createdAt: '2025-12-03T10:00:00.000Z',
    createdBy: 'user-003',
  },
  {
    id: 'spe-004',
    code: 'SPE-20251203-0004',
    name: 'Mẫu đất nông nghiệp - Khu vực B',
    type: 'Đất',
    typeId: 'stype-004',
    receivedDate: '2025-12-03T10:15:00.000Z',
    testRequestId: 'req-002',
    testRequestNumber: 'REQ-20251203-0002',
    quantity: 3,
    unit: 'kg',
    status: SpecimenStatus.Testing,
    storageLocationId: 'loc-004',
    storageLocation: 'Phòng mẫu nhiệt độ thường',
    storageCondition: '25°C',
    description: 'Mẫu đất trồng hồ tiêu, độ sâu 0-30cm',
    createdAt: '2025-12-03T10:15:00.000Z',
    createdBy: 'user-003',
  },
  // Specimens for REQ-003
  {
    id: 'spe-005',
    code: 'SPE-20251205-0005',
    name: 'Mẫu nước ngầm - Giếng khoan GK01',
    type: 'Nước ngầm',
    typeId: 'stype-001',
    receivedDate: '2025-12-05T10:30:00.000Z',
    testRequestId: 'req-003',
    testRequestNumber: 'REQ-20251205-0003',
    quantity: 2,
    unit: 'L',
    status: SpecimenStatus.Testing,
    storageLocationId: 'loc-001',
    storageLocation: 'Tủ lạnh 2-8°C - Phòng A1',
    storageCondition: '2-8°C',
    description: 'Mẫu nước ngầm lấy từ giếng khoan sâu 50m',
    createdAt: '2025-12-05T10:30:00.000Z',
    createdBy: 'user-003',
  },
  {
    id: 'spe-006',
    code: 'SPE-20251205-0006',
    name: 'Mẫu nước mặt - Suối Ea Kao',
    type: 'Nước mặt',
    typeId: 'stype-002',
    receivedDate: '2025-12-05T11:00:00.000Z',
    testRequestId: 'req-003',
    testRequestNumber: 'REQ-20251205-0003',
    quantity: 2,
    unit: 'L',
    status: SpecimenStatus.Testing,
    storageLocationId: 'loc-001',
    storageLocation: 'Tủ lạnh 2-8°C - Phòng A1',
    storageCondition: '2-8°C',
    description: 'Mẫu nước suối Ea Kao, điểm lấy mẫu QT-01',
    createdAt: '2025-12-05T11:00:00.000Z',
    createdBy: 'user-003',
  },
  // Specimens for REQ-004
  {
    id: 'spe-007',
    code: 'SPE-20251208-0007',
    name: 'Mẫu phân bón NPK 16-16-8',
    type: 'Phân bón',
    typeId: 'stype-006',
    receivedDate: '2025-12-08T09:00:00.000Z',
    testRequestId: 'req-004',
    testRequestNumber: 'REQ-20251208-0004',
    quantity: 1,
    unit: 'kg',
    status: SpecimenStatus.Received,
    storageLocationId: 'loc-004',
    storageLocation: 'Phòng mẫu nhiệt độ thường',
    storageCondition: '25°C',
    description: 'Mẫu phân bón NPK lô sản xuất PB-2025-1208',
    createdAt: '2025-12-08T09:00:00.000Z',
    createdBy: 'user-003',
  },
  // Specimens for REQ-005
  {
    id: 'spe-008',
    code: 'SPE-20251210-0008',
    name: 'Mẫu nước thải - KCN Hòa Phú',
    type: 'Nước thải',
    typeId: 'stype-003',
    receivedDate: '2025-12-10T14:30:00.000Z',
    testRequestId: 'req-005',
    testRequestNumber: 'REQ-20251210-0005',
    quantity: 5,
    unit: 'L',
    status: SpecimenStatus.Received,
    storageLocationId: 'loc-001',
    storageLocation: 'Tủ lạnh 2-8°C - Phòng A1',
    storageCondition: '2-8°C',
    description: 'Mẫu nước thải đầu ra nhà máy xử lý nước thải KCN',
    createdAt: '2025-12-10T14:30:00.000Z',
    createdBy: 'user-003',
  },
];

// =====================================================
// TESTS (Linked to Specimens)
// =====================================================

export const mockTests = [
  // Tests for SPE-001 (Cà phê nhân)
  {
    id: 'test-001',
    code: 'TEST-20251201-0001',
    name: 'Xác định độ ẩm cà phê nhân',
    specimenId: 'spe-001',
    specimenCode: 'SPE-20251201-0001',
    testRequestId: 'req-001',
    method: 'TCVN 6928:2007',
    methodId: 'method-001',
    standard: 'TCVN 4193:2014',
    status: TestStatus.Approved,
    assignedTo: 'user-004',
    assignedToName: 'Lê Văn C',
    department: 'Phòng Hóa học',
    startDate: '2025-12-02T08:00:00.000Z',
    completedDate: '2025-12-03T16:00:00.000Z',
    notes: '',
    createdAt: '2025-12-01T09:00:00.000Z',
    createdBy: 'user-002',
  },
  {
    id: 'test-002',
    code: 'TEST-20251201-0002',
    name: 'Xác định hàm lượng Caffeine',
    specimenId: 'spe-002',
    specimenCode: 'SPE-20251201-0002',
    testRequestId: 'req-001',
    method: 'AOAC 950.40',
    methodId: 'method-005',
    standard: 'TCVN 5253:1990',
    status: TestStatus.Approved,
    assignedTo: 'user-004',
    assignedToName: 'Lê Văn C',
    department: 'Phòng Hóa học',
    startDate: '2025-12-02T08:30:00.000Z',
    completedDate: '2025-12-04T15:00:00.000Z',
    notes: '',
    createdAt: '2025-12-01T09:30:00.000Z',
    createdBy: 'user-002',
  },
  // Tests for SPE-003 (Đất A)
  {
    id: 'test-003',
    code: 'TEST-20251203-0003',
    name: 'Xác định pH đất',
    specimenId: 'spe-003',
    specimenCode: 'SPE-20251203-0003',
    testRequestId: 'req-002',
    method: 'TCVN 5979:2007',
    methodId: 'method-001',
    standard: 'TCVN 5979:2007',
    status: TestStatus.Completed,
    assignedTo: 'user-003',
    assignedToName: 'Trần Thị B',
    department: 'Phòng Hóa học',
    startDate: '2025-12-04T08:00:00.000Z',
    completedDate: '2025-12-05T14:00:00.000Z',
    notes: '',
    createdAt: '2025-12-03T11:00:00.000Z',
    createdBy: 'user-002',
  },
  {
    id: 'test-004',
    code: 'TEST-20251203-0004',
    name: 'Xác định Nitơ tổng trong đất',
    specimenId: 'spe-003',
    specimenCode: 'SPE-20251203-0003',
    testRequestId: 'req-002',
    method: 'TCVN 6498:1999',
    methodId: 'method-003',
    standard: 'TCVN 6498:1999',
    status: TestStatus.InProgress,
    assignedTo: 'user-004',
    assignedToName: 'Lê Văn C',
    department: 'Phòng Hóa học',
    startDate: '2025-12-05T08:00:00.000Z',
    completedDate: null,
    notes: 'Đang chờ kết quả phân tích',
    createdAt: '2025-12-03T11:30:00.000Z',
    createdBy: 'user-002',
  },
  // Tests for SPE-005 (Nước ngầm)
  {
    id: 'test-005',
    code: 'TEST-20251205-0005',
    name: 'Xác định pH nước ngầm',
    specimenId: 'spe-005',
    specimenCode: 'SPE-20251205-0005',
    testRequestId: 'req-003',
    method: 'TCVN 6492:2011',
    methodId: 'method-001',
    standard: 'QCVN 09-MT:2015/BTNMT',
    status: TestStatus.InProgress,
    assignedTo: 'user-003',
    assignedToName: 'Trần Thị B',
    department: 'Phòng Hóa học',
    startDate: '2025-12-06T08:00:00.000Z',
    completedDate: null,
    notes: '',
    createdAt: '2025-12-05T11:00:00.000Z',
    createdBy: 'user-002',
  },
  {
    id: 'test-006',
    code: 'TEST-20251205-0006',
    name: 'Xác định Coliform nước ngầm',
    specimenId: 'spe-005',
    specimenCode: 'SPE-20251205-0005',
    testRequestId: 'req-003',
    method: 'TCVN 6187-1:2019',
    methodId: 'method-004',
    standard: 'QCVN 09-MT:2015/BTNMT',
    status: TestStatus.Assigned,
    assignedTo: 'user-003',
    assignedToName: 'Trần Thị B',
    department: 'Phòng Vi sinh',
    startDate: null,
    completedDate: null,
    notes: '',
    createdAt: '2025-12-05T11:30:00.000Z',
    createdBy: 'user-002',
  },
  // Tests for SPE-006 (Nước mặt)
  {
    id: 'test-007',
    code: 'TEST-20251205-0007',
    name: 'Xác định pH nước mặt',
    specimenId: 'spe-006',
    specimenCode: 'SPE-20251205-0006',
    testRequestId: 'req-003',
    method: 'TCVN 6492:2011',
    methodId: 'method-001',
    standard: 'QCVN 08-MT:2015/BTNMT',
    status: TestStatus.Pending,
    assignedTo: null,
    assignedToName: null,
    department: 'Phòng Hóa học',
    startDate: null,
    completedDate: null,
    notes: '',
    createdAt: '2025-12-05T14:00:00.000Z',
    createdBy: 'user-002',
  },
  {
    id: 'test-008',
    code: 'TEST-20251205-0008',
    name: 'Xác định kim loại nặng nước mặt',
    specimenId: 'spe-006',
    specimenCode: 'SPE-20251205-0006',
    testRequestId: 'req-003',
    method: 'TCVN 6193:1996',
    methodId: 'method-006',
    standard: 'QCVN 08-MT:2015/BTNMT',
    status: TestStatus.Pending,
    assignedTo: null,
    assignedToName: null,
    department: 'Phòng Hóa học',
    startDate: null,
    completedDate: null,
    notes: '',
    createdAt: '2025-12-05T14:30:00.000Z',
    createdBy: 'user-002',
  },
];

// =====================================================
// TEST RESULTS (Linked to Tests)
// =====================================================

export const mockTestResults = [
  // Results for TEST-001 (Độ ẩm cà phê)
  {
    id: 'result-001',
    testId: 'test-001',
    testCode: 'TEST-20251201-0001',
    testName: 'Xác định độ ẩm cà phê nhân',
    specimenId: 'spe-001',
    specimenCode: 'SPE-20251201-0001',
    parameter: 'Độ ẩm',
    value: '11.5',
    unit: '%',
    referenceRange: '≤ 12.5%',
    isPass: true,
    approvalStatus: ResultApprovalStatus.Step2Approved,
    testedBy: 'user-004',
    testedByName: 'Lê Văn C',
    testedDate: '2025-12-03T14:00:00.000Z',
    reviewedBy: 'user-005',
    reviewedByName: 'Phạm Thị D',
    reviewedDate: '2025-12-03T16:00:00.000Z',
    approvedBy: 'user-006',
    approvedByName: 'Hoàng Văn E',
    approvedDate: '2025-12-04T09:00:00.000Z',
    notes: '',
    createdAt: '2025-12-03T14:00:00.000Z',
  },
  // Results for TEST-002 (Caffeine)
  {
    id: 'result-002',
    testId: 'test-002',
    testCode: 'TEST-20251201-0002',
    testName: 'Xác định hàm lượng Caffeine',
    specimenId: 'spe-002',
    specimenCode: 'SPE-20251201-0002',
    parameter: 'Caffeine',
    value: '1.35',
    unit: '%',
    referenceRange: '0.8-2.5%',
    isPass: true,
    approvalStatus: ResultApprovalStatus.Step2Approved,
    testedBy: 'user-004',
    testedByName: 'Lê Văn C',
    testedDate: '2025-12-04T10:00:00.000Z',
    reviewedBy: 'user-005',
    reviewedByName: 'Phạm Thị D',
    reviewedDate: '2025-12-04T14:00:00.000Z',
    approvedBy: 'user-006',
    approvedByName: 'Hoàng Văn E',
    approvedDate: '2025-12-04T16:00:00.000Z',
    notes: '',
    createdAt: '2025-12-04T10:00:00.000Z',
  },
  // Results for TEST-003 (pH đất)
  {
    id: 'result-003',
    testId: 'test-003',
    testCode: 'TEST-20251203-0003',
    testName: 'Xác định pH đất',
    specimenId: 'spe-003',
    specimenCode: 'SPE-20251203-0003',
    parameter: 'pH',
    value: '5.8',
    unit: '',
    referenceRange: '5.5-7.0',
    isPass: true,
    approvalStatus: ResultApprovalStatus.Step1Reviewed,
    testedBy: 'user-003',
    testedByName: 'Trần Thị B',
    testedDate: '2025-12-05T11:00:00.000Z',
    reviewedBy: 'user-005',
    reviewedByName: 'Phạm Thị D',
    reviewedDate: '2025-12-05T15:00:00.000Z',
    approvedBy: null,
    approvedByName: null,
    approvedDate: null,
    notes: 'pH phù hợp cho trồng cà phê',
    createdAt: '2025-12-05T11:00:00.000Z',
  },
  // Results for TEST-005 (pH nước ngầm) - Draft
  {
    id: 'result-004',
    testId: 'test-005',
    testCode: 'TEST-20251205-0005',
    testName: 'Xác định pH nước ngầm',
    specimenId: 'spe-005',
    specimenCode: 'SPE-20251205-0005',
    parameter: 'pH',
    value: '6.8',
    unit: '',
    referenceRange: '5.5-8.5',
    isPass: true,
    approvalStatus: ResultApprovalStatus.Draft,
    testedBy: 'user-003',
    testedByName: 'Trần Thị B',
    testedDate: '2025-12-10T10:00:00.000Z',
    reviewedBy: null,
    reviewedByName: null,
    reviewedDate: null,
    approvedBy: null,
    approvedByName: null,
    approvedDate: null,
    notes: 'Kết quả sơ bộ, cần kiểm tra lại',
    createdAt: '2025-12-10T10:00:00.000Z',
  },
];

// =====================================================
// SPECIMEN HISTORY (Linked to Specimens)
// =====================================================

export const mockSpecimenHistories = [
  // History for SPE-001
  {
    id: 'history-001',
    specimenId: 'spe-001',
    specimenCode: 'SPE-20251201-0001',
    action: 'Tiếp nhận mẫu',
    location: 'Quầy tiếp nhận',
    status: SpecimenStatus.Received,
    performedBy: 'user-003',
    performedByName: 'Trần Thị B',
    performedAt: '2025-12-01T08:30:00.000Z',
    temperature: '25°C',
    humidity: '65%',
    notes: 'Mẫu đạt yêu cầu tiếp nhận',
    createdAt: '2025-12-01T08:30:00.000Z',
  },
  {
    id: 'history-002',
    specimenId: 'spe-001',
    specimenCode: 'SPE-20251201-0001',
    action: 'Chuyển vào phòng thử nghiệm',
    location: 'Phòng Hóa học',
    status: SpecimenStatus.Testing,
    performedBy: 'user-003',
    performedByName: 'Trần Thị B',
    performedAt: '2025-12-02T08:00:00.000Z',
    temperature: '25°C',
    humidity: '60%',
    notes: '',
    createdAt: '2025-12-02T08:00:00.000Z',
  },
  {
    id: 'history-003',
    specimenId: 'spe-001',
    specimenCode: 'SPE-20251201-0001',
    action: 'Hoàn tất thử nghiệm',
    location: 'Phòng Hóa học',
    status: SpecimenStatus.Storage,
    performedBy: 'user-004',
    performedByName: 'Lê Văn C',
    performedAt: '2025-12-03T16:00:00.000Z',
    temperature: '25°C',
    humidity: '60%',
    notes: 'Chuyển lưu kho',
    createdAt: '2025-12-03T16:00:00.000Z',
  },
  // History for SPE-005
  {
    id: 'history-004',
    specimenId: 'spe-005',
    specimenCode: 'SPE-20251205-0005',
    action: 'Tiếp nhận mẫu',
    location: 'Quầy tiếp nhận',
    status: SpecimenStatus.Received,
    performedBy: 'user-003',
    performedByName: 'Trần Thị B',
    performedAt: '2025-12-05T10:30:00.000Z',
    temperature: '25°C',
    humidity: '65%',
    notes: 'Mẫu nước ngầm, bảo quản lạnh',
    createdAt: '2025-12-05T10:30:00.000Z',
  },
  {
    id: 'history-005',
    specimenId: 'spe-005',
    specimenCode: 'SPE-20251205-0005',
    action: 'Chuyển vào tủ lạnh',
    location: 'Tủ lạnh 2-8°C - Phòng A1',
    status: SpecimenStatus.Storage,
    performedBy: 'user-003',
    performedByName: 'Trần Thị B',
    performedAt: '2025-12-05T10:45:00.000Z',
    temperature: '4°C',
    humidity: '50%',
    notes: '',
    createdAt: '2025-12-05T10:45:00.000Z',
  },
  {
    id: 'history-006',
    specimenId: 'spe-005',
    specimenCode: 'SPE-20251205-0005',
    action: 'Lấy mẫu thử nghiệm',
    location: 'Phòng Hóa học',
    status: SpecimenStatus.Testing,
    performedBy: 'user-003',
    performedByName: 'Trần Thị B',
    performedAt: '2025-12-06T08:00:00.000Z',
    temperature: '25°C',
    humidity: '60%',
    notes: 'Lấy 100ml để phân tích pH',
    createdAt: '2025-12-06T08:00:00.000Z',
  },
];

// =====================================================
// NCRs (Non-Conformance Reports)
// =====================================================

export const mockNCRs = [
  {
    id: 'ncr-001',
    ncrNumber: 'NCR-20251205-0001',
    title: 'Mẫu nước ngầm vượt ngưỡng kim loại nặng',
    description: 'Kết quả thử nghiệm cho thấy hàm lượng As trong mẫu nước ngầm vượt QCVN cho phép',
    type: 'TestResult',
    severity: NCRSeverity.Major,
    status: NCRStatus.InProgress,
    relatedEntityType: 'TestResult',
    relatedEntityId: 'result-004',
    relatedEntityCode: 'TEST-20251205-0005',
    department: 'Phòng Hóa học',
    reportedBy: 'user-004',
    reportedByName: 'Lê Văn C',
    reportedAt: '2025-12-10T11:00:00.000Z',
    assignedTo: 'user-005',
    assignedToName: 'Phạm Thị D',
    rootCause: 'Nhiễm bẩn tự nhiên từ địa chất',
    correctiveAction: 'Khuyến nghị khách hàng xử lý nước trước khi sử dụng',
    preventiveAction: 'Tăng cường giám sát vùng có nguy cơ cao',
    dueDate: '2025-12-15T17:00:00.000Z',
    closedDate: null,
    notes: '',
    createdAt: '2025-12-10T11:00:00.000Z',
  },
  {
    id: 'ncr-002',
    ncrNumber: 'NCR-20251128-0001',
    title: 'Sai lệch kết quả do thiết bị chưa hiệu chuẩn',
    description: 'Máy đo pH cho kết quả sai lệch do quá hạn hiệu chuẩn',
    type: 'Equipment',
    severity: NCRSeverity.Critical,
    status: NCRStatus.Resolved,
    relatedEntityType: 'Equipment',
    relatedEntityId: 'eqp-001',
    relatedEntityCode: 'EQP-PH-001',
    department: 'Phòng Hóa học',
    reportedBy: 'user-003',
    reportedByName: 'Trần Thị B',
    reportedAt: '2025-11-28T09:00:00.000Z',
    assignedTo: 'user-002',
    assignedToName: 'Nguyễn Văn A',
    rootCause: 'Không theo dõi lịch hiệu chuẩn thiết bị',
    correctiveAction: 'Hiệu chuẩn lại thiết bị, thử nghiệm lại các mẫu bị ảnh hưởng',
    preventiveAction: 'Thiết lập hệ thống nhắc nhở tự động về lịch hiệu chuẩn',
    dueDate: '2025-12-05T17:00:00.000Z',
    closedDate: '2025-12-03T16:00:00.000Z',
    notes: 'Đã hiệu chuẩn và thử nghiệm lại thành công',
    createdAt: '2025-11-28T09:00:00.000Z',
  },
];

// =====================================================
// REPORTS
// =====================================================

export const mockReports = [
  {
    id: 'rpt-001',
    reportNumber: 'RPT-20251205-0001',
    title: 'Phiếu kết quả thử nghiệm cà phê - REQ-20251201-0001',
    testRequestId: 'req-001',
    testRequestNumber: 'REQ-20251201-0001',
    customerId: 'cust-001',
    customerName: 'Công ty TNHH Cà phê Tây Nguyên',
    specimens: ['spe-001', 'spe-002'],
    specimenCodes: ['SPE-20251201-0001', 'SPE-20251201-0002'],
    tests: ['test-001', 'test-002'],
    testCodes: ['TEST-20251201-0001', 'TEST-20251201-0002'],
    status: ReportStatus.Issued,
    reportDate: '2025-12-05T00:00:00.000Z',
    issuedDate: '2025-12-05T14:00:00.000Z',
    preparedBy: 'user-004',
    preparedByName: 'Lê Văn C',
    reviewedBy: 'user-005',
    reviewedByName: 'Phạm Thị D',
    approvedBy: 'user-006',
    approvedByName: 'Hoàng Văn E',
    notes: '',
    createdAt: '2025-12-05T10:00:00.000Z',
  },
  {
    id: 'rpt-002',
    reportNumber: 'RPT-20251210-0001',
    title: 'Phiếu kết quả thử nghiệm đất - REQ-20251203-0002',
    testRequestId: 'req-002',
    testRequestNumber: 'REQ-20251203-0002',
    customerId: 'cust-002',
    customerName: 'HTX Nông nghiệp Ea H\'leo',
    specimens: ['spe-003', 'spe-004'],
    specimenCodes: ['SPE-20251203-0003', 'SPE-20251203-0004'],
    tests: ['test-003', 'test-004'],
    testCodes: ['TEST-20251203-0003', 'TEST-20251203-0004'],
    status: ReportStatus.PendingApproval,
    reportDate: '2025-12-10T00:00:00.000Z',
    issuedDate: null,
    preparedBy: 'user-003',
    preparedByName: 'Trần Thị B',
    reviewedBy: 'user-005',
    reviewedByName: 'Phạm Thị D',
    approvedBy: null,
    approvedByName: null,
    notes: 'Chờ phê duyệt kết quả Nitơ tổng',
    createdAt: '2025-12-10T09:00:00.000Z',
  },
];

// =====================================================
// TASK ASSIGNMENTS
// =====================================================

export const mockTaskAssignments = [
  {
    id: 'task-001',
    taskNumber: 'TASK-20251205-0001',
    title: 'Phân tích mẫu nước ngầm - Viện NC Tây Nguyên',
    description: 'Thực hiện phân tích các chỉ tiêu nước ngầm theo yêu cầu REQ-20251205-0003',
    type: 'adhoc',
    priority: 'high',
    status: TaskStatus.InProgress,
    assignedTo: 'user-003',
    assignedToName: 'Trần Thị B',
    assignedBy: 'user-002',
    assignedByName: 'Nguyễn Văn A',
    department: 'Phòng Hóa học',
    relatedTestRequests: ['req-003'],
    relatedSpecimens: ['spe-005', 'spe-006'],
    relatedTests: ['test-005', 'test-006', 'test-007', 'test-008'],
    dueDate: '2025-12-12T17:00:00.000Z',
    startDate: '2025-12-06T08:00:00.000Z',
    completedDate: null,
    progress: 50,
    notes: '',
    createdAt: '2025-12-05T11:00:00.000Z',
  },
  {
    id: 'task-002',
    taskNumber: 'TASK-20251203-0001',
    title: 'Phân tích mẫu đất - HTX Ea H\'leo',
    description: 'Thực hiện phân tích đất theo yêu cầu REQ-20251203-0002',
    type: 'adhoc',
    priority: 'medium',
    status: TaskStatus.InProgress,
    assignedTo: 'user-004',
    assignedToName: 'Lê Văn C',
    assignedBy: 'user-002',
    assignedByName: 'Nguyễn Văn A',
    department: 'Phòng Hóa học',
    relatedTestRequests: ['req-002'],
    relatedSpecimens: ['spe-003', 'spe-004'],
    relatedTests: ['test-003', 'test-004'],
    dueDate: '2025-12-10T17:00:00.000Z',
    startDate: '2025-12-04T08:00:00.000Z',
    completedDate: null,
    progress: 75,
    notes: '',
    createdAt: '2025-12-03T14:00:00.000Z',
  },
  {
    id: 'task-003',
    taskNumber: 'TASK-20251201-0001',
    title: 'Phân tích mẫu cà phê - Công ty Cà phê Tây Nguyên',
    description: 'Thực hiện phân tích cà phê theo yêu cầu REQ-20251201-0001',
    type: 'adhoc',
    priority: 'high',
    status: TaskStatus.Completed,
    assignedTo: 'user-004',
    assignedToName: 'Lê Văn C',
    assignedBy: 'user-002',
    assignedByName: 'Nguyễn Văn A',
    department: 'Phòng Hóa học',
    relatedTestRequests: ['req-001'],
    relatedSpecimens: ['spe-001', 'spe-002'],
    relatedTests: ['test-001', 'test-002'],
    dueDate: '2025-12-05T17:00:00.000Z',
    startDate: '2025-12-02T08:00:00.000Z',
    completedDate: '2025-12-04T16:00:00.000Z',
    progress: 100,
    notes: 'Hoàn thành đúng hạn',
    createdAt: '2025-12-01T10:00:00.000Z',
  },
];

// =====================================================
// SUBCONTRACTORS
// =====================================================

export const mockSubcontractors = [
  {
    id: 'sub-001',
    code: 'NTP-20250101-001',
    name: 'Viện Pasteur TP. Hồ Chí Minh',
    address: '167 Pasteur, Phường 8, Quận 3, TP. Hồ Chí Minh',
    phone: '028 3820 2878',
    email: 'info@pasteurhcm.gov.vn',
    contactPerson: 'TS. Nguyễn Văn X',
    taxCode: '0301234567',
    status: 'active',
    capabilities: ['Xét nghiệm COVID-19 khẳng định', 'Giải trình tự gen virus', 'Xét nghiệm bệnh nhiệt đới'],
    certifications: [
      {
        id: 'cert-001',
        name: 'ISO/IEC 17025:2017',
        issuedBy: 'BoA',
        issuedDate: '2023-01-15T00:00:00.000Z',
        expiryDate: '2026-01-14T00:00:00.000Z',
        status: 'valid',
      },
      {
        id: 'cert-002',
        name: 'VILAS',
        issuedBy: 'Bộ KH&CN',
        issuedDate: '2024-03-01T00:00:00.000Z',
        expiryDate: '2027-02-28T00:00:00.000Z',
        status: 'valid',
      },
    ],
    evaluationScore: 4.5,
    contractStartDate: '2025-01-01T00:00:00.000Z',
    contractEndDate: '2026-12-31T00:00:00.000Z',
    notes: '',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sub-002',
    code: 'NTP-20250101-002',
    name: 'Viện Vệ sinh Dịch tễ Trung ương',
    address: '1 Yersin, Hai Bà Trưng, Hà Nội',
    phone: '024 3971 5762',
    email: 'info@nihe.org.vn',
    contactPerson: 'PGS.TS. Trần Văn Y',
    taxCode: '0102345678',
    status: 'active',
    capabilities: ['Xét nghiệm HIV khẳng định', 'Xét nghiệm Viêm gan B/C', 'Nuôi cấy vi khuẩn đặc biệt'],
    certifications: [
      {
        id: 'cert-003',
        name: 'ISO/IEC 17025:2017',
        issuedBy: 'BoA',
        issuedDate: '2022-06-01T00:00:00.000Z',
        expiryDate: '2025-05-31T00:00:00.000Z',
        status: 'expiring',
      },
    ],
    evaluationScore: 4.8,
    contractStartDate: '2025-01-01T00:00:00.000Z',
    contractEndDate: '2025-12-31T00:00:00.000Z',
    notes: 'Đối tác chiến lược',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

// =====================================================
// AUDIT LOGS
// =====================================================

export const mockAuditLogs = [
  {
    id: 'log-001',
    action: 'CREATE',
    entityType: 'TestRequest',
    entityId: 'req-005',
    entityCode: 'REQ-20251210-0005',
    description: 'Tạo yêu cầu thử nghiệm mới',
    userId: 'user-002',
    userName: 'Nguyễn Văn A',
    ipAddress: '192.168.1.100',
    timestamp: '2025-12-10T14:00:00.000Z',
    details: { customerName: 'Sở Tài nguyên và Môi trường Đắk Lắk' },
  },
  {
    id: 'log-002',
    action: 'UPDATE',
    entityType: 'TestResult',
    entityId: 'result-003',
    entityCode: 'TEST-20251203-0003',
    description: 'Cập nhật kết quả thử nghiệm',
    userId: 'user-005',
    userName: 'Phạm Thị D',
    ipAddress: '192.168.1.101',
    timestamp: '2025-12-05T15:00:00.000Z',
    details: { oldStatus: 'Submitted', newStatus: 'Step1Reviewed' },
  },
  {
    id: 'log-003',
    action: 'APPROVE',
    entityType: 'Report',
    entityId: 'rpt-001',
    entityCode: 'RPT-20251205-0001',
    description: 'Phê duyệt phiếu kết quả',
    userId: 'user-006',
    userName: 'Hoàng Văn E',
    ipAddress: '192.168.1.102',
    timestamp: '2025-12-05T14:00:00.000Z',
    details: { reportTitle: 'Phiếu kết quả thử nghiệm cà phê' },
  },
];

// =====================================================
// DASHBOARD STATISTICS (Computed from above data)
// =====================================================

export const getDashboardStats = () => {
  const pendingRequests = mockTestRequests.filter(r => r.status === TestRequestStatus.Pending).length;
  const inProgressRequests = mockTestRequests.filter(r => r.status === TestRequestStatus.InProgress).length;
  const completedRequests = mockTestRequests.filter(r => r.status === TestRequestStatus.Completed).length;

  const pendingTests = mockTests.filter(t => t.status === TestStatus.Pending || t.status === TestStatus.Assigned).length;
  const inProgressTests = mockTests.filter(t => t.status === TestStatus.InProgress).length;
  const completedTests = mockTests.filter(t => t.status >= TestStatus.Completed).length;

  const openNCRs = mockNCRs.filter(n => n.status === NCRStatus.Open || n.status === NCRStatus.InProgress).length;

  const pendingApprovalResults = mockTestResults.filter(r =>
    r.approvalStatus === ResultApprovalStatus.Submitted ||
    r.approvalStatus === ResultApprovalStatus.Step1Reviewed
  ).length;

  return {
    totalRequests: mockTestRequests.length,
    pendingRequests,
    inProgressRequests,
    completedRequests,
    totalSpecimens: mockSpecimens.length,
    totalTests: mockTests.length,
    pendingTests,
    inProgressTests,
    completedTests,
    openNCRs,
    pendingApprovalResults,
    totalReports: mockReports.length,
  };
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export const getTestRequestById = (id: string) => mockTestRequests.find(r => r.id === id);
export const getSpecimenById = (id: string) => mockSpecimens.find(s => s.id === id);
export const getTestById = (id: string) => mockTests.find(t => t.id === id);
export const getTestResultById = (id: string) => mockTestResults.find(r => r.id === id);
export const getUserById = (id: string) => mockUsers.find(u => u.id === id);

export const getSpecimensByTestRequestId = (testRequestId: string) =>
  mockSpecimens.filter(s => s.testRequestId === testRequestId);

export const getTestsBySpecimenId = (specimenId: string) =>
  mockTests.filter(t => t.specimenId === specimenId);

export const getTestsByTestRequestId = (testRequestId: string) =>
  mockTests.filter(t => t.testRequestId === testRequestId);

export const getTestResultsByTestId = (testId: string) =>
  mockTestResults.filter(r => r.testId === testId);

export const getSpecimenHistoryBySpecimenId = (specimenId: string) =>
  mockSpecimenHistories.filter(h => h.specimenId === specimenId);
