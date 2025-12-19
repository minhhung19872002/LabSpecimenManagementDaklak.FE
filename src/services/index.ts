// API Client
export { api } from './api';
export { default as apiClient } from './api';

// Auth Service
export { authService } from './authService';
export { default as authServiceDefault } from './authService';

// Test Request Service
export { testRequestService } from './testRequestService';
export { default as testRequestServiceDefault } from './testRequestService';

// Specimen Service
export { specimenService } from './specimenService';
export { default as specimenServiceDefault } from './specimenService';

// Specimen History Service
export { specimenHistoryService } from './specimenHistoryService';
export { default as specimenHistoryServiceDefault } from './specimenHistoryService';

// Test Service
export { testService } from './testService';
export { default as testServiceDefault } from './testService';

// Test Result Service
export { testResultService } from './testResultService';
export { default as testResultServiceDefault } from './testResultService';

// NCR Service
export { ncrService } from './ncrService';
export type { NCRDto, CreateNCRDto, UpdateNCRDto, NCRType, NCRSeverity, NCRStatus } from './ncrService';

// Master Data Services
export {
  departmentService,
  specimenTypeService,
  testMethodService,
  storageLocationService,
  customerService
} from './masterDataService';
export type {
  DepartmentDto,
  CreateUpdateDepartmentDto,
  SpecimenTypeDto,
  CreateUpdateSpecimenTypeDto,
  TestMethodDto,
  CreateUpdateTestMethodDto,
  StorageLocationDto,
  CreateUpdateStorageLocationDto,
  CustomerDto,
  CreateUpdateCustomerDto,
} from './masterDataService';

// Report Service
export { reportService } from './reportService';
export type { ReportDto, CreateReportDto, UpdateReportDto, ReportStatus } from './reportService';

// Dashboard Service
export { dashboardService } from './dashboardService';
export type { DashboardSummaryDto, DashboardChartData, RecentActivityDto } from './dashboardService';

// Subcontractor Service
export { subcontractorService } from './subcontractorService';
export type {
  SubcontractorDto,
  SubcontractorCertificationDto,
  CreateUpdateSubcontractorDto,
  CreateSubcontractorCertificationDto
} from './subcontractorService';

// Statistics Service
export { statisticsService } from './statisticsService';
export type {
  StatisticsOverviewDto,
  SampleMatrixDto,
  TATComplianceDto,
  WorkloadByDepartmentDto,
  MonthlyTrendDto,
  StatisticsDataDto,
  StatisticsQueryParams
} from './statisticsService';

// Laboratory Task Service
export { laboratoryTaskService } from './laboratoryTaskService';
export { default as laboratoryTaskServiceDefault } from './laboratoryTaskService';
