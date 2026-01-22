/**
 * Permission Mapping - Map routes và actions với permission names
 *
 * Permission names phải khớp với backend LabSpecimenManagementPermissions
 */

// Permission prefix
const P = 'LabSpecimenManagement';

/**
 * Permission constants - phải khớp với backend
 */
export const PERMISSIONS = {
  // Dashboard
  Dashboard: `${P}.Dashboard`,

  // Statistics
  Statistics: {
    Default: `${P}.Statistics`,
    Export: `${P}.Statistics.Export`,
  },

  // Test Requests
  TestRequests: {
    Default: `${P}.TestRequests`,
    Create: `${P}.TestRequests.Create`,
    Edit: `${P}.TestRequests.Edit`,
    Delete: `${P}.TestRequests.Delete`,
  },

  // Specimens
  Specimens: {
    Default: `${P}.Specimens`,
    Create: `${P}.Specimens.Create`,
    Edit: `${P}.Specimens.Edit`,
    Delete: `${P}.Specimens.Delete`,
  },

  // Tests
  Tests: {
    Default: `${P}.Tests`,
    Create: `${P}.Tests.Create`,
    Edit: `${P}.Tests.Edit`,
    Delete: `${P}.Tests.Delete`,
    Assign: `${P}.Tests.Assign`,
    Execute: `${P}.Tests.Execute`,
    Review: `${P}.Tests.Review`,
    Approve: `${P}.Tests.Approve`,
  },

  // Test Results
  TestResults: {
    Default: `${P}.TestResults`,
    Create: `${P}.TestResults.Create`,
    Edit: `${P}.TestResults.Edit`,
    Delete: `${P}.TestResults.Delete`,
    Submit: `${P}.TestResults.Submit`,
    Review: `${P}.TestResults.Review`,
    Approve: `${P}.TestResults.Approve`,
    Reject: `${P}.TestResults.Reject`,
  },

  // Reports
  Reports: {
    Default: `${P}.Reports`,
    Create: `${P}.Reports.Create`,
    Edit: `${P}.Reports.Edit`,
    Delete: `${P}.Reports.Delete`,
    Approve: `${P}.Reports.Approve`,
    Export: `${P}.Reports.Export`,
    Send: `${P}.Reports.Send`,
  },

  // NCRs
  NCRs: {
    Default: `${P}.NCRs`,
    Create: `${P}.NCRs.Create`,
    Edit: `${P}.NCRs.Edit`,
    Delete: `${P}.NCRs.Delete`,
    Close: `${P}.NCRs.Close`,
    Assign: `${P}.NCRs.Assign`,
  },

  // Laboratory Tasks
  LaboratoryTasks: {
    Default: `${P}.LaboratoryTasks`,
    Edit: `${P}.LaboratoryTasks.Edit`,
    UpdateStatus: `${P}.LaboratoryTasks.UpdateStatus`,
    ViewAll: `${P}.LaboratoryTasks.ViewAll`,
  },

  // Task Assignments
  TaskAssignments: {
    Default: `${P}.TaskAssignments`,
    Create: `${P}.TaskAssignments.Create`,
    Edit: `${P}.TaskAssignments.Edit`,
    Delete: `${P}.TaskAssignments.Delete`,
    Accept: `${P}.TaskAssignments.Accept`,
    Reject: `${P}.TaskAssignments.Reject`,
    Complete: `${P}.TaskAssignments.Complete`,
  },

  // Quotations
  Quotations: {
    Default: `${P}.Quotations`,
    Create: `${P}.Quotations.Create`,
    Edit: `${P}.Quotations.Edit`,
    Delete: `${P}.Quotations.Delete`,
  },

  // Receipts
  Receipts: {
    Default: `${P}.Receipts`,
    View: `${P}.Receipts.View`,
    Confirm: `${P}.Receipts.Confirm`,
  },

  // Subcontractors
  Subcontractors: {
    Default: `${P}.Subcontractors`,
    Create: `${P}.Subcontractors.Create`,
    Edit: `${P}.Subcontractors.Edit`,
    Delete: `${P}.Subcontractors.Delete`,
  },

  // Master Data - Unified Permissions (for all master data features)
  MasterData: {
    Default: `${P}.MasterData`,
    View: `${P}.MasterData.View`,
    Create: `${P}.MasterData.Create`,
    Edit: `${P}.MasterData.Edit`,
    Delete: `${P}.MasterData.Delete`,
    Import: `${P}.MasterData.Import`,
  },

  // Master Data - Individual (DEPRECATED - use MasterData instead)
  Departments: {
    Default: `${P}.Departments`,
    Create: `${P}.Departments.Create`,
    Edit: `${P}.Departments.Edit`,
    Delete: `${P}.Departments.Delete`,
  },
  SpecimenTypes: {
    Default: `${P}.SpecimenTypes`,
    Create: `${P}.SpecimenTypes.Create`,
    Edit: `${P}.SpecimenTypes.Edit`,
    Delete: `${P}.SpecimenTypes.Delete`,
  },
  TestMethods: {
    Default: `${P}.TestMethods`,
    Create: `${P}.TestMethods.Create`,
    Edit: `${P}.TestMethods.Edit`,
    Delete: `${P}.TestMethods.Delete`,
  },
  Standards: {
    Default: `${P}.Standards`,
    Create: `${P}.Standards.Create`,
    Edit: `${P}.Standards.Edit`,
    Delete: `${P}.Standards.Delete`,
  },
  StorageLocations: {
    Default: `${P}.StorageLocations`,
    Create: `${P}.StorageLocations.Create`,
    Edit: `${P}.StorageLocations.Edit`,
    Delete: `${P}.StorageLocations.Delete`,
  },
  Customers: {
    Default: `${P}.Customers`,
    Create: `${P}.Customers.Create`,
    Edit: `${P}.Customers.Edit`,
    Delete: `${P}.Customers.Delete`,
  },
  IndicatorGroups: {
    Default: `${P}.IndicatorGroups`,
    Create: `${P}.IndicatorGroups.Create`,
    Edit: `${P}.IndicatorGroups.Edit`,
    Delete: `${P}.IndicatorGroups.Delete`,
    Import: `${P}.IndicatorGroups.Import`,
  },
  Indicators: {
    Default: `${P}.Indicators`,
    Create: `${P}.Indicators.Create`,
    Edit: `${P}.Indicators.Edit`,
    Delete: `${P}.Indicators.Delete`,
    Import: `${P}.Indicators.Import`,
  },
  Laboratories: {
    Default: `${P}.Laboratories`,
    Create: `${P}.Laboratories.Create`,
    Edit: `${P}.Laboratories.Edit`,
    Delete: `${P}.Laboratories.Delete`,
  },
  SampleConditions: {
    Default: `${P}.SampleConditions`,
    Create: `${P}.SampleConditions.Create`,
    Edit: `${P}.SampleConditions.Edit`,
    Delete: `${P}.SampleConditions.Delete`,
  },

  // Users
  Users: {
    Default: `${P}.Users`,
    Create: `${P}.Users.Create`,
    Edit: `${P}.Users.Edit`,
    Delete: `${P}.Users.Delete`,
    ManageRoles: `${P}.Users.ManageRoles`,
  },

  // Role Management
  RoleManagement: {
    Default: `${P}.RoleManagement`,
    Create: `${P}.RoleManagement.Create`,
    Edit: `${P}.RoleManagement.Edit`,
    Delete: `${P}.RoleManagement.Delete`,
    ManagePermissions: `${P}.RoleManagement.ManagePermissions`,
    ManageUsers: `${P}.RoleManagement.ManageUsers`,
  },

  // Settings
  Settings: {
    Default: `${P}.Settings`,
    Edit: `${P}.Settings.Edit`,
  },

  // Audit Logs
  AuditLogs: {
    Default: `${P}.AuditLogs`,
  },

  // Import
  Import: {
    Default: `${P}.Import`,
    TestRequests: `${P}.Import.TestRequests`,
    Specimens: `${P}.Import.Specimens`,
    Customers: `${P}.Import.Customers`,
    TestMethods: `${P}.Import.TestMethods`,
    Standards: `${P}.Import.Standards`,
  },
} as const;

