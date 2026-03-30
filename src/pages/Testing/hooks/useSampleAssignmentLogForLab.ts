import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { testingService } from '../../../services/testingService';
import { laboratoryTaskService } from '../../../services/laboratoryTaskService';
import { indicatorService, IndicatorDto } from '../../../services/masterDataService';
import {
  SampleAssignmentLogDto,
  GetSampleAssignmentLogInput,
  SampleAssignmentLogStatisticsDto,
} from '../../../types/qualityManagement';
import { UserLookupDto, QLKTDisplayStatus } from '../../../types/laboratoryTask';

interface UseSampleAssignmentLogForLabOptions {
  displayStatusFilter?: QLKTDisplayStatus;
}

interface UseSampleAssignmentLogForLabResult {
  loading: boolean;
  data: SampleAssignmentLogDto[];
  totalCount: number;

  // Statistics
  stats: SampleAssignmentLogStatisticsDto;

  // Filters
  searchText: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  selectedIndicatorIds: string[];
  indicators: IndicatorDto[];
  technicianFilter: string[];
  technicians: UserLookupDto[];
  loadingTechnicians: boolean;

  // Pagination
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // Handlers
  handleSearch: (value: string) => void;
  handleSearchInputChange: (value: string) => void;
  handleDateRangeChange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
  handleIndicatorChange: (values: string[]) => void;
  handleTechnicianFilterChange: (values: string[]) => void;
  handleTableChange: (pagination: { current?: number; pageSize?: number }) => void;
  handleRowDoubleClick: (record: SampleAssignmentLogDto) => void;
  handleReload: () => void;
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

  // State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleAssignmentLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [technicianFilter, setTechnicianFilter] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Statistics
  const [stats, setStats] = useState<SampleAssignmentLogStatisticsDto>({
    total: 0,
    underReview: 0,
    toDo: 0,
    testing: 0,
    waitingApproval: 0,
    resultRejected: 0,
    completed: 0,
  });

  // Master data
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);

  // Load technicians
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

  // Load statistics (independent of filters)
  const loadStats = useCallback(async () => {
    try {
      const result = await testingService.getSampleAssignmentLogStatistics();
      setStats(result);
    } catch (error) {
      console.error('Failed to load sample assignment log statistics:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: dateRange ? 'RequestCompletionDate asc' : 'ContractNumber desc',
        search: searchText || undefined,
        fromDate: dateRange?.[0]?.startOf('day').format('YYYY-MM-DD') || undefined,
        toDate: dateRange?.[1]?.endOf('day').format('YYYY-MM-DD') || undefined,
        indicatorIds: selectedIndicatorIds.length > 0 ? selectedIndicatorIds : undefined,
        technicianIds: technicianFilter.length > 0 ? technicianFilter : undefined,
      };

      const result = await testingService.getSampleAssignmentLog(input);

      // Client-side filter by QLKTDisplayStatus if set
      if (displayStatusFilter !== undefined) {
        const filtered = result.items.filter(
          (item) => item.qlktDisplayStatus === displayStatusFilter
        );
        setData(filtered);
      } else {
        setData(result.items);
      }
      setTotalCount(result.totalCount);
      setPagination(prev => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error('Failed to load sample assignment log:', error);
      message.error('Không thể tải dữ liệu sổ nhận mẫu giao việc');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, displayStatusFilter, dateRange, selectedIndicatorIds, technicianFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchText(value);
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
    setSearchText('');
    setDateRange(null);
    setSelectedIndicatorIds([]);
    setTechnicianFilter([]);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData();
    loadStats();
  }, [loadData, loadStats]);

  return {
    loading,
    data,
    totalCount,
    stats,
    searchText,
    dateRange,
    selectedIndicatorIds,
    indicators,
    technicianFilter,
    technicians,
    loadingTechnicians,
    pagination,
    handleSearch,
    handleSearchInputChange,
    handleDateRangeChange,
    handleIndicatorChange,
    handleTechnicianFilterChange,
    handleTableChange,
    handleRowDoubleClick,
    handleReload,
  };
};

export default useSampleAssignmentLogForLab;
