import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { testingService } from "../../../services/testingService";
import { laboratoryTaskService } from "../../../services/laboratoryTaskService";
import { indicatorService, IndicatorDto } from "../../../services/masterDataService";
import { authService } from "../../../services/authService";
import {
  TestingListDto,
  TestingStatus,
  TestingTabType,
} from "../../../types/testing";
import { UserLookupDto } from "../../../types/laboratoryTask";
import { getTestingColumns } from "../components/columns";

const findCurrentTechnician = (
  technicians: UserLookupDto[],
  currentUser?: {
    id?: string;
    userName?: string;
    email?: string;
    fullName?: string;
  } | null,
): UserLookupDto | undefined => {
  if (!currentUser) {
    return undefined;
  }

  const normalizedUserName = currentUser.userName?.trim().toLowerCase();
  const normalizedEmail = currentUser.email?.trim().toLowerCase();
  const normalizedFullName = currentUser.fullName?.trim().toLowerCase();

  return technicians.find((tech) => {
    const techUserName = tech.userName?.trim().toLowerCase();
    const techEmail = tech.email?.trim().toLowerCase();
    const techDisplayName = tech.displayName?.trim().toLowerCase();

    return (
      (currentUser.id && tech.id === currentUser.id) ||
      (!!normalizedUserName && techUserName === normalizedUserName) ||
      (!!normalizedEmail && techEmail === normalizedEmail) ||
      (!!normalizedFullName && techDisplayName === normalizedFullName)
    );
  });
};

