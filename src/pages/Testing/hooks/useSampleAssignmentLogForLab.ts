import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { qualityManagementService } from '../../../services/qualityManagementService';
import { laboratoryService } from '../../../services/masterDataService';
import {
  SampleAssignmentLogDto,
  GetSampleAssignmentLogInput,
} from '../../../types/qualityManagement';
import { TestRequestStatus } from '../../../types/testRequest';
import { STORAGE_KEYS } from '../../../constants';
import { UserInfo } from '../../../services/authService';

interface UseSampleAssignmentLogForLabResult {
  loading: boolean;
  data: SampleAssignmentLogDto[];
  totalCount: number;
  laboratoryId: string | undefined;
  laboratoryName: string | undefined;

  // Filters
  searchText: string;
  statusFilter: TestRequestStatus | undefined;

  // Pagination
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // Handlers
  handleSearch: (value: string) => void;
  handleStatusFilter: (status: TestRequestStatus | undefined) => void;
  handleTableChange: (pagination: { current?: number; pageSize?: number }) => void;
  handleRowDoubleClick: (record: SampleAssignmentLogDto) => void;
  handleReload: () => void;
}

/**
 * Hook để lấy dữ liệu Sổ nhận mẫu giao việc cho Lab của user hiện tại
 * Sử dụng cho trang Testing (Thử nghiệm viên)
 */
export const useSampleAssignmentLogForLab = (): UseSampleAssignmentLogForLabResult => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleAssignmentLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | undefined>(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Laboratory info
  const [laboratoryId, setLaboratoryId] = useState<string | undefined>(undefined);
  const [laboratoryName, setLaboratoryName] = useState<string | undefined>(undefined);
  const [labReady, setLabReady] = useState(false);

  // Get laboratory ID from current user's department
  useEffect(() => {
    const fetchUserLaboratory = async () => {
      try {
        // Get user info from localStorage
        const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
        if (!userInfoStr) {
          console.warn('User info not found in localStorage');
          setLabReady(true);
          return;
        }

        const userInfo: UserInfo = JSON.parse(userInfoStr);
        const departmentId = userInfo.departmentId;

        if (!departmentId) {
          console.warn('User departmentId not found');
          setLabReady(true);
          return;
        }

        // Get all active laboratories
        const laboratories = await laboratoryService.getActive();

        // Find laboratory with matching departmentId
        const userLab = laboratories.find(lab => lab.departmentId === departmentId);

        if (userLab) {
          setLaboratoryId(userLab.id);
          setLaboratoryName(userLab.name);
        } else {
          console.warn('No laboratory found for user department:', departmentId);
        }
      } catch (error) {
        console.error('Failed to fetch user laboratory:', error);
      } finally {
        setLabReady(true);
      }
    };

    fetchUserLaboratory();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    // Wait for laboratory info to be ready
    if (!labReady) return;

    // If no laboratoryId found, don't load data
    if (!laboratoryId) {
      setData([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: 'RequestCompletionDate asc',
        search: searchText || undefined,
        testRequestStatus: statusFilter,
        laboratoryId: laboratoryId,
      };

      const result = await qualityManagementService.getSampleAssignmentLog(input);
      setData(result.items);
      setTotalCount(result.totalCount);
      setPagination(prev => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error('Failed to load sample assignment log:', error);
      message.error('Không thể tải dữ liệu sổ nhận mẫu giao việc');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, laboratoryId, labReady]);

  // Initial load and reload on filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleStatusFilter = useCallback((status: TestRequestStatus | undefined) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleTableChange = useCallback((paginationInfo: { current?: number; pageSize?: number }) => {
    setPagination(prev => ({
      ...prev,
      current: paginationInfo.current || prev.current,
      pageSize: paginationInfo.pageSize || prev.pageSize,
    }));
  }, []);

  const handleRowDoubleClick = useCallback((record: SampleAssignmentLogDto) => {
    // Navigate to Testing detail page (with lab view mode)
    navigate(`/testing/${record.laboratoryTaskId}?view=lab`);
  }, [navigate]);

  const handleReload = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    data,
    totalCount,
    laboratoryId,
    laboratoryName,
    searchText,
    statusFilter,
    pagination,
    handleSearch,
    handleStatusFilter,
    handleTableChange,
    handleRowDoubleClick,
    handleReload,
  };
};

export default useSampleAssignmentLogForLab;
