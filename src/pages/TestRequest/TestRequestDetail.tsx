import React, { useState, useEffect, useRef, useMemo } from "react";
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
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetTestRequestQuery,
  useGetSamplesForResultFormQuery,
  useGenerateTestRequestFormMutation,
  useGenerateBM01ResultFormMutation,
  useGetResultFormEditorConfigQuery,
  useUpdateToPendingApprovalMutation,
  useApproveTestRequestMutation,
  useSendResultMutation,
  useCompleteTestRequestMutation,
  SampleForSelectionDto,
} from "../../store/api/testRequestApi";
import {
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestStatusColors,
  canEditTestRequest,
  ResultLanguage,
  SamplingRequirement,
  SampleStorageOption,
  SampleStatus,
} from "../../types/testRequest";
import dayjs from "dayjs";
import "./TestRequestDetail.css";

const { Title, Text } = Typography;

const TestRequestDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // RTK Query hooks
  const {
    data,
    isLoading: loading,
  } = useGetTestRequestQuery(id!, { skip: !id });

  // OnlyOffice Editor states
  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [editorConfig, setEditorConfig] = useState<any>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const docEditorRef = useRef<any>(null);

  // BM01 Sample Selection Modal states
  const [sampleSelectionModalVisible, setSampleSelectionModalVisible] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // RTK Query for samples
  const {
    data: samplesForSelection = [],
    isLoading: loadingSamples,
  } = useGetSamplesForResultFormQuery(id!, {
    skip: !id || !sampleSelectionModalVisible,
  });

  // RTK Query for editor config
  const {
    data: editorConfigData,
  } = useGetResultFormEditorConfigQuery(generatedFileName!, {
    skip: !generatedFileName,
  });

  // Update editor config when data is loaded
  useEffect(() => {
    if (editorConfigData && generatedFileName) {
      setEditorConfig(editorConfigData);
      setEditorLoading(true);
      setEditorModalVisible(true);
      setGeneratedFileName(null);
    }
  }, [editorConfigData, generatedFileName]);

  // Mutations
  const [generateTestRequestForm, { isLoading: printingTestRequest }] = useGenerateTestRequestFormMutation();
  const [generateBM01ResultForm, { isLoading: generatingBM01 }] = useGenerateBM01ResultFormMutation();
  const [updateToPendingApproval] = useUpdateToPendingApprovalMutation();
  const [approveTestRequest] = useApproveTestRequestMutation();
  const [sendResult] = useSendResultMutation();
  const [completeTestRequest] = useCompleteTestRequestMutation();

  const getStatusTag = (status: TestRequestStatus) => {
    const label = TestRequestStatusLabels[status] || status.toString();
    const color = TestRequestStatusColors[status] || "default";
    return <Tag color={color}>{label}</Tag>;
  };

  // Render action buttons based on status
  const renderActionButtons = () => {
    if (!data) return null;

    switch (data.status) {
      case TestRequestStatus.New:
      case TestRequestStatus.Pending:
        return (
          <Button
            icon={<FileTextOutlined />}
            onClick={() => handlePrintTestRequest()}
            loading={printingTestRequest}
          >
            In phiếu XN
          </Button>
        );
      case TestRequestStatus.TestingCompleted:
        return (
          <Space>
            <Button
              icon={<FileTextOutlined />}
              onClick={handleOpenBM01Modal}
            >
              In KQ Mẫu đơn
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => handlePrintMixedResult()}
            >
              In KQ hỗn hợp
            </Button>
          </Space>
        );
      case TestRequestStatus.PendingApproval:
        return (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove()}
          >
            Phê duyệt
          </Button>
        );
      case TestRequestStatus.Approved:
        return (
          <Button
            type="primary"
            onClick={() => handleSendResult()}
          >
            Gửi kết quả
          </Button>
        );
      case TestRequestStatus.ResultSent:
        return (
          <Button
            type="primary"
            onClick={() => handleComplete()}
          >
            Hoàn thành
          </Button>
        );
      default:
        return null;
    }
  };

  // Handle print test request form - generate document and open editor
  const handlePrintTestRequest = async () => {
    if (!id) return;
    try {
      const result = await generateTestRequestForm(id).unwrap();
      message.success(`Đã tạo phiếu yêu cầu XN: ${result.requestNumber}`);
      setGeneratedFileName(result.fileName);
    } catch (error: any) {
      console.error("Error printing test request:", error);
      message.error(error?.data?.error?.message || "Không thể tạo phiếu. Vui lòng thử lại.");
    }
  };

  // Handle print mixed result (placeholder)
  const handlePrintMixedResult = () => {
    message.info("Chức năng in KQ hỗn hợp đang được phát triển");
  };

  // Handle send result
  const handleSendResult = async () => {
    if (!id) return;
    try {
      await sendResult(id).unwrap();
      message.success("Đã gửi kết quả thành công");
    } catch (error: any) {
      console.error("Error sending result:", error);
      message.error(error?.data?.error?.message || "Không thể gửi kết quả. Vui lòng thử lại.");
    }
  };

  // Handle approve test request
  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveTestRequest(id).unwrap();
      message.success("Đã phê duyệt thành công");
    } catch (error: any) {
      console.error("Error approving test request:", error);
      message.error(error?.data?.error?.message || "Không thể phê duyệt. Vui lòng thử lại.");
    }
  };

  // Handle complete test request
  const handleComplete = async () => {
    if (!id) return;
    try {
      await completeTestRequest(id).unwrap();
      message.success("Đã hoàn thành yêu cầu thử nghiệm");
    } catch (error: any) {
      console.error("Error completing test request:", error);
      message.error(error?.data?.error?.message || "Không thể hoàn thành. Vui lòng thử lại.");
    }
  };

  const getSampleStatusTag = (status: SampleStatus) => {
    const statusConfig = {
      [SampleStatus.Normal]: { color: "default", text: "Bình thường" },
      [SampleStatus.Damaged]: { color: "warning", text: "Hư hỏng" },
      [SampleStatus.NotMeetRequirements]: {
        color: "error",
        text: "Không đạt YC",
      },
      [SampleStatus.Testing]: { color: "processing", text: "Đang kiểm nghiệm" },
      [SampleStatus.Completed]: { color: "success", text: "Hoàn thành" },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
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
            user: editorConfig.config.editorConfig?.user || { id: "1", name: "Editor" },
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
  const handleOpenBM01Modal = () => {
    setSampleSelectionModalVisible(true);
    setSelectedSampleId(null);
  };

  // Handle BM01 - Generate result form
  const handleGenerateBM01 = async () => {
    if (!id || !selectedSampleId) {
      message.warning("Vui lòng chọn một mẫu");
      return;
    }

    const selectedSample = samplesForSelection.find(s => s.id === selectedSampleId);
    if (selectedSample && !selectedSample.canGenerateResult) {
      message.error("Mẫu chưa xét nghiệm xong");
      return;
    }

    try {
      // Step 1: Generate the document
      const result = await generateBM01ResultForm({ testRequestId: id, sampleId: selectedSampleId }).unwrap();
      message.success(`Đã tạo phiếu kết quả BM01 cho mẫu ${result.sampleCode}`);

      // Step 2: Update status to PendingApproval after printing result form
      await updateToPendingApproval(id).unwrap();

      // Step 3: Close selection modal
      setSampleSelectionModalVisible(false);

      // Step 4: Set file name to trigger editor config fetch
      setGeneratedFileName(result.fileName);
    } catch (error: any) {
      console.error("Error generating BM01 result form:", error);
      message.error(error?.data?.error?.message || "Không thể tạo phiếu kết quả. Vui lòng thử lại.");
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
      render: (date: string) => date ? dayjs(date).format("DD/MM/YYYY") : "-",
    },
  ];

  // Sample table columns
  const sampleColumns = useMemo(() => [
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
      render: (value: string, record: any) =>
        value || getSampleStatusTag(record.status),
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
        const groupedByLab: Record<string, { labName: string; indicators: any[] }> = {};

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

        const renderIndicator = (ind: any, idx: number) => (
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
            </div>
            {ind.requestDate && (
              <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                YC xong: {dayjs(ind.requestDate).format("DD/MM/YYYY")}
              </div>
            )}
          </div>
        );

        return (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {/* Unsent indicators */}
            {unsentIndicators.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {unsentIndicators.map((ind, idx) => renderIndicator(ind, idx))}
              </div>
            )}

            {/* Grouped by laboratory */}
            {Object.entries(groupedByLab).map(([labId, { labName, indicators: labIndicators }]) => (
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
            ))}
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
  ], []);

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
      <Card
        title={
          <Space wrap>
            <span>Chi tiết yêu cầu thử nghiệm</span>
            <Tag color="blue">{data.requestNumber}</Tag>
            {getStatusTag(data.status)}
          </Space>
        }
        extra={
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/requests")}
            >
              Quay lại
            </Button>
            {renderActionButtons()}
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/test-request/edit/${id}`)}
              disabled={!canEditTestRequest(data.status)}
              title={!canEditTestRequest(data.status) ? "Không thể chỉnh sửa ở trạng thái này" : ""}
            >
              Chỉnh sửa
            </Button>
          </Space>
        }
      >
        {/* Thông tin hợp đồng */}
        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin hợp đồng
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12} md={6}>
              <div className="detail-item">
                <Text type="secondary">Số HĐ:</Text>
                <Text strong>{data.contractNumber || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="detail-item">
                <Text type="secondary">Ngày HĐ:</Text>
                <Text strong>
                  {data.contractDate
                    ? dayjs(data.contractDate).format("DD/MM/YYYY")
                    : "-"}
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="detail-item">
                <Text type="secondary">Số phiếu thu:</Text>
                <Text>{data.receiptNumber || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
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
          <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
            <Col xs={24}>
              <Space wrap size={[16, 8]}>
                <Space size={4}>
                  <BoolIcon value={data.sentToAccounting} />
                  <Text style={{ fontSize: 13 }}>Gửi kế toán</Text>
                </Space>
                <Space size={4}>
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
                </Space>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Thông tin khách hàng */}
        <div className="detail-section">
          <Title level={5} style={{ marginBottom: 12 }}>
            Thông tin khách hàng
          </Title>
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <div className="detail-item">
                <Text type="secondary">Tên CS/DN:</Text>
                <Text strong style={{ fontSize: 15 }}>
                  {data.customerName || "-"}
                </Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
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
            <Col xs={24} sm={12}>
              <div className="detail-item">
                <Text type="secondary">Người liên hệ:</Text>
                <Text strong>{data.contactPerson || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
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
        <Divider style={{ marginTop: 24 }}>
          <Space>
            <span style={{ fontWeight: 600 }}>Thông tin mẫu</span>
            <Tag color="blue">
              {data.totalSampleCount || data.samples?.length || 0} mẫu
            </Tag>
          </Space>
        </Divider>

        <Table
          dataSource={data.samples || []}
          columns={sampleColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1600 }}
          size="small"
          bordered
          style={{ marginBottom: 24 }}
          locale={{ emptyText: "Không có mẫu nào" }}
        />

        {/* Yêu cầu về phương pháp */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
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

            <div className="detail-section" style={{ marginTop: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Yêu cầu về kết quả
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Ngôn ngữ:</Text>
                    <Text>{getResultLanguageText(data.resultLanguage)}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Số bản:</Text>
                    <Text>{data.resultCopyCount || "-"}</Text>
                  </div>
                </Col>
                <Col xs={24}>
                  <Space wrap size={[16, 8]}>
                    <Space size={4}>
                      <BoolIcon value={data.separatePassedResults} />
                      <Text style={{ fontSize: 13 }}>Tách riêng CT đạt</Text>
                    </Space>
                  </Space>
                </Col>
                {data.conformityDeclaration && (
                  <Col xs={24}>
                    <div className="detail-item">
                      <Text type="secondary">Công bố hợp quy:</Text>
                      <Text>{data.conformityDeclaration}</Text>
                    </div>
                  </Col>
                )}
                {data.otherRequirements && (
                  <Col xs={24}>
                    <div className="detail-item">
                      <Text type="secondary">Yêu cầu khác:</Text>
                      <Text>{data.otherRequirements}</Text>
                    </div>
                  </Col>
                )}
              </Row>
            </div>

            <div className="detail-section" style={{ marginTop: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Yêu cầu về lấy mẫu & giao trả
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Lấy mẫu:</Text>
                    <Text>
                      {getSamplingRequirementText(data.samplingRequirement)}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Lưu mẫu:</Text>
                    <Text>{getSampleStorageText(data.sampleStorage)}</Text>
                  </div>
                </Col>
                <Col xs={24}>
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
                <Col xs={24} sm={12}>
                  <div className="detail-item">
                    <Text type="secondary">Ngày trả KQ:</Text>
                    <Text strong style={{ color: "#1890ff" }}>
                      {data.resultDeliveryDate
                        ? dayjs(data.resultDeliveryDate).format("DD/MM/YYYY")
                        : "-"}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
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

          <Col xs={24} lg={12}>
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

            <div className="detail-section" style={{ marginTop: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Người phụ trách
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24}>
                  <div className="detail-item">
                    <Text type="secondary">Người giám sát:</Text>
                    <Text strong>{data.supervisorName || "-"}</Text>
                  </div>
                </Col>
                <Col xs={24}>
                  <div className="detail-item">
                    <Text type="secondary">Giám đốc:</Text>
                    <Text strong>{data.directorName || "-"}</Text>
                  </div>
                </Col>
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
          column={{ xs: 1, sm: 2 }}
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
          <Button key="cancel" onClick={() => setSampleSelectionModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={generatingBM01}
            disabled={!selectedSampleId || !samplesForSelection.find(s => s.id === selectedSampleId)?.canGenerateResult}
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
          {samplesForSelection.some(s => !s.canGenerateResult) && (
            <div style={{ marginTop: 12, color: "#888", fontSize: 12 }}>
              * Chỉ có thể xuất báo cáo cho các mẫu có trạng thái "Đã gửi kết quả"
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
          body: { height: "calc(100vh - 53px)", padding: 0, overflow: "hidden" },
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
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
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
    </div>
  );
};

export default TestRequestDetail;
