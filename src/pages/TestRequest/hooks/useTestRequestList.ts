import { useState, useMemo, useCallback } from "react";
import type { Dayjs } from "dayjs";
import { useGetTestRequestListQuery } from "../../../store/api/testRequestApi";
import { TestRequestStatus } from "../../../types/testRequest";
import { DEFAULT_PAGE_SIZE } from "../constants";

export const useTestRequestList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | "all">("all");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const {
    data: testRequestData,
    isLoading: loading,
    isFetching,
    refetch,
  } = useGetTestRequestListQuery({
    skipCount: (currentPage - 1) * pageSize,
    maxResultCount: pageSize,
    sorting: "requestDate desc",
    search: searchText || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    expectedCompletionDateFrom: dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
    expectedCompletionDateTo: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
  });

  const data = useMemo(() => testRequestData?.items || [], [testRequestData]);
  const totalCount = testRequestData?.totalCount || 0;

  const handleSearch = useCallback(() => {
    setSearchText(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: TestRequestStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  return {
    // Data
    data,
    totalCount,
    loading,
    isFetching,

    // Filters state
    searchInput,
    setSearchInput,
    statusFilter,
    dateRange,
    currentPage,
    pageSize,

    // Actions
    refetch,
    handleSearch,
    handleClearSearch,
    handleStatusChange,
    handleDateRangeChange,
    handlePageChange,
  };
};