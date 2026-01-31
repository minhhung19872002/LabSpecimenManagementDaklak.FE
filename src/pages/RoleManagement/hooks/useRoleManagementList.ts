import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import roleManagementService, { RoleDto, GetRolesParams } from '../../../services/roleManagementService';

interface UseRoleManagementListReturn {
  roles: RoleDto[];
  loading: boolean;
  totalCount: number;
  params: GetRolesParams;
  setParams: React.Dispatch<React.SetStateAction<GetRolesParams>>;
  refresh: () => Promise<void>;
  handleSearch: (value: string) => void;
  handlePageChange: (page: number, pageSize: number) => void;
  handleCreate: (name: string) => Promise<RoleDto | null>;
  handleDelete: (id: string) => Promise<boolean>;
}

const DEFAULT_PARAMS: GetRolesParams = {
  skipCount: 0,
  maxResultCount: 10,
  sorting: 'name',
  filter: '',
};

export const useRoleManagementList = (): UseRoleManagementListReturn => {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [params, setParams] = useState<GetRolesParams>(DEFAULT_PARAMS);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await roleManagementService.getList(params);
      // Filter out admin role - không hiển thị trên UI
      const filteredRoles = result.items.filter(
        (role) => role.name.toLowerCase() !== 'admin'
      );
      setRoles(filteredRoles);
      // Adjust total count to exclude admin role
      const adminCount = result.items.length - filteredRoles.length;
      setTotalCount(result.totalCount - adminCount);
    } catch (error: unknown) {
      console.error('Error fetching roles:', error);
      message.error('Không thể tải danh sách nhóm quyền');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const refresh = useCallback(async () => {
    await fetchRoles();
  }, [fetchRoles]);

  const handleSearch = useCallback((value: string) => {
    setParams(prev => ({
      ...prev,
      filter: value,
      skipCount: 0,
    }));
  }, []);

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    setParams(prev => ({
      ...prev,
      skipCount: (page - 1) * pageSize,
      maxResultCount: pageSize,
    }));
  }, []);

  const handleCreate = useCallback(async (name: string): Promise<RoleDto | null> => {
    try {
      const newRole = await roleManagementService.create({ name });
      message.success('Tạo nhóm quyền thành công');
      await fetchRoles();
      return newRole;
    } catch (error: unknown) {
      console.error('Error creating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo nhóm quyền';
      message.error(errorMessage);
      return null;
    }
  }, [fetchRoles]);

  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    try {
      await roleManagementService.delete(id);
      message.success('Xóa nhóm quyền thành công');
      await fetchRoles();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa nhóm quyền';
      message.error(errorMessage);
      return false;
    }
  }, [fetchRoles]);

  return {
    roles,
    loading,
    totalCount,
    params,
    setParams,
    refresh,
    handleSearch,
    handlePageChange,
    handleCreate,
    handleDelete,
  };
};

export default useRoleManagementList;