/**
 * Route Permission Map - Map route paths với required permissions
 * User cần có ÍT NHẤT 1 trong các permissions để truy cập route
 */
export const ROUTE_PERMISSION_MAP: Record<string, string[]> = {
  // Dashboard & Statistics
  '/dashboard': [PERMISSIONS.Dashboard],
  '/statistics': [PERMISSIONS.Statistics.Default],

  // Test Requests
  '/test-requests': [PERMISSIONS.TestRequests.Default],

  // Tasks (Quản lý công việc)
  '/tasks': [PERMISSIONS.LaboratoryTasks.Default],

  // Testing (Quản lý thử nghiệm - KTV)
  '/testing': [PERMISSIONS.Tests.Default],

  // Quality Management
  '/quality-management': [PERMISSIONS.TestResults.Review, PERMISSIONS.TestResults.Approve],

  // Specimens
  '/specimens': [PERMISSIONS.Specimens.Default],

  // Specimen Histories
  '/specimen-histories': [PERMISSIONS.Specimens.Default],

  // Reports
  '/reports': [PERMISSIONS.Reports.Default],

  // NCR
  '/ncr': [PERMISSIONS.NCRs.Default],

  // Receipts
  '/receipts': [PERMISSIONS.Receipts.View, PERMISSIONS.Receipts.Default],

  // Quotations
  '/quotations': [PERMISSIONS.Quotations.Default],

  // Subcontractors
  '/subcontractors': [PERMISSIONS.Subcontractors.Default],

  // Master Data
  '/master-data': [
    PERMISSIONS.Indicators.Default,
    PERMISSIONS.SpecimenTypes.Default,
    PERMISSIONS.Standards.Default,
    PERMISSIONS.TestMethods.Default,
    PERMISSIONS.StorageLocations.Default,
    PERMISSIONS.Customers.Default,
    PERMISSIONS.Departments.Default,
    PERMISSIONS.Laboratories.Default,
    PERMISSIONS.SampleConditions.Default,
  ],

  // Organizations
  '/organizations': [PERMISSIONS.Customers.Default],

  // Audit Log
  '/audit-log': [PERMISSIONS.AuditLogs.Default],

  // Employees
  '/employees': [PERMISSIONS.Users.Default],

  // Role Management
  '/role-management': [PERMISSIONS.RoleManagement.Default],

  // Settings
  '/settings': [PERMISSIONS.Settings.Default],
};

