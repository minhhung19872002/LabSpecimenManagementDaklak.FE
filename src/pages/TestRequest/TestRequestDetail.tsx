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
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  FileTextOutlined,
  HistoryOutlined,
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

  // BM01 Sample Selection Modal states
  const [sampleSelectionModalVisible, setSampleSelectionModalVisible] =
    useState(false);
  const [samplesForSelection, setSamplesForSelection] = useState<
    SampleForSelectionDto[]
  >([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [generatingBM01, setGeneratingBM01] = useState(false);

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
    if (data.status === TestRequestStatus.PendingApproval) {
      buttons.push(
        <Button
          key="approve"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => handleApprove()}
        >
          Phê duyệt KQ
        </Button>
      );
      buttons.push(
        <Button
          key="reject-result"
          danger
          icon={<CloseCircleOutlined />}
          onClick={() => setRejectResultModalVisible(true)}
        >
          Không duyệt
        </Button>
      );
    }

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
          onClick={() => handlePrintMixedResult()}
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

  // Handle print test request form - generate document and open editor
  // Status is automatically updated to Pending when generating form (if currently New)
  const handlePrintTestRequest = async () => {
    if (!id) return;
    setPrintingTestRequest(true);
    try {
      // Step 1: Generate the test request form document (also updates status to Pending if New)
      const result = await testRequestService.generateTestRequestForm(id);
      message.success(`Đã tạo phiếu yêu cầu XN: ${result.requestNumber}`);

      // Step 2: Get editor config and open OnlyOffice
      const config = await testRequestService.getResultFormEditorConfig(
        result.fileName
      );
      setEditorConfig(config);
      setEditorLoading(true);
      setEditorModalVisible(true);

      // Step 3: Reload data to get updated status
      loadData(id);
    } catch (error: any) {
      console.error("Error printing test request:", error);
      message.error(
        error?.response?.data?.error?.message ||
          "Không thể tạo phiếu. Vui lòng thử lại."
      );
    } finally {
      setPrintingTestRequest(false);
    }
  };

  // Handle print mixed result (placeholder)
  const handlePrintMixedResult = () => {
    message.info("Chức năng in KQ hỗn hợp đang được phát triển");
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
  const handleComplete = async () => {
    if (!id) return;
    try {
      await testRequestService.complete(id);
      message.success("Đã hoàn thành yêu cầu thử nghiệm");
      loadData(id); // Reload to get updated status
    } catch (error: any) {
      console.error("Error completing test request:", error);
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
    try {
      // Step 1: Generate the document
      const result = await testRequestService.generateBM01ResultForm(
        id,
        selectedSampleId
      );
      message.success(`Đã tạo phiếu kết quả BM01 cho mẫu ${result.sampleCode}`);

      // Step 2: Update status to PendingApproval after printing result form
      await testRequestService.updateToPendingApproval(id);

      // Step 3: Close selection modal
      setSampleSelectionModalVisible(false);

      // Step 4: Get editor config and open OnlyOffice
      const config = await testRequestService.getResultFormEditorConfig(
        result.fileName
      );
      setEditorConfig(config);
      setEditorLoading(true);
      setEditorModalVisible(true);

      // Step 5: Reload data to update status
      loadData(id);
    } catch (error: any) {
      console.error("Error generating BM01 result form:", error);
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
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            <Col xs={24} lg={12} xl={6}>
              <div className="detail-item">
                <Text type="secondary">Số HĐ:</Text>
                <Text strong>{data.contractNumber || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} lg={12} xl={6}>
              <div className="detail-item">
                <Text type="secondary">Ngày HĐ:</Text>
                <Text strong>
                  {data.contractDate
                    ? dayjs(data.contractDate).format("DD/MM/YYYY")
                    : "-"}
                </Text>
              </div>
            </Col>
            <Col xs={24} lg={12} xl={6}>
              <div className="detail-item">
                <Text type="secondary">Số phiếu thu:</Text>
                <Text>{data.receiptNumber || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} lg={12} xl={6}>
              <div className="detail-item">
                <Text type="secondary">Ngày yêu cầu:</Text>
                <Text strong>
                  {data.requestDate
                    ? dayjs(data.requestDate).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </Text>
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
          dataSource={(data.samples || []).filter(s => !s.isCancelled)}
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
    </div>
  );
};

export default TestRequestDetail;
