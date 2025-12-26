/**
 * Application route paths constants
 * Use these constants instead of hardcoded strings for navigation
 */

export const PATH_ROUTES = {
  root: '/',

  dashboard: '/dashboard',

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

  qualityManagement: '/quality-management',

  reports: '/reports',

  statistics: '/statistics',

  ncr: '/ncr',

  subcontractors: '/subcontractors',

  masterData: '/master-data',

  organizations: '/organizations',

  auditLog: '/audit-log',

  employees: '/employees',

  settings: '/settings',

  login: '/login',
};
