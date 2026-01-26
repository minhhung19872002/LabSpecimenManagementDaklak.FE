/**
 * Master Data Action Types
 * Defines all possible actions that can be triggered from toolbar
 */

export const MASTER_DATA_ACTIONS = {
  // Common actions
  CREATE: 'create',
  IMPORT: 'import',
  EXPORT: 'export',
  DOWNLOAD_TEMPLATE: 'downloadTemplate',

  // Group-specific actions (for Indicators)
  CREATE_GROUP: 'createGroup',
  IMPORT_GROUP: 'importGroup',

  // Bulk actions (for Indicators)
  BULK_CREATE: 'bulkCreate',
} as const;

export type MasterDataAction = typeof MASTER_DATA_ACTIONS[keyof typeof MASTER_DATA_ACTIONS];