/**
 * Action Permission Map - Map module actions với specific permissions
 */
export const ACTION_PERMISSION_MAP = {
  testRequests: {
    create: PERMISSIONS.TestRequests.Create,
    edit: PERMISSIONS.TestRequests.Edit,
    view: PERMISSIONS.TestRequests.Default,
    delete: PERMISSIONS.TestRequests.Delete,
    sendSample: PERMISSIONS.Specimens.Create,
    approveChange: PERMISSIONS.TestResults.Approve,
    cancel: PERMISSIONS.TestRequests.Delete,
    sendToAccounting: PERMISSIONS.TestRequests.Edit,
    printRequest: PERMISSIONS.TestRequests.Default,
  },
  tasks: {
    viewList: PERMISSIONS.LaboratoryTasks.Default,
    viewDetail: PERMISSIONS.LaboratoryTasks.ViewAll,
    assignTesting: PERMISSIONS.Tests.Assign,
    addSupporter: PERMISSIONS.LaboratoryTasks.Edit,
    editMethod: PERMISSIONS.Tests.Edit,
    approveResult: PERMISSIONS.TestResults.Review,
  },
  testing: {
    viewList: PERMISSIONS.Tests.Default,
    viewDetail: PERMISSIONS.Tests.Execute,
    inputResult: PERMISSIONS.TestResults.Create,
    editResult: PERMISSIONS.TestResults.Edit,
    sendResult: PERMISSIONS.TestResults.Submit,
  },
  qualityManagement: {
    viewApprovedResults: PERMISSIONS.TestResults.Review,
    approveQuality: PERMISSIONS.TestResults.Approve,
    returnForEdit: PERMISSIONS.TestResults.Reject,
    createReport: PERMISSIONS.Reports.Create,
  },
  receipts: {
    view: PERMISSIONS.Receipts.View,
    confirm: PERMISSIONS.Receipts.Confirm,
  },
  quotations: {
    create: PERMISSIONS.Quotations.Create,
    view: PERMISSIONS.Quotations.Default,
    edit: PERMISSIONS.Quotations.Edit,
    delete: PERMISSIONS.Quotations.Delete,
  },
  specimens: {
    view: PERMISSIONS.Specimens.Default,
    create: PERMISSIONS.Specimens.Create,
    edit: PERMISSIONS.Specimens.Edit,
    delete: PERMISSIONS.Specimens.Delete,
  },
  reports: {
    view: PERMISSIONS.Reports.Default,
    create: PERMISSIONS.Reports.Create,
    edit: PERMISSIONS.Reports.Edit,
    delete: PERMISSIONS.Reports.Delete,
    approve: PERMISSIONS.Reports.Approve,
    export: PERMISSIONS.Reports.Export,
    send: PERMISSIONS.Reports.Send,
  },
  ncr: {
    view: PERMISSIONS.NCRs.Default,
    create: PERMISSIONS.NCRs.Create,
    edit: PERMISSIONS.NCRs.Edit,
    delete: PERMISSIONS.NCRs.Delete,
    close: PERMISSIONS.NCRs.Close,
    assign: PERMISSIONS.NCRs.Assign,
  },
  masterData: {
    view: PERMISSIONS.Indicators.Default,
    create: PERMISSIONS.Indicators.Create,
    edit: PERMISSIONS.Indicators.Edit,
    delete: PERMISSIONS.Indicators.Delete,
    import: PERMISSIONS.Indicators.Import,
  },
  employees: {
    view: PERMISSIONS.Users.Default,
    create: PERMISSIONS.Users.Create,
    edit: PERMISSIONS.Users.Edit,
    delete: PERMISSIONS.Users.Delete,
    manageRoles: PERMISSIONS.Users.ManageRoles,
  },
  roleManagement: {
    view: PERMISSIONS.RoleManagement.Default,
    create: PERMISSIONS.RoleManagement.Create,
    edit: PERMISSIONS.RoleManagement.Edit,
    delete: PERMISSIONS.RoleManagement.Delete,
    managePermissions: PERMISSIONS.RoleManagement.ManagePermissions,
    manageUsers: PERMISSIONS.RoleManagement.ManageUsers,
  },
} as const;

