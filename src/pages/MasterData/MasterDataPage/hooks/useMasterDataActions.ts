import { message } from "antd";
import type { FormInstance } from "antd";
import {
  departmentService,
  specimenTypeService,
  testMethodService,
  storageLocationService,
  customerService,
  laboratoryService,
  warehouseService,
  CreateUpdateDepartmentDto,
  CreateUpdateSpecimenTypeDto,
  CreateTestMethodDto,
  UpdateTestMethodDto,
  CreateUpdateStorageLocationDto,
  CreateUpdateCustomerDto,
  CreateUpdateLaboratoryDto,
  CreateUpdateWarehouseDto,
} from "../../../../services/masterDataService";
import {
  importService,
  downloadBlobAsFile,
} from "../../../../services/importService";
import { MasterDataItem } from "../types";
import { categoryLabels, importTypeMap } from "../constants";

interface UseMasterDataActionsParams {
  activeCategory: string;
  currentData: MasterDataItem[];
  editingItem: MasterDataItem | null;
  setIsModalOpen: (open: boolean) => void;
  setEditingItem: (item: MasterDataItem | null) => void;
  setModalLoading: (loading: boolean) => void;
  setImportModalOpen: (open: boolean) => void;
  setDownloadingTemplate: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchCategoryData: (category: string, forceRefresh?: boolean) => Promise<void>;
  fetchStatistics: () => Promise<void>;
}

