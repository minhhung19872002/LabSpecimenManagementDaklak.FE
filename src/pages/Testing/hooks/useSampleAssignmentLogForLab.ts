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
} from '../../../types/qualityManagement';
import { TestRequestStatus } from '../../../types/testRequest';
import { UserLookupDto } from '../../../types/laboratoryTask';

interface UseSampleAssignmentLogForLabResult {
  loading: boolean;
  data: SampleAssignmentLogDto[];
  totalCount: number;

  // Filters
  searchText: string;
  statusFilter: TestRequestStatus | undefined;
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
  handleStatusFilter: (status: TestRequestStatus | undefined) => void;
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
export const useSampleAssignmentLogForLab = (): UseSampleAssignmentLogForLabResult => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleAssignmentLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);
  const [technicianFilter, setTechnicianFilter] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
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

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const input: GetSampleAssignmentLogInput = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: dateRange ? 'RequestCompletionDate asc' : 'ContractNumber desc',
        search: searchText || undefined,
        testRequestStatus: statusFilter,
        fromDate: dateRange?.[0]?.startOf('day').format('YYYY-MM-DD') || undefined,
        toDate: dateRange?.[1]?.endOf('day').format('YYYY-MM-DD') || undefined,
        indicatorIds: selectedIndicatorIds.length > 0 ? selectedIndicatorIds : undefined,
        technicianIds: technicianFilter.length > 0 ? technicianFilter : undefined,
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
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, dateRange, selectedIndicatorIds, technicianFilter]);

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

  const handleStatusFilter = useCallback((status: TestRequestStatus | undefined) => {
    setStatusFilter(status);
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
    setStatusFilter(undefined);
    setDateRange(null);
    setSelectedIndicatorIds([]);
    setTechnicianFilter([]);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData();
  }, [loadData]);

  return {
    loading,
    data,
    totalCount,
    searchText,
    statusFilter,
    dateRange,
    selectedIndicatorIds,
    indicators,
    technicianFilter,
    technicians,
    loadingTechnicians,
    pagination,
    handleSearch,
    handleSearchInputChange,
    handleStatusFilter,
    handleDateRangeChange,
    handleIndicatorChange,
    handleTechnicianFilterChange,
    handleTableChange,
    handleRowDoubleClick,
    handleReload,
  };
};

export default useSampleAssignmentLogForLab;
