import { useState, useCallback, useEffect, useMemo } from 'react';
import { message } from 'antd';
import roleManagementService, {
  RoleDetailDto,
  RoleUserDto,
  PermissionGroupDto,
} from '../../../services/roleManagementService';

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
  refresh: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  handleUsersSearch: (value: string) => void;
  handleAddUser: (userId: string) => Promise<boolean>;
  handleRemoveUser: (userId: string) => Promise<boolean>;
  handleSearchAvailableUsers: (filter: string) => Promise<void>;
  handleSavePermissions: (permissions: string[]) => Promise<boolean>;
  handleUpdateRole: (name: string) => Promise<boolean>;
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
      setPermissionGroups(detail.permissionGroups);
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
      setPermissionGroups(permissions);
    } catch (error: unknown) {
      console.error('Error fetching permissions:', error);
      message.error('Không thể tải danh sách quyền');
    } finally {
      setPermissionsLoading(false);
    }
  }, [roleDetail?.name]);

  useEffect(() => {
    fetchRoleDetail();
  }, [fetchRoleDetail]);

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
    refresh,
    refreshUsers,
    handleUsersSearch,
    handleAddUser,
    handleRemoveUser,
    handleSearchAvailableUsers,
    handleSavePermissions,
    handleUpdateRole,
  };
};

export default useRoleManagementDetail;
