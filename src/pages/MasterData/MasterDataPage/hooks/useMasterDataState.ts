import { useState, useEffect } from "react";
import { message } from "antd";
import {
  departmentService,
  specimenTypeService,
  testMethodService,
  storageLocationService,
  customerService,
  laboratoryService,
  masterDataStatisticsService,
} from "../../../../services/masterDataService";
import { userService } from "../../../../services/userService";
import {
  MasterDataItem,
  MasterDataStatisticsDto,
  UserLookupDto,
} from "../types";
import { NO_PAGINATION_CATEGORIES, DEFAULT_PAGE_SIZE } from "../constants";

export const useMasterDataState = (initialCategory = "departments") => {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [data, setData] = useState<Record<string, MasterDataItem[]>>({
    departments: [],
    laboratories: [],
    specimenTypes: [],
    testMethods: [],
    storageLocations: [],
    customers: [],
    indicators: [],
  });
  const [totalCount, setTotalCount] = useState<Record<string, number>>({
    departments: 0,
    laboratories: 0,
    specimenTypes: 0,
    testMethods: 0,
    storageLocations: 0,
    customers: 0,
    indicators: 0,
  });
  const [pagination, setPagination] = useState<
    Record<string, { current: number; pageSize: number }>
  >({
    specimenTypes: { current: 1, pageSize: DEFAULT_PAGE_SIZE },
    testMethods: { current: 1, pageSize: DEFAULT_PAGE_SIZE },
    storageLocations: { current: 1, pageSize: DEFAULT_PAGE_SIZE },
    customers: { current: 1, pageSize: DEFAULT_PAGE_SIZE },
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    departments: false,
    laboratories: false,
    specimenTypes: false,
    testMethods: false,
    storageLocations: false,
    customers: false,
    indicators: false,
  });
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(
    new Set()
  );
  const [statistics, setStatistics] = useState<MasterDataStatisticsDto | null>(
    null
  );
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [users, setUsers] = useState<UserLookupDto[]>([]);

  // Fetch statistics from API
  const fetchStatistics = async () => {
    try {
      setStatisticsLoading(true);
      const stats = await masterDataStatisticsService.getStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error("Failed to fetch statistics:", err);
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Fetch data for a specific category with pagination support
  const fetchCategoryData = async (
    category: string,
    forceRefresh = false,
    page?: number,
    pageSize?: number
  ) => {
    // For paginated categories, always fetch when page/pageSize changes
    const isPaginated = !NO_PAGINATION_CATEGORIES.includes(category);
    const currentPagination = pagination[category] || {
      current: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    };
    const targetPage = page ?? currentPagination.current;
    const targetPageSize = pageSize ?? currentPagination.pageSize;

    // Skip if already loaded and not forcing refresh (only for non-paginated categories)
    if (!forceRefresh && !isPaginated && loadedCategories.has(category)) {
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [category]: true }));
      setError(null);

      let result;
      const skipCount = isPaginated ? (targetPage - 1) * targetPageSize : 0;
      const maxResultCount = isPaginated ? targetPageSize : 1000;

      switch (category) {
        case "departments":
          result = await departmentService.getList({
            maxResultCount: 1000,
          });
          break;
        case "laboratories": {
          const labItems = await laboratoryService.getAll();
          result = { items: labItems, totalCount: labItems.length };
          break;
        }
        case "specimenTypes":
          result = await specimenTypeService.getList({
            skipCount,
            maxResultCount,
          });
          break;
        case "testMethods":
          result = await testMethodService.getList({
            skipCount,
            maxResultCount,
          });
          break;
        case "storageLocations":
          result = await storageLocationService.getList({
            skipCount,
            maxResultCount,
          });
          break;
        case "customers":
          result = await customerService.getList({
            skipCount,
            maxResultCount,
          });
          break;
        default:
          result = { items: [], totalCount: 0 };
      }

      setData((prev) => ({ ...prev, [category]: result.items }));
      setTotalCount((prev) => ({ ...prev, [category]: result.totalCount }));
      if (isPaginated) {
        setPagination((prev) => ({
          ...prev,
          [category]: { current: targetPage, pageSize: targetPageSize },
        }));
      }
      setLoadedCategories((prev) => new Set(prev).add(category));
    } catch (err: any) {
      console.error(`Failed to fetch ${category}:`, err);
      const errorMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        `Failed to load ${category}`;
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  // Handle table pagination change
  const handleTableChange = (page: number, pageSize: number) => {
    if (!activeCategory) {
      return;
    }
    fetchCategoryData(activeCategory, true, page, pageSize);
  };

  // Load statistics on mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Load users for Quản lý kỹ thuật dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await userService.getLookup();
        setUsers(userList);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };
    loadUsers();
  }, []);

  // Load departments for Laboratory form (needed for Department select dropdown)
  useEffect(() => {
    const loadDepartments = async () => {
      if (data.departments.length === 0 && !loadedCategories.has("departments")) {
        try {
          const result = await departmentService.getList({ maxResultCount: 1000 });
          setData((prev) => ({ ...prev, departments: result.items }));
          setTotalCount((prev) => ({ ...prev, departments: result.totalCount }));
          setLoadedCategories((prev) => new Set(prev).add("departments"));
        } catch (err) {
          console.error("Failed to load departments:", err);
        }
      }
    };
    loadDepartments();
  }, []);

  // Load data when switching tabs (lazy load)
  useEffect(() => {
    if (!activeCategory) {
      return;
    }

    const isPaginated = !NO_PAGINATION_CATEGORIES.includes(activeCategory);
    // For paginated categories, load if no data; for non-paginated, check loadedCategories
    if (isPaginated) {
      if (data[activeCategory]?.length === 0) {
        fetchCategoryData(activeCategory);
      }
    } else if (!loadedCategories.has(activeCategory)) {
      fetchCategoryData(activeCategory);
    }
  }, [activeCategory]);

  const currentData = data[activeCategory] || [];
  const filteredData = searchText
    ? currentData.filter(
        (item) =>
          item.code?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.name?.toLowerCase().includes(searchText.toLowerCase())
      )
    : currentData;

  return {
    // State
    activeCategory,
    data,
    totalCount,
    pagination,
    loading,
    loadedCategories,
    statistics,
    statisticsLoading,
    error,
    searchText,
    isModalOpen,
    editingItem,
    modalLoading,
    importModalOpen,
    downloadingTemplate,
    users,
    currentData,
    filteredData,
    // Setters
    setActiveCategory,
    setData,
    setTotalCount,
    setPagination,
    setLoading,
    setLoadedCategories,
    setStatistics,
    setStatisticsLoading,
    setError,
    setSearchText,
    setIsModalOpen,
    setEditingItem,
    setModalLoading,
    setImportModalOpen,
    setDownloadingTemplate,
    setUsers,
    // Actions
    fetchStatistics,
    fetchCategoryData,
    handleTableChange,
  };
};
