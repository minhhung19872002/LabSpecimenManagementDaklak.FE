import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetTestingListQuery } from "../../../store/api/testingApi";
import { useGetTechniciansByLaboratoryQuery } from "../../../store/api/laboratoryTaskApi";
import {
  TestingStatus,
  TestingTabType,
} from "../../../types/testing";

export const useTestingList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestingStatus | undefined>(undefined);
  const [technicianFilter, setTechnicianFilter] = useState<string[]>([]);

  // Read tab from URL, default to MyAssignments
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TestingTabType>(
    tabFromUrl === "all" ? TestingTabType.All : TestingTabType.MyAssignments
  );

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });

  // RTK Query hooks
  const {
    data: taskData,
    isLoading: loading,
    isFetching,
    refetch,
  } = useGetTestingListQuery({
    skipCount: (pagination.current - 1) * pagination.pageSize,
    maxResultCount: pagination.pageSize,
    tab: activeTab,
    search: debouncedSearch || undefined,
    statuses: statusFilter !== undefined ? [statusFilter] : undefined,
    technicianIds: technicianFilter.length > 0 ? technicianFilter : undefined,
  });

  // Technicians for filter dropdown
  const { data: technicians = [], isLoading: loadingTechnicians } =
    useGetTechniciansByLaboratoryQuery(undefined);

  const tasks = taskData?.items || [];
  const totalCount = taskData?.totalCount || 0;

  // Statistics
  const stats = useMemo(() => ({
    total: totalCount,
    todo: tasks.filter((t) => t.testingStatus === TestingStatus.Todo).length,
    inProgress: tasks.filter((t) => t.testingStatus === TestingStatus.InProgress).length,
    done: tasks.filter((t) => t.testingStatus === TestingStatus.Done).length,
  }), [tasks, totalCount]);

  // Handlers
  const handleSearch = (value: string) => {
    setDebouncedSearch(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusFilterChange = (value: TestingStatus | undefined) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTechnicianFilterChange = (values: string[]) => {
    setTechnicianFilter(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTabChange = (key: string) => {
    const newTab = Number(key) as TestingTabType;
    setActiveTab(newTab);
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSearchParams({ tab: newTab === TestingTabType.All ? "all" : "my" });
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleRefresh = () => {
    setSearchText("");
    setDebouncedSearch("");
    setStatusFilter(undefined);
    setTechnicianFilter([]);
    setPagination((prev) => ({ ...prev, current: 1 }));
    refetch();
  };

  const handleRowDoubleClick = (laboratoryTaskId: string) => {
    navigate(
      `/testing/${laboratoryTaskId}?viewMode=${
        activeTab === TestingTabType.MyAssignments ? "my" : "all"
      }`
    );
  };

  return {
    // Data
    tasks,
    totalCount,
    stats,
    loading,
    isFetching,
    technicians,
    loadingTechnicians,

    // Filter states
    searchText,
    setSearchText,
    statusFilter,
    technicianFilter,
    activeTab,
    pagination,

    // Handlers
    handleSearch,
    handleStatusFilterChange,
    handleTechnicianFilterChange,
    handleTabChange,
    handleTableChange,
    handleRefresh,
    handleRowDoubleClick,
  };
};
