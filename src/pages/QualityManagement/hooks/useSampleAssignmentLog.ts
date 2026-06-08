import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { qualityManagementService } from '../../../services/qualityManagementService';
import { laboratoryService, LaboratoryDto } from '../../../services/masterDataService';
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
  sorting: string;
  statusFilter: TestRequestStatus | undefined;
  qlclDisplayStatuses: number[] | undefined;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  laboratoryIds: string[];
  laboratories: LaboratoryDto[];

  // Pagination
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // Handlers
  handleSearch: (value: string) => void;
  handleSortChange: (value: string) => void;
  handleStatusFilter: (status: TestRequestStatus | undefined) => void;
  handleQlclStatusFilter: (statuses: number[] | undefined) => void;
  handleDateRangeChange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
  handleLaboratoryChange: (values: string[]) => void;
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
  const [sorting, setSorting] = useState('ContractDate desc');
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | undefined>(undefined);
  const [qlclDisplayStatuses, setQlclDisplayStatuses] = useState<number[] | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [laboratoryIds, setLaboratoryIds] = useState<string[]>([]);
  const [laboratories, setLaboratories] = useState<LaboratoryDto[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Load master data
  useEffect(() => {
    laboratoryService.getActive().then(setLaboratories).catch(console.error);
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting,
        search: searchText || undefined,
        testRequestStatus: statusFilter,
        qlclDisplayStatuses,
        fromDate: dateRange?.[0]?.startOf('day').format('YYYY-MM-DD') || undefined,
        toDate: dateRange?.[1]?.endOf('day').format('YYYY-MM-DD') || undefined,
        laboratoryIds: laboratoryIds.length > 0 ? laboratoryIds : undefined,
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
  }, [pagination.current, pagination.pageSize, searchText, sorting, statusFilter, qlclDisplayStatuses, dateRange, laboratoryIds]);

  // Initial load and reload on filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSorting(value);
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

  const handleDateRangeChange = useCallback((dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleLaboratoryChange = useCallback((values: string[]) => {
    setLaboratoryIds(values);
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
    sorting,
    statusFilter,
    qlclDisplayStatuses,
    dateRange,
    laboratoryIds,
    laboratories,
    pagination,
    handleSearch,
    handleSortChange,
    handleStatusFilter,
    handleQlclStatusFilter,
    handleDateRangeChange,
    handleLaboratoryChange,
    handleTableChange,
    handleRowDoubleClick,
    handleReload,
  };
};

export default useSampleAssignmentLog;
