import { useMemo } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import { ACTION_PERMISSION_MAP, ModuleName, ActionName } from '../constants/permissionMapping';
import { authService } from '../services/authService';

/**
 * Permission Level
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
 * Action Permission Result type
 */
export interface ActionPermissionResult {
  canView: boolean;
  canEdit: boolean;
  canAll: boolean;
  permissionLevel: PermissionLevel;
  hasNoPermission: boolean;
}

/**
 * Hook để kiểm tra quyền action theo Permission-based system
 *
 * Kiểm tra permission name từ ACTION_PERMISSION_MAP
 *
 * @param module - Tên module (testRequests, tasks, testing, qualityManagement, receipts, specimens, reports, ncr, etc.)
 * @param action - Tên action trong module
 * @returns Object chứa các quyền canView, canEdit, canAll và permissionLevel
 *
 * @example
 * // Trong TestRequestDetail.tsx
 * const { canEdit, canAll } = useActionPermission('testRequests', 'edit');
 *
 * // Trong SpecimenDetail.tsx
 * const { canEdit } = useActionPermission('specimens', 'edit');
 *
 * return (
 *   <>
 *     {canEdit && <Button onClick={handleEdit}>Chỉnh sửa</Button>}
 *   </>
 * );
 */
export const useActionPermission = <M extends ModuleName>(
  module: M,
  action: ActionName<M>
): ActionPermissionResult => {
  const permissionLevel = useMemo(() => {
    try {
      // Lấy thông tin user từ localStorage
      const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (!userInfoStr) return PermissionLevel.NONE;

      const userInfo = JSON.parse(userInfoStr);
      const userRoles: string[] = userInfo.roles || [];
      const userPermissions: string[] = userInfo.permissions || [];

      // Admin luôn có full quyền
      if (userRoles.includes('admin') || userPermissions.includes('Role:admin')) {
        return PermissionLevel.ALL;
      }

      // Kiểm tra permission-based
      const moduleMap = ACTION_PERMISSION_MAP[module];
      if (moduleMap) {
        const requiredPermission = moduleMap[action as keyof typeof moduleMap];
        if (requiredPermission && typeof requiredPermission === 'string' && authService.hasPermission(requiredPermission)) {
          // User có permission cụ thể => ALL level
          return PermissionLevel.ALL;
        }
      }

      // Không có quyền
      return PermissionLevel.NONE;
    } catch {
      return PermissionLevel.NONE;
    }
  }, [module, action]);

  return {
    /** Có quyền xem (VIEW trở lên) */
    canView: permissionLevel >= PermissionLevel.VIEW,
    /** Có quyền chỉnh sửa (EDIT trở lên) */
    canEdit: permissionLevel >= PermissionLevel.EDIT,
    /** Có full quyền (ALL) */
    canAll: permissionLevel >= PermissionLevel.ALL,
    /** Permission level hiện tại */
    permissionLevel,
    /** Không có quyền gì */
    hasNoPermission: permissionLevel === PermissionLevel.NONE,
  };
};

/**
 * Hook để kiểm tra nhiều action cùng lúc trong một module
 *
 * @param module - Tên module
 * @param actions - Mảng các action cần kiểm tra
 * @returns Object với key là action name và value là permission info
 *
 * @example
 * const permissions = useMultipleActionPermissions('testRequests', ['create', 'edit', 'cancel']);
 * // permissions.create.canAll, permissions.edit.canEdit, etc.
 */
export const useMultipleActionPermissions = <M extends ModuleName>(
  module: M,
  actions: ActionName<M>[]
): Record<string, ActionPermissionResult> => {
  const results = useMemo(() => {
    try {
      const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (!userInfoStr) {
        return actions.reduce((acc, action) => {
          acc[action as string] = {
            canView: false,
            canEdit: false,
            canAll: false,
            permissionLevel: PermissionLevel.NONE,
            hasNoPermission: true,
          };
          return acc;
        }, {} as Record<string, ActionPermissionResult>);
      }

      const userInfo = JSON.parse(userInfoStr);
      const userRoles: string[] = userInfo.roles || [];
      const userPermissions: string[] = userInfo.permissions || [];

      // Admin luôn có full quyền
      const isAdmin = userRoles.includes('admin') || userPermissions.includes('Role:admin');

      return actions.reduce((acc, action) => {
        let maxLevel = PermissionLevel.NONE;

        // Admin có full quyền
        if (isAdmin) {
          maxLevel = PermissionLevel.ALL;
        } else {
          // Kiểm tra permission-based
          const moduleMap = ACTION_PERMISSION_MAP[module];
          if (moduleMap) {
            const requiredPermission = moduleMap[action as keyof typeof moduleMap];
            if (requiredPermission && typeof requiredPermission === 'string' && authService.hasPermission(requiredPermission)) {
              maxLevel = PermissionLevel.ALL;
            }
          }
        }

        acc[action as string] = {
          canView: maxLevel >= PermissionLevel.VIEW,
          canEdit: maxLevel >= PermissionLevel.EDIT,
          canAll: maxLevel >= PermissionLevel.ALL,
          permissionLevel: maxLevel,
          hasNoPermission: maxLevel === PermissionLevel.NONE,
        };
        return acc;
      }, {} as Record<string, ActionPermissionResult>);
    } catch {
      return actions.reduce((acc, action) => {
        acc[action as string] = {
          canView: false,
          canEdit: false,
          canAll: false,
          permissionLevel: PermissionLevel.NONE,
          hasNoPermission: true,
        };
        return acc;
      }, {} as Record<string, ActionPermissionResult>);
    }
  }, [module, actions]);

  return results;
};

/**
 * Hook để lấy tất cả roles của user hiện tại
 */
export const useUserRoles = (): string[] => {
  return useMemo(() => {
    try {
      const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (!userInfoStr) return [];

      const userInfo = JSON.parse(userInfoStr);
      return userInfo.roles || [];
    } catch {
      return [];
    }
  }, []);
};

/**
 * Utility function để check permission (dùng ngoài React component)
 */
export const checkActionPermission = <M extends ModuleName>(
  module: M,
  action: ActionName<M>
): {
  canView: boolean;
  canEdit: boolean;
  canAll: boolean;
  permissionLevel: PermissionLevel;
} => {
  try {
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userInfoStr) {
      return {
        canView: false,
        canEdit: false,
        canAll: false,
        permissionLevel: PermissionLevel.NONE,
      };
    }

    const userInfo = JSON.parse(userInfoStr);
    const userRoles: string[] = userInfo.roles || [];
    const userPermissions: string[] = userInfo.permissions || [];

    // Admin luôn có full quyền
    if (userRoles.includes('admin') || userPermissions.includes('Role:admin')) {
      return {
        canView: true,
        canEdit: true,
        canAll: true,
        permissionLevel: PermissionLevel.ALL,
      };
    }

    // Kiểm tra permission-based
    const moduleMap = ACTION_PERMISSION_MAP[module];
    if (moduleMap) {
      const requiredPermission = moduleMap[action as keyof typeof moduleMap];
      if (requiredPermission && typeof requiredPermission === 'string' && authService.hasPermission(requiredPermission)) {
        return {
          canView: true,
          canEdit: true,
          canAll: true,
          permissionLevel: PermissionLevel.ALL,
        };
      }
    }

    // Không có quyền
    return {
      canView: false,
      canEdit: false,
      canAll: false,
      permissionLevel: PermissionLevel.NONE,
    };
  } catch {
    return {
      canView: false,
      canEdit: false,
      canAll: false,
      permissionLevel: PermissionLevel.NONE,
    };
  }
};

export default useActionPermission;