export const useMasterDataActions = ({
  activeCategory,
  currentData,
  editingItem,
  setIsModalOpen,
  setEditingItem,
  setModalLoading,
  setImportModalOpen,
  setDownloadingTemplate,
  setError,
  fetchCategoryData,
  fetchStatistics,
}: UseMasterDataActionsParams) => {
  const canImport = importTypeMap[activeCategory] !== null;

  const handleCreate = async (form: FormInstance) => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      sortOrder: currentData.length + 1,
    });

    if (activeCategory === "warehouses") {
      try {
        const nextCode = await warehouseService.getNextCode();
        form.setFieldsValue({ code: nextCode });
      } catch (err) {
        console.error("Failed to get next warehouse code:", err);
      }
    }

    setIsModalOpen(true);
  };

  const handleEdit = (record: MasterDataItem, form: FormInstance) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);

      switch (activeCategory) {
        case "departments":
          await departmentService.delete(id);
          break;
        case "laboratories":
          await laboratoryService.delete(id);
          break;
        case "specimenTypes":
          await specimenTypeService.delete(id);
          break;
        case "testMethods":
          await testMethodService.delete(id);
          break;
        case "storageLocations":
          await storageLocationService.delete(id);
          break;
        case "customers":
          await customerService.delete(id);
          break;
        case "warehouses":
          await warehouseService.delete(id);
          break;
      }

      message.success("Xóa thành công!");
      // Refresh data and statistics
      await fetchCategoryData(activeCategory, true);
      fetchStatistics();
    } catch (err: any) {
      console.error("Failed to delete:", err);
      // Handle different error formats from ABP Framework
      let errorMsg = "Lỗi khi xóa dữ liệu";

      if (err?.response?.data) {
        const errorData = err.response.data;
        if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (errorData.general && Array.isArray(errorData.general)) {
          errorMsg = errorData.general.join(", ");
        } else if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat();
          errorMsg = (errorMessages as string[]).join(", ");
        } else if (typeof errorData === "object") {
          const allErrors = Object.values(errorData)
            .flat()
            .filter((e) => typeof e === "string");
          if (allErrors.length > 0) {
            errorMsg = (allErrors as string[]).join(", ");
          }
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      message.error(errorMsg);
    }
  };

  const handleModalOk = async (form: FormInstance) => {
    try {
      setModalLoading(true);
      setError(null);
      // Clear previous field errors
      form.setFields([
        { name: "code", errors: [] },
        { name: "name", errors: [] },
      ]);
      const values = await form.validateFields();

      if (editingItem) {
        // Update existing item
        switch (activeCategory) {
          case "departments":
            await departmentService.update(
              editingItem.id,
              values as CreateUpdateDepartmentDto
            );
            break;
          case "laboratories":
            await laboratoryService.update(
              editingItem.id,
              values as CreateUpdateLaboratoryDto
            );
            break;
          case "specimenTypes":
            await specimenTypeService.update(
              editingItem.id,
              values as CreateUpdateSpecimenTypeDto
            );
            break;
          case "testMethods":
            await testMethodService.update(
              editingItem.id,
              values as UpdateTestMethodDto
            );
            break;
          case "storageLocations":
            await storageLocationService.update(
              editingItem.id,
              values as CreateUpdateStorageLocationDto
            );
            break;
          case "customers":
            await customerService.update(
              editingItem.id,
              values as CreateUpdateCustomerDto
            );
            break;
          case "warehouses":
            await warehouseService.update(
              editingItem.id,
              values as CreateUpdateWarehouseDto
            );
            break;
        }
        message.success("Cập nhật thành công!");
      } else {
        // Create new item
        switch (activeCategory) {
          case "departments":
            await departmentService.create(values as CreateUpdateDepartmentDto);
            break;
          case "laboratories":
            await laboratoryService.create(values as CreateUpdateLaboratoryDto);
            break;
          case "specimenTypes":
            await specimenTypeService.create(
              values as CreateUpdateSpecimenTypeDto
            );
            break;
          case "testMethods":
            await testMethodService.create(values as CreateTestMethodDto);
            break;
          case "storageLocations":
            await storageLocationService.create(
              values as CreateUpdateStorageLocationDto
            );
            break;
          case "customers":
            await customerService.create(values as CreateUpdateCustomerDto);
            break;
          case "warehouses":
            await warehouseService.create(values as CreateUpdateWarehouseDto);
            break;
        }
        message.success("Thêm mới thành công!");
      }

      setIsModalOpen(false);
      form.resetFields();
      // Refresh data and statistics
      await fetchCategoryData(activeCategory, true);
      if (!editingItem) {
        // Only refresh statistics when creating new item
        fetchStatistics();
      }
    } catch (err: any) {
      // Ant Design form validation error — inline errors already shown on fields
      if (err?.errorFields) {
        if (activeCategory === "warehouses") return;
      }

      console.error("Failed to save:", err);
      // Handle different error formats from ABP Framework
      let errorMsg = "Lỗi khi lưu dữ liệu";
      let hasFieldErrors = false;

      if (err?.response?.data) {
        const errorData = err.response.data;

        // Handle field-level validation errors format: { code: "message", name: "message" }
        // After API interceptor unwraps, errorData is directly the field errors object
        if (typeof errorData === "object") {
          const fieldErrors: { name: string; errors: string[] }[] = [];
          const validFields = ["code", "name", "description", "phone", "email", "address", "taxCode", "contactPerson"];

          for (const field of validFields) {
            if (errorData[field] && typeof errorData[field] === "string") {
              fieldErrors.push({
                name: field,
                errors: [errorData[field]],
              });
            } else if (errorData[field] && Array.isArray(errorData[field])) {
              fieldErrors.push({
                name: field,
                errors: errorData[field],
              });
            }
          }

          if (fieldErrors.length > 0) {
            form.setFields(fieldErrors);
            hasFieldErrors = true;
            // Show first error as toast
            errorMsg = fieldErrors[0].errors[0];
          }
        }

        // ABP Framework format: { error: { message: "...", details: "..." } }
        if (!hasFieldErrors && errorData.error?.message) {
          errorMsg = errorData.error.message;
        }
        // Alternative ABP format: { message: "..." }
        else if (!hasFieldErrors && errorData.message) {
          errorMsg = errorData.message;
        }
        // Custom format with general errors: { general: ["error1", "error2"] }
        else if (!hasFieldErrors && errorData.general && Array.isArray(errorData.general)) {
          errorMsg = errorData.general.join(", ");
        }
        // Validation errors format: { errors: { field: ["error1", "error2"] } }
        else if (!hasFieldErrors && errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat();
          errorMsg = (errorMessages as string[]).join(", ");
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      if (activeCategory === "warehouses") {
        if (!hasFieldErrors) {
          message.error(errorMsg);
        }
      } else {
        setError(errorMsg);
        message.error(errorMsg);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (record: MasterDataItem) => {
    if (activeCategory !== "warehouses") return;
    try {
      await warehouseService.toggleActive(record.id);
      const newStatus = !(record as any).isActive;
      message.success(
        newStatus ? "Đã kích hoạt kho!" : "Đã ngừng kích hoạt kho!"
      );
      await fetchCategoryData(activeCategory, true);
    } catch (err: any) {
      console.error("Failed to toggle active:", err);
      message.error("Không thể thay đổi trạng thái");
    }
  };

  const handleImportExcel = () => {
    if (canImport) {
      setImportModalOpen(true);
    } else {
      message.info(
        `Import Excel chưa hỗ trợ cho ${categoryLabels[activeCategory]}`
      );
    }
  };

  const handleDownloadTemplate = async () => {
    if (!canImport) {
      message.info(
        `Tải template mẫu chưa hỗ trợ cho ${categoryLabels[activeCategory]}`
      );
      return;
    }

    setDownloadingTemplate(true);
    try {
      let blob: Blob;
      let filename: string;

      if (activeCategory === "customers") {
        blob = await importService.downloadCustomersTemplate();
        filename = "customers-template.xlsx";
      } else if (activeCategory === "testMethods") {
        blob = await importService.downloadTestMethodsTemplate();
        filename = "test-methods-template.xlsx";
      } else if (activeCategory === "warehouses") {
        blob = await importService.downloadWarehouseTemplate();
        filename = "Danh_muc_kho.xlsx";
      } else {
        throw new Error("Unsupported category for template download");
      }

      downloadBlobAsFile(blob, filename);
      message.success("Tải template thành công!");
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error("Không thể tải template. Vui lòng thử lại.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleExportExcel = () => {
    const blob = new Blob(["Mock Excel Data"], {
      type: "application/vnd.ms-excel",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `master_data_${activeCategory}.xlsx`;
    a.click();
    message.success("Xuất Excel thành công!");
  };

  return {
    canImport,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleToggleActive,
    handleImportExcel,
    handleDownloadTemplate,
    handleExportExcel,
  };
};
