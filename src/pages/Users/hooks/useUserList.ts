import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { userService, UserDto } from "../../../services/userService";
import { departmentService } from "../../../services/masterDataService";
import { userSchema, UserFormData } from "../schemas";
import { getUserColumns } from "../components/columns";
import { ROLE_OPTIONS } from "../../../constants";

export interface Department {
  id: string;
  name: string;
  code: string;
}

// Re-export ROLE_OPTIONS as ROLES for backward compatibility
export const ROLES = ROLE_OPTIONS;

export const useUserList = () => {
  // List state
  const [data, setData] = useState<UserDto[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // Search
  const [searchText, setSearchText] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserDto | null>(null);

  // React Hook Form
  const form = useForm<UserFormData>({
    resolver: yupResolver(userSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userService.getList({ maxResultCount: 100 });
      setData(result.items || []);
    } catch (error) {
      console.error("Error loading users:", error);
      message.error("Không thể tải danh sách người dùng. Vui lòng kiểm tra kết nối server.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const result = await departmentService.getList({ maxResultCount: 100 });
      setDepartments(result.items || []);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadDepartments();
  }, [loadData, loadDepartments]);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter(
      (u) =>
        u.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        u.username.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [data, searchText]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    form.reset({
      username: "",
      fullName: "",
      email: "",
      phone: "",
      department: "",
      role: "",
      password: "",
    });
    setIsModalOpen(true);
  }, [form]);

  const handleEdit = useCallback(
    (record: UserDto) => {
      setEditingItem(record);
      form.reset({
        username: record.username,
        fullName: record.fullName,
        email: record.email,
        phone: record.phone || "",
        department: record.department,
        role: record.role,
        password: "",
      });
      setIsModalOpen(true);
    },
    [form]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await userService.delete(id);
        setData(data.filter((u) => u.id !== id));
        message.success("Đã xóa người dùng");
      } catch (error) {
        console.error("Error deleting user:", error);
        message.error("Không thể xóa người dùng. Vui lòng thử lại.");
      }
    },
    [data]
  );

  const handleToggleActive = useCallback(
    async (id: string, checked: boolean) => {
      try {
        await userService.toggleActive(id, checked);
        setData(data.map((u) => (u.id === id ? { ...u, isActive: checked } : u)));
        message.success(checked ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản");
      } catch (error) {
        console.error("Error toggling user status:", error);
        message.error("Không thể thay đổi trạng thái. Vui lòng thử lại.");
      }
    },
    [data]
  );

  const handleResetPassword = useCallback(async (record: UserDto) => {
    try {
      const result = await userService.resetPassword(record.id);
      message.success(
        `Đã đặt lại mật khẩu cho ${record.fullName}. Mật khẩu mới: ${result.password}`
      );
    } catch (error) {
      console.error("Error resetting password:", error);
      message.error("Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    }
  }, []);

  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.reset();
  }, [form]);

  const handleModalSubmit = useCallback(
    async (formData: UserFormData) => {
      try {
        if (editingItem) {
          const updatePayload = {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone || undefined,
            department: formData.department,
            role: formData.role,
          };
          await userService.update(editingItem.id, updatePayload);
          message.success("Đã cập nhật thông tin người dùng");
        } else {
          const createPayload = {
            username: formData.username,
            password: formData.password || "",
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone || undefined,
            department: formData.department,
            role: formData.role,
          };
          await userService.create(createPayload);
          message.success("Đã thêm người dùng mới");
        }
        setIsModalOpen(false);
        form.reset();
        loadData();
      } catch (error) {
        console.error("Error saving user:", error);
        message.error("Không thể lưu thông tin người dùng. Vui lòng thử lại.");
      }
    },
    [editingItem, form, loadData]
  );

  // Columns
  const columns = useMemo(
    () =>
      getUserColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleActive: handleToggleActive,
        onResetPassword: handleResetPassword,
      }),
    [handleEdit, handleDelete, handleToggleActive, handleResetPassword]
  );

  return {
    // Data
    data: filteredData,
    departments,
    loading,

    // Search
    searchText,
    handleSearchChange,

    // Modal
    isModalOpen,
    editingItem,
    form,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,

    // Table
    columns,
    loadData,
  };
};
