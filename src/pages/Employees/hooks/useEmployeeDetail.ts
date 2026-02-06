import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import employeeService, {
  EmployeeDto,
  UpdateEmployeeDto,
  PermissionGroupDto,
  UserRoleDto,
} from '../../../services/employeeService';

interface UseEmployeeDetailReturn {
  employee: EmployeeDto | null;
  loading: boolean;
  saving: boolean;
  permissionsLoading: boolean;
  rolesLoading: boolean;
  permissionGroups: PermissionGroupDto[];
  userRoles: UserRoleDto[];
  refresh: () => Promise<void>;
  handleUpdateEmployee: (data: UpdateEmployeeDto) => Promise<boolean>;
  handleSavePermissions: (permissions: string[]) => Promise<boolean>;
  handleAddRole: (roleName: string) => Promise<boolean>;
  handleRemoveRole: (roleName: string) => Promise<boolean>;
}

export const useEmployeeDetail = (employeeId: string): UseEmployeeDetailReturn => {
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroupDto[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleDto[]>([]);

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const data = await employeeService.get(employeeId);
      setEmployee(data);
    } catch (error: unknown) {
      console.error('Error fetching employee:', error);
      message.error('Không thể tải thông tin nhân viên');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  const fetchPermissions = useCallback(async () => {
    if (!employeeId) return;
    setPermissionsLoading(true);
    try {
      const permissions = await employeeService.getUserPermissions(employeeId);
      if (permissions && Array.isArray(permissions)) {
        setPermissionGroups(permissions);
      }
    } catch (error: unknown) {
      console.error('Error fetching user permissions:', error);
      message.error('Không thể tải quyền truy cập');
    } finally {
      setPermissionsLoading(false);
    }
  }, [employeeId]);

  const fetchRoles = useCallback(async () => {
    if (!employeeId) return;
    setRolesLoading(true);
    try {
      const roles = await employeeService.getUserRoles(employeeId);
      if (roles && Array.isArray(roles)) {
        setUserRoles(roles);
      }
    } catch (error: unknown) {
      console.error('Error fetching user roles:', error);
      message.error('Không thể tải danh sách nhóm quyền');
    } finally {
      setRolesLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmployee();
    fetchPermissions();
    fetchRoles();
  }, [fetchEmployee, fetchPermissions, fetchRoles]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchEmployee(), fetchPermissions(), fetchRoles()]);
  }, [fetchEmployee, fetchPermissions, fetchRoles]);

  const handleUpdateEmployee = useCallback(async (data: UpdateEmployeeDto): Promise<boolean> => {
    if (!employeeId) return false;
    setSaving(true);
    try {
      await employeeService.update(employeeId, data);
      message.success('Cập nhật thông tin thành công');
      await fetchEmployee();
      return true;
    } catch (error: unknown) {
      console.error('Error updating employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật thông tin';
      message.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [employeeId, fetchEmployee]);

  const handleSavePermissions = useCallback(async (permissions: string[]): Promise<boolean> => {
    if (!employeeId) return false;
    setSaving(true);
    try {
      await employeeService.updateUserPermissions(employeeId, { permissions });
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
  }, [employeeId, fetchPermissions]);

  const handleAddRole = useCallback(async (roleName: string): Promise<boolean> => {
    if (!employeeId) return false;
    setSaving(true);
    try {
      await employeeService.addRoleToUser(employeeId, roleName);
      message.success('Thêm nhóm quyền thành công');
      await Promise.all([fetchRoles(), fetchEmployee()]);
      return true;
    } catch (error: unknown) {
      console.error('Error adding role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể thêm nhóm quyền';
      message.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [employeeId, fetchRoles, fetchEmployee]);

  const handleRemoveRole = useCallback(async (roleName: string): Promise<boolean> => {
    if (!employeeId) return false;
    setSaving(true);
    try {
      await employeeService.removeRoleFromUser(employeeId, roleName);
      message.success('Xóa nhóm quyền thành công');
      await Promise.all([fetchRoles(), fetchEmployee()]);
      return true;
    } catch (error: unknown) {
      console.error('Error removing role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa nhóm quyền';
      message.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [employeeId, fetchRoles, fetchEmployee]);

  return {
    employee,
    loading,
    saving,
    permissionsLoading,
    rolesLoading,
    permissionGroups,
    userRoles,
    refresh,
    handleUpdateEmployee,
    handleSavePermissions,
    handleAddRole,
    handleRemoveRole,
  };
};

export default useEmployeeDetail;
