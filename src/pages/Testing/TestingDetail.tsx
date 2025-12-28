import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Descriptions,
  Collapse,
  message,
  Spin,
  Alert,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  SendOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { testingService } from "../../services/testingService";
import {
  TestingDetailDto,
  TestingStatus,
  TestingStatusLabels,
  TestingStatusColors,
  SaveIndicatorResultDto,
  TestingSampleDto,
  SampleTestingImageType,
  SampleTestingImageDto,
  IndicatorTestingStatus,
} from "../../types/testing";
import IndicatorEditTable from "./components/IndicatorEditTable";
import RejectionHistoryModal from "./components/RejectionHistoryModal";
import SampleTestingImages from "./components/SampleTestingImages";
import SampleImagesDisplay from "./components/SampleImagesDisplay";

const { Title, Text } = Typography;
const { Panel } = Collapse;

const TestingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<TestingDetailDto | null>(null);

  // Edited results (per sample)
  const [sampleResults, setSampleResults] = useState<
    Map<string, SaveIndicatorResultDto[]>
  >(new Map());

  // Selected indicators per sample (for multiselect)
  const [selectedIndicators, setSelectedIndicators] = useState<
    Map<string, string[]>
  >(new Map());

  // Active collapse keys (open all panels by default)
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  // Rejection history modal
  const [historyModal, setHistoryModal] = useState({
    visible: false,
    indicatorId: "",
    indicatorName: "",
  });

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Always use 'my' mode (user's data only) - default for "Phân công của tôi"
      const result = await testingService.get(id, "my");
      setDetail(result);

      // Initialize sample results
      const initialResults = new Map<string, SaveIndicatorResultDto[]>();
      result.samples.forEach((sample) => {
        initialResults.set(
          sample.sampleId,
          sample.indicators.map((ind) => ({
            indicatorId: ind.id,
            methodId: ind.methodId,
            unit: ind.unit,
            result: ind.result,
          }))
        );
      });
      setSampleResults(initialResults);

      // Initialize selected indicators
      const initialSelected = new Map<string, string[]>();
      result.samples.forEach((sample) => {
        initialSelected.set(sample.sampleId, []);
      });
      setSelectedIndicators(initialSelected);

      // Open all sample panels by default
      setActiveKeys(result.samples.map((s) => s.sampleId));
    } catch (error) {
      console.error("Failed to load testing detail:", error);
      message.error("Không thể tải thông tin xét nghiệm");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const getStatusTag = (status: TestingStatus) => {
    const label = TestingStatusLabels[status];
    const color = TestingStatusColors[status];

    const iconMap: Record<TestingStatus, React.ReactNode> = {
      [TestingStatus.NotStarted]: <ClockCircleOutlined />,
      [TestingStatus.InProgress]: <SyncOutlined spin />,
      [TestingStatus.PendingApproval]: <ClockCircleOutlined />,
      [TestingStatus.Rejected]: <WarningOutlined />,
      [TestingStatus.Completed]: <CheckCircleOutlined />,
    };

    return (
      <Tag
        color={color}
        icon={iconMap[status]}
        style={{ fontSize: 14, padding: "4px 12px" }}
      >
        {label}
      </Tag>
    );
  };

  const handleResultsChange = (
    sampleId: string,
    results: SaveIndicatorResultDto[]
  ) => {
    const newResults = new Map(sampleResults);
    newResults.set(sampleId, results);
    setSampleResults(newResults);
  };

  const handleSelectionChange = (sampleId: string, indicatorIds: string[]) => {
    const newSelected = new Map(selectedIndicators);
    newSelected.set(sampleId, indicatorIds);
    setSelectedIndicators(newSelected);
  };

  const handleSaveIndicator = async (indicatorId: string) => {
    if (!id) return;

    // Find the indicator's current edited result
    let indicatorResult: SaveIndicatorResultDto | undefined;
    sampleResults.forEach((results) => {
      const found = results.find((r) => r.indicatorId === indicatorId);
      if (found) {
        indicatorResult = found;
      }
    });

    if (!indicatorResult) return;

    try {
      await testingService.saveResults(id, { results: [indicatorResult] });
      // Silent save on blur - no message needed
    } catch (error: any) {
      console.error("Failed to save result:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể lưu kết quả"
      );
    }
  };

  // Check-in indicators (Thực hiện)
  // Chỉ check-in các chỉ tiêu có trạng thái = "Cần làm" (Todo) hoặc "Bị từ chối" (Rejected)
  const handleCheckIn = async (sampleId: string) => {
    if (!id || !detail) return;
    const selected = selectedIndicators.get(sampleId) || [];

    if (selected.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 chỉ tiêu để thực hiện");
      return;
    }

    // Lọc và phân loại chỉ tiêu
    const sample = detail.samples.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    const validIndicatorIds: string[] = [];
    const alreadyTestingIds: string[] = [];

    selected.forEach((indicatorId) => {
      const indicator = sample.indicators.find((i) => i.id === indicatorId);
      if (!indicator) return;

      if (
        indicator.testingStatus === IndicatorTestingStatus.Todo ||
        indicator.testingStatus === IndicatorTestingStatus.Rejected
      ) {
        validIndicatorIds.push(indicatorId);
      } else if (indicator.testingStatus === IndicatorTestingStatus.Testing) {
        alreadyTestingIds.push(indicatorId);
      }
    });

    // Báo lỗi nếu có chỉ tiêu đang ở trạng thái "Đang thí nghiệm"
    if (alreadyTestingIds.length > 0 && validIndicatorIds.length === 0) {
      const testingNames = alreadyTestingIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(
        `Các chỉ tiêu "${testingNames}" đang ở trạng thái "Đang thí nghiệm", không cần thực hiện lại`
      );
      return;
    }

    if (validIndicatorIds.length === 0) {
      message.warning(
        "Không có chỉ tiêu nào ở trạng thái 'Cần làm' hoặc 'Bị từ chối' để thực hiện"
      );
      return;
    }

    setSubmitting(true);
    try {
      await testingService.checkInIndicators(id, {
        sampleId,
        indicatorIds: validIndicatorIds,
      });
      message.success(
        `Đã bắt đầu thực hiện ${validIndicatorIds.length} chỉ tiêu`
      );
      loadDetail();
    } catch (error: any) {
      console.error("Failed to check-in:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể thực hiện"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Submit results for approval (Gửi kết quả)
  // Chỉ gửi các chỉ tiêu có trạng thái = "Đang thử nghiệm" (Testing) và có kết quả
  const handleSubmitResults = async (sampleId: string) => {
    if (!id || !detail) return;
    const selected = selectedIndicators.get(sampleId) || [];

    if (selected.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 chỉ tiêu để gửi kết quả");
      return;
    }

    // Lọc chỉ các chỉ tiêu có trạng thái Testing
    const sample = detail.samples.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    const results = sampleResults.get(sampleId) || [];

    // Kiểm tra và lọc chỉ tiêu hợp lệ
    const validIndicatorIds: string[] = [];
    const missingResultIds: string[] = [];
    const todoStatusIds: string[] = [];
    const rejectedStatusIds: string[] = [];

    selected.forEach((indicatorId) => {
      const indicator = sample.indicators.find((i) => i.id === indicatorId);
      if (!indicator) return;

      // Phân loại theo trạng thái
      if (indicator.testingStatus === IndicatorTestingStatus.Todo) {
        todoStatusIds.push(indicatorId);
        return;
      }

      if (indicator.testingStatus === IndicatorTestingStatus.Rejected) {
        rejectedStatusIds.push(indicatorId);
        return;
      }

      // Chỉ gửi nếu trạng thái = Testing
      if (indicator.testingStatus !== IndicatorTestingStatus.Testing) {
        return; // Bỏ qua các trạng thái khác (Done, PendingApproval)
      }

      // Kiểm tra có kết quả không (từ edited results hoặc từ indicator)
      const editedResult = results.find((r) => r.indicatorId === indicatorId);
      const resultValue = editedResult?.result ?? indicator.result;

      if (!resultValue || resultValue.trim() === "") {
        missingResultIds.push(indicatorId);
        return;
      }

      validIndicatorIds.push(indicatorId);
    });

    // Thông báo lỗi nếu có chỉ tiêu ở trạng thái "Cần làm"
    if (todoStatusIds.length > 0 && validIndicatorIds.length === 0) {
      const todoNames = todoStatusIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(
        `Các chỉ tiêu "${todoNames}" đang ở trạng thái "Cần làm". Vui lòng ấn "Thực hiện" trước khi gửi kết quả`
      );
      return;
    }

    // Thông báo lỗi nếu có chỉ tiêu bị từ chối
    if (rejectedStatusIds.length > 0 && validIndicatorIds.length === 0) {
      const rejectedNames = rejectedStatusIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(
        `Các chỉ tiêu "${rejectedNames}" đang ở trạng thái "Bị từ chối". Vui lòng ấn "Thực hiện" để thử nghiệm lại`
      );
      return;
    }

    if (missingResultIds.length > 0) {
      const missingNames = missingResultIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(`Vui lòng nhập kết quả cho: ${missingNames}`);
      return;
    }

    if (validIndicatorIds.length === 0) {
      message.warning("Không có chỉ tiêu hợp lệ để gửi kết quả");
      return;
    }

    // Save all selected indicators first
    const selectedResults = results.filter((r) =>
      validIndicatorIds.includes(r.indicatorId)
    );

    setSubmitting(true);
    try {
      if (selectedResults.length > 0) {
        await testingService.saveResults(id, { results: selectedResults });
      }

      await testingService.submitResults(id, {
        sampleId,
        indicatorIds: validIndicatorIds,
      });
      message.success(
        `Gửi kết quả thành công cho ${validIndicatorIds.length} chỉ tiêu`
      );
      loadDetail();
    } catch (error: any) {
      console.error("Failed to submit results:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể gửi kết quả"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleImagesChange = (
    sampleId: string,
    imageType: SampleTestingImageType,
    images: SampleTestingImageDto[]
  ) => {
    if (!detail) return;

    // Update detail with new images
    const updatedSamples = detail.samples.map((sample) => {
      if (sample.sampleId !== sampleId) return sample;

      if (imageType === SampleTestingImageType.BeforeTesting) {
        return { ...sample, beforeTestingImages: images };
      } else {
        return { ...sample, afterTestingImages: images };
      }
    });

    setDetail({ ...detail, samples: updatedSamples });
  };

  const showRejectionHistory = (indicatorId: string, indicatorName: string) => {
    setHistoryModal({
      visible: true,
      indicatorId,
      indicatorName,
    });
  };

  // Check-in single indicator (Thực hiện từng chỉ tiêu)
  const handleCheckInSingleIndicator = async (indicatorId: string) => {
    if (!id || !detail) return;

    // Tìm sample chứa indicator này
    let sampleId: string | null = null;
    let indicator = null;
    for (const sample of detail.samples) {
      const found = sample.indicators.find((i) => i.id === indicatorId);
      if (found) {
        sampleId = sample.sampleId;
        indicator = found;
        break;
      }
    }

    if (!sampleId || !indicator) return;

    // Chỉ check-in nếu trạng thái = Todo hoặc Rejected
    if (
      indicator.testingStatus !== IndicatorTestingStatus.Todo &&
      indicator.testingStatus !== IndicatorTestingStatus.Rejected
    ) {
      message.warning(
        'Chỉ tiêu này không ở trạng thái "Cần làm" hoặc "Bị từ chối"'
      );
      return;
    }

    setSubmitting(true);
    try {
      await testingService.checkInIndicators(id, {
        sampleId,
        indicatorIds: [indicatorId],
      });
      message.success("Đã bắt đầu thực hiện chỉ tiêu");
      loadDetail();
    } catch (error: any) {
      console.error("Failed to check-in indicator:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể thực hiện"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Submit single indicator result (Gửi KQ từng chỉ tiêu)
  const handleSubmitSingleIndicator = async (indicatorId: string) => {
    if (!id || !detail) return;

    // Tìm sample chứa indicator này
    let sampleId: string | null = null;
    let indicator = null;
    for (const sample of detail.samples) {
      const found = sample.indicators.find((i) => i.id === indicatorId);
      if (found) {
        sampleId = sample.sampleId;
        indicator = found;
        break;
      }
    }

    if (!sampleId || !indicator) return;

    // Chỉ gửi nếu trạng thái = Testing
    if (indicator.testingStatus !== IndicatorTestingStatus.Testing) {
      message.warning('Chỉ tiêu này không ở trạng thái "Đang thí nghiệm"');
      return;
    }

    // Kiểm tra có kết quả không
    const results = sampleResults.get(sampleId) || [];
    const editedResult = results.find((r) => r.indicatorId === indicatorId);
    const resultValue = editedResult?.result ?? indicator.result;

    if (!resultValue || resultValue.trim() === "") {
      message.warning("Vui lòng nhập kết quả trước khi gửi");
      return;
    }

    setSubmitting(true);
    try {
      // Lưu kết quả trước
      if (editedResult) {
        await testingService.saveResults(id, { results: [editedResult] });
      }

      await testingService.submitResults(id, {
        sampleId,
        indicatorIds: [indicatorId],
      });
      message.success("Gửi kết quả thành công");
      loadDetail();
    } catch (error: any) {
      console.error("Failed to submit indicator result:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể gửi kết quả"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Check if deadline is urgent (<=3 days)
  const isUrgent = detail?.requestCompletionDate
    ? (() => {
        const deadline = new Date(detail.requestCompletionDate);
        const today = new Date();
        const diffDays = Math.ceil(
          (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 3;
      })()
    : false;

  // Sort samples theo sampleId để cố định vị trí
  const sortedSamples = detail?.samples
    ? [...detail.samples].sort((a, b) => a.sampleId.localeCompare(b.sampleId))
    : [];

  // Check if sample is completed (all indicators are Done)
  const isSampleCompleted = (sample: TestingSampleDto) => {
    return (
      sample.indicators.length > 0 &&
      sample.indicators.every(
        (ind) => ind.testingStatus === IndicatorTestingStatus.Done
      )
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card>
        <Alert
          message="Không tìm thấy thông tin"
          description="Không thể tải thông tin xét nghiệm"
          type="error"
        />
      </Card>
    );
  }

  // Render sample panel header (compact - only title and action buttons)
  const renderSamplePanelHeader = (sample: TestingSampleDto) => {
    const selected = selectedIndicators.get(sample.sampleId) || [];

    // Kiểm tra có chỉ tiêu nào được chọn ở trạng thái Todo hoặc Rejected không
    const hasCheckInableIndicators = selected.some((indicatorId) => {
      const indicator = sample.indicators.find((i) => i.id === indicatorId);
      return (
        indicator &&
        (indicator.testingStatus === IndicatorTestingStatus.Todo ||
          indicator.testingStatus === IndicatorTestingStatus.Rejected)
      );
    });

    // Kiểm tra có chỉ tiêu nào được chọn ở trạng thái Testing không
    const hasSubmittableIndicators = selected.some((indicatorId) => {
      const indicator = sample.indicators.find((i) => i.id === indicatorId);
      return (
        indicator && indicator.testingStatus === IndicatorTestingStatus.Testing
      );
    });

    return (
      <div style={{ width: "100%" }}>
        <Row justify="space-between" align="middle" wrap={false}>
          <Col flex="auto">
            <Space wrap size={8}>
              <Text strong>
                {sample.sampleCode} - {sample.sampleName}
              </Text>
              <Text type="secondary">
                ({sample.indicators.length} chỉ tiêu)
              </Text>
            </Space>
          </Col>
          <Col flex="none" onClick={(e) => e.stopPropagation()}>
            <Space size={8}>
              {/* Action buttons */}
              <Button
                type="default"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleCheckIn(sample.sampleId)}
                disabled={
                  submitting ||
                  selected.length === 0 ||
                  !hasCheckInableIndicators
                }
              >
                Thực hiện
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmitResults(sample.sampleId)}
                disabled={
                  submitting ||
                  selected.length === 0 ||
                  !hasSubmittableIndicators
                }
              >
                Gửi kết quả
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
    );
  };

  // Render sample images section (displayed inside panel content)
  const renderSampleImages = (sample: TestingSampleDto) => {
    // Không cho upload nếu sample đã hoàn thành
    const canUpload = !isSampleCompleted(sample);

    return (
      <div
        style={{
          marginBottom: 16,
          padding: "12px 0",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Space size={24} wrap>
          {/* Hình mẫu (readonly từ TestRequest) */}
          {sample.sampleImages?.length > 0 && (
            <SampleImagesDisplay
              images={sample.sampleImages}
              title="Hình mẫu"
            />
          )}
          {/* Hình trước TN */}
          <SampleTestingImages
            taskId={id!}
            sampleId={sample.sampleId}
            imageType={SampleTestingImageType.BeforeTesting}
            images={sample.beforeTestingImages || []}
            canUpload={canUpload}
            onImagesChange={(images) =>
              handleImagesChange(
                sample.sampleId,
                SampleTestingImageType.BeforeTesting,
                images
              )
            }
          />
          {/* Hình sau TN */}
          <SampleTestingImages
            taskId={id!}
            sampleId={sample.sampleId}
            imageType={SampleTestingImageType.AfterTesting}
            images={sample.afterTestingImages || []}
            canUpload={canUpload}
            onImagesChange={(images) =>
              handleImagesChange(
                sample.sampleId,
                SampleTestingImageType.AfterTesting,
                images
              )
            }
          />
        </Space>
      </div>
    );
  };

  return (
    <div>
      {/* Back Button */}
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/testing")}
        >
          Quay lại
        </Button>
      </div>

      {/* Urgent Alert */}
      {isUrgent && (
        <Alert
          message="Cảnh báo"
          description="Ngày yêu cầu hoàn thành còn ≤3 ngày!"
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={4} style={{ margin: 0 }}>
                <ExperimentOutlined style={{ marginRight: 8 }} />
                Số hợp đồng: {detail.contractNumber || "N/A"}
              </Title>
              <Space>
                {getStatusTag(detail.testingStatus)}
                <Text type="secondary">
                  KTV: {detail.technicianNames || "Chưa có"}
                </Text>
                <Text type="secondary">|</Text>
                <Text type="secondary">
                  Khoa phòng: {detail.laboratoryName || "N/A"}
                </Text>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Overview Info */}
      <Card title="Thông tin tổng quan" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Khách hàng">
            {detail.customerName || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Quản lý kỹ thuật">
            {detail.technicalManagerName || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày YC hoàn thành">
            <span
              style={{
                color: isUrgent ? "#ff4d4f" : undefined,
                fontWeight: isUrgent ? "bold" : undefined,
              }}
            >
              {detail.requestCompletionDate
                ? new Date(detail.requestCompletionDate).toLocaleDateString(
                    "vi-VN"
                  )
                : "N/A"}
            </span>
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={[24, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Title level={5}>Mẫu được phân công</Title>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {sortedSamples.map((sample) => (
                <li key={sample.sampleId} style={{ marginBottom: 4 }}>
                  <Text strong style={{ whiteSpace: "nowrap" }}>
                    {sample.sampleCode}
                  </Text>
                  <Text type="secondary"> - </Text>
                  <Tooltip title={sample.sampleName}>
                    <Text
                      type="secondary"
                      style={{
                        display: "inline-block",
                        maxWidth: "calc(100% - 120px)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        verticalAlign: "bottom",
                      }}
                    >
                      {sample.sampleName}
                    </Text>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </Col>
          <Col span={12}>
            <Title level={5}>Số chỉ tiêu</Title>
            <Text>
              <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
                {detail.completedIndicatorCount}
              </Text>
              <Text type="secondary"> / {detail.totalIndicatorCount}</Text>
              <Text type="secondary"> đã hoàn thành</Text>
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Sample Panels */}
      <Collapse
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(keys as string[])}
        expandIconPosition="start"
      >
        {sortedSamples.map((sample) => (
          <Panel header={renderSamplePanelHeader(sample)} key={sample.sampleId}>
            {/* Images section */}
            {renderSampleImages(sample)}
            {/* Indicators table */}
            <IndicatorEditTable
              indicators={sample.indicators}
              selectedIndicatorIds={
                selectedIndicators.get(sample.sampleId) || []
              }
              isUrgent={isUrgent}
              submitting={submitting}
              onResultsChange={(results) =>
                handleResultsChange(sample.sampleId, results)
              }
              onSelectionChange={(ids) =>
                handleSelectionChange(sample.sampleId, ids)
              }
              onShowRejectionHistory={showRejectionHistory}
              onSaveIndicator={handleSaveIndicator}
              onCheckInIndicator={handleCheckInSingleIndicator}
              onSubmitIndicator={handleSubmitSingleIndicator}
            />
          </Panel>
        ))}
      </Collapse>

      {/* Rejection History Modal */}
      <RejectionHistoryModal
        visible={historyModal.visible}
        indicatorId={historyModal.indicatorId}
        indicatorName={historyModal.indicatorName}
        onClose={() =>
          setHistoryModal({
            visible: false,
            indicatorId: "",
            indicatorName: "",
          })
        }
      />
    </div>
  );
};

export default TestingDetail;
