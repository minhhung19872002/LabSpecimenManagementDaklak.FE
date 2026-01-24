import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { testingService } from '../../../services/testingService';
import {
  SampleAssignmentLogDto,
  GetSampleAssignmentLogInput,
} from '../../../types/qualityManagement';
import { TestRequestStatus } from '../../../types/testRequest';

interface UseSampleAssignmentLogForLabResult {
  loading: boolean;
  data: SampleAssignmentLogDto[];
  totalCount: number;

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
 * Sử dụng API /api/v1/testing/sample-assignment-log (query từ LaboratoryTaskIndicator)
 * Backend tự xác định lab của user thông qua authentication token
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
    pageSize: 50,
    total: 0,
  });

  // Load data - backend tự filter theo lab của user hiện tại
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: 'RequestCompletionDate asc',
        search: searchText || undefined,
        testRequestStatus: statusFilter,
      };

      const result = await testingService.getSampleAssignmentLog(input);
      setData(result.items);
      setTotalCount(result.totalCount);
      setPagination(prev => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error('Failed to load sample assignment log:', error);
      message.error('Không thể tải dữ liệu sổ nhận mẫu giao việc');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, statusFilter]);

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
    navigate(`/testing/${record.laboratoryTaskId}?view=lab`);
  }, [navigate]);

  const handleReload = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    data,
    totalCount,
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
