// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Descriptions,
  Button,
  message,
  Tag,
  Spin,
  Space,
  Table,
  Divider,
  Typography,
  Row,
  Col,
  Modal,
  Input,
  Alert,
  Upload,
  Image,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  FileTextOutlined,
  HistoryOutlined,
  UploadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  testRequestService,
  SampleForSelectionDto,
} from "../../services/testRequestService";
import {
  TestRequestDto,
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestStatusColors,
  canEditTestRequest,
  canSendSample,
  canSendResult,
  canComplete,
  ResultLanguage,
  SamplingRequirement,
  SampleStorageOption,
  SampleStatus,
} from "../../types/testRequest";
import dayjs from "dayjs";
import "./TestRequestDetail.css";
import { PATH_ROUTES } from "../../constants";
import {
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
} from "../../types/laboratoryTask";
import ProcessTimelineModal from "./components/ProcessTimelineModal";
import SampleImagesModal from "./components/SampleImagesModal";
import SampleImagesButton from "./components/SampleImagesButton";
import { fileService } from "../../services/fileService";
import { TestRequestSampleDto } from "../../types/testRequest";
import { API_BASE_URL } from "../../services/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

const TestRequestDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto | null>(null);

  // OnlyOffice Editor states
  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [editorConfig, setEditorConfig] = useState<any>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const docEditorRef = useRef<any>(null);

  // BM01 Sample Selection Modal states (Single)
  const [sampleSelectionModalVisible, setSampleSelectionModalVisible] =
    useState(false);
  const [samplesForSelection, setSamplesForSelection] = useState<
    SampleForSelectionDto[]
  >([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [generatingBM01, setGeneratingBM01] = useState(false);
  const [bm01Note, setBm01Note] = useState<string>("");

  // Mixed Result Modal states (Multiple samples)
  const [mixedResultModalVisible, setMixedResultModalVisible] = useState(false);
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
  const [generatingMixed, setGeneratingMixed] = useState(false);
  const [mixedNote, setMixedNote] = useState<string>("");

  // Print test request form loading state
  const [printingTestRequest, setPrintingTestRequest] = useState(false);

  // Send sample loading state
  const [sendingSample, setSendingSample] = useState(false);

  // Reject result modal states
  const [rejectResultModalVisible, setRejectResultModalVisible] =
    useState(false);
  const [rejectResultReason, setRejectResultReason] = useState("");
  const [rejectResultLoading, setRejectResultLoading] = useState(false);

  // Process timeline modal state
  const [processTimelineModalVisible, setProcessTimelineModalVisible] =
    useState(false);

  // Postal delivery image upload modal states (tối đa 5 hình)
  const [postalImageModalVisible, setPostalImageModalVisible] = useState(false);
  const [uploadingPostalImage, setUploadingPostalImage] = useState(false);
  const [postalImages, setPostalImages] = useState<
    Array<{ fileId: string; url: string }>
  >([]);

  // Sample images modal state
  const [sampleImagesModalVisible, setSampleImagesModalVisible] =
    useState(false);
  const [selectedSampleForImages, setSelectedSampleForImages] =
    useState<TestRequestSampleDto | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (requestId: string) => {
    setLoading(true);
    try {
      const result = await testRequestService.get(requestId);
      setData(result);
    } catch (error: any) {
      console.error("Error loading test request:", error);
      message.error("Không thể tải thông tin yêu cầu thử nghiệm");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: TestRequestStatus) => {
    const label = TestRequestStatusLabels[status] || status.toString();
    const color = TestRequestStatusColors[status] || "default";
    return <Tag color={color}>{label}</Tag>;
  };

  // Render action buttons based on status
  const renderActionButtons = () => {
    if (!data) return null;

    const buttons: React.ReactNode[] = [];

    // In phiếu XN - New hoặc Pending
    if (
      data.status === TestRequestStatus.New ||
      data.status === TestRequestStatus.Pending
    ) {
      buttons.push(
        <Button
          key="print"
          icon={<FileTextOutlined />}
          onClick={() => handlePrintTestRequest()}
          loading={printingTestRequest}
        >
          In phiếu XN
        </Button>
      );
    }

    // Gửi mẫu - chỉ khi Pending
    if (canSendSample(data.status)) {
      buttons.push(
        <Button
          key="send-sample"
          type="primary"
          onClick={() => handleSendSample()}
          loading={sendingSample}
        >
          Gửi mẫu
        </Button>
      );
    }

    // Phê duyệt/Từ chối thay đổi - PendingChangeApproval (cho QLCL)
    // Chuyển sang tab "Lịch sử thay đổi" để xem chi tiết và duyệt/từ chối
    // (Buttons đã được chuyển vào ChangeHistoryTab component)

    // In KQ - InProgress hoặc SampleSent có thể không cần buttons đặc biệt
    // PendingApproval - Phê duyệt KQ hoặc Không duyệt
    // if (data.status === TestRequestStatus.PendingApproval) {
    //   buttons.push(
    //     <Button
    //       key="approve"
    //       type="primary"
    //       icon={<CheckCircleOutlined />}
    //       onClick={() => handleApprove()}
    //     >
    //       Phê duyệt KQ
    //     </Button>
    //   );
    //   buttons.push(
    //     <Button
    //       key="reject-result"
    //       danger
    //       icon={<CloseCircleOutlined />}
    //       onClick={() => setRejectResultModalVisible(true)}
    //     >
    //       Không duyệt
    //     </Button>
    //   );
    // }

    // Approved - In KQ, Gửi kết quả
    if (data.status === TestRequestStatus.Approved) {
      buttons.push(
        <Button
          key="print-bm01"
          icon={<FileTextOutlined />}
          onClick={handleOpenBM01Modal}
        >
          In KQ Mẫu đơn
        </Button>
      );
      buttons.push(
        <Button
          key="print-mixed"
          icon={<FileTextOutlined />}
          onClick={() => handleOpenMixedResultModal()}
        >
          In KQ hỗn hợp
        </Button>
      );
      buttons.push(
        <Button
          key="send-result"
          type="primary"
          onClick={() => handleSendResult()}
        >
          Gửi kết quả
        </Button>
      );
    }

    // ResultSent - Hoàn thành
    if (canComplete(data.status)) {
      buttons.push(
        <Button key="complete" type="primary" onClick={() => handleComplete()}>
          Hoàn thành
        </Button>
      );
    }

    return buttons.length > 0 ? <Space wrap>{buttons}</Space> : null;
  };

  // Handle print test request form - generate PDF and open in new tab
  // Status is automatically updated to Pending when generating form (if currently New)
  const handlePrintTestRequest = async () => {
    if (!id) return;
    setPrintingTestRequest(true);

    // Open new tab immediately to avoid popup blocker (must be in sync with user action)
    const newTab = window.open("about:blank", "_blank");

    // Show loading state in the new tab
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Đang tạo phiếu...</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .loader { text-align: center; }
              .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid #1890ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              p { color: #666; font-size: 16px; }
            </style>
          </head>
          <body><div class="loader"><div class="spinner"></div><p>Đang tạo phiếu yêu cầu...</p></div></body>
        </html>
      `);
    }

    try {
      // Step 1: Generate the test request form document (returns PDF, also updates status to Pending if New)
      const result = await testRequestService.generateTestRequestForm(id);
      message.success(`Đã tạo phiếu yêu cầu XN: ${result.contractNumber}`);

      // Step 2: Navigate the already-opened tab to PDF URL
      // Use /view/ endpoint for inline display (preview) instead of /download/ which forces download
      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(
        result.fileName
      )}`;
      if (newTab) {
        newTab.location.href = pdfUrl;
      } else {
        // Fallback if popup was blocked
        window.open(pdfUrl, "_blank");
      }

      // Step 3: Reload data to get updated status
      loadData(id);
    } catch (error: any) {
      console.error("Error printing test request:", error);
      // Close the blank tab if there was an error
      if (newTab) {
        newTab.close();
      }
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể tạo phiếu. Vui lòng thử lại."
      );
    } finally {
      setPrintingTestRequest(false);
    }
  };

  // Handle print mixed result - Open modal to select multiple samples
  const handleOpenMixedResultModal = async () => {
    if (!id) return;

    setLoadingSamples(true);
    setMixedResultModalVisible(true);
    setSelectedSampleIds([]);
    setMixedNote(""); // Reset note when opening modal

    try {
      const samples = await testRequestService.getSamplesForResultForm(id);
      setSamplesForSelection(samples);
    } catch (error: any) {
      console.error("Error loading samples:", error);
      message.error("Không thể tải danh sách mẫu");
      setMixedResultModalVisible(false);
    } finally {
      setLoadingSamples(false);
    }
  };

  // Handle generate mixed result form
  const handleGenerateMixedResult = async () => {
    if (!id || selectedSampleIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một mẫu");
      return;
    }

    // Validate all selected samples can generate result
    const invalidSamples = selectedSampleIds.filter((sampleId) => {
      const sample = samplesForSelection.find((s) => s.id === sampleId);
      return sample && !sample.canGenerateResult;
    });

    if (invalidSamples.length > 0) {
      message.error("Có mẫu chưa xét nghiệm xong, không thể xuất báo cáo");
      return;
    }

    setGeneratingMixed(true);

    // Open new tab immediately to avoid popup blocker (must be in sync with user action)
    const newTab = window.open("about:blank", "_blank");

    // Show loading state in the new tab
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Đang tạo phiếu...</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .loader { text-align: center; }
              .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid #1890ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              p { color: #666; font-size: 16px; }
            </style>
          </head>
          <body><div class="loader"><div class="spinner"></div><p>Đang tạo phiếu kết quả...</p></div></body>
        </html>
      `);
    }

    try {
      // Generate mixed result for multiple samples
      const result = await testRequestService.generateMixedSamplesResultForm(
        id,
        selectedSampleIds,
        mixedNote || undefined
      );
      message.success(
        `Đã tạo phiếu kết quả hỗn hợp cho ${selectedSampleIds.length} mẫu`
      );

      // Close modal
      setMixedResultModalVisible(false);

      // Navigate the already-opened tab to PDF URL
      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(
        result.fileName
      )}`;
      if (newTab) {
        newTab.location.href = pdfUrl;
      } else {
        // Fallback if popup was blocked
        window.open(pdfUrl, "_blank");
      }

      // Reload data
      loadData(id);
    } catch (error: any) {
      console.error("Error generating mixed result form:", error);
      // Close the blank tab if there was an error
      if (newTab) {
        newTab.close();
      }
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể tạo phiếu kết quả. Vui lòng thử lại."
      );
    } finally {
      setGeneratingMixed(false);
    }
  };

  // Handle send sample: Pending → SampleSent
  const handleSendSample = async () => {
    if (!id) return;
    setSendingSample(true);
    try {
      await testRequestService.sendSample(id);
      message.success("Đã gửi mẫu thành công");
      loadData(id);
    } catch (error: any) {
      console.error("Error sending sample:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể gửi mẫu. Vui lòng thử lại."
      );
    } finally {
      setSendingSample(false);
    }
  };

  // Handle send result
  const handleSendResult = async () => {
    if (!id) return;
    try {
      await testRequestService.sendResult(id);
      message.success("Đã gửi kết quả thành công");
      loadData(id); // Reload to get updated status
    } catch (error: any) {
      console.error("Error sending result:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể gửi kết quả. Vui lòng thử lại."
      );
    }
  };

  // Handle approve test request
  const handleApprove = async () => {
    if (!id) return;
    try {
      await testRequestService.approve(id);
      message.success("Đã phê duyệt thành công");
      loadData(id); // Reload to get updated status
    } catch (error: any) {
      console.error("Error approving test request:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể phê duyệt. Vui lòng thử lại."
      );
    }
  };

  // Handle reject result: PendingApproval → InProgress (trả về cho QLKT xem xét)
  const handleRejectResult = async () => {
    if (!id || !rejectResultReason.trim()) {
      message.warning("Vui lòng nhập lý do không duyệt");
      return;
    }
    setRejectResultLoading(true);
    try {
      await testRequestService.rejectResult(id, rejectResultReason);
      message.success("Đã trả lại cho Quản lý Kỹ thuật xem xét");
      setRejectResultModalVisible(false);
      setRejectResultReason("");
      loadData(id);
    } catch (error: any) {
      console.error("Error rejecting result:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể từ chối kết quả. Vui lòng thử lại."
      );
    } finally {
      setRejectResultLoading(false);
    }
  };

  // Handle complete test request
  // If not all indicators are completed, status will be updated to previous status based on priority
  const handleComplete = async () => {
    if (!id || !data) return;

    // Nếu Gửi bưu điện = true, hiện modal upload hình ảnh
    if (data.deliveryPostal) {
      setPostalImageModalVisible(true);
      return;
    }

    // Hoàn thành bình thường (không yêu cầu gửi bưu điện)
    try {
      await testRequestService.complete(id);
      // Reload data to check new status
      const updatedData = await testRequestService.get(id);
      setData(updatedData);

      if (updatedData.status === TestRequestStatus.Completed) {
        message.success("Đã hoàn thành yêu cầu thử nghiệm");
      } else {
        // Status was updated to previous status because not all indicators are completed
        const statusLabel = TestRequestStatusLabels[updatedData.status];
        message.warning(
          `Chưa hoàn thành tất cả chỉ tiêu. Trạng thái đã cập nhật về: ${statusLabel}`
        );
      }
    } catch (error: any) {
      console.error("Error completing test request:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể hoàn thành. Vui lòng thử lại."
      );
    }
  };

  // Handle postal image upload (tối đa 5 hình)
  const handlePostalImageUpload = async (file: File, fileList: File[]) => {
    // Get current count and calculate remaining slots
    const currentCount = postalImages.length;
    const remainingSlots = 5 - currentCount;
    const fileIndex = fileList.indexOf(file);

    // Show warning on first file if total exceeds limit
    if (fileIndex === 0 && fileList.length > remainingSlots) {
      if (remainingSlots <= 0) {
        message.warning("Đã đạt tối đa 5 hình ảnh. Không thể thêm hình mới.");
        return false;
      } else {
        message.warning(
          `Chỉ có thể thêm ${remainingSlots} hình nữa. ${
            fileList.length - remainingSlots
          } hình sẽ bị bỏ qua.`
        );
      }
    }

    // Skip files that exceed the limit
    if (fileIndex >= remainingSlots) {
      return false;
    }

    // Validate file - check if it's an image
    if (!file.type.startsWith("image/")) {
      message.error(`${file.name}: Chỉ chấp nhận file hình ảnh`);
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error(`${file.name}: Kích thước file tối đa 10MB`);
      return false;
    }

    // Validate file using fileService
    const validationError = fileService.getValidationError(file);
    if (validationError) {
      message.error(validationError);
      return false;
    }

    setUploadingPostalImage(true);
    try {
      const result = await fileService.uploadImage(file);
      // Use fileService.getFileUrl to get full URL
      const fullUrl = fileService.getFileUrl(result.fileId);
      setPostalImages((prev) => {
        // Double check limit before adding
        if (prev.length >= 5) {
          return prev;
        }
        return [
          ...prev,
          {
            fileId: result.fileId,
            url: fullUrl,
          },
        ];
      });
    } catch (error) {
      message.error(`Upload ${file.name} thất bại`);
    } finally {
      setUploadingPostalImage(false);
    }
    return false; // Prevent default upload behavior
  };

  // Remove postal image
  const handleRemovePostalImage = (fileId: string) => {
    setPostalImages((prev) => prev.filter((img) => img.fileId !== fileId));
  };

  // Handle complete with postal images
  // If not all indicators are completed, status will be updated to previous status based on priority
  const handleCompleteWithImage = async () => {
    if (!id || postalImages.length === 0) {
      message.error("Vui lòng upload ít nhất 1 hình ảnh gửi bưu điện");
      return;
    }

    try {
      const imageFileIds = postalImages.map((img) => img.fileId);
      await testRequestService.completeWithImage(id, imageFileIds);
      setPostalImageModalVisible(false);
      setPostalImages([]);

      // Reload data to check new status
      const updatedData = await testRequestService.get(id);
      setData(updatedData);

      if (updatedData.status === TestRequestStatus.Completed) {
        message.success("Đã hoàn thành yêu cầu thử nghiệm");
      } else {
        // Status was updated to previous status because not all indicators are completed
        const statusLabel = TestRequestStatusLabels[updatedData.status];
        message.warning(
          `Chưa hoàn thành tất cả chỉ tiêu. Trạng thái đã cập nhật về: ${statusLabel}`
        );
      }
    } catch (error: any) {
      console.error("Error completing with image:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể hoàn thành. Vui lòng thử lại."
      );
    }
  };

  const getResultLanguageText = (lang: ResultLanguage) => {
    const langMap = {
      [ResultLanguage.Vietnamese]: "Tiếng Việt",
      [ResultLanguage.English]: "Tiếng Anh",
      [ResultLanguage.VietnameseAndEnglish]: "Tiếng Việt/Anh",
    };
    return langMap[lang] || "Tiếng Việt";
  };

  const getSamplingRequirementText = (req: SamplingRequirement) => {
    const reqMap = {
      [SamplingRequirement.LabSampling]: "TTKN lấy mẫu",
      [SamplingRequirement.CustomerSampling]: "KH tự lấy mẫu",
    };
    return reqMap[req] || "KH tự lấy mẫu";
  };

  const getSampleStorageText = (opt: SampleStorageOption) => {
    const optMap = {
      [SampleStorageOption.No]: "Không",
      [SampleStorageOption.Yes]: "Có (theo quy định của Trung tâm)",
    };
    return optMap[opt] || "Không";
  };

  const BoolIcon = ({ value }: { value: boolean }) => {
    return value ? (
      <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
    ) : (
      <CloseCircleOutlined style={{ color: "#d9d9d9", fontSize: 16 }} />
    );
  };

  // Load OnlyOffice script when modal opens
  useEffect(() => {
    if (!editorModalVisible || !editorConfig) return;

    const scriptId = "onlyoffice-api-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `${editorConfig.documentServerUrl}/web-apps/apps/api/documents/api.js`;
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        setEditorLoading(false);
      };
      script.onerror = () => {
        message.error("Không thể tải OnlyOffice Document Server");
        setEditorLoading(false);
      };
      document.head.appendChild(script);
    } else {
      if ((window as any).DocsAPI) {
        setScriptLoaded(true);
      }
      setEditorLoading(false);
    }
  }, [editorModalVisible, editorConfig]);

  // Initialize editor when script is loaded and modal is visible
  useEffect(() => {
    if (!scriptLoaded || !editorConfig || !editorModalVisible) return;

    // Wait for DOM to be ready
    const initTimer = setTimeout(() => {
      try {
        if (docEditorRef.current) {
          docEditorRef.current.destroyEditor();
        }

        // Build config similar to OnlyOfficeEditor component
        const config = {
          document: {
            fileType: editorConfig.config.document.fileType,
            key: editorConfig.config.document.key,
            title: editorConfig.config.document.title,
            url: editorConfig.config.document.url,
            permissions: {
              edit: true,
              download: true,
              print: true,
              comment: true,
              copy: true,
              fillForms: true,
              modifyContentControl: true,
              modifyFilter: true,
              review: true,
            },
          },
          documentType: editorConfig.config.documentType,
          editorConfig: {
            mode: "edit",
            lang: "vi",
            user: editorConfig.config.editorConfig?.user || {
              id: "1",
              name: "Editor",
            },
            customization: {
              autosave: false,
              forcesave: true,
              plugins: false,
            },
          },
          height: "100%",
          width: "100%",
          type: "desktop",
          events: {
            onDocumentReady: () => {
              console.log("Result form document is ready");
            },
            onError: (event: any) => {
              console.error("OnlyOffice error:", event);
              const errorCode = event?.data?.errorCode || event?.data;
              if (errorCode === -2 || errorCode === -4 || errorCode === -5) {
                console.warn("OnlyOffice temporary error:", errorCode);
                return;
              }
              message.error("Có lỗi xảy ra với document editor");
            },
          },
        };

        docEditorRef.current = new (window as any).DocsAPI.DocEditor(
          "result-form-editor-container",
          config
        );
      } catch (err) {
        console.error("Failed to initialize editor:", err);
        message.error("Không thể khởi tạo editor");
      }
    }, 200);

    return () => {
      clearTimeout(initTimer);
    };
  }, [scriptLoaded, editorConfig, editorModalVisible]);

  // Cleanup editor on modal close
  useEffect(() => {
    if (!editorModalVisible && docEditorRef.current) {
      try {
        docEditorRef.current.destroyEditor();
        docEditorRef.current = null;
      } catch (err) {
        console.error("Failed to destroy editor:", err);
      }
    }
  }, [editorModalVisible]);

  const handleCloseEditorModal = () => {
    if (docEditorRef.current) {
      try {
        docEditorRef.current.destroyEditor();
        docEditorRef.current = null;
      } catch (e) {
        console.log("Editor destroy error:", e);
      }
    }
    setEditorModalVisible(false);
    setEditorConfig(null);
    setScriptLoaded(false);
  };

  // Handle BM01 - Open sample selection modal
  const handleOpenBM01Modal = async () => {
    if (!id) return;

    setLoadingSamples(true);
    setSampleSelectionModalVisible(true);
    setSelectedSampleId(null);
    setBm01Note(""); // Reset note when opening modal

    try {
      const samples = await testRequestService.getSamplesForResultForm(id);
      setSamplesForSelection(samples);
    } catch (error: any) {
      console.error("Error loading samples:", error);
      message.error("Không thể tải danh sách mẫu");
      setSampleSelectionModalVisible(false);
    } finally {
      setLoadingSamples(false);
    }
  };

  // Handle BM01 - Generate result form
  const handleGenerateBM01 = async () => {
    if (!id || !selectedSampleId) {
      message.warning("Vui lòng chọn một mẫu");
      return;
    }

    const selectedSample = samplesForSelection.find(
      (s) => s.id === selectedSampleId
    );
    if (selectedSample && !selectedSample.canGenerateResult) {
      message.error("Mẫu chưa xét nghiệm xong");
      return;
    }

    setGeneratingBM01(true);

    // Open new tab immediately to avoid popup blocker (must be in sync with user action)
    const newTab = window.open("about:blank", "_blank");

    // Show loading state in the new tab
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Đang tạo phiếu...</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
              .loader { text-align: center; }
              .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid #1890ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              p { color: #666; font-size: 16px; }
            </style>
          </head>
          <body><div class="loader"><div class="spinner"></div><p>Đang tạo phiếu kết quả...</p></div></body>
        </html>
      `);
    }

    try {
      // Step 1: Generate the document with optional note
      const result = await testRequestService.generateBM01ResultForm(
        id,
        selectedSampleId,
        bm01Note || undefined
      );
      message.success(`Đã tạo phiếu kết quả BM01 cho mẫu ${result.sampleCode}`);

      // Step 2: Close selection modal
      setSampleSelectionModalVisible(false);

      // Step 3: Navigate the already-opened tab to PDF URL
      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(
        result.fileName
      )}`;
      if (newTab) {
        newTab.location.href = pdfUrl;
      } else {
        // Fallback if popup was blocked
        window.open(pdfUrl, "_blank");
      }

      // Step 4: Reload data to update status
      loadData(id);
    } catch (error: any) {
      console.error("Error generating BM01 result form:", error);
      // Close the blank tab if there was an error
      if (newTab) {
        newTab.close();
      }
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể tạo phiếu kết quả. Vui lòng thử lại."
      );
    } finally {
      setGeneratingBM01(false);
    }
  };

  // Sample selection table columns
  const sampleSelectionColumns = [
    {
      title: "Mã mẫu",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: 120,
    },
    {
      title: "Tên mẫu",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 200,
    },
    {
      title: "Trạng thái XN",
      dataIndex: "testingStatus",
      key: "testingStatus",
      width: 150,
      render: (status: string, record: SampleForSelectionDto) => (
        <Tag color={record.canGenerateResult ? "success" : "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Ngày YC xong",
      dataIndex: "requestedCompletionDate",
      key: "requestedCompletionDate",
      width: 120,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
  ];

  // Sample table columns
  const sampleColumns = [
    {
      title: "STT",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 50,
      align: "center" as const,
    },
    {
      title: "Mã mẫu",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: 100,
    },
    {
      title: "Tên mẫu",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 150,
    },
    {
      title: "Loại mẫu",
      dataIndex: "specimenTypeName",
      key: "specimenTypeName",
      width: 150,
      render: (value: string) => value || "-",
    },
    {
      title: "Hình ảnh",
      key: "images",
      width: 80,
      align: "center" as const,
      render: (_: any, record: TestRequestSampleDto) => (
        <SampleImagesButton
          sample={record}
          onClick={() => {
            setSelectedSampleForImages(record);
            setSampleImagesModalVisible(true);
          }}
        />
      ),
    },
    {
      title: "Địa chỉ lấy mẫu",
      dataIndex: "samplingAddress",
      key: "samplingAddress",
      width: 180,
      render: (value: string) => value || "-",
    },
    {
      title: "Lượng mẫu",
      dataIndex: "sampleQuantity",
      key: "sampleQuantity",
      width: 80,
      render: (value: string) => value || "-",
    },
    {
      title: "Tình trạng mẫu",
      dataIndex: "statusText",
      key: "statusText",
      width: 120,
      render: (value: string, record: any) => value || "-",
    },
    {
      title: "Trạng thái XL",
      dataIndex: "processingStatus",
      key: "processingStatus",
      width: 100,
      render: (value: string) =>
        value ? <Tag color="blue">{value}</Tag> : "-",
    },
    {
      title: "Chỉ tiêu kiểm nghiệm",
      dataIndex: "indicators",
      key: "indicators",
      width: 350,
      render: (indicators: any[]) => {
        if (!indicators || indicators.length === 0) return "-";

        // Group indicators by laboratory
        const unsentIndicators = indicators.filter((ind) => !ind.laboratoryId);
        const sentIndicators = indicators.filter((ind) => ind.laboratoryId);
        const groupedByLab: Record<
          string,
          { labName: string; indicators: any[] }
        > = {};

        sentIndicators.forEach((ind) => {
          const labId = ind.laboratoryId;
          if (!groupedByLab[labId]) {
            groupedByLab[labId] = {
              labName: ind.laboratoryName || "Khoa phòng",
              indicators: [],
            };
          }
          groupedByLab[labId].indicators.push(ind);
        });

        const renderIndicator = (ind: any, idx: number) => {
          // Get approval status info
          const hasApprovalStatus =
            ind.approvalStatus !== undefined && ind.approvalStatus !== null;
          const approvalStatusLabel = hasApprovalStatus
            ? IndicatorApprovalStatusLabels[
                ind.approvalStatus as IndicatorApprovalStatus
              ]
            : null;
          const approvalStatusColor = hasApprovalStatus
            ? IndicatorApprovalStatusColors[
                ind.approvalStatus as IndicatorApprovalStatus
              ]
            : null;

          return (
            <div
              key={idx}
              style={{
                marginBottom: 4,
                padding: "4px 8px",
                background: "#f5f5f5",
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                  {ind.indicatorCode || ind.indicatorName}
                </Tag>
                <Text style={{ fontSize: 11 }}>{ind.indicatorName}</Text>
                {ind.unitPrice > 0 && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    ({ind.unitPrice?.toLocaleString("vi-VN")}đ)
                  </Text>
                )}
                {/* Trạng thái duyệt */}
                {hasApprovalStatus && approvalStatusLabel && (
                  <Tag
                    color={approvalStatusColor || "default"}
                    style={{ margin: 0, fontSize: 10 }}
                  >
                    {approvalStatusLabel}
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                {ind.requestDate && (
                  <span>
                    YC xong: {dayjs(ind.requestDate).format("DD/MM/YYYY")}
                  </span>
                )}
                {ind.requestDate && ind.testDate && (
                  <span style={{ margin: "0 4px" }}>|</span>
                )}
                {ind.testDate && (
                  <span>
                    Ngày TN: {dayjs(ind.testDate).format("DD/MM/YYYY")}
                  </span>
                )}
              </div>
            </div>
          );
        };

        return (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {/* Unsent indicators */}
            {unsentIndicators.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {unsentIndicators.map((ind, idx) => renderIndicator(ind, idx))}
              </div>
            )}

            {/* Grouped by laboratory */}
            {Object.entries(groupedByLab).map(
              ([labId, { labName, indicators: labIndicators }]) => (
                <div key={labId} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      padding: "4px 8px",
                      fontWeight: 600,
                      fontSize: 12,
                      color: "#000",
                      background: "#e6e6e6",
                      borderRadius: 4,
                      marginBottom: 4,
                    }}
                  >
                    {labName} ({labIndicators.length})
                  </div>
                  <div style={{ paddingLeft: 8 }}>
                    {labIndicators.map((ind, idx) => renderIndicator(ind, idx))}
                  </div>
                </div>
              )
            )}
          </div>
        );
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 120,
      ellipsis: true,
      render: (value: string) => value || "-",
    },
    {
      title: "Chi phí",
      dataIndex: "totalIndicatorCost",
      key: "totalIndicatorCost",
      width: 100,
      align: "right" as const,
      render: (value: number) =>
        value > 0 ? `${value.toLocaleString("vi-VN")}đ` : "-",
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <p>{t("common.noData")}</p>
      </Card>
    );
  }

  return (
    <div className="test-request-detail">
      {/* Back button and Process Timeline */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(PATH_ROUTES.testRequests.index)}
        >
          Quay lại
        </Button>
        <Button
          icon={<HistoryOutlined />}
          onClick={() => setProcessTimelineModalVisible(true)}
        >
          Xem tiến trình
        </Button>
      </div>

      <Card
        title={
          <div className="card-header-flex">
            <Space wrap>
              <span>Chi tiết yêu cầu thử nghiệm</span>
              <Tag color="blue">{data.requestNumber}</Tag>
              {getStatusTag(data.status)}
            </Space>
            <Space wrap>
              {renderActionButtons()}
              {canEditTestRequest(data.status) && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate(PATH_ROUTES.testRequests.edit(id!))}
                >
                  Chỉnh sửa
                </Button>
              )}
            </Space>
          </div>
        }
      >
        {/* Thông báo khi có thay đổi đang chờ phê duyệt */}
        {data.status === TestRequestStatus.PendingChangeApproval && (
          <Alert
            message="Có thay đổi đang chờ phê duyệt"
            description="Dữ liệu hiển thị bên dưới là dữ liệu gốc trước khi thay đổi. Vui lòng vào trang 'Quản lý chất lượng' để phê duyệt hoặc từ chối các thay đổi."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {/* Thông tin hợp đồng */}
        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin hợp đồng
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24} lg={12} xl={8}>
              <div className="detail-item">
                <Text type="secondary">Số HĐ:</Text>
                <Text strong>{data.contractNumber || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} lg={12} xl={8}>
              <div className="detail-item">
                <Text type="secondary">Ngày HĐ:</Text>
                <Text strong>
                  {data.contractDate
                    ? dayjs(data.contractDate).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </Text>
              </div>
            </Col>
            <Col xs={24} lg={12} xl={8}>
              <div className="detail-item">
                <Text type="secondary">Số phiếu thu:</Text>
                <Text>{data.receiptNumber || "-"}</Text>
              </div>
            </Col>
          </Row>
          {/* Chỉ hiển thị "Gửi kế toán" khi trạng thái = ResultSent */}
          {data.status === TestRequestStatus.ResultSent && (
            <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
              <Col xs={24}>
                <Space wrap size={[16, 8]}>
                  <Space size={4}>
                    <BoolIcon value={data.sentToAccounting} />
                    <Text style={{ fontSize: 13 }}>Gửi kế toán</Text>
                  </Space>
                  {/* <Space size={4}>
                  <BoolIcon value={data.paymentReceived} />
                  <Text style={{ fontSize: 13 }}>Đã thu tiền</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.sentToDepartment} />
                  <Text style={{ fontSize: 13 }}>Gửi khoa phòng</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.resultReturned} />
                  <Text style={{ fontSize: 13 }}>Trả kết quả</Text>
                </Space> */}
                </Space>
              </Col>
            </Row>
          )}
        </div>

        {/* Thông tin khách hàng */}
        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin khách hàng
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24} xl={12}>
              <div className="detail-item">
                <Text type="secondary">Tên CS/DN:</Text>
                <Text strong style={{ fontSize: 15 }}>
                  {data.customerName || "-"}
                </Text>
              </div>
            </Col>
            <Col xs={24} xl={12}>
              <div className="detail-item">
                <Text type="secondary">Mã số thuế:</Text>
                <Text>{data.taxCode || "-"}</Text>
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 12]} style={{ marginTop: 8 }}>
            <Col xs={24}>
              <div className="detail-item">
                <Text type="secondary">Địa chỉ:</Text>
                <Text>
                  {[data.address, data.ward, data.district, data.province]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </Text>
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 12]} style={{ marginTop: 8 }}>
            <Col xs={24} md={12}>
              <div className="detail-item">
                <Text type="secondary">Người liên hệ:</Text>
                <Text strong>{data.contactPerson || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="detail-item">
                <Text type="secondary">Điện thoại:</Text>
                <Text strong>{data.phone || "-"}</Text>
              </div>
            </Col>
          </Row>
        </div>

        {/* Loại hình mẫu */}
        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>
            Loại hình mẫu
          </Title>
          <Row gutter={[16, 8]}>
            <Col xs={24}>
              <Space wrap size={[16, 8]}>
                <Space size={4}>
                  <BoolIcon value={data.sampleTypeService} />
                  <Text style={{ fontSize: 13 }}>Dịch vụ</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.sampleTypeContract} />
                  <Text style={{ fontSize: 13 }}>Hợp đồng</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.sampleTypeTask} />
                  <Text style={{ fontSize: 13 }}>Nhiệm vụ</Text>
                </Space>
                <Space size={4}>
                  <BoolIcon value={data.sampleTypeSubContract} />
                  <Text style={{ fontSize: 13 }}>Thầu phụ</Text>
                </Space>
              </Space>
            </Col>
          </Row>
          {data.subContract && (
            <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
              <Col xs={24}>
                <div className="detail-item">
                  <Text type="secondary">Thầu phụ:</Text>
                  <Text>{data.subContract}</Text>
                </div>
              </Col>
            </Row>
          )}
        </div>

        {/* Bảng mẫu */}
        <Divider orientation="left" style={{ marginTop: 24 }}>
          <Space>
            <span style={{ fontWeight: 600 }}>Thông tin mẫu</span>
            <Tag color="blue">
              {data.totalSampleCount || data.samples?.length || 0} mẫu
            </Tag>
          </Space>
        </Divider>

        <Table
          dataSource={(data.samples || []).filter((s) => !s.isCancelled)}
          columns={sampleColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1600 }}
          size="small"
          bordered
          style={{ marginBottom: 24 }}
          locale={{ emptyText: "Không có mẫu nào" }}
        />

        {/* Layout: Desktop 2 cols, Mobile responsive wrap */}
        {/* Desktop: Left (Yêu cầu về kết quả, Yêu cầu về phương pháp), Right (Yêu cầu về lấy mẫu & giao trả, Thông tin chi phí) */}
        {/* Mobile order: Yêu cầu về kết quả → Yêu cầu về lấy mẫu & giao trả → Yêu cầu về phương pháp → Thông tin chi phí */}
        <Row gutter={[24, 24]}>
          {/* Yêu cầu về kết quả - Desktop: Left col row 1, Mobile: order 1 */}
          <Col xs={{ span: 24, order: 1 }} lg={{ span: 12, order: 1 }}>
            <div className="detail-section">
              <Title level={5} style={{ marginBottom: 12 }}>
                Yêu cầu về kết quả
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24} xl={12}>
                  <div className="detail-item">
                    <Text type="secondary">Ngôn ngữ:</Text>
                    <Text>{getResultLanguageText(data.resultLanguage)}</Text>
                  </div>
                </Col>
                <Col xs={24} xl={12}>
                  <div className="detail-item">
                    <Text type="secondary">Số bản:</Text>
                    <Text>{data.resultCopyCount || "-"}</Text>
                  </div>
                </Col>
                <Col span={24}>
                  <Space wrap size={[16, 8]}>
                    <Space size={4}>
                      <BoolIcon value={data.separatePassedResults} />
                      <Text style={{ fontSize: 13 }}>Tách riêng CT đạt</Text>
                    </Space>
                  </Space>
                </Col>
                {data.conformityDeclaration && (
                  <Col span={24}>
                    <div className="detail-item">
                      <Text type="secondary">Công bố hợp quy:</Text>
                      <Text>{data.conformityDeclaration}</Text>
                    </div>
                  </Col>
                )}
                {data.otherRequirements && (
                  <Col span={24}>
                    <div className="detail-item">
                      <Text type="secondary">Yêu cầu khác:</Text>
                      <Text>{data.otherRequirements}</Text>
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          </Col>

          {/* Yêu cầu về lấy mẫu & giao trả - Desktop: Right col row 1, Mobile: order 2 */}
          <Col xs={{ span: 24, order: 2 }} lg={{ span: 12, order: 2 }}>
            <div className="detail-section">
              <Title level={5} style={{ marginBottom: 12 }}>
                Yêu cầu về lấy mẫu & giao trả
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24} xl={12}>
                  <div className="detail-item">
                    <Text type="secondary">Lấy mẫu:</Text>
                    <Text>
                      {getSamplingRequirementText(data.samplingRequirement)}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} xl={12}>
                  <div className="detail-item">
                    <Text type="secondary">Lưu mẫu:</Text>
                    <Text>{getSampleStorageText(data.sampleStorage)}</Text>
                  </div>
                </Col>
                <Col span={24}>
                  <Space wrap size={[16, 8]}>
                    <Space size={4}>
                      <BoolIcon value={data.deliveryDirectPickup} />
                      <Text style={{ fontSize: 13 }}>Nhận trực tiếp</Text>
                    </Space>
                    <Space size={4}>
                      <BoolIcon value={data.deliveryPostal} />
                      <Text style={{ fontSize: 13 }}>Gửi bưu điện</Text>
                    </Space>
                    <Space size={4}>
                      <BoolIcon value={data.returnStoredSample} />
                      <Text style={{ fontSize: 13 }}>Trả lại mẫu lưu</Text>
                    </Space>
                  </Space>
                </Col>
                <Col span={24}>
                  <div className="detail-item">
                    <Text type="secondary">Ngày trả KQ:</Text>
                    <Text strong style={{ color: "#1890ff" }}>
                      {data.resultDeliveryDate
                        ? dayjs(data.resultDeliveryDate).format("DD/MM/YYYY")
                        : "-"}
                    </Text>
                  </div>
                </Col>
                <Col span={24}>
                  <div className="detail-item">
                    <Text type="secondary">Ngày hoàn thành dự kiến:</Text>
                    <Text strong style={{ color: "#52c41a" }}>
                      {data.expectedCompletionDate
                        ? dayjs(data.expectedCompletionDate).format(
                            "DD/MM/YYYY"
                          )
                        : "-"}
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>

          {/* Yêu cầu về phương pháp - Desktop: Left col row 2, Mobile: order 3 */}
          <Col xs={{ span: 24, order: 3 }} lg={{ span: 12, order: 3 }}>
            <div className="detail-section">
              <Title level={5} style={{ marginBottom: 12 }}>
                Yêu cầu về phương pháp
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <Space wrap size={[16, 8]}>
                    <Space size={4}>
                      <BoolIcon value={data.methodWestHighlandInstitute} />
                      <Text style={{ fontSize: 13 }}>
                        Theo Viện KHKT NN Tây Nguyên
                      </Text>
                    </Space>
                    <Space size={4}>
                      <BoolIcon value={data.methodCustomer} />
                      <Text style={{ fontSize: 13 }}>
                        Theo yêu cầu khách hàng
                      </Text>
                    </Space>
                  </Space>
                </Col>
                {data.methodCustomerDetail && (
                  <Col xs={24}>
                    <div className="detail-item">
                      <Text type="secondary">Chi tiết PP KH:</Text>
                      <Text>{data.methodCustomerDetail}</Text>
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          </Col>

          {/* Thông tin chi phí - Desktop: Right col row 2, Mobile: order 4 */}
          <Col xs={{ span: 24, order: 4 }} lg={{ span: 12, order: 4 }}>
            <div className="detail-section">
              <Title level={5} style={{ marginBottom: 12 }}>
                Thông tin chi phí
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <div
                    style={{
                      background: "#e6f7ff",
                      padding: "16px",
                      borderRadius: 8,
                      border: "1px solid #91d5ff",
                      textAlign: "center",
                    }}
                  >
                    <Text
                      type="secondary"
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Tổng chi phí:
                    </Text>
                    <Text strong style={{ fontSize: 24, color: "#1890ff" }}>
                      {(data.totalCost || 0).toLocaleString("vi-VN")} đ
                    </Text>
                  </div>
                </Col>
                {data.totalCostInWords && (
                  <Col xs={24}>
                    <div className="detail-item">
                      <Text type="secondary">Bằng chữ:</Text>
                      <Text italic>{data.totalCostInWords}</Text>
                    </div>
                  </Col>
                )}
              </Row>
            </div>

            {data.notes && (
              <div className="detail-section" style={{ marginTop: 16 }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Ghi chú
                </Title>
                <Text>{data.notes}</Text>
              </div>
            )}

            {data.subcontractor && (
              <div className="detail-section" style={{ marginTop: 16 }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Nhà thầu phụ
                </Title>
                <Text>{data.subcontractor}</Text>
              </div>
            )}
          </Col>
        </Row>

        {/* Hình ảnh gửi bưu điện - hiển thị khi có */}
        {data.deliveryPostal &&
          data.postalDeliveryImages &&
          data.postalDeliveryImages.length > 0 && (
            <>
              <Divider orientation="left" style={{ marginTop: 24 }}>
                <span style={{ fontWeight: 600 }}>
                  Hình ảnh gửi bưu điện ({data.postalDeliveryImages.length}{" "}
                  hình)
                </span>
              </Divider>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  padding: "16px 0",
                  justifyContent: "center",
                }}
              >
                <Image.PreviewGroup>
                  {data.postalDeliveryImages.map((img, index) => {
                    // Use fileService.getFileUrl for consistent URL generation
                    const imageUrl = fileService.getFileUrl(img.fileId);
                    return (
                      <div
                        key={img.fileId}
                        style={{
                          width: 200,
                          height: 200,
                          border: "1px solid #d9d9d9",
                          borderRadius: 8,
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Hình ảnh gửi bưu điện ${index + 1}`}
                          width={200}
                          height={200}
                          style={{
                            objectFit: "cover",
                          }}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                          placeholder={
                            <div
                              style={{
                                width: 200,
                                height: 200,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f5f5f5",
                              }}
                            >
                              <PictureOutlined
                                style={{ fontSize: 40, color: "#999" }}
                              />
                            </div>
                          }
                        />
                      </div>
                    );
                  })}
                </Image.PreviewGroup>
              </div>
            </>
          )}

        {/* Thông tin hệ thống */}
        <Divider />
        <Descriptions
          size="small"
          column={{ xs: 1, md: 2 }}
          style={{ marginTop: 16 }}
        >
          <Descriptions.Item label="Ngày tạo">
            {data.creationTime
              ? dayjs(data.creationTime).format("DD/MM/YYYY HH:mm:ss")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối">
            {data.lastModificationTime
              ? dayjs(data.lastModificationTime).format("DD/MM/YYYY HH:mm:ss")
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* BM01 Sample Selection Modal */}
      <Modal
        title="Chọn mẫu để xuất báo cáo BM01"
        open={sampleSelectionModalVisible}
        onCancel={() => setSampleSelectionModalVisible(false)}
        width={700}
        footer={[
          <Button
            key="cancel"
            onClick={() => setSampleSelectionModalVisible(false)}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={generatingBM01}
            disabled={
              !selectedSampleId ||
              !samplesForSelection.find((s) => s.id === selectedSampleId)
                ?.canGenerateResult
            }
            onClick={handleGenerateBM01}
          >
            Xuất báo cáo
          </Button>,
        ]}
      >
        <Spin spinning={loadingSamples}>
          <Table
            dataSource={samplesForSelection}
            columns={sampleSelectionColumns}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              type: "radio",
              selectedRowKeys: selectedSampleId ? [selectedSampleId] : [],
              onChange: (selectedRowKeys) => {
                setSelectedSampleId(selectedRowKeys[0] as string);
              },
              getCheckboxProps: (record: SampleForSelectionDto) => ({
                disabled: !record.canGenerateResult,
              }),
            }}
            onRow={(record) => ({
              onClick: () => {
                if (record.canGenerateResult) {
                  setSelectedSampleId(record.id);
                }
              },
              style: {
                cursor: record.canGenerateResult ? "pointer" : "not-allowed",
                opacity: record.canGenerateResult ? 1 : 0.6,
              },
            })}
            locale={{ emptyText: "Không có mẫu nào" }}
          />
          {samplesForSelection.some((s) => !s.canGenerateResult) && (
            <div style={{ marginTop: 12, color: "#888", fontSize: 12 }}>
              * Chỉ có thể xuất báo cáo cho các mẫu có trạng thái "Đã gửi kết
              quả"
            </div>
          )}

          {/* Note input field */}
          <div style={{ marginTop: 16 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Ghi chú (không bắt buộc)
            </label>
            <Input.TextArea
              value={bm01Note}
              onChange={(e) => setBm01Note(e.target.value)}
              placeholder="Nhập ghi chú sẽ được đưa vào phần cuối của báo cáo..."
              rows={3}
              maxLength={500}
              showCount
            />
          </div>
        </Spin>
      </Modal>

      {/* Mixed Result Sample Selection Modal */}
      <Modal
        title="Chọn mẫu để xuất báo cáo kết quả hỗn hợp"
        open={mixedResultModalVisible}
        onCancel={() => setMixedResultModalVisible(false)}
        width={700}
        footer={[
          <Button
            key="cancel"
            onClick={() => setMixedResultModalVisible(false)}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={generatingMixed}
            disabled={selectedSampleIds.length === 0}
            onClick={handleGenerateMixedResult}
          >
            Xuất báo cáo ({selectedSampleIds.length} mẫu)
          </Button>,
        ]}
      >
        <Spin spinning={loadingSamples}>
          <Table
            dataSource={samplesForSelection}
            columns={sampleSelectionColumns}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              type: "checkbox",
              selectedRowKeys: selectedSampleIds,
              onChange: (selectedRowKeys) => {
                setSelectedSampleIds(selectedRowKeys as string[]);
              },
              getCheckboxProps: (record: SampleForSelectionDto) => ({
                disabled: !record.canGenerateResult,
              }),
            }}
            onRow={(record) => ({
              onClick: () => {
                if (record.canGenerateResult) {
                  setSelectedSampleIds((prev) => {
                    if (prev.includes(record.id)) {
                      return prev.filter((id) => id !== record.id);
                    }
                    return [...prev, record.id];
                  });
                }
              },
              style: {
                cursor: record.canGenerateResult ? "pointer" : "not-allowed",
                opacity: record.canGenerateResult ? 1 : 0.6,
              },
            })}
            locale={{ emptyText: "Không có mẫu nào" }}
          />
          {samplesForSelection.some((s) => !s.canGenerateResult) && (
            <div style={{ marginTop: 12, color: "#888", fontSize: 12 }}>
              * Chỉ có thể xuất báo cáo cho các mẫu có trạng thái "Đã gửi kết
              quả"
            </div>
          )}

          {/* Note input field */}
          <div style={{ marginTop: 16 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Ghi chú (không bắt buộc)
            </label>
            <Input.TextArea
              value={mixedNote}
              onChange={(e) => setMixedNote(e.target.value)}
              placeholder="Nhập ghi chú sẽ được đưa vào phần cuối của báo cáo..."
              rows={3}
              maxLength={500}
              showCount
            />
          </div>
        </Spin>
      </Modal>

      {/* OnlyOffice Editor Modal - Full Screen */}
      <Modal
        title={null}
        open={editorModalVisible}
        onCancel={handleCloseEditorModal}
        width="100vw"
        style={{ top: 0, margin: 0, padding: 0, maxWidth: "100vw" }}
        styles={{
          body: {
            height: "calc(100vh - 53px)",
            padding: 0,
            overflow: "hidden",
          },
          wrapper: { padding: 0 },
          mask: { padding: 0 },
          header: { display: "none" },
          footer: { marginTop: 0, padding: "10px 16px" },
        }}
        wrapClassName="fullscreen-modal"
        footer={
          <Button icon={<CloseOutlined />} onClick={handleCloseEditorModal}>
            Đóng
          </Button>
        }
        closable={false}
        destroyOnClose
        centered={false}
      >
        {editorLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Spin size="large" tip="Đang tải editor..." />
          </div>
        ) : (
          <div
            id="result-form-editor-container"
            ref={editorContainerRef}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </Modal>

      {/* Reject Result Modal - Trả lại cho QLKT xem xét */}
      <Modal
        title="Không duyệt kết quả"
        open={rejectResultModalVisible}
        width={600}
        centered
        onCancel={() => {
          setRejectResultModalVisible(false);
          setRejectResultReason("");
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRejectResultModalVisible(false);
              setRejectResultReason("");
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={rejectResultLoading}
            disabled={!rejectResultReason.trim()}
            onClick={handleRejectResult}
          >
            Xác nhận
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 12 }}>
          <Text>Kết quả sẽ được trả lại cho Quản lý Kỹ thuật xem xét.</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text>Vui lòng nhập lý do không duyệt:</Text>
        </div>
        <TextArea
          rows={4}
          value={rejectResultReason}
          onChange={(e) => setRejectResultReason(e.target.value)}
          placeholder="Nhập lý do không duyệt kết quả..."
          maxLength={1000}
          showCount
        />
      </Modal>

      {/* Process Timeline Modal */}
      <ProcessTimelineModal
        open={processTimelineModalVisible}
        onClose={() => setProcessTimelineModalVisible(false)}
        testRequestId={id!}
      />

      {/* Postal Delivery Image Upload Modal */}
      <Modal
        title="Hoàn thành - Upload hình ảnh gửi bưu điện"
        open={postalImageModalVisible}
        onCancel={() => {
          setPostalImageModalVisible(false);
          setPostalImages([]);
        }}
        onOk={handleCompleteWithImage}
        okText="Hoàn thành"
        cancelText="Hủy"
        okButtonProps={{ disabled: postalImages.length === 0 }}
        centered
        width={600}
      >
        <Alert
          message={`Bắt buộc upload hình ảnh minh chứng gửi bưu điện (tối đa 5 hình, đã chọn ${postalImages.length}/5)`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Upload
          accept="image/*"
          multiple
          showUploadList={false}
          beforeUpload={handlePostalImageUpload}
          disabled={uploadingPostalImage || postalImages.length >= 5}
        >
          <Button
            icon={<UploadOutlined />}
            loading={uploadingPostalImage}
            disabled={postalImages.length >= 5}
          >
            Chọn hình ảnh ({postalImages.length}/5)
          </Button>
        </Upload>
        {postalImages.length > 0 && (
          <div
            style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            <Image.PreviewGroup>
              {postalImages.map((img, index) => (
                <div
                  key={img.fileId}
                  style={{ position: "relative", display: "inline-block" }}
                >
                  <Image
                    src={img.url}
                    alt={`Hình ảnh gửi bưu điện ${index + 1}`}
                    style={{ width: 100, height: 100, objectFit: "cover" }}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleRemovePostalImage(img.fileId)}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      background: "white",
                      borderRadius: "50%",
                      padding: 0,
                      width: 20,
                      height: 20,
                      minWidth: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              ))}
            </Image.PreviewGroup>
          </div>
        )}
      </Modal>

      {/* Sample Images Modal */}
      <SampleImagesModal
        open={sampleImagesModalVisible}
        onClose={() => {
          setSampleImagesModalVisible(false);
          setSelectedSampleForImages(null);
        }}
        sample={selectedSampleForImages}
      />
    </div>
  );
};

export default TestRequestDetail;
