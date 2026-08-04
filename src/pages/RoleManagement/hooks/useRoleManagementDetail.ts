import { useState, useCallback, useEffect, useMemo } from 'react';
import { message } from 'antd';
import roleManagementService, {
  RoleDetailDto,
  RoleUserDto,
  PermissionGroupDto,
  RoleWarehouseDto,
} from '../../../services/roleManagementService';
import { warehouseService } from '../../../services/masterDataService';

export interface UsersLocalParams {
  filter: string;
}

interface UseRoleManagementDetailReturn {
  roleDetail: RoleDetailDto | null;
  loading: boolean;
  usersLoading: boolean;
  permissionsLoading: boolean;
  saving: boolean;
  users: RoleUserDto[];
  usersTotalCount: number;
  usersParams: UsersLocalParams;
  permissionGroups: PermissionGroupDto[];
  availableUsers: RoleUserDto[];
  availableUsersLoading: boolean;
  roleWarehouses: RoleWarehouseDto[];
  warehousesLoading: boolean;
  totalWarehouseCount: number;
  refresh: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  handleUsersSearch: (value: string) => void;
  handleAddUser: (userId: string) => Promise<boolean>;
  handleRemoveUser: (userId: string) => Promise<boolean>;
  handleSearchAvailableUsers: (filter: string) => Promise<void>;
  handleSavePermissions: (permissions: string[]) => Promise<boolean>;
  handleUpdateRole: (name: string) => Promise<boolean>;
  handleSaveRoleWarehouses: (warehouseIds: string[]) => Promise<boolean>;
}

const DEFAULT_USERS_PARAMS: UsersLocalParams = {
  filter: '',
};

