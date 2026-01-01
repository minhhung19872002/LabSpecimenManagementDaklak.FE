import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import { testService } from "../../../services/testService";
import { specimenService } from "../../../services/specimenService";
import { testMethodService } from "../../../services/masterDataService";
import { userService, UserLookupDto } from "../../../services/userService";
import { TestDto, TestStatus } from "../../../types/test";
import { PATH_ROUTES } from "../../../constants";
import { testSchema, TestFormData } from "../schemas";
import { getTestColumns } from "../components/columns";

export const useTestList = () => {
  const navigate = useNavigate();

  // List state
  const [data, setData] = useState<TestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestStatus | "all">("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestDto | null>(null);

  // Master data
  const [testMethods, setTestMethods] = useState<{ id: string; code: string; name: string; standard?: string }[]>([]);
  const [specimens, setSpecimens] = useState<{ id: string; code: string; name: string }[]>([]);
  const [users, setUsers] = useState<UserLookupDto[]>([]);

  // React Hook Form
  const form = useForm<TestFormData>({
    resolver: yupResolver(testSchema),
    defaultValues: {
      status: TestStatus.Pending,
    },
  });

  const loadMasterData = useCallback(async () => {
    try {
      const [methodsResult, specimensResult] = await Promise.all([
        testMethodService.getActive(),
        specimenService.getList({ maxResultCount: 1000 }),
      ]);
      setTestMethods(methodsResult.items || []);
      setSpecimens(specimensResult.items || []);
    } catch (error) {
      console.error("Error loading master data:", error);
    }

    try {
      const usersResult = await userService.getLookup();
      setUsers(usersResult || []);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await testService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: "creationTime desc",
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setData(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (error) {
      console.error("Error loading tests:", error);
      message.error("Không thể tải danh sách phép thử. Vui lòng kiểm tra kết nối server.");
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = useCallback(() => {
    setSearchText(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: TestStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await testService.delete(id);
        message.success("Xóa phép thử thành công!");
        loadData();
      } catch (error) {
        console.error("Error deleting test:", error);
        message.error("Không thể xóa phép thử. Vui lòng thử lại.");
      }
    },
    [loadData]
  );

  const generateCode = useCallback(() => {
    return `TEST-${dayjs().format("YYYYMMDD")}-${String(data.length + 1).padStart(4, "0")}`;
  }, [data.length]);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    form.reset({
      code: generateCode(),
      status: TestStatus.Pending,
      specimenId: "",
      name: "",
      method: "",
      standard: "",
      assigneeId: null,
      startDate: null,
      completionDate: null,
      notes: null,
    });
    setIsModalOpen(true);
  }, [form, generateCode]);

  const handleEdit = useCallback(
    (record: TestDto) => {
      setEditingItem(record);
      form.reset({
        code: record.code,
        specimenId: record.specimenId,
        name: record.name,
        method: record.method,
        standard: record.standard,
        status: record.status,
        assigneeId: record.assigneeId || null,
        startDate: record.startDate ? new Date(record.startDate) : null,
        completionDate: record.completionDate ? new Date(record.completionDate) : null,
        notes: record.notes || null,
      });
      setIsModalOpen(true);
    },
    [form]
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(PATH_ROUTES.tests.detail(id));
    },
    [navigate]
  );

  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.reset();
  }, [form]);

  const handleModalSubmit = useCallback(
    async (formData: TestFormData) => {
      try {
        if (editingItem) {
          await testService.update(editingItem.id, {
            name: formData.name,
            method: formData.method,
            standard: formData.standard,
            status: (formData.status ?? TestStatus.Pending) as TestStatus,
            assigneeId: formData.assigneeId || undefined,
            startDate: formData.startDate ? dayjs(formData.startDate).toISOString() : undefined,
            completionDate: formData.completionDate ? dayjs(formData.completionDate).toISOString() : undefined,
            notes: formData.notes || undefined,
          });
          message.success("Cập nhật phép thử thành công!");
        } else {
          await testService.create({
            specimenId: formData.specimenId || "",
            name: formData.name,
            method: formData.method,
            standard: formData.standard,
            assigneeId: formData.assigneeId || undefined,
            notes: formData.notes || undefined,
          });
          message.success("Thêm phép thử mới thành công!");
        }
        setIsModalOpen(false);
        setEditingItem(null);
        form.reset();
        loadData();
      } catch (error) {
        console.error("Error saving test:", error);
        message.error("Không thể lưu phép thử. Vui lòng thử lại.");
      }
    },
    [editingItem, form, loadData]
  );

  const columns = useMemo(
    () =>
      getTestColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleDelete]
  );

  // Get unique standards from test methods
  const standards = useMemo(() => {
    return [...new Set(testMethods.map((m) => m.standard).filter(Boolean))] as string[];
  }, [testMethods]);

  return {
    // List state
    data,
    loading,
    totalCount,
    currentPage,
    pageSize,
    searchInput,
    statusFilter,
    columns,

    // Modal state
    isModalOpen,
    editingItem,
    form,

    // Master data
    testMethods,
    specimens,
    users,
    standards,

    // Handlers
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusChange,
    handlePageChange,
    handleDelete,
    handleCreate,
    handleEdit,
    handleView,
    handleModalCancel,
    handleModalSubmit,
  };
};