/**
 * Menu Permission Map - Map menu items với required permissions
 */
export const MENU_PERMISSION_MAP = {
  dashboard: [PERMISSIONS.Dashboard],
  statistics: [PERMISSIONS.Statistics.Default],
  quotations: [PERMISSIONS.Quotations.Default],
  receipts: [PERMISSIONS.Receipts.View, PERMISSIONS.Receipts.Default],
  requests: [PERMISSIONS.TestRequests.Default], // menu key is 'requests'
  testRequests: [PERMISSIONS.TestRequests.Default], // alias
  taskManagement: [PERMISSIONS.LaboratoryTasks.Default], // menu key is 'taskManagement'
  tasks: [PERMISSIONS.LaboratoryTasks.Default], // alias
  testManagement: [PERMISSIONS.Tests.Default], // menu key is 'testManagement'
  testing: [PERMISSIONS.Tests.Default], // alias
  qualityManagement: [PERMISSIONS.TestResults.Review, PERMISSIONS.TestResults.Approve],
  specimens: [PERMISSIONS.Specimens.Default],
  specimenHistories: [PERMISSIONS.Specimens.Default],
  ncr: [PERMISSIONS.NCRs.Default],
  reports: [PERMISSIONS.Reports.Default],
  subcontractors: [PERMISSIONS.Subcontractors.Default],
  masterData: [
    PERMISSIONS.Indicators.Default,
    PERMISSIONS.SpecimenTypes.Default,
    PERMISSIONS.Standards.Default,
  ],
  organizations: [PERMISSIONS.Customers.Default],
  auditLog: [PERMISSIONS.AuditLogs.Default],
  employees: [PERMISSIONS.Users.Default],
  roleManagement: [PERMISSIONS.RoleManagement.Default],
  settings: [PERMISSIONS.Settings.Default],
} as const;

export type ModuleName = keyof typeof ACTION_PERMISSION_MAP;
export type ActionName<M extends ModuleName> = keyof (typeof ACTION_PERMISSION_MAP)[M];
