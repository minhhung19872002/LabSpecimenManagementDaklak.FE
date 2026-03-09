/**
 * Application route paths constants
 * Use these constants instead of hardcoded strings for navigation
 */

export const PATH_ROUTES = {
  root: '/',

  dashboard: '/dashboard',

  quotations: {
    index: '/quotations',
    create: '/quotations/create',
    detail: (id: string) => `/quotations/${id}`,
    view: (id: string) => `/quotations/view/${id}`,
    edit: (id: string) => `/quotations/edit/${id}`,
  },

  testRequests: {
    index: '/test-requests',
    create: '/test-requests/create',
    detail: (id: string) => `/test-requests/${id}`,
    edit: (id: string) => `/test-requests/edit/${id}`,
  },

  specimens: {
    index: '/specimens',
    create: '/specimens/create',
    detail: (id: string) => `/specimens/${id}`,
    edit: (id: string) => `/specimens/edit/${id}`,
  },

  tests: {
    index: '/tests',
    create: '/tests/create',
    detail: (id: string) => `/tests/${id}`,
    edit: (id: string) => `/tests/edit/${id}`,
  },

  testResults: {
    index: '/test-results',
    create: '/test-results/create',
    detail: (id: string) => `/test-results/${id}`,
    edit: (id: string) => `/test-results/edit/${id}`,
  },

  specimenHistories: {
    index: '/specimen-histories',
    create: '/specimen-histories/create',
    detail: (id: string) => `/specimen-histories/${id}`,
    edit: (id: string) => `/specimen-histories/edit/${id}`,
  },

  tasks: {
    index: '/tasks',
    detail: (id: string) => `/tasks/${id}`,
  },

  testing: {
    index: '/testing',
    detail: (id: string) => `/testing/${id}`,
  },

  qualityManagement: {
    index: '/quality-management',
    detail: (id: string) => `/quality-management/${id}`,
  },

  reports: '/reports',

  statistics: '/statistics',

  ncr: '/ncr',

  receipts: {
    index: '/receipts',
    detail: (id: string) => `/receipts/${id}`,
  },

  subcontractors: '/subcontractors',

  masterData: '/master-data',

  organizations: {
    index: '/organizations',
    detail: (id: string) => `/organizations/${id}`,
  },

  auditLog: '/audit-log',

  employees: {
    index: '/employees',
    detail: (id: string) => `/employees/${id}`,
  },

  roleManagement: {
    index: '/role-management',
    detail: (id: string) => `/role-management/${id}`,
  },

  settings: '/settings',

  login: '/login',

  forbidden: '/403',
};
