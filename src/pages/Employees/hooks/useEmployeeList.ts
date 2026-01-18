import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { employeeService, EmployeeDto } from "../../../services/employeeService";
import { departmentService } from "../../../services/masterDataService";
import { ROLES } from "../../../constants";
import { employeeSchema, EmployeeFormData } from "../schemas";
import { getEmployeeColumns } from "../components/columns";

export interface Department {
  id: string;
  name: string;
  code: string;
}

export const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: "Quản trị viên", color: "red" },
  { value: ROLES.LAB_TECHNICAL_MANAGER, label: "Quản lý kỹ thuật Lab", color: "purple" },
  { value: ROLES.SAMPLE_RECEIVER, label: "Giao nhận mẫu", color: "blue" },
  { value: ROLES.QUALITY_MANAGER, label: "Quản lý chất lượng", color: "green" },
  { value: ROLES.LAB_TECHNICIAN, label: "Thử nghiệm viên", color: "orange" },
];

export const POSITION_OPTIONS = [
  "Giám đốc",
  "Phó Giám đốc",
  "Trưởng phòng",
  "Phó trưởng phòng",
  "Thử nghiệm viên chính",
  "Thử nghiệm viên",
  "Nhân viên",
];

export const useEmployeeList = () => {
  // List state
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & filter state
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EmployeeDto | null>(null);
  const [newEmployeeInfo, setNewEmployeeInfo] = useState<{ email: string } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [resetPasswordLoadingId, setResetPasswordLoadingId] = useState<string | null>(null);

  // Statistics state
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  // React Hook Form
  const form = useForm<EmployeeFormData>({
    resolver: yupResolver(employeeSchema) as any,
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      phone: null,
      departmentId: "",
      position: null,
      role: "",
      isActive: true,
      passwordMode: "auto",
      password: "",
      confirmPassword: "",
    },
  });

  // Load departments once
  const loadDepartments = useCallback(async () => {
    try {
      const result = await departmentService.getList({ maxResultCount: 100 });
      setDepartments(result.items || []);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const result = await employeeService.getList({ maxResultCount: 1000 });
      const items = result.items || [];
      setStats({
        total: items.length,
        active: items.filter((e) => e.isActive).length,
        inactive: items.filter((e) => !e.isActive).length,
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: "CreationTime DESC",
      };

      if (searchText) {
        params.filter = searchText;
      }
      if (departmentFilter !== "all") {
        const dept = departments.find((d) => d.name === departmentFilter);
        if (dept) {
          params.departmentId = dept.id;
        }
      }
      if (roleFilter !== "all") {
        params.role = roleFilter;
      }

      const result = await employeeService.getList(params);
      setEmployees(result.items || []);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Error loading employees:", error);
      message.error("Không thể tải danh sách nhân viên. Vui lòng kiểm tra kết nối server.");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, departmentFilter, roleFilter, departments]);

  useEffect(() => {
    loadDepartments();
    loadStatistics();
  }, [loadDepartments, loadStatistics]);

  useEffect(() => {
    if (departments.length > 0) {
      loadData();
    }
  }, [loadData, departments.length]);

  // Search handlers
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

  // Filter handlers
  const handleDepartmentFilterChange = useCallback((value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
  }, []);

  const handleRoleFilterChange = useCallback((value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  }, []);

  // Pagination handler
  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setDepartmentFilter("all");
    setRoleFilter("all");
    setCurrentPage(1);
    loadStatistics();
  }, [loadStatistics]);

  // CRUD handlers
  const handleCreate = useCallback(() => {
    setEditingItem(null);
    form.reset({
      username: "",
      fullName: "",
      email: "",
      phone: null,
      departmentId: "",
      position: null,
      role: "",
      isActive: true,
      passwordMode: "auto",
      password: "",
      confirmPassword: "",
    });
    setIsModalOpen(true);
  }, [form]);

  const handleEdit = useCallback(
    (record: EmployeeDto) => {
      setEditingItem(record);
      form.reset({
        username: record.username,
        fullName: record.fullName,
        email: record.email,
        phone: record.phone || null,
        departmentId: record.departmentId,
        position: record.position || null,
        role: record.role,
        isActive: record.isActive,
      });
      setIsModalOpen(true);
    },
    [form]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await employeeService.delete(id);
        message.success("Đã xóa nhân viên");
        loadData();
        loadStatistics();
      } catch (error) {
        console.error("Error deleting employee:", error);
        message.error("Không thể xóa nhân viên. Vui lòng thử lại.");
      }
    },
    [loadData, loadStatistics]
  );

  const handleToggleActive = useCallback(
    async (id: string, checked: boolean) => {
      try {
        await employeeService.toggleActive(id, checked);
        setEmployees((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: checked } : item
          )
        );
        setStats((prev) => ({
          ...prev,
          active: prev.active + (checked ? 1 : -1),
          inactive: prev.inactive + (checked ? -1 : 1),
        }));
        message.success(
          checked ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản"
        );
      } catch (error) {
        console.error("Error toggling employee status:", error);
        message.error("Không thể thay đổi trạng thái. Vui lòng thử lại.");
      }
    },
    []
  );

  const handleResetPassword = useCallback(async (record: EmployeeDto) => {
    setResetPasswordLoadingId(record.id);
    try {
      await employeeService.resetPassword(record.id);
      setNewEmployeeInfo({ email: record.email });
      setIsPasswordModalOpen(true);
    } catch (error) {
      console.error("Error resetting password:", error);
      message.error("Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setResetPasswordLoadingId(null);
    }
  }, []);

  // Modal handlers
  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.reset();
  }, [form]);

  const handleModalSubmit = useCallback(
    async (formData: EmployeeFormData) => {
      setModalLoading(true);
      try {
        if (editingItem) {
          // Update employee
          await employeeService.update(editingItem.id, {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone || "",
            role: formData.role,
            departmentId: formData.departmentId,
            position: formData.position || "",
            isActive: formData.isActive ?? true,
          });
          message.success("Đã cập nhật thông tin nhân viên");
          setIsModalOpen(false);
          loadData();
        } else {
          // Create employee
          const isManualPassword = formData.passwordMode === "manual";

          await employeeService.create({
            username: formData.username,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone || "",
            role: formData.role,
            departmentId: formData.departmentId,
            position: formData.position || "",
            isActive: formData.isActive ?? true,
            useManualPassword: isManualPassword,
            password: isManualPassword ? formData.password || undefined : undefined,
            confirmPassword: isManualPassword ? formData.confirmPassword || undefined : undefined,
          });
          setIsModalOpen(false);
          loadData();
          loadStatistics();

          // Only show password sent modal if auto-generated
          if (!isManualPassword) {
            setNewEmployeeInfo({ email: formData.email });
            setIsPasswordModalOpen(true);
          } else {
            message.success("Đã tạo nhân viên thành công");
          }
        }

        form.reset();
      } catch (error: unknown) {
        console.error("Error saving employee:", error);

        // Parse error message from API response
        let errorMessage = "Không thể lưu thông tin nhân viên. Vui lòng thử lại.";

        if (error && typeof error === "object" && "response" in error) {
          const response = (error as { response?: { data?: Record<string, string[]> | { message?: string } } }).response;
          const errorData = response?.data;

          if (errorData) {
            // Check if errorData is validation errors object { field: ["message1", "message2"] }
            if (typeof errorData === "object" && !("message" in errorData)) {
              const errors = errorData as Record<string, string[]>;
              const allMessages: string[] = [];

              Object.values(errors).forEach((messages) => {
                if (Array.isArray(messages)) {
                  allMessages.push(...messages);
                }
              });

              if (allMessages.length > 0) {
                errorMessage = allMessages.join(". ");
              }
            } else if ("message" in errorData && errorData.message) {
              errorMessage = String(errorData.message);
            }
          }
        }

        message.error(errorMessage);
      } finally {
        setModalLoading(false);
      }
    },
    [editingItem, form, loadData, loadStatistics]
  );

  const handlePasswordModalClose = useCallback(() => {
    setIsPasswordModalOpen(false);
    setNewEmployeeInfo(null);
  }, []);

  // Columns
  const columns = useMemo(
    () =>
      getEmployeeColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleActive: handleToggleActive,
        onResetPassword: handleResetPassword,
        resetPasswordLoadingId,
        roles: ROLE_OPTIONS,
      }),
    [handleEdit, handleDelete, handleToggleActive, handleResetPassword, resetPasswordLoadingId]
  );

  return {
    // List state
    employees,
    departments,
    loading,
    totalCount,
    stats,

    // Search & filter
    searchInput,
    departmentFilter,
    roleFilter,

    // Pagination
    currentPage,
    pageSize,

    // Modal state
    isModalOpen,
    isPasswordModalOpen,
    editingItem,
    newEmployeeInfo,
    modalLoading,
    form,

    // Table
    columns,

    // Handlers
    handleSearchInputChange,
    handleSearch,
    handleClearSearch,
    handleDepartmentFilterChange,
    handleRoleFilterChange,
    handlePageChange,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleModalCancel,
    handleModalSubmit,
    handlePasswordModalClose,
  };
};
