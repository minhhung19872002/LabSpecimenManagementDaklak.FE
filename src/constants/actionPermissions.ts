import { ROLES } from './roles';

/**
 * Permission Level theo Permission Matrix
 * - NONE: Không có quyền
 * - VIEW (V): Chỉ có quyền xem
 * - EDIT (E): Có thể xem và sử dụng function trên page
 * - ALL (A): Full quyền
 */
export enum PermissionLevel {
  NONE = 0,
  VIEW = 1,
  EDIT = 2,
  ALL = 3,
}

/**
 * Action Permissions mapping theo Permission Matrix CSV
 *
 * Structure: Module -> Action -> Role -> PermissionLevel
 *
 * Legend từ Matrix:
 * - A (All): Full quyền
 * - E (Edit): Có thể xem và sử dụng function trên page
 * - V (View): Chỉ có quyền xem
 */
export const ACTION_PERMISSIONS = {
  // ============================================
  // PHIẾU YÊU CẦU (/test-requests)
  // ============================================
  testRequests: {
    // Tạo phiếu yêu cầu: BP Giao nhận (A), Admin (A)
    create: {
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Chỉnh sửa phiếu yêu cầu: BP Giao nhận (A), Admin (A)
    edit: {
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Xem phiếu yêu cầu: BP Giao nhận (A), QLCL (V), Admin (A)
    view: {
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.QUALITY_MANAGER]: PermissionLevel.VIEW,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Gửi mẫu: BP Giao nhận (A), Admin (A)
    sendSample: {
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Duyệt thay đổi: BP Giao nhận (V), QLCL (A), Admin (A)
    approveChange: {
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.VIEW,
      [ROLES.QUALITY_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Hủy yêu cầu: BP Giao nhận (A), Admin (A)
    cancel: {
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Gửi kế toán: BP Giao nhận (A), Admin (A)
    sendToAccounting: {
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // In phiếu XN: BP Giao nhận (A), Admin (A)
    printRequest: {
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
  },

  // ============================================
  // QUẢN LÝ CÔNG VIỆC (/tasks)
  // ============================================
  tasks: {
    // Xem danh sách công việc: QLKT (A), Admin (V)
    // Note: Người hỗ trợ (E) - sẽ thêm sau
    viewList: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
    // Xem chi tiết công việc: QLKT (A), Admin (V)
    viewDetail: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
    // Phân công thử nghiệm: QLKT (A), Admin (V)
    assignTesting: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
    // Thêm người hỗ trợ: QLKT (A), Admin (V)
    addSupporter: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
    // Sửa phương pháp: QLKT (A), Admin (V)
    editMethod: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
    // Duyệt kết quả: QLKT (A)
    // Note: Người hỗ trợ (E) - sẽ thêm sau
    approveResult: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
    },
  },

  // ============================================
  // QUẢN LÝ THỬ NGHIỆM (/testing)
  // ============================================
  testing: {
    // Xem danh sách công việc: QLKT (V), KTV (A), Admin (V)
    // Note: Người hỗ trợ (V) - sẽ thêm sau
    viewList: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.VIEW,
      [ROLES.LAB_TECHNICIAN]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
    // Xem chi tiết công việc: QLKT (V), KTV (A), Admin (V)
    viewDetail: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.VIEW,
      [ROLES.LAB_TECHNICIAN]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
    // Nhập kết quả: QLKT (V), KTV (A), Admin (V)
    inputResult: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.VIEW,
      [ROLES.LAB_TECHNICIAN]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
    // Sửa kết quả: QLKT (V), KTV (A), Admin (V)
    editResult: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.VIEW,
      [ROLES.LAB_TECHNICIAN]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
    // Gửi kết quả: QLKT (V), KTV (A), Admin (V)
    sendResult: {
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.VIEW,
      [ROLES.LAB_TECHNICIAN]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.VIEW,
    },
  },

  // ============================================
  // QUẢN LÝ CHẤT LƯỢNG (/quality-management)
  // ============================================
  qualityManagement: {
    // Xem kết quả đã duyệt kỹ thuật: QLCL (A), Admin (A)
    viewApprovedResults: {
      [ROLES.QUALITY_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Phê duyệt chất lượng: QLCL (A), Admin (A)
    approveQuality: {
      [ROLES.QUALITY_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Trả hồ sơ chỉnh sửa: QLCL (A), Admin (A)
    returnForEdit: {
      [ROLES.QUALITY_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Tạo report: QLCL (A), Admin (A)
    createReport: {
      [ROLES.QUALITY_MANAGER]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
  },

  // ============================================
  // QUẢN LÝ PHIẾU THU (/receipts)
  // ============================================
  receipts: {
    // Xem phiếu thu: Kế toán (A), Admin (A)
    view: {
      [ROLES.ACCOUNTANT]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
    // Xác nhận phiếu thu: Kế toán (A), Admin (A)
    confirm: {
      [ROLES.ACCOUNTANT]: PermissionLevel.ALL,
      [ROLES.ADMIN]: PermissionLevel.ALL,
    },
  },

  // ============================================
  // BÁO GIÁ (/quotations)
  // Tất cả roles đều có full quyền
  // ============================================
  quotations: {
    // Tạo báo giá: Tất cả roles (A)
    create: {
      [ROLES.ADMIN]: PermissionLevel.ALL,
      [ROLES.QUALITY_MANAGER]: PermissionLevel.ALL,
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.LAB_TECHNICIAN]: PermissionLevel.ALL,
      [ROLES.ACCOUNTANT]: PermissionLevel.ALL,
    },
    // Xem báo giá: Tất cả roles (A)
    view: {
      [ROLES.ADMIN]: PermissionLevel.ALL,
      [ROLES.QUALITY_MANAGER]: PermissionLevel.ALL,
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.LAB_TECHNICIAN]: PermissionLevel.ALL,
      [ROLES.ACCOUNTANT]: PermissionLevel.ALL,
    },
    // Sửa báo giá: Tất cả roles (A)
    edit: {
      [ROLES.ADMIN]: PermissionLevel.ALL,
      [ROLES.QUALITY_MANAGER]: PermissionLevel.ALL,
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.LAB_TECHNICIAN]: PermissionLevel.ALL,
      [ROLES.ACCOUNTANT]: PermissionLevel.ALL,
    },
    // Xóa báo giá: Tất cả roles (A)
    delete: {
      [ROLES.ADMIN]: PermissionLevel.ALL,
      [ROLES.QUALITY_MANAGER]: PermissionLevel.ALL,
      [ROLES.LAB_TECHNICAL_MANAGER]: PermissionLevel.ALL,
      [ROLES.SAMPLE_RECEIVER]: PermissionLevel.ALL,
      [ROLES.LAB_TECHNICIAN]: PermissionLevel.ALL,
      [ROLES.ACCOUNTANT]: PermissionLevel.ALL,
    },
  },
} as const;

// Type definitions
export type ModuleName = keyof typeof ACTION_PERMISSIONS;
export type ActionName<M extends ModuleName> = keyof (typeof ACTION_PERMISSIONS)[M];