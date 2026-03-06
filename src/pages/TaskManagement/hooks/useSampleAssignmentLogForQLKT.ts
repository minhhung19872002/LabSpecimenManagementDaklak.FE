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
import { UserLookupDto } from '../../../types/laboratoryTask';
import { TestRequestStatus } from '../../../types/testRequest';
import { PATH_ROUTES } from '../../../constants';

interface UseSampleAssignmentLogForQLKTResult {
  loading: boolean;
  data: SampleAssignmentLogDto[];
  totalCount: number;

  // Filters
  searchText: string;
  statusFilter: TestRequestStatus | undefined;
  dateFrom: dayjs.Dayjs | null;
  dateTo: dayjs.Dayjs | null;
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
  handleStatusFilter: (status: TestRequestStatus | undefined) => void;
  handleDateFromChange: (date: dayjs.Dayjs | null) => void;
  handleDateToChange: (date: dayjs.Dayjs | null) => void;
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
export const useSampleAssignmentLogForQLKT = (): UseSampleAssignmentLogForQLKTResult => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleAssignmentLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<dayjs.Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<dayjs.Dayjs | null>(null);
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

  // Load data - backend tự filter theo lab của user hiện tại (QLKT)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: 'ContractNumber desc',
        search: debouncedSearchText || undefined,
        testRequestStatus: statusFilter,
        fromDate: dateFrom?.startOf('day').format('YYYY-MM-DD') || undefined,
        toDate: dateTo?.endOf('day').format('YYYY-MM-DD') || undefined,
        indicatorIds: selectedIndicatorIds.length > 0 ? selectedIndicatorIds : undefined,
        technicianIds: selectedTechnicianIds.length > 0 ? selectedTechnicianIds : undefined,
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
  }, [pagination.current, pagination.pageSize, debouncedSearchText, statusFilter, dateFrom, dateTo, selectedIndicatorIds, selectedTechnicianIds]);

  // Initial load and reload on filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleStatusFilter = useCallback((status: TestRequestStatus | undefined) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleDateFromChange = useCallback((date: dayjs.Dayjs | null) => {
    setDateFrom(date);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleDateToChange = useCallback((date: dayjs.Dayjs | null) => {
    setDateTo(date);
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
    setStatusFilter(undefined);
    setDateFrom(null);
    setDateTo(null);
    setSelectedIndicatorIds([]);
    setSelectedTechnicianIds([]);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  return {
    loading,
    data,
    totalCount,
    searchText,
    statusFilter,
    dateFrom,
    dateTo,
    selectedIndicatorIds,
    selectedTechnicianIds,
    indicators,
    technicians,
    pagination,
    handleSearchInputChange,
    handleStatusFilter,
    handleDateFromChange,
    handleDateToChange,
    handleIndicatorChange,
    handleTechnicianChange,
    handleTableChange,
    handleRowDoubleClick,
    handleReload,
  };
};

export default useSampleAssignmentLogForQLKT;
