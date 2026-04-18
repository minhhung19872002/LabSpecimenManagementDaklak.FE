import { useMemo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { UploadFile } from "antd/es/upload/interface";
import { useTestMethodsData, useTestMethodsActions } from "./hooks";
import {
  TestMethodsTable,
  TestMethodModal,
  EditIndicatorModal,
  ImportTestMethodModal,
} from "./components";
import { getTestMethodColumns } from "./constants";
import { TestMethodsTabProps, TestMethodsActions, TestMethodImportPreviewDto } from "./types";
import {
  testMethodSchema,
  TestMethodFormData,
} from "./schemas/testMethodSchema";
import { API_BASE_URL, api } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/errorHandler";

const TestMethodsList = forwardRef<TestMethodsActions, TestMethodsTabProps>(({
  onDataChange,
  refreshKey,
}, ref) => {
  const {
    testMethods,
    totalCount,
    loading,
    searchText,
    currentPage,
    pageSize,
    setSearchText,
    handlePageChange,
    fetchData,
  } = useTestMethodsData();

  // Refresh data when refreshKey changes (when switching to this tab)
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
    editingItem,
    modalLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleModalOk,
    handleModalCancel,
    // Edit indicator
    editIndicatorModalOpen,
    editIndicatorLoading,
    editingIndicator,
    handleEditIndicatorOk,
    handleEditIndicatorCancel,
    handleToggleActive,
  } = useTestMethodsActions({
    fetchData,
    onDataChange,
  });

  const form = useForm<TestMethodFormData>({
    resolver: yupResolver(testMethodSchema) as any,
    defaultValues: { name: "", formattedName: "", unit: null, formattedUnit: null, isActive: true },
  });

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] =
    useState<TestMethodImportPreviewDto | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Import handlers
  const handleDownloadTemplate = () => {
    window.open(
      `${API_BASE_URL}/api/v1/import/test-methods-with-indicators/template`,
      "_blank",
    );
  };

  const handlePreviewImport = async () => {
    if (!fileList.length || !fileList[0].originFileObj) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj as Blob);

    try {
      const response = await api.upload<TestMethodImportPreviewDto>(
        "/api/v1/import/test-methods-with-indicators/preview",
        formData,
      );
      setPreviewData(response.data);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Lỗi khi đọc file"));
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
      }>("/api/v1/import/test-methods-with-indicators", formData);

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
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Lỗi khi import"));
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

  // Memoized columns for test methods
  const methodColumns = useMemo(
    () =>
      getTestMethodColumns(
        (record) => handleEdit(record, form),
        handleDelete,
        handleToggleActive,
      ),
    [handleEdit, handleDelete, handleToggleActive, form],
  );

  // Expose actions to parent
  useImperativeHandle(ref, () => ({
    handleCreate: () => handleCreate(form),
    handleDownloadTemplate,
    handleImport: () => setImportModalOpen(true),
  }));

  return (
    <>
      {/* Flat Table */}
      <TestMethodsTable
        loading={loading}
        data={testMethods as any}
        columns={methodColumns}
        searchText={searchText}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onSearchChange={setSearchText}
        onPageChange={handlePageChange}
      />

      {/* Create/Edit TestMethod Modal */}
      <TestMethodModal
        open={modalOpen}
        loading={modalLoading}
        editingItem={editingItem}
        form={form}
        onOk={(data) => handleModalOk(data, form)}
        onCancel={() => handleModalCancel(form)}
      />

      {/* Edit Indicator Modal */}
      <EditIndicatorModal
        open={editIndicatorModalOpen}
        loading={editIndicatorLoading}
        indicator={editingIndicator}
        onOk={handleEditIndicatorOk}
        onCancel={handleEditIndicatorCancel}
      />

      {/* Import TestMethod Modal */}
      <ImportTestMethodModal
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

TestMethodsList.displayName = "TestMethodsList";

export default TestMethodsList;
