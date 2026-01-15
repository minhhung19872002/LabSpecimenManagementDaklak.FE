import { useState } from "react";
import { message, Modal } from "antd";
import type { FormInstance } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { UseFormReturn } from "react-hook-form";
import {
  indicatorGroupService,
  indicatorService,
  CreateUpdateIndicatorGroupDto,
  CreateIndicatorDto,
  UpdateIndicatorDto,
  CreateBulkIndicatorsDto,
} from "../../../../services/masterDataService";
import {
  IndicatorGroupDto,
  IndicatorDto,
  ImportIndicatorsResultDto,
  ImportIndicatorGroupsResultDto,
} from "../types";
import {
  IndicatorFormData,
  IndicatorGroupFormData,
} from "../schemas/indicatorSchema";

interface UseIndicatorsActionsParams {
  indicators: IndicatorDto[];
  selectedRowKeys: string[];
  setSelectedRowKeys: (keys: string[]) => void;
  setBatchLoading: (loading: boolean) => void;
  fetchData: () => Promise<void>;
  onDataChange?: () => void;
}

export const useIndicatorsActions = ({
  indicators,
  selectedRowKeys,
  setSelectedRowKeys,
  setBatchLoading,
  fetchData,
  onDataChange,
}: UseIndicatorsActionsParams) => {
  // Modal states
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importGroupModalOpen, setImportGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IndicatorGroupDto | null>(
    null
  );
  const [editingIndicator, setEditingIndicator] = useState<IndicatorDto | null>(
    null
  );
  const [modalLoading, setModalLoading] = useState(false);
  const [importResult, setImportResult] =
    useState<ImportIndicatorsResultDto | null>(null);
  const [importGroupResult, setImportGroupResult] =
    useState<ImportIndicatorGroupsResultDto | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [groupFileList, setGroupFileList] = useState<UploadFile[]>([]);

  // Handle Group CRUD
  const handleCreateGroup = (groupForm: UseFormReturn<IndicatorGroupFormData>) => {
    setEditingGroup(null);
    groupForm.reset({ name: "", isActive: true, laboratoryId: undefined });
    setGroupModalOpen(true);
  };

  const handleEditGroup = (
    group: IndicatorGroupDto,
    groupForm: UseFormReturn<IndicatorGroupFormData>
  ) => {
    setEditingGroup(group);
    groupForm.reset({
      name: group.name,
      isActive: group.isActive,
      laboratoryId: group.laboratoryId || undefined,
    });
    setGroupModalOpen(true);
  };

  const handleDeleteGroup = async (id: string) => {
    const groupIndicators = indicators.filter(
      (ind) => ind.indicatorGroupId === id
    );
    if (groupIndicators.length > 0) {
      message.error("Không thể xóa nhóm có chứa chỉ tiêu");
      return;
    }
    try {
      await indicatorGroupService.delete(id);
      message.success("Xóa nhóm thành công!");
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể xóa nhóm");
    }
  };

  const handleGroupModalOk = async (
    data: IndicatorGroupFormData,
    groupForm: UseFormReturn<IndicatorGroupFormData>
  ) => {
    try {
      setModalLoading(true);

      if (editingGroup) {
        await indicatorGroupService.update(
          editingGroup.id,
          data as CreateUpdateIndicatorGroupDto
        );
        message.success("Cập nhật nhóm thành công!");
      } else {
        await indicatorGroupService.create(data as CreateUpdateIndicatorGroupDto);
        message.success("Thêm nhóm thành công!");
      }

      setGroupModalOpen(false);
      groupForm.reset();
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể lưu nhóm");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Indicator CRUD
  const handleEditIndicator = (
    indicator: IndicatorDto,
    indicatorForm: UseFormReturn<IndicatorFormData>
  ) => {
    setEditingIndicator(indicator);
    indicatorForm.reset({
      indicatorGroupId: indicator.indicatorGroupId,
      name: indicator.name,
      formattedName: indicator.formattedName || indicator.name,
      isActive: indicator.isActive,
    });
    setIndicatorModalOpen(true);
  };

  const handleDeleteIndicator = async (id: string) => {
    try {
      const canDelete = await indicatorService.canDelete(id);
      if (!canDelete) {
        message.error(
          "Không thể xóa chỉ tiêu này vì đã được sử dụng trong phiếu yêu cầu"
        );
        return;
      }
      await indicatorService.delete(id);
      message.success("Xóa chỉ tiêu thành công!");
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể xóa chỉ tiêu");
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await indicatorService.toggleActive(id);
      message.success("Cập nhật trạng thái thành công!");
      fetchData();
    } catch (error) {
      message.error("Không thể cập nhật trạng thái");
    }
  };

  // Batch operations
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} chỉ tiêu đã chọn?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setBatchLoading(true);
          const result = await indicatorService.batchDelete(selectedRowKeys);
          if (result.successCount > 0) {
            message.success(
              `Đã xóa ${result.successCount} chỉ tiêu thành công!`
            );
          }
          if (result.failedCount > 0) {
            const errorNames = result.errors.map((e) => e.name).join(", ");
            message.warning(
              `${result.failedCount} chỉ tiêu không thể xóa: ${errorNames}`
            );
          }
          setSelectedRowKeys([]);
          fetchData();
          onDataChange?.();
        } catch (error) {
          message.error("Không thể xóa chỉ tiêu");
        } finally {
          setBatchLoading(false);
        }
      },
    });
  };

  const handleBatchDeactivate = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    Modal.confirm({
      title: "Xác nhận ngưng hoạt động",
      content: `Bạn có chắc chắn muốn ngưng hoạt động ${selectedRowKeys.length} chỉ tiêu đã chọn?`,
      okText: "Ngưng hoạt động",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setBatchLoading(true);
          const result = await indicatorService.batchDeactivate(
            selectedRowKeys
          );
          message.success(
            `Đã ngưng hoạt động ${result.successCount} chỉ tiêu!`
          );
          setSelectedRowKeys([]);
          fetchData();
        } catch (error) {
          message.error("Không thể ngưng hoạt động chỉ tiêu");
        } finally {
          setBatchLoading(false);
        }
      },
    });
  };

  const handleBatchActivate = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    Modal.confirm({
      title: "Xác nhận kích hoạt",
      content: `Bạn có chắc chắn muốn kích hoạt ${selectedRowKeys.length} chỉ tiêu đã chọn?`,
      okText: "Kích hoạt",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setBatchLoading(true);
          const result = await indicatorService.batchActivate(selectedRowKeys);
          message.success(`Đã kích hoạt ${result.successCount} chỉ tiêu!`);
          setSelectedRowKeys([]);
          fetchData();
        } catch (error) {
          message.error("Không thể kích hoạt chỉ tiêu");
        } finally {
          setBatchLoading(false);
        }
      },
    });
  };

  const handleIndicatorModalOk = async (
    data: IndicatorFormData,
    indicatorForm: UseFormReturn<IndicatorFormData>
  ) => {
    try {
      setModalLoading(true);

      if (editingIndicator) {
        await indicatorService.update(
          editingIndicator.id,
          data as UpdateIndicatorDto
        );
        message.success("Cập nhật chỉ tiêu thành công!");
      } else {
        await indicatorService.create(data as CreateIndicatorDto);
        message.success("Thêm chỉ tiêu thành công!");
      }

      setIndicatorModalOpen(false);
      indicatorForm.reset();
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể lưu chỉ tiêu");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Bulk Create (still uses Ant Design Form for dynamic fields)
  const handleBulkCreate = (bulkForm: FormInstance) => {
    console.log("handleBulkCreate");
    bulkForm.resetFields();
    bulkForm.setFieldsValue({ indicators: [{ name: "", formattedName: "" }] });
    setBulkModalOpen(true);
  };

  const handleBulkModalOk = async (bulkForm: FormInstance) => {
    try {
      setModalLoading(true);
      const values = await bulkForm.validateFields();

      // Map form values to DTO format
      const indicators = values.indicators
        .filter((item: any) => item?.name?.trim())
        .map((item: any) => ({
          name: item.name.trim(),
          formattedName: item.formattedName || item.name.trim(),
        }));

      const data: CreateBulkIndicatorsDto = {
        indicatorGroupId: values.indicatorGroupId,
        indicators,
      };

      if (data.indicators.length === 0) {
        message.error("Vui lòng nhập ít nhất 1 chỉ tiêu");
        return;
      }

      await indicatorService.createBulk(data);
      message.success(`Thêm ${data.indicators.length} chỉ tiêu thành công!`);

      setBulkModalOpen(false);
      bulkForm.resetFields();
      fetchData();
      onDataChange?.();
    } catch (error) {
      message.error("Không thể thêm chỉ tiêu");
    } finally {
      setModalLoading(false);
    }
  };

  const handleImportExcel = async () => {
    if (fileList.length === 0) {
      message.error("Vui lòng chọn file Excel");
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) {
      message.error("File không hợp lệ");
      return;
    }

    try {
      setModalLoading(true);
      const result = await indicatorService.importFromExcel(file);
      setImportResult(result);

      if (result.successCount > 0) {
        message.success(`Import thành công ${result.successCount} chỉ tiêu!`);
        fetchData();
        onDataChange?.();
      }

      if (result.errorCount > 0) {
        message.warning(`Có ${result.errorCount} lỗi khi import`);
      }
    } catch (error) {
      message.error("Không thể import file");
    } finally {
      setModalLoading(false);
    }
  };

  const handleImportGroupExcel = async () => {
    if (groupFileList.length === 0) {
      message.error("Vui lòng chọn file Excel");
      return;
    }

    const file = groupFileList[0].originFileObj;
    if (!file) {
      message.error("File không hợp lệ");
      return;
    }

    try {
      setModalLoading(true);
      const result = await indicatorGroupService.importFromExcel(file);
      setImportGroupResult(result);

      if (result.successCount > 0) {
        message.success(
          `Import thành công ${result.successCount} nhóm chỉ tiêu!`
        );
        fetchData();
        onDataChange?.();
      }

      if (result.errorCount > 0) {
        message.warning(`Có ${result.errorCount} lỗi khi import`);
      }
    } catch (error) {
      message.error("Không thể import file");
    } finally {
      setModalLoading(false);
    }
  };

  return {
    // Modal states
    groupModalOpen,
    setGroupModalOpen,
    indicatorModalOpen,
    setIndicatorModalOpen,
    bulkModalOpen,
    setBulkModalOpen,
    importModalOpen,
    setImportModalOpen,
    importGroupModalOpen,
    setImportGroupModalOpen,
    editingGroup,
    setEditingGroup,
    editingIndicator,
    setEditingIndicator,
    modalLoading,
    importResult,
    setImportResult,
    importGroupResult,
    setImportGroupResult,
    fileList,
    setFileList,
    groupFileList,
    setGroupFileList,
    // Group actions
    handleCreateGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleGroupModalOk,
    // Indicator actions
    handleEditIndicator,
    handleDeleteIndicator,
    handleToggleActive,
    handleIndicatorModalOk,
    // Batch actions
    handleBatchDelete,
    handleBatchDeactivate,
    handleBatchActivate,
    // Bulk create
    handleBulkCreate,
    handleBulkModalOk,
    // Import
    handleImportExcel,
    handleImportGroupExcel,
  };
};
