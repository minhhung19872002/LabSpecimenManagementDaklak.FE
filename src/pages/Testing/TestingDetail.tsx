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
} from "@ant-design/icons";
import { testingService } from "../../services/testingService";
import {
  TestingDetailDto,
  TestingStatus,
  TestingStatusLabels,
  TestingStatusColors,
  SaveIndicatorResultDto,
} from "../../types/testing";
import IndicatorEditTable from "./components/IndicatorEditTable";
import RejectionHistoryModal from "./components/RejectionHistoryModal";
import { IndicatorApprovalStatus } from "../../types/laboratoryTask";

const { Title, Text } = Typography;
const { Panel } = Collapse;

const TestingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<TestingDetailDto | null>(null);

  // Edited results (per sample)
  const [sampleResults, setSampleResults] = useState<Map<string, SaveIndicatorResultDto[]>>(new Map());


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
      const result = await testingService.get(id, 'my');
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
      [TestingStatus.Todo]: <ClockCircleOutlined />,
      [TestingStatus.InProgress]: <SyncOutlined spin />,
      [TestingStatus.Done]: <CheckCircleOutlined />,
    };

    return (
      <Tag color={color} icon={iconMap[status]} style={{ fontSize: 14, padding: "4px 12px" }}>
        {label}
      </Tag>
    );
  };

  const handleResultsChange = (sampleId: string, results: SaveIndicatorResultDto[]) => {
    const newResults = new Map(sampleResults);
    newResults.set(sampleId, results);
    setSampleResults(newResults);
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
      message.error(error.response?.data?.error?.message || "Không thể lưu kết quả");
    }
  };

  const handleSubmitForApprovalSingle = async (indicatorId: string) => {
    if (!id) return;

    setSubmitting(true);
    try {
      // First, save the results for this indicator before submitting
      // Find the indicator's current edited result
      let indicatorResult: SaveIndicatorResultDto | undefined;
      sampleResults.forEach((results) => {
        const found = results.find((r) => r.indicatorId === indicatorId);
        if (found) {
          indicatorResult = found;
        }
      });

      if (indicatorResult) {
        // Save the result first
        await testingService.saveResults(id, { results: [indicatorResult] });
      }

      // Then submit for approval
      await testingService.submitForApproval(id, { indicatorIds: [indicatorId] });
      message.success("Gửi duyệt thành công");
      loadDetail();
    } catch (error: any) {
      console.error("Failed to submit for approval:", error);
      message.error(error.response?.data?.error?.message || "Không thể gửi duyệt");
    } finally {
      setSubmitting(false);
    }
  };

  const showRejectionHistory = (indicatorId: string, indicatorName: string) => {
    setHistoryModal({
      visible: true,
      indicatorId,
      indicatorName,
    });
  };

  // Sort samples theo sampleId để cố định vị trí
  const sortedSamples = detail?.samples
    ? [...detail.samples].sort((a, b) => a.sampleId.localeCompare(b.sampleId))
    : [];

  // Get all indicators from all samples
  const allIndicators = detail?.samples?.flatMap((s) => s.indicators) || [];

  // Check indicators status
  const allApproved =
    allIndicators.length > 0 &&
    allIndicators.every((i) => i.approvalStatus === IndicatorApprovalStatus.Approved);

  const allSubmittedOrApproved =
    allIndicators.length > 0 &&
    allIndicators.every(
      (i) =>
        i.approvalStatus === IndicatorApprovalStatus.Entered ||
        i.approvalStatus === IndicatorApprovalStatus.Approved
    );

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

  return (
    <div>
      {/* Back Button */}
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/testing')}
        >
          Quay lại
        </Button>
      </div>

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
          <Col>
            {/* Overall status tag for the whole task */}
            {allApproved && (
              <Tag color="success" style={{ fontSize: 14, padding: "8px 16px" }}>
                <CheckCircleOutlined /> Tất cả đã phê duyệt
              </Tag>
            )}
            {allSubmittedOrApproved && !allApproved && (
              <Tag color="processing" style={{ fontSize: 14, padding: "8px 16px" }}>
                <ClockCircleOutlined /> Đang chờ phê duyệt
              </Tag>
            )}
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
            {detail.requestCompletionDate
              ? new Date(detail.requestCompletionDate).toLocaleDateString("vi-VN")
              : "N/A"}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={[24, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Title level={5}>Mẫu được phân công</Title>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {sortedSamples.map((sample) => (
                <li key={sample.sampleId} style={{ marginBottom: 4 }}>
                  <Text strong style={{ whiteSpace: "nowrap" }}>{sample.sampleCode}</Text>
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
                        verticalAlign: "bottom"
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
      <Collapse activeKey={activeKeys} onChange={(keys) => setActiveKeys(keys as string[])}>
        {sortedSamples.map((sample) => (
          <Panel
            header={
              <Space>
                <Text strong>
                  {sample.sampleCode} - {sample.sampleName}
                </Text>
                {sample.statusText && (
                  <Tag color="blue">{sample.statusText}</Tag>
                )}
                <Text type="secondary">
                  ({sample.indicators.length} chỉ tiêu)
                </Text>
              </Space>
            }
            key={sample.sampleId}
          >
            <IndicatorEditTable
              indicators={sample.indicators}
              onResultsChange={(results) => handleResultsChange(sample.sampleId, results)}
              onShowRejectionHistory={showRejectionHistory}
              onSaveIndicator={handleSaveIndicator}
              onSubmitForApproval={handleSubmitForApprovalSingle}
              submitting={submitting}
            />
          </Panel>
        ))}
      </Collapse>

      {/* Rejection History Modal */}
      <RejectionHistoryModal
        visible={historyModal.visible}
        indicatorId={historyModal.indicatorId}
        indicatorName={historyModal.indicatorName}
        onClose={() => setHistoryModal({ visible: false, indicatorId: "", indicatorName: "" })}
      />
    </div>
  );
};

export default TestingDetail;
