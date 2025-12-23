import { useState, useMemo, useCallback } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import {
  useGetSpecimenListQuery,
  useDeleteSpecimenMutation,
} from "../../../store/api/specimenApi";
import {
  useGetActiveSpecimenTypesQuery,
  useGetActiveStorageLocationsQuery,
} from "../../../store/api/masterDataApi";
import { useGetTestRequestListQuery } from "../../../store/api/testRequestApi";
import { SpecimenStatus } from "../../../types/specimen";
import { importService, downloadBlobAsFile } from "../../../services/importService";
import { DEFAULT_PAGE_SIZE, MESSAGES } from "../constants";

export const useSpecimenList = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Filter state
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<SpecimenStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Download state
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // RTK Query hooks
  const {
    data: specimenData,
    isLoading: loading,
    isFetching,
    refetch,
  } = useGetSpecimenListQuery({
    skipCount: (currentPage - 1) * pageSize,
    maxResultCount: pageSize,
    sorting: "receivedDate desc",
    search: searchText || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const { data: specimenTypesData } = useGetActiveSpecimenTypesQuery();
  const { data: storageLocationsData } = useGetActiveStorageLocationsQuery();
  const { data: testRequestsData } = useGetTestRequestListQuery({ maxResultCount: 1000 });

  const [deleteSpecimen, { isLoading: isDeleting }] = useDeleteSpecimenMutation();

  // Derived data
  const data = useMemo(() => specimenData?.items || [], [specimenData]);
  const totalCount = specimenData?.totalCount || 0;

  const specimenTypes = useMemo(
    () => specimenTypesData?.items?.map((t) => t.name) || [],
    [specimenTypesData]
  );

  const storageLocations = useMemo(
    () => storageLocationsData?.items || [],
    [storageLocationsData]
  );

  const testRequests = useMemo(
    () => testRequestsData?.items || [],
    [testRequestsData]
  );

  // Handlers
  const handleSearch = useCallback(() => {
    setSearchText(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: SpecimenStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteSpecimen(id).unwrap();
      message.success(MESSAGES.DELETE_SUCCESS);
    } catch (error: any) {
      console.error("Error deleting specimen:", error);
      message.error(error.data?.error?.message || MESSAGES.DELETE_ERROR);
    }
  }, [deleteSpecimen]);

  const handleDownloadTemplate = useCallback(async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await importService.downloadSpecimensTemplate();
      downloadBlobAsFile(blob, "specimens-template.xlsx");
      message.success(MESSAGES.DOWNLOAD_TEMPLATE_SUCCESS);
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error(MESSAGES.DOWNLOAD_TEMPLATE_ERROR);
    } finally {
      setDownloadingTemplate(false);
    }
  }, []);

  const generateSpecimenCode = useCallback((index: number) => {
    return `SPE-${dayjs().format("YYYYMMDD")}-${String(
      data.length + index + 1
    ).padStart(4, "0")}`;
  }, [data.length]);

  return {
    // Data
    data,
    totalCount,
    specimenTypes,
    storageLocations,
    testRequests,

    // Loading states
    loading,
    isFetching,
    isDeleting,
    downloadingTemplate,

    // Pagination
    currentPage,
    pageSize,

    // Filters
    searchInput,
    setSearchInput,
    statusFilter,
    typeFilter,

    // Handlers
    handleSearch,
    handleClearSearch,
    handleStatusChange,
    handleTypeChange,
    handlePageChange,
    handleDelete,
    handleDownloadTemplate,
    generateSpecimenCode,
    refetch,
  };
};
