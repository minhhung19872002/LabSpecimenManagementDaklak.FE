import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { testingService } from '../../../services/testingService';
import { laboratoryTaskService } from '../../../services/laboratoryTaskService';
import { indicatorService, IndicatorDto } from '../../../services/masterDataService';
import { authService } from '../../../services/authService';
import {
  SampleAssignmentLogDto,
  GetSampleAssignmentLogInput,
} from '../../../types/qualityManagement';
import { UserLookupDto, QLKTDisplayStatus } from '../../../types/laboratoryTask';

interface UseSampleAssignmentLogForLabOptions {
  displayStatusFilter?: QLKTDisplayStatus;
  /** When true, table data is scoped to the current user regardless of the "Thử nghiệm viên" dropdown (used by card clicks). */
  restrictToCurrentUser?: boolean;
}

interface UseSampleAssignmentLogForLabResult {
  loading: boolean;
  data: SampleAssignmentLogDto[];
  totalCount: number;

  // Filters
  searchText: string;
  sorting: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  selectedIndicatorIds: string[];
  indicators: IndicatorDto[];
  technicianFilter: string[];
  technicians: UserLookupDto[];
  loadingTechnicians: boolean;
  currentUserId?: string;
  resultFilter: string[];
  distinctResults: string[];
  loadingResults: boolean;

  // Pagination
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // Handlers
  handleSearch: (value: string) => void;
  handleSearchInputChange: (value: string) => void;
  handleSortChange: (value: string) => void;
  handleDateRangeChange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
  handleIndicatorChange: (values: string[]) => void;
  handleTechnicianFilterChange: (values: string[]) => void;
  handleResultFilterChange: (values: string[]) => void;
  handleTableChange: (pagination: { current?: number; pageSize?: number }) => void;
  handleRowDoubleClick: (record: SampleAssignmentLogDto) => void;
  reloadDistinctResults: () => void;
}

/**
 * Hook để lấy dữ liệu Sổ nhận mẫu giao việc cho Lab của user hiện tại
 * Sử dụng API /api/v1/testing/sample-assignment-log (query từ LaboratoryTaskIndicator)
 * Backend tự xác định lab của user thông qua authentication token
 */
export const useSampleAssignmentLogForLab = (
  options?: UseSampleAssignmentLogForLabOptions
): UseSampleAssignmentLogForLabResult => {
  const navigate = useNavigate();
  const displayStatusFilter = options?.displayStatusFilter;
  const restrictToCurrentUser = options?.restrictToCurrentUser;
  const currentUser = authService.getUserInfo();
  const currentUserId = currentUser?.id;

  // State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleAssignmentLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sorting, setSorting] = useState('ContractDate desc');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [technicianFilter, setTechnicianFilter] = useState<string[]>([]);
  const [resultFilter, setResultFilter] = useState<string[]>([]);
  const [distinctResults, setDistinctResults] = useState<string[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Master data
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);

  // Load technicians (table defaults to showing ALL - no auto technician filter)
  useEffect(() => {
    const loadTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        const result = await laboratoryTaskService.getTechniciansByLaboratory();
        setTechnicians(result || []);
      } catch (error) {
        console.error('Failed to load technicians:', error);
      } finally {
        setLoadingTechnicians(false);
      }
    };
    loadTechnicians();
  }, []);

  // Load indicators
  useEffect(() => {
    const loadIndicators = async () => {
      try {
        const result = await indicatorService.getActive();
        setIndicators(result || []);
      } catch (error) {
        console.error('Failed to load indicators:', error);
      }
    };
    loadIndicators();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting,
        search: searchFilter || undefined,
        fromDate: dateRange?.[0]?.startOf('day').format('YYYY-MM-DD') || undefined,
        toDate: dateRange?.[1]?.endOf('day').format('YYYY-MM-DD') || undefined,
        indicatorIds: selectedIndicatorIds.length > 0 ? selectedIndicatorIds : undefined,
        technicianIds: restrictToCurrentUser
          ? (currentUserId ? [currentUserId] : undefined)
          : (technicianFilter.length > 0 ? technicianFilter : undefined),
        qlktDisplayStatuses: displayStatusFilter !== undefined ? [displayStatusFilter] : undefined,
        results: resultFilter.length > 0 ? resultFilter : undefined,
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
  }, [pagination.current, pagination.pageSize, searchFilter, displayStatusFilter, dateRange, selectedIndicatorIds, technicianFilter, resultFilter, sorting, restrictToCurrentUser, currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [displayStatusFilter]);

  // Load distinct results for dropdown
  const loadDistinctResults = useCallback(async () => {
    setLoadingResults(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        search: searchFilter || undefined,
        fromDate: dateRange?.[0]?.startOf('day').format('YYYY-MM-DD') || undefined,
        toDate: dateRange?.[1]?.endOf('day').format('YYYY-MM-DD') || undefined,
        indicatorIds: selectedIndicatorIds.length > 0 ? selectedIndicatorIds : undefined,
        technicianIds: restrictToCurrentUser
          ? (currentUserId ? [currentUserId] : undefined)
          : (technicianFilter.length > 0 ? technicianFilter : undefined),
        qlktDisplayStatuses: displayStatusFilter !== undefined ? [displayStatusFilter] : undefined,
      };
      const result = await testingService.getDistinctResults(input);
      setDistinctResults(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to load distinct results:', error);
    } finally {
      setLoadingResults(false);
    }
  }, [searchFilter, dateRange, selectedIndicatorIds, technicianFilter, displayStatusFilter, restrictToCurrentUser, currentUserId]);

  useEffect(() => {
    loadDistinctResults();
  }, [loadDistinctResults]);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setSearchFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSorting(value);
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

  const handleIndicatorChange = useCallback((values: string[]) => {
    setSelectedIndicatorIds(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleTechnicianFilterChange = useCallback((values: string[]) => {
    setTechnicianFilter(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleResultFilterChange = useCallback((values: string[]) => {
    setResultFilter(values);
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

  return {
    loading,
    data,
    totalCount,
    searchText,
    sorting,
    dateRange,
    selectedIndicatorIds,
    indicators,
    technicianFilter,
    technicians,
    loadingTechnicians,
    currentUserId,
    resultFilter,
    distinctResults,
    loadingResults,
    pagination,
    handleSearch,
    handleSearchInputChange,
    handleSortChange,
    handleDateRangeChange,
    handleIndicatorChange,
    handleTechnicianFilterChange,
    handleResultFilterChange,
    handleTableChange,
    handleRowDoubleClick,
    reloadDistinctResults: loadDistinctResults,
  };
};

export default useSampleAssignmentLogForLab;
