import { useMemo } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import { ACTION_PERMISSIONS, PermissionLevel, ModuleName, ActionName } from '../constants/actionPermissions';

/**
 * Hook để kiểm tra quyền action theo Permission Matrix
 *
 * @param module - Tên module (testRequests, tasks, testing, qualityManagement, receipts)
 * @param action - Tên action trong module
 * @returns Object chứa các quyền canView, canEdit, canAll và permissionLevel
 *
 * @example
 * // Trong TestRequestDetail.tsx
 * const { canEdit, canAll } = useActionPermission('testRequests', 'edit');
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
) => {
  const permissionLevel = useMemo(() => {
    try {
      // Lấy thông tin user từ localStorage
      const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (!userInfoStr) return PermissionLevel.NONE;

      const userInfo = JSON.parse(userInfoStr);
      const userRoles: string[] = userInfo.roles || [];

      if (!userRoles || userRoles.length === 0) return PermissionLevel.NONE;

      // Lấy permissions cho module
      const modulePermissions = ACTION_PERMISSIONS[module];
      if (!modulePermissions) return PermissionLevel.NONE;

      // Lấy permissions cho action
      const actionPermissions = modulePermissions[action as keyof typeof modulePermissions];
      if (!actionPermissions) return PermissionLevel.NONE;

      // Tìm permission level cao nhất từ các role của user
      let maxLevel = PermissionLevel.NONE;
      for (const role of userRoles) {
        const level = (actionPermissions as Record<string, PermissionLevel>)[role];
        if (level !== undefined && level > maxLevel) {
          maxLevel = level;
        }
      }

      return maxLevel;
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
) => {
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
        }, {} as Record<string, ReturnType<typeof useActionPermission>>);
      }

      const userInfo = JSON.parse(userInfoStr);
      const userRoles: string[] = userInfo.roles || [];
      const modulePermissions = ACTION_PERMISSIONS[module];

      return actions.reduce((acc, action) => {
        let maxLevel = PermissionLevel.NONE;

        if (modulePermissions && userRoles.length > 0) {
          const actionPermissions = modulePermissions[action as keyof typeof modulePermissions];
          if (actionPermissions) {
            for (const role of userRoles) {
              const level = (actionPermissions as Record<string, PermissionLevel>)[role];
              if (level !== undefined && level > maxLevel) {
                maxLevel = level;
              }
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
      }, {} as Record<string, ReturnType<typeof useActionPermission>>);
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
      }, {} as Record<string, ReturnType<typeof useActionPermission>>);
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

    const modulePermissions = ACTION_PERMISSIONS[module];
    if (!modulePermissions) {
      return {
        canView: false,
        canEdit: false,
        canAll: false,
        permissionLevel: PermissionLevel.NONE,
      };
    }

    const actionPermissions = modulePermissions[action as keyof typeof modulePermissions];
    if (!actionPermissions) {
      return {
        canView: false,
        canEdit: false,
        canAll: false,
        permissionLevel: PermissionLevel.NONE,
      };
    }

    let maxLevel = PermissionLevel.NONE;
    for (const role of userRoles) {
      const level = (actionPermissions as Record<string, PermissionLevel>)[role];
      if (level !== undefined && level > maxLevel) {
        maxLevel = level;
      }
    }

    return {
      canView: maxLevel >= PermissionLevel.VIEW,
      canEdit: maxLevel >= PermissionLevel.EDIT,
      canAll: maxLevel >= PermissionLevel.ALL,
      permissionLevel: maxLevel,
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