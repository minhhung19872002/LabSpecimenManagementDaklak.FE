import { useState, useEffect, useCallback, useMemo } from "react";
import { message, Modal } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import { reportService, CreateReportDto } from "../../../services/reportService";
import { testRequestService } from "../../../services/testRequestService";
import { specimenService } from "../../../services/specimenService";
import { testService } from "../../../services/testService";
import { downloadBlobAsFile } from "../../../services/importService";
import { reportSchema, ReportFormData } from "../schemas";

export interface ReportDisplay {
  id: string;
  reportNumber: string;
  requestNumber: string;
  customerName: string;
  specimenCode: string;
  specimenName: string;
  testCount: number;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  emailSent: boolean;
}

export const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; text: string }> = {
    Draft: { color: "default", text: "Bản nháp" },
    PendingApproval: { color: "orange", text: "Chờ duyệt" },
    Approved: { color: "green", text: "Đã duyệt" },
    Issued: { color: "blue", text: "Đã phát hành" },
  };
  return configs[status] || { color: "default", text: status };
};

export const useReportList = () => {
  // List state
  const [data, setData] = useState<ReportDisplay[]>([]);
  const [testRequests, setTestRequests] = useState<any[]>([]);
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Search & filter
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportDisplay | null>(null);

  // React Hook Form
  const form = useForm<ReportFormData>({
    resolver: yupResolver(reportSchema),
    defaultValues: {
      specimenIds: [],
      testIds: [],
      notes: "",
    },
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportService.getList({ maxResultCount: 100 });
      setData(
        result.items.map((r: any) => ({
          id: r.id,
          reportNumber: r.reportNumber,
          requestNumber: r.testRequestNumber || "",
          customerName: r.customerName,
          specimenCode: r.specimenCodes?.join(", ") || "",
          specimenName: r.title,
          testCount: r.testCount || 0,
          status:
            r.status === 0
              ? "Draft"
              : r.status === 1
              ? "PendingApproval"
              : r.status === 2
              ? "Approved"
              : "Issued",
          createdAt: dayjs(r.creationTime).format("YYYY-MM-DD"),
          approvedAt: r.issuedDate
            ? dayjs(r.issuedDate).format("YYYY-MM-DD HH:mm")
            : null,
          approvedBy: r.approvedByName || null,
          emailSent: r.status === 3,
        }))
      );
    } catch (error) {
      console.error("Error loading reports:", error);
      message.error("Không thể tải danh sách báo cáo. Vui lòng kiểm tra kết nối server.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTestRequests = useCallback(async () => {
    try {
      const result = await testRequestService.getList({ maxResultCount: 1000 });
      setTestRequests(result.items);
    } catch (error) {
      console.error("Error loading test requests:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadTestRequests();
  }, [loadData, loadTestRequests]);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((r) => {
      const matchSearch =
        r.reportNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.requestNumber?.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = !statusFilter || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, searchText, statusFilter]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleStatusFilterChange = useCallback((value: string | null) => {
    setStatusFilter(value);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    form.reset({
      testRequestId: "",
      title: "",
      customerName: "",
      specimenIds: [],
      testIds: [],
      notes: "",
    });
    setSpecimens([]);
    setTests([]);
    setIsCreateModalOpen(true);
  }, [form]);

  const handleTestRequestChange = useCallback(
    async (testRequestId: string) => {
      const selectedRequest = testRequests.find((tr) => tr.id === testRequestId);
      if (selectedRequest) {
        form.setValue("customerName", selectedRequest.customerName || "");
        form.setValue(
          "title",
          `Báo cáo kết quả - ${selectedRequest.requestNumber || ""}`
        );
        form.setValue("specimenIds", []);
        form.setValue("testIds", []);

        try {
          const specimenList = await specimenService.getByTestRequest(testRequestId);
          setSpecimens(specimenList);

          const allTests: any[] = [];
          for (const specimen of specimenList) {
            const testList = await testService.getBySpecimen(specimen.id);
            allTests.push(...testList);
          }
          setTests(allTests);
        } catch (error) {
          console.error("Error loading specimens/tests:", error);
          setSpecimens([]);
          setTests([]);
        }
      }
    },
    [form, testRequests]
  );

  const handleCreateModalCancel = useCallback(() => {
    setIsCreateModalOpen(false);
    form.reset();
    setSpecimens([]);
    setTests([]);
  }, [form]);

  const handleCreateModalSubmit = useCallback(
    async (formData: ReportFormData) => {
      try {
        setCreateLoading(true);

        const createData: CreateReportDto = {
          title: formData.title,
          testRequestId: formData.testRequestId,
          customerName: formData.customerName,
          specimenIds:
            formData.specimenIds && formData.specimenIds.length > 0
              ? JSON.stringify(formData.specimenIds)
              : undefined,
          testIds:
            formData.testIds && formData.testIds.length > 0
              ? JSON.stringify(formData.testIds)
              : undefined,
          notes: formData.notes || undefined,
        };

        await reportService.create(createData);
        message.success("Tạo báo cáo mới thành công!");
        setIsCreateModalOpen(false);
        form.reset();
        setSpecimens([]);
        setTests([]);
        loadData();
      } catch (error) {
        message.error("Không thể tạo báo cáo. Vui lòng thử lại.");
        console.error("Failed to create report:", error);
      } finally {
        setCreateLoading(false);
      }
    },
    [form, loadData]
  );

  const handlePreview = useCallback((record: ReportDisplay) => {
    setSelectedReport(record);
    setIsPreviewOpen(true);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setIsPreviewOpen(false);
    setSelectedReport(null);
  }, []);

  const handleShowQR = useCallback((record: ReportDisplay) => {
    setSelectedReport(record);
    setIsQrModalOpen(true);
  }, []);

  const handleQrModalClose = useCallback(() => {
    setIsQrModalOpen(false);
    setSelectedReport(null);
  }, []);

  const handleExportPDF = useCallback(async (record: ReportDisplay) => {
    try {
      message.loading({
        content: `Đang xuất PDF báo cáo ${record.reportNumber}...`,
        key: "exportPdf",
      });
      const blob = await reportService.exportPdf(record.id);
      downloadBlobAsFile(blob, `BaoCao_${record.reportNumber}.pdf`);
      message.success({
        content: `Xuất PDF báo cáo ${record.reportNumber} thành công!`,
        key: "exportPdf",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      message.error({
        content: "Không thể xuất PDF. Vui lòng thử lại.",
        key: "exportPdf",
      });
    }
  }, []);

  const handleSendEmail = useCallback(async (record: ReportDisplay) => {
    try {
      await reportService.sendEmail(record.id, { email: "" });
      message.success(
        `Đã gửi email báo cáo ${record.reportNumber} cho ${record.customerName}`
      );
    } catch (error) {
      message.error("Không thể gửi email. Vui lòng thử lại.");
    }
  }, []);

  const handlePrint = useCallback((record: ReportDisplay) => {
    message.info(`Đang in báo cáo ${record.reportNumber}...`);
  }, []);

  const handleSubmitForApproval = useCallback(
    (record: ReportDisplay) => {
      Modal.confirm({
        title: "Xác nhận gửi duyệt",
        content: `Bạn có chắc chắn muốn gửi báo cáo "${record.reportNumber}" để duyệt?`,
        okText: "Gửi duyệt",
        cancelText: "Hủy",
        onOk: async () => {
          setWorkflowLoading(true);
          try {
            await reportService.submitForReview(record.id);
            message.success("Đã gửi báo cáo để duyệt!");
            loadData();
          } catch (error) {
            message.error("Không thể gửi báo cáo để duyệt. Vui lòng thử lại.");
            console.error("Failed to submit for approval:", error);
          } finally {
            setWorkflowLoading(false);
          }
        },
      });
    },
    [loadData]
  );

  const handleApprove = useCallback(
    (record: ReportDisplay) => {
      Modal.confirm({
        title: "Xác nhận duyệt báo cáo",
        content: `Bạn có chắc chắn muốn duyệt báo cáo "${record.reportNumber}"?`,
        okText: "Duyệt",
        cancelText: "Hủy",
        onOk: async () => {
          setWorkflowLoading(true);
          try {
            await reportService.approve(record.id);
            message.success("Đã duyệt báo cáo thành công!");
            loadData();
          } catch (error) {
            message.error("Không thể duyệt báo cáo. Vui lòng thử lại.");
            console.error("Failed to approve:", error);
          } finally {
            setWorkflowLoading(false);
          }
        },
      });
    },
    [loadData]
  );

  const handleIssue = useCallback(
    (record: ReportDisplay) => {
      Modal.confirm({
        title: "Xác nhận phát hành báo cáo",
        content: `Bạn có chắc chắn muốn phát hành báo cáo "${record.reportNumber}"? Sau khi phát hành, báo cáo sẽ có mã QR truy xuất.`,
        okText: "Phát hành",
        cancelText: "Hủy",
        onOk: async () => {
          setWorkflowLoading(true);
          try {
            await reportService.issue(record.id);
            message.success("Đã phát hành báo cáo thành công!");
            loadData();
          } catch (error) {
            message.error("Không thể phát hành báo cáo. Vui lòng thử lại.");
            console.error("Failed to issue:", error);
          } finally {
            setWorkflowLoading(false);
          }
        },
      });
    },
    [loadData]
  );

  return {
    // Data
    data: filteredData,
    testRequests,
    specimens,
    tests,
    loading,
    createLoading,
    workflowLoading,

    // Search & filter
    searchText,
    statusFilter,
    handleSearchChange,
    handleStatusFilterChange,

    // Create modal
    isCreateModalOpen,
    form,
    handleOpenCreateModal,
    handleTestRequestChange,
    handleCreateModalCancel,
    handleCreateModalSubmit,

    // Preview & QR modal
    isPreviewOpen,
    isQrModalOpen,
    selectedReport,
    handlePreview,
    handlePreviewClose,
    handleShowQR,
    handleQrModalClose,

    // Actions
    handleExportPDF,
    handleSendEmail,
    handlePrint,
    handleSubmitForApproval,
    handleApprove,
    handleIssue,
    loadData,
  };
};
