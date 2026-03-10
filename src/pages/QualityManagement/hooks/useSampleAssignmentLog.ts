import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { qualityManagementService } from '../../../services/qualityManagementService';
import {
  SampleAssignmentLogDto,
  GetSampleAssignmentLogInput,
  QLCLSampleAssignmentLogStatisticsDto,
} from '../../../types/qualityManagement';
import { TestRequestStatus } from '../../../types/testRequest';

interface UseSampleAssignmentLogResult {
  loading: boolean;
  data: SampleAssignmentLogDto[];
  totalCount: number;
  statistics: QLCLSampleAssignmentLogStatisticsDto | null;

  // Filters
  searchText: string;
  statusFilter: TestRequestStatus | undefined;
  qlclDisplayStatuses: number[] | undefined;

  // Pagination
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // Handlers
  handleSearch: (value: string) => void;
  handleStatusFilter: (status: TestRequestStatus | undefined) => void;
  handleQlclStatusFilter: (statuses: number[] | undefined) => void;
  handleTableChange: (pagination: { current?: number; pageSize?: number }) => void;
  handleRowDoubleClick: (record: SampleAssignmentLogDto) => void;
  handleReload: () => void;
}

export const useSampleAssignmentLog = (): UseSampleAssignmentLogResult => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleAssignmentLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState<QLCLSampleAssignmentLogStatisticsDto | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | undefined>(undefined);
  const [qlclDisplayStatuses, setQlclDisplayStatuses] = useState<number[] | undefined>(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: 'ContractNumber desc',
        search: searchText || undefined,
        testRequestStatus: statusFilter,
        qlclDisplayStatuses,
      };

      const [result, statsResult] = await Promise.all([
        qualityManagementService.getSampleAssignmentLog(input),
        qualityManagementService.getSampleAssignmentLogStatistics(),
      ]);

      setData(result.items);
      setTotalCount(result.totalCount);
      setPagination(prev => ({ ...prev, total: result.totalCount }));
      setStatistics(statsResult);
    } catch (error) {
      console.error('Failed to load sample assignment log:', error);
      message.error('Không thể tải dữ liệu sổ nhận mẫu giao việc');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, qlclDisplayStatuses]);

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

  const handleQlclStatusFilter = useCallback((statuses: number[] | undefined) => {
    setQlclDisplayStatuses(statuses);
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
    // Navigate based on available IDs
    if (record.qualityTaskId) {
      // Đã gửi QLCL → trang chi tiết QLCL
      navigate(`/quality-management/${record.qualityTaskId}`);
    } else if (record.laboratoryTaskId) {
      // Đã gửi Lab nhưng chưa gửi QLCL → trang chi tiết Lab task
      navigate(`/testing/${record.laboratoryTaskId}`);
    } else {
      // Chưa gửi Lab → trang chi tiết phiếu yêu cầu
      navigate(`/test-requests/${record.testRequestId}`);
    }
  }, [navigate]);

  const handleReload = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    data,
    totalCount,
    statistics,
    searchText,
    statusFilter,
    qlclDisplayStatuses,
    pagination,
    handleSearch,
    handleStatusFilter,
    handleQlclStatusFilter,
    handleTableChange,
    handleRowDoubleClick,
    handleReload,
  };
};

export default useSampleAssignmentLog;