export const useTestingList = () => {
  const navigate = useNavigate();
  const currentUser = authService.getUserInfo();
  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.userName;
  const currentUserEmail = currentUser?.email;
  const currentUserFullName = currentUser?.fullName;
  const [tasks, setTasks] = useState<TestingListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [sorting, setSorting] = useState("ContractDate desc");
  const [statusFilter, setStatusFilter] = useState<TestingStatus | undefined>(
    undefined
  );
  // null = no stat card selected (default); tracks which card is active so a card can be toggled off
  const [selectedStatusCard, setSelectedStatusCard] = useState<string | null>(null);
  const [technicianFilter, setTechnicianFilter] = useState<string[]>([]);

  // Date range filter (Ngày yêu cầu xong)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Indicator filter (Chọn chỉ tiêu)
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);

  // Active tab state
  const [activeTab, setActiveTab] = useState<TestingTabType>(
    TestingTabType.All
  );

  // Technicians for filter dropdown
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [technicianFilterReady, setTechnicianFilterReady] = useState(false);
  const hasInitializedTechnicianFilter = useRef(false);

  // Indicators for filter dropdown
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Load technicians for filter
  useEffect(() => {
    const loadTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        const result = await laboratoryTaskService.getTechniciansByLaboratory();
        const technicianList = result || [];
        setTechnicians(technicianList);

        if (!hasInitializedTechnicianFilter.current) {
          hasInitializedTechnicianFilter.current = true;

          const currentTechnician = findCurrentTechnician(
            technicianList,
            {
              id: currentUserId,
              userName: currentUserName,
              email: currentUserEmail,
              fullName: currentUserFullName,
            },
          );

          if (currentTechnician) {
            setTechnicianFilter([currentTechnician.id]);
          }
        }
      } catch (error) {
        console.error("Failed to load technicians:", error);
      } finally {
        setLoadingTechnicians(false);
        setTechnicianFilterReady(true);
      }
    };
    loadTechnicians();
  }, [currentUserEmail, currentUserFullName, currentUserId, currentUserName]);

  // Load indicators for filter dropdown
  useEffect(() => {
    const loadIndicators = async () => {
      try {
        const result = await indicatorService.getActive(true);
        setIndicators(result || []);
      } catch (error) {
        console.error("Failed to load indicators:", error);
      }
    };
    loadIndicators();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await testingService.getList({
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        tab: activeTab,
        search: searchFilter || undefined,
        statuses: statusFilter !== undefined ? [statusFilter] : undefined,
        technicianIds:
          technicianFilter.length > 0 ? technicianFilter : undefined,
        transferDateFrom: dateRange?.[0]?.startOf('day').format('YYYY-MM-DD') || undefined,
        transferDateTo: dateRange?.[1]?.endOf('day').format('YYYY-MM-DD') || undefined,
        indicatorIds: selectedIndicatorIds.length > 0 ? selectedIndicatorIds : undefined,
        sorting,
      });

      setTasks(result.items);
      setPagination((prev) => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error("Failed to load testing tasks:", error);
      message.error("Không thể tải danh sách xét nghiệm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.current,
    pagination.pageSize,
    activeTab,
    searchFilter,
    statusFilter,
    technicianFilter,
    dateRange,
    selectedIndicatorIds,
    sorting,
  ]);

  useEffect(() => {
    if (technicianFilterReady) loadData();
  }, [loadData, technicianFilterReady]);

  // Statistics - loaded separately from API (not affected by filters)
  const [stats, setStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    pendingApproval: 0,
    rejected: 0,
    completed: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const result = await testingService.getStatusStatistics(activeTab);
      setStats({
        total: result.total,
        notStarted: result.notStarted,
        inProgress: result.inProgress,
        pendingApproval: result.pendingApproval,
        rejected: result.rejected,
        completed: result.completed,
      });
    } catch (error) {
      console.error("Failed to load testing statistics:", error);
    }
  }, [activeTab]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setSearchFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSorting(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      if (selectedStatusCard === value) {
        setSelectedStatusCard(null);
        setStatusFilter(undefined);
      } else {
        setSelectedStatusCard(value);
        setStatusFilter(value === "all" ? undefined : (Number(value) as TestingStatus));
      }
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    [selectedStatusCard]
  );

  const handleTechnicianFilterChange = useCallback((values: string[]) => {
    setTechnicianFilter(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleDateRangeChange = useCallback((dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleIndicatorChange = useCallback((values: string[]) => {
    setSelectedIndicatorIds(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(Number(key) as TestingTabType);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleTableChange = useCallback(
    (paginationConfig: { current?: number; pageSize?: number }) => {
      setPagination((prev) => ({
        ...prev,
        current: paginationConfig.current || prev.current,
        pageSize: paginationConfig.pageSize || prev.pageSize,
      }));
    },
    []
  );

  const handleRefresh = useCallback(() => {
    setSearchText("");
    setSearchFilter("");
    setStatusFilter(undefined);
    setSelectedStatusCard(null);
    setTechnicianFilter([]);
    setDateRange(null);
    setSelectedIndicatorIds([]);
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData();
    loadStats();
  }, [loadData, loadStats]);

  const handleRowDoubleClick = useCallback(
    (record: TestingListDto) => {
      // Truyền viewMode=lab khi xem từ tab "Công việc của Lab" (All)
      const viewMode = activeTab === TestingTabType.All ? "lab" : "my";
      navigate(`/testing/${record.laboratoryTaskId}?view=${viewMode}`);
    },
    [navigate, activeTab]
  );

  const getRowClassName = useCallback((record: TestingListDto) => {
    // Highlight đỏ cho:
    // 1. Hợp đồng khẩn cấp (isUrgent) và chưa hoàn thành
    // 2. Trạng thái "Chưa bắt đầu" hoặc "Đang thử nghiệm"
    const isUrgentAndNotCompleted =
      record.isUrgent && record.testingStatus !== TestingStatus.Completed;
    const isNotStartedOrInProgress =
      record.testingStatus === TestingStatus.NotStarted ||
      record.testingStatus === TestingStatus.InProgress;

    return isUrgentAndNotCompleted || isNotStartedOrInProgress ? "urgent-row" : "";
  }, []);

  const columns = useMemo(() => getTestingColumns(), []);

  return {
    // State
    tasks,
    loading,
    searchText,
    sorting,
    statusFilter,
    selectedStatusCard,
    technicianFilter,
    technicians,
    loadingTechnicians,
    pagination,
    stats,
    columns,
    activeTab,
    dateRange,
    selectedIndicatorIds,
    indicators,

    // Handlers
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleSortChange,
    handleStatusFilterChange,
    handleTechnicianFilterChange,
    handleDateRangeChange,
    handleIndicatorChange,
    handleTabChange,
    handleTableChange,
    handleRefresh,
    handleRowDoubleClick,
    getRowClassName,
  };
};
