import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { testResultService } from "../../../services/testResultService";
import { testService } from "../../../services/testService";
import {
  TestResultDto,
  ResultApprovalStatus,
  CreateTestResultDto,
  UpdateTestResultDto,
} from "../../../types/testResult";
import { TestDto } from "../../../types/test";
import { PATH_ROUTES } from "../../../constants";
import { testResultSchema, TestResultFormData } from "../schemas";
import { getTestResultColumns } from "../components/columns";

export const UNIT_OPTIONS = [
  { value: "", label: "Không có" },
  { value: "Ct value", label: "Ct value" },
  { value: "COI", label: "COI (Cut-off Index)" },
  { value: "copies/mL", label: "copies/mL" },
  { value: "CFU/g", label: "CFU/g" },
  { value: "CFU/mL", label: "CFU/mL" },
  { value: "IU/mL", label: "IU/mL" },
];

export const useTestResultList = () => {
  const navigate = useNavigate();

  // List state
  const [data, setData] = useState<TestResultDto[]>([]);
  const [tests, setTests] = useState<TestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResultApprovalStatus | undefined>(undefined);
  const [passFilter, setPassFilter] = useState<boolean | undefined>(undefined);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestResultDto | null>(null);

  // React Hook Form
  const form = useForm<TestResultFormData>({
    resolver: yupResolver(testResultSchema),
    defaultValues: {
      approvalStatus: ResultApprovalStatus.Draft,
      isPass: true,
    },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await testResultService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: "creationTime desc",
        search: searchText || undefined,
        approvalStatus: statusFilter,
        isPass: passFilter,
      });
      setData(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      message.error("Không thể tải danh sách kết quả. Vui lòng kiểm tra kết nối API.");
      console.error("Failed to fetch test results:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter, passFilter]);

  const loadTests = useCallback(async () => {
    try {
      const result = await testService.getList({ maxResultCount: 1000 });
      setTests(result.items);
    } catch (error) {
      console.error("Failed to fetch tests:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

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

  const handleStatusChange = useCallback((value: ResultApprovalStatus | "all") => {
    setStatusFilter(value === "all" ? undefined : value);
    setCurrentPage(1);
  }, []);

  const handlePassFilterChange = useCallback((value: "all" | "pass" | "fail") => {
    if (value === "all") {
      setPassFilter(undefined);
    } else {
      setPassFilter(value === "pass");
    }
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await testResultService.delete(id);
        message.success("Xóa kết quả thành công!");
        loadData();
      } catch (error) {
        message.error("Không thể xóa kết quả. Vui lòng thử lại.");
        console.error("Failed to delete test result:", error);
      }
    },
    [loadData]
  );

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    form.reset({
      approvalStatus: ResultApprovalStatus.Draft,
      isPass: true,
      testId: "",
      parameter: "",
      value: "",
      unit: "",
      lowerLimit: null,
      upperLimit: null,
      notes: "",
    });
    setIsModalOpen(true);
  }, [form]);

  const handleEdit = useCallback(
    (record: TestResultDto) => {
      setEditingItem(record);
      form.reset({
        testId: record.testId,
        parameter: record.parameter,
        value: record.value,
        unit: record.unit,
        lowerLimit: record.lowerLimit ?? null,
        upperLimit: record.upperLimit ?? null,
        isPass: record.isPass ?? true,
        approvalStatus: record.approvalStatus,
        notes: record.notes || "",
      });
      setIsModalOpen(true);
    },
    [form]
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(PATH_ROUTES.testResults.detail(id));
    },
    [navigate]
  );

  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.reset();
  }, [form]);

  const handleModalSubmit = useCallback(
    async (formData: TestResultFormData) => {
      try {
        if (editingItem) {
          const updateData: UpdateTestResultDto = {
            parameter: formData.parameter,
            value: formData.value,
            unit: formData.unit,
            lowerLimit: formData.lowerLimit ?? undefined,
            upperLimit: formData.upperLimit ?? undefined,
            isPass: formData.isPass,
            approvalStatus: (formData.approvalStatus ?? ResultApprovalStatus.Draft) as ResultApprovalStatus,
            notes: formData.notes || undefined,
          };
          await testResultService.update(editingItem.id, updateData);
          message.success("Cập nhật kết quả thành công!");
        } else {
          const createData: CreateTestResultDto = {
            testId: formData.testId || "",
            parameter: formData.parameter,
            value: formData.value,
            unit: formData.unit,
            lowerLimit: formData.lowerLimit ?? undefined,
            upperLimit: formData.upperLimit ?? undefined,
            isPass: formData.isPass,
            notes: formData.notes || undefined,
          };
          await testResultService.create(createData);
          message.success("Thêm kết quả mới thành công!");
        }
        setIsModalOpen(false);
        setEditingItem(null);
        form.reset();
        loadData();
      } catch (error) {
        message.error("Không thể lưu kết quả. Vui lòng thử lại.");
        console.error("Failed to save test result:", error);
      }
    },
    [editingItem, form, loadData]
  );

  const columns = useMemo(
    () =>
      getTestResultColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleDelete]
  );

  return {
    // List state
    data,
    tests,
    loading,
    totalCount,
    currentPage,
    pageSize,
    searchInput,
    statusFilter,
    passFilter,
    columns,

    // Modal state
    isModalOpen,
    editingItem,
    form,

    // Handlers
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusChange,
    handlePassFilterChange,
    handlePageChange,
    handleDelete,
    handleCreate,
    handleEdit,
    handleView,
    handleModalCancel,
    handleModalSubmit,
  };
};
