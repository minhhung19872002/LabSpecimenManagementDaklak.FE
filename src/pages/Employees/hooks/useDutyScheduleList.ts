import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import {
  temporaryAccessService,
  TemporaryAccessGrantDto,
  GrantStatus,
  TemporaryAccessGrantPagedRequestDto,
} from "../../../services/temporaryAccessService";
import { EmployeeDto } from "../../../services/employeeService";

export const useDutyScheduleList = () => {
  const [grants, setGrants] = useState<TemporaryAccessGrantDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [statusFilter, setStatusFilter] = useState<GrantStatus | undefined>(undefined);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<TemporaryAccessGrantDto | null>(null);
  const [preselectedEmployee, setPreselectedEmployee] = useState<EmployeeDto | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const result = await temporaryAccessService.getStats();
      setStats(result);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: TemporaryAccessGrantPagedRequestDto = {
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: "ExpiryDate DESC",
        filter: searchText || undefined,
        status: statusFilter,
      };
      const result = await temporaryAccessService.getList(params);
      setGrants(result.items || []);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Error loading duty schedules:", error);
      message.error("Không thể tải danh sách lịch trực. Vui lòng thử lại.");
      setGrants([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter, refreshTrigger]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleSearch = useCallback(() => {
    setSearchText(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: GrantStatus | undefined) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  const handleRefresh = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setStatusFilter(undefined);
    setCurrentPage(1);
    setRefreshTrigger((t) => t + 1); // always triggers loadData via useEffect with fresh state
    loadStats();
  }, [loadStats]);

  // Called from Tab 1's Clock icon — opens modal pre-filled with that employee
  const handleOpenCreateFromEmployee = useCallback((employee: EmployeeDto) => {
    setEditingGrant(null);
    setPreselectedEmployee(employee);
    setIsModalOpen(true);
  }, []);

  // Called from Tab 2's "Thêm lịch trực" button
  const handleOpenCreate = useCallback(() => {
    setEditingGrant(null);
    setPreselectedEmployee(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((grant: TemporaryAccessGrantDto) => {
    setEditingGrant(grant);
    setPreselectedEmployee(null);
    setIsModalOpen(true);
  }, []);

  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingGrant(null);
    setPreselectedEmployee(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setIsModalOpen(false);
    setEditingGrant(null);
    setPreselectedEmployee(null);
    loadData();
    loadStats();
  }, [loadData, loadStats]);

  const handleExpire = useCallback(
    async (id: string) => {
      try {
        await temporaryAccessService.expire(id);
        message.success("Đã hết hạn quyền truy cập");
        loadData();
        loadStats();
      } catch (error) {
        console.error("Error expiring grant:", error);
        message.error("Không thể hết hạn quyền truy cập. Vui lòng thử lại.");
      }
    },
    [loadData, loadStats],
  );

  return {
    grants,
    loading,
    totalCount,
    stats,
    currentPage,
    pageSize,
    statusFilter,
    searchInput,
    isModalOpen,
    editingGrant,
    preselectedEmployee,
    handleSearchInputChange,
    handleSearch,
    handleClearSearch,
    handleStatusFilterChange,
    handlePageChange,
    handleRefresh,
    handleOpenCreateFromEmployee,
    handleOpenCreate,
    handleEdit,
    handleModalCancel,
    handleModalSuccess,
    handleExpire,
  };
};