export const useRoleManagementDetail = (roleId: string): UseRoleManagementDetailReturn => {
  const [roleDetail, setRoleDetail] = useState<RoleDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<RoleUserDto[]>([]);
  const [usersParams, setUsersParams] = useState<UsersLocalParams>(DEFAULT_USERS_PARAMS);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroupDto[]>([]);
  const [availableUsers, setAvailableUsers] = useState<RoleUserDto[]>([]);
  const [availableUsersLoading, setAvailableUsersLoading] = useState(false);
  const [roleWarehouses, setRoleWarehouses] = useState<RoleWarehouseDto[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [totalWarehouseCount, setTotalWarehouseCount] = useState(0);

  // Local filtering and pagination
  const filteredUsers = useMemo(() => {
    if (!usersParams.filter.trim()) {
      return allUsers;
    }
    const lowerFilter = usersParams.filter.toLowerCase();
    return allUsers.filter(user =>
      user.userName?.toLowerCase().includes(lowerFilter) ||
      user.fullName?.toLowerCase().includes(lowerFilter) ||
      user.email?.toLowerCase().includes(lowerFilter) ||
      user.departmentName?.toLowerCase().includes(lowerFilter) ||
      user.position?.toLowerCase().includes(lowerFilter)
    );
  }, [allUsers, usersParams.filter]);

  const usersTotalCount = filteredUsers.length;
  const users = filteredUsers;

  const fetchRoleDetail = useCallback(async () => {
    if (!roleId) return;
    setLoading(true);
    try {
      const detail = await roleManagementService.get(roleId);
      setRoleDetail(detail);
      // Only update permissionGroups if data is valid array
      // For initial load, use empty array as fallback since there's no previous state
      const groups = detail?.permissionGroups;
      if (groups && Array.isArray(groups)) {
        setPermissionGroups(groups);
      } else {
        setPermissionGroups([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching role detail:', error);
      message.error('Không thể tải thông tin nhóm quyền');
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  const fetchUsers = useCallback(async () => {
    if (!roleId) return;
    setUsersLoading(true);
    try {
      const users = await roleManagementService.getRoleUsers(roleId);
      setAllUsers(users);
    } catch (error: unknown) {
      console.error('Error fetching role users:', error);
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setUsersLoading(false);
    }
  }, [roleId]);

  const fetchPermissions = useCallback(async () => {
    if (!roleDetail?.name) return;
    setPermissionsLoading(true);
    try {
      const permissions = await roleManagementService.getRolePermissions(roleDetail.name);
      // Only update state if API returns valid data
      // Keep current state if API returns null/undefined to preserve saved data on UI
      if (permissions && Array.isArray(permissions)) {
        setPermissionGroups(permissions);
      } else {
        console.warn('API returned invalid permissions data, keeping current state');
      }
    } catch (error: unknown) {
      console.error('Error fetching permissions:', error);
      message.error('Không thể tải danh sách quyền');
      // Don't clear permissionGroups on error - keep current state
    } finally {
      setPermissionsLoading(false);
    }
  }, [roleDetail?.name]);

  const fetchRoleWarehouses = useCallback(async () => {
    if (!roleId) return;
    setWarehousesLoading(true);
    try {
      const [data, allWarehouses] = await Promise.all([
        roleManagementService.getRoleWarehouses(roleId),
        warehouseService.getActive(),
      ]);
      if (data && Array.isArray(data)) {
        setRoleWarehouses(data);
      }
      setTotalWarehouseCount(allWarehouses.filter(w => !w.isDefault).length);
    } catch (error: unknown) {
      console.error('Error fetching role warehouses:', error);
    } finally {
      setWarehousesLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    fetchRoleDetail();
    fetchRoleWarehouses();
  }, [fetchRoleDetail, fetchRoleWarehouses]);

  useEffect(() => {
    if (roleId) {
      fetchUsers();
    }
  }, [roleId, fetchUsers]);

  const refresh = useCallback(async () => {
    await fetchRoleDetail();
  }, [fetchRoleDetail]);

  const refreshUsers = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  const handleUsersSearch = useCallback((value: string) => {
    setUsersParams({ filter: value });
  }, []);

  const handleAddUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!roleId) return false;
    try {
      await roleManagementService.addUserToRole(roleId, userId);
      message.success('Thêm người dùng thành công');
      await fetchUsers();
      await fetchRoleDetail();
      return true;
    } catch (error: unknown) {
      console.error('Error adding user to role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể thêm người dùng';
      message.error(errorMessage);
      return false;
    }
  }, [roleId, fetchUsers, fetchRoleDetail]);

  const handleRemoveUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!roleId) return false;
    try {
      await roleManagementService.removeUserFromRole(roleId, userId);
      message.success('Xóa người dùng khỏi nhóm thành công');
      await fetchUsers();
      await fetchRoleDetail();
      return true;
    } catch (error: unknown) {
      console.error('Error removing user from role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa người dùng';
      message.error(errorMessage);
      return false;
    }
  }, [roleId, fetchUsers, fetchRoleDetail]);

  const handleSearchAvailableUsers = useCallback(async (filter: string) => {
    if (!roleId) return;
    setAvailableUsersLoading(true);
    try {
      const users = await roleManagementService.getAvailableUsers(roleId, filter);
      setAvailableUsers(users);
    } catch (error: unknown) {
      console.error('Error fetching available users:', error);
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setAvailableUsersLoading(false);
    }
  }, [roleId]);

  const handleSavePermissions = useCallback(async (permissions: string[]): Promise<boolean> => {
    if (!roleDetail?.name) return false;
    setSaving(true);
    try {
      await roleManagementService.updateRolePermissions(roleDetail.name, { permissions });
      message.success('Lưu quyền truy cập thành công');
      await fetchPermissions();
      return true;
    } catch (error: unknown) {
      console.error('Error saving permissions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể lưu quyền truy cập';
      message.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [roleDetail?.name, fetchPermissions]);

  const handleUpdateRole = useCallback(async (name: string): Promise<boolean> => {
    if (!roleId || !roleDetail) return false;
    setSaving(true);
    try {
      await roleManagementService.update(roleId, {
        name,
        isDefault: roleDetail.isDefault,
        isPublic: roleDetail.isPublic,
        concurrencyStamp: roleDetail.concurrencyStamp,
      });
      message.success('Cập nhật nhóm quyền thành công');
      await fetchRoleDetail();
      return true;
    } catch (error: unknown) {
      console.error('Error updating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật nhóm quyền';
      message.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [roleId, roleDetail, fetchRoleDetail]);

  const handleSaveRoleWarehouses = useCallback(async (warehouseIds: string[]): Promise<boolean> => {
    if (!roleId) return false;
    setSaving(true);
    try {
      await roleManagementService.assignRoleWarehouses(roleId, { warehouseIds });
      message.success('Lưu phân quyền kho thành công');
      await fetchRoleWarehouses();
      return true;
    } catch (error: unknown) {
      console.error('Error saving role warehouses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể lưu phân quyền kho';
      message.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [roleId, fetchRoleWarehouses]);

  return {
    roleDetail,
    loading,
    usersLoading,
    permissionsLoading,
    saving,
    users,
    usersTotalCount,
    usersParams,
    permissionGroups,
    availableUsers,
    availableUsersLoading,
    roleWarehouses,
    warehousesLoading,
    totalWarehouseCount,
    refresh,
    refreshUsers,
    handleUsersSearch,
    handleAddUser,
    handleRemoveUser,
    handleSearchAvailableUsers,
    handleSavePermissions,
    handleUpdateRole,
    handleSaveRoleWarehouses,
  };
};

export default useRoleManagementDetail;
