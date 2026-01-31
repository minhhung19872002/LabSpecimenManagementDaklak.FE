import { useMemo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { UploadFile } from "antd/es/upload/interface";
import { useSampleTypeCategoriesData, useSampleTypeCategoriesActions } from "./hooks";
import { CategoriesTable, CategoryModal, ImportSampleTypeCategoryModal } from "./components";
import { getCategoryColumns, getSpecimenTypeColumns } from "./constants";
import { SampleTypeCategoriesTabProps, SampleTypeCategoriesActions, SampleTypeCategoryImportPreviewDto } from "./types";
import { sampleTypeCategorySchema, SampleTypeCategoryFormData } from "./schemas";
import { API_BASE_URL, api } from "../../../services/api";

const SampleTypeCategoriesList = forwardRef<SampleTypeCategoriesActions, SampleTypeCategoriesTabProps>(({
  onDataChange,
  refreshKey,
}, ref) => {
  const {
    loading,
    searchText,
    groupedData,
    expandedRowKeys,
    setSearchText,
    setExpandedRowKeys,
    fetchData,
  } = useSampleTypeCategoriesData();

  // Refresh data when refreshKey changes
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (refreshKey !== undefined) {
      fetchData();
    }
  }, [refreshKey]);

  const {
    modalOpen,
    editingCategory,
    modalLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleModalOk,
    handleModalCancel,
  } = useSampleTypeCategoriesActions({
    fetchData,
    onDataChange,
  });

  const form = useForm<SampleTypeCategoryFormData>({
    resolver: yupResolver(sampleTypeCategorySchema) as any,
    defaultValues: { name: "", description: "", isActive: true },
  });

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] =
    useState<SampleTypeCategoryImportPreviewDto | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Import handlers
  const handleDownloadTemplate = () => {
    window.open(
      `${API_BASE_URL}/api/v1/import/sample-type-categories/template`,
      "_blank",
    );
  };

  const handlePreviewImport = async () => {
    if (!fileList.length || !fileList[0].originFileObj) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj as Blob);

    try {
      const response = await api.upload<SampleTypeCategoryImportPreviewDto>(
        "/api/v1/import/sample-type-categories/preview",
        formData,
      );
      setPreviewData(response.data);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.error?.message ||
          "Lỗi khi đọc file",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!fileList.length || !fileList[0].originFileObj) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj as Blob);

    try {
      const response = await api.upload<{
        success: boolean;
        message?: string;
      }>("/api/v1/import/sample-type-categories", formData);

      const result = response.data;

      if (result.success) {
        message.success(result.message);
        setImportModalOpen(false);
        setPreviewData(null);
        setFileList([]);
        fetchData();
        onDataChange?.();
      } else {
        message.error(result.message || "Lỗi khi import");
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.error?.message ||
          "Lỗi khi import",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportCancel = () => {
    setImportModalOpen(false);
    setPreviewData(null);
    setFileList([]);
  };

  const handleImportReset = () => {
    setPreviewData(null);
    setFileList([]);
  };

  // Memoized columns
  const categoryColumns = useMemo(
    () =>
      getCategoryColumns(
        (record) => handleEdit(record, form),
        handleDelete,
        handleToggleActive
      ),
    [handleEdit, handleDelete, handleToggleActive, form]
  );

  const specimenTypeColumns = useMemo(() => getSpecimenTypeColumns(), []);

  // Expose actions to parent
  useImperativeHandle(ref, () => ({
    handleCreate: () => handleCreate(form),
    handleDownloadTemplate,
    handleImport: () => setImportModalOpen(true),
  }));

  return (
    <>

      {/* Categories Table with nested SpecimenTypes */}
      <CategoriesTable
        loading={loading}
        groupedData={groupedData}
        categoryColumns={categoryColumns}
        specimenTypeColumns={specimenTypeColumns}
        expandedRowKeys={expandedRowKeys}
        searchText={searchText}
        onSearchChange={setSearchText}
        onExpandedRowsChange={setExpandedRowKeys}
      />

      {/* Category Modal */}
      <CategoryModal
        open={modalOpen}
        loading={modalLoading}
        editingCategory={editingCategory}
        form={form}
        onOk={(data) => handleModalOk(data, form)}
        onCancel={() => handleModalCancel(form)}
      />

      {/* Import Modal */}
      <ImportSampleTypeCategoryModal
        open={importModalOpen}
        loading={importLoading}
        fileList={fileList}
        previewData={previewData}
        onFileListChange={setFileList}
        onPreview={handlePreviewImport}
        onConfirm={handleConfirmImport}
        onCancel={handleImportCancel}
        onReset={handleImportReset}
      />
    </>
  );
});

SampleTypeCategoriesList.displayName = "SampleTypeCategoriesList";

export default SampleTypeCategoriesList;
