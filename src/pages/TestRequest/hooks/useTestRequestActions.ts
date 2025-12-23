import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { useDeleteTestRequestMutation } from "../../../store/api/testRequestApi";
import { TestRequestDto } from "../../../types/testRequest";
import { importService, downloadBlobAsFile } from "../../../services/importService";
import { MESSAGES } from "../constants";

export const useTestRequestActions = () => {
  const navigate = useNavigate();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const [deleteTestRequest, { isLoading: isDeleting }] = useDeleteTestRequestMutation();

  const handleCreate = useCallback(() => {
    navigate("/test-request/create");
  }, [navigate]);

  const handleEdit = useCallback(
    (record: TestRequestDto) => {
      navigate(`/test-request/edit/${record.id}`);
    },
    [navigate]
  );

  const handleView = useCallback(
    (record: TestRequestDto) => {
      navigate(`/test-request/${record.id}`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteTestRequest(id).unwrap();
        message.success(MESSAGES.deleteSuccess);
      } catch (error: any) {
        console.error("Error deleting test request:", error);
        message.error(error.data?.error?.message || MESSAGES.deleteError);
      }
    },
    [deleteTestRequest]
  );

  const handleDownloadTemplate = useCallback(async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await importService.downloadTestRequestsTemplate();
      downloadBlobAsFile(blob, "test-requests-template.xlsx");
      message.success(MESSAGES.downloadTemplateSuccess);
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error(MESSAGES.downloadTemplateError);
    } finally {
      setDownloadingTemplate(false);
    }
  }, []);

  const openImportModal = useCallback(() => {
    setImportModalOpen(true);
  }, []);

  const closeImportModal = useCallback(() => {
    setImportModalOpen(false);
  }, []);

  return {
    // State
    importModalOpen,
    downloadingTemplate,
    isDeleting,

    // Actions
    handleCreate,
    handleEdit,
    handleView,
    handleDelete,
    handleDownloadTemplate,
    openImportModal,
    closeImportModal,
  };
};