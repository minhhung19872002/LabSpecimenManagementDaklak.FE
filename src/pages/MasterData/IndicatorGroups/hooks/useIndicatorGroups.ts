import { useState, useEffect, useMemo, useCallback } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { UploadFile } from "antd/es/upload/interface";
import {
  indicatorGroupService,
  CreateUpdateIndicatorGroupDto,
  IndicatorGroupDto,
  ImportIndicatorGroupsResultDto,
} from "../../../../services/masterDataService";
import {
  indicatorGroupSchema,
  IndicatorGroupFormData,
} from "../../Indicators/schemas/indicatorSchema";
import { getApiErrorMessage } from "../../../../utils/errorHandler";
import { downloadBlob, normalizeForSearch } from "../utils";

/** Dữ liệu + thao tác cho danh mục "Nhóm chỉ tiêu" (tách khỏi danh mục chỉ tiêu) */
export const useIndicatorGroups = (onDataChange?: () => void) => {
  const [groups, setGroups] = useState<IndicatorGroupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IndicatorGroupDto | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileList, setImportFileList] = useState<UploadFile[]>([]);
  const [importResult, setImportResult] = useState<ImportIndicatorGroupsResultDto | null>(null);

  const groupForm = useForm<IndicatorGroupFormData>({
    resolver: yupResolver(indicatorGroupSchema) as any,
    defaultValues: { name: "", isActive: true },
  });

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      setGroups((await indicatorGroupService.getWithCount()) || []);
    } catch (error) {
      console.error("Failed to fetch indicator groups:", error);
      message.error("Không thể tải danh sách nhóm chỉ tiêu");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  const filteredGroups = useMemo(() => {
    const keyword = normalizeForSearch(searchText);
    if (!keyword) return groups;
    return groups.filter((g) => normalizeForSearch(g.name).includes(keyword));
  }, [groups, searchText]);

  const refresh = useCallback(() => {
    fetchGroups();
    onDataChange?.();
  }, [fetchGroups, onDataChange]);

  // CRUD
  const handleCreate = useCallback(() => {
    setEditingGroup(null);
    groupForm.reset({ name: "", isActive: true });
    setGroupModalOpen(true);
  }, [groupForm]);

  const handleEdit = useCallback(
    (group: IndicatorGroupDto) => {
      setEditingGroup(group);
      groupForm.reset({ name: group.name, isActive: group.isActive });
      setGroupModalOpen(true);
    },
    [groupForm],
  );

  const handleCloseModal = useCallback(() => {
    setGroupModalOpen(false);
    groupForm.reset();
  }, [groupForm]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await indicatorGroupService.delete(id);
        message.success("Xóa nhóm thành công!");
        refresh();
      } catch (error: unknown) {
        message.error(getApiErrorMessage(error, "Không thể xóa nhóm"));
      }
    },
    [refresh],
  );

  const handleModalOk = useCallback(
    async (data: IndicatorGroupFormData) => {
      try {
        setModalLoading(true);
        if (editingGroup) {
          await indicatorGroupService.update(editingGroup.id, data as CreateUpdateIndicatorGroupDto);
          message.success("Cập nhật nhóm thành công!");
        } else {
          await indicatorGroupService.create(data as CreateUpdateIndicatorGroupDto);
          message.success("Thêm nhóm thành công!");
        }
        setGroupModalOpen(false);
        groupForm.reset();
        refresh();
      } catch (error: unknown) {
        message.error(getApiErrorMessage(error, "Không thể lưu nhóm"));
      } finally {
        setModalLoading(false);
      }
    },
    [editingGroup, groupForm, refresh],
  );

  // Import danh sách nhóm (chỉ tên nhóm)
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await indicatorGroupService.downloadTemplate();
      downloadBlob(blob, "Template_DanhSachNhomChiTieu.xlsx");
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Không thể tải template"));
    }
  }, []);

  const handleOpenImport = useCallback(() => {
    setImportResult(null);
    setImportFileList([]);
    setImportModalOpen(true);
  }, []);

  const handleCloseImport = useCallback(() => {
    setImportModalOpen(false);
    setImportResult(null);
    setImportFileList([]);
  }, []);

  const handleImport = useCallback(async () => {
    const file = importFileList[0]?.originFileObj;
    if (!file) {
      message.error("Vui lòng chọn file Excel");
      return;
    }
    try {
      setModalLoading(true);
      const result = await indicatorGroupService.importFromExcel(file);
      setImportResult(result);
      if (result.successCount > 0) {
        message.success(`Import thành công ${result.successCount} nhóm chỉ tiêu!`);
        refresh();
      }
      if (result.errorCount > 0) {
        message.warning(`Có ${result.errorCount} lỗi khi import`);
      }
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Không thể import file"));
    } finally {
      setModalLoading(false);
    }
  }, [importFileList, refresh]);

  return {
    loading,
    searchText,
    filteredGroups,
    currentPage,
    pageSize,
    groupForm,
    groupModalOpen,
    editingGroup,
    modalLoading,
    importModalOpen,
    importFileList,
    importResult,
    setImportFileList,
    handleSearchChange,
    handlePageChange,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleCloseModal,
    handleDownloadTemplate,
    handleOpenImport,
    handleCloseImport,
    handleImport,
  };
};
