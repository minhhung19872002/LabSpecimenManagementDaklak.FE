import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { laboratoryTaskService } from '../../../services/laboratoryTaskService';
import { indicatorService, IndicatorDto } from '../../../services/masterDataService';
import {
  SampleAssignmentLogDto,
  GetSampleAssignmentLogInput,
} from '../../../types/qualityManagement';
import { UserLookupDto, QLKTDisplayStatus } from '../../../types/laboratoryTask';
import { PATH_ROUTES } from '../../../constants';

interface UseSampleAssignmentLogForQLKTOptions {
  displayStatusFilter?: QLKTDisplayStatus;
}

interface UseSampleAssignmentLogForQLKTResult {
  loading: boolean;
  data: SampleAssignmentLogDto[];
  totalCount: number;

  // Filters
  searchText: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  selectedIndicatorIds: string[];
  selectedTechnicianIds: string[];

  // Master data
  indicators: IndicatorDto[];
  technicians: UserLookupDto[];

  // Pagination
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // Handlers
  handleSearchInputChange: (value: string) => void;
  handleDateRangeChange: (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
  handleIndicatorChange: (values: string[]) => void;
  handleTechnicianChange: (values: string[]) => void;
  handleTableChange: (pagination: { current?: number; pageSize?: number }) => void;
  handleRowDoubleClick: (record: SampleAssignmentLogDto) => void;
  handleReload: () => void;
}

/**
 * Hook để lấy dữ liệu Sổ nhận mẫu giao việc cho QLKT (Quản lý kỹ thuật)
 * Sử dụng API /api/v1/laboratory-tasks/sample-assignment-log
 * Backend tự xác định lab của user thông qua authentication token
 */
export const useSampleAssignmentLogForQLKT = (
  options?: UseSampleAssignmentLogForQLKTOptions
): UseSampleAssignmentLogForQLKTResult => {
  const navigate = useNavigate();
  const displayStatusFilter = options?.displayStatusFilter;

  // State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleAssignmentLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<string[]>([]);

  // Master data
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Debounce search text
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setPagination((prev) => prev.current === 1 ? prev : { ...prev, current: 1 });
    }, 500);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchText]);

  // Load master data for filter dropdowns
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [indicatorList, technicianList] = await Promise.all([
          indicatorService.getActive(),
          laboratoryTaskService.getTechniciansByLaboratory(),
        ]);
        setIndicators(indicatorList);
        setTechnicians(technicianList);
      } catch (error) {
        console.error('Failed to load filter master data:', error);
      }
    };
    loadMasterData();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: dateRange ? 'RequestCompletionDate asc' : 'ContractDate desc',
        search: debouncedSearchText || undefined,
        fromDate: dateRange?.[0]?.startOf('day').format('YYYY-MM-DD') || undefined,
        toDate: dateRange?.[1]?.endOf('day').format('YYYY-MM-DD') || undefined,
        indicatorIds: selectedIndicatorIds.length > 0 ? selectedIndicatorIds : undefined,
        technicianIds: selectedTechnicianIds.length > 0 ? selectedTechnicianIds : undefined,
        qlktDisplayStatuses: displayStatusFilter !== undefined ? [displayStatusFilter] : undefined,
      };

      const result = await laboratoryTaskService.getSampleAssignmentLog(input);

      setData(result.items);
      setTotalCount(result.totalCount);
      setPagination(prev => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error('Failed to load sample assignment log:', error);
      message.error('Không thể tải dữ liệu sổ nhận mẫu giao việc');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, debouncedSearchText, displayStatusFilter, dateRange, selectedIndicatorIds, selectedTechnicianIds]);

  // Initial load and reload on filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [displayStatusFilter]);

  // Handlers
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

  const handleTechnicianChange = useCallback((values: string[]) => {
    setSelectedTechnicianIds(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleTableChange = useCallback((paginationInfo: { current?: number; pageSize?: number }) => {
    setPagination(prev => ({
      ...prev,
      current: paginationInfo.current || prev.current,
      pageSize: paginationInfo.pageSize || prev.pageSize,
    }));
  }, []);

  // Navigate to task detail page (QLKT view)
  const handleRowDoubleClick = useCallback((record: SampleAssignmentLogDto) => {
    navigate(PATH_ROUTES.tasks.detail(record.laboratoryTaskId));
  }, [navigate]);

  const handleReload = useCallback(() => {
    setSearchText('');
    setDebouncedSearchText('');
    setDateRange(null);
    setSelectedIndicatorIds([]);
    setSelectedTechnicianIds([]);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  return {
    loading,
    data,
    totalCount,
    searchText,
    dateRange,
    selectedIndicatorIds,
    selectedTechnicianIds,
    indicators,
    technicians,
    pagination,
    handleSearchInputChange,
    handleDateRangeChange,
    handleIndicatorChange,
    handleTechnicianChange,
    handleTableChange,
    handleRowDoubleClick,
    handleReload,
  };
};

export default useSampleAssignmentLogForQLKT;
