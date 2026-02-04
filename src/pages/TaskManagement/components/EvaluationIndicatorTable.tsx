import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  Select,
  Button,
  Space,
  Modal,
  Form,
  Typography,
  Input,
  Tag,
  Tooltip,
} from "antd";
import StatusTag from "../../../components/common/StatusTag";
import type { TableRowSelection } from "antd/es/table/interface";
import {
  CheckOutlined,
  CloseOutlined,
  SwapOutlined,
  FileAddOutlined,
} from "../../../components/common/Icon";
import {
  LaboratoryTaskIndicatorDto,
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
  MethodLookupDto,
  IndicatorEvaluationAction,
} from "../../../types/laboratoryTask";
import { laboratoryTaskService } from "../../../services/laboratoryTaskService";
import { IndicatorName } from "../../../components/common";
import "./EvaluationIndicatorTable.css";

const { Text } = Typography;

// Extended type with position flags for tree line rendering
interface IndicatorWithPosition extends LaboratoryTaskIndicatorDto {
  _isFirstSub?: boolean;
  _isLastSub?: boolean;
}

// Helper to extract error message from API response
// API trả về format: { errors: { fieldName: ["message1", "message2"] } }
const getApiErrorMessage = (error: any, defaultMessage: string): string => {
  const errorData = error?.response?.data;
  if (!errorData) return defaultMessage;

  // Nếu có errors object, lấy message đầu tiên từ field đầu tiên
  if (errorData.errors && typeof errorData.errors === "object") {
    const firstField = Object.keys(errorData.errors)[0];
    if (firstField && Array.isArray(errorData.errors[firstField])) {
      return errorData.errors[firstField][0] || defaultMessage;
    }
  }

  // Fallback các format khác
  return (
    errorData.general?.[0] ||
    errorData.error?.message ||
    errorData.message ||
    defaultMessage
  );
};

interface EvaluationIndicatorTableProps {
  indicators: LaboratoryTaskIndicatorDto[];
  methods: MethodLookupDto[];
  taskId: string;
  canEvaluate: boolean; // QLKT permission
  loading?: boolean;
  onEvaluationComplete: () => void; // Callback to refresh data after evaluation
  isSharedSampleTask?: boolean; // Mẫu chung - cần check ẩn nút từ chối cho Lab Hóa
}

const EvaluationIndicatorTable: React.FC<EvaluationIndicatorTableProps> = ({
  indicators,
  methods,
  taskId,
  canEvaluate,
  loading = false,
  onEvaluationComplete,
  isSharedSampleTask = false,
}) => {
  // State for selected indicators
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>(
    []
  );

  // State for action loading
  const [actionLoading, setActionLoading] = useState(false);

  // State for hiding reject button (shared sample - Lab Hóa không được từ chối)
  const [hideRejectButton, setHideRejectButton] = useState(false);

  // Check if should hide reject button for shared sample task (Lab Hóa)
  useEffect(() => {
    if (isSharedSampleTask && taskId) {
      laboratoryTaskService
        .shouldHideRejectButton(taskId)
        .then((shouldHide) => {
          setHideRejectButton(shouldHide);
        })
        .catch((error) => {
          console.error("Failed to check shouldHideRejectButton:", error);
          setHideRejectButton(false);
        });
    } else {
      setHideRejectButton(false);
    }
  }, [isSharedSampleTask, taskId]);

  // State for method change modal
  const [methodChangeModal, setMethodChangeModal] = useState<{
    visible: boolean;
    indicatorId?: string;
    mode: "single" | "bulk";
  }>({
    visible: false,
    mode: "single",
  });
  const [methodChangeForm] = Form.useForm();

  // State for reject modal
  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    indicatorId?: string;
    mode: "single" | "bulk";
  }>({
    visible: false,
    mode: "single",
  });
  const [rejectForm] = Form.useForm();

  // State for supplementary request modal
  const [supplementaryModal, setSupplementaryModal] = useState<{
    visible: boolean;
    indicatorId?: string;
  }>({
    visible: false,
  });
  const [supplementaryForm] = Form.useForm();

  // Filter indicators that need evaluation (Pending or CannotTest status)
  // Exclude sub-indicators only - Lab Hóa can work in parallel now
  const pendingIndicators = useMemo(() => {
    return indicators.filter(
      (ind) =>
        !ind.parentIndicatorId && // Chỉ đánh giá cho chỉ tiêu cha
        (ind.approvalStatus === IndicatorApprovalStatus.Pending ||
          ind.approvalStatus === IndicatorApprovalStatus.CannotTest)
    );
  }, [indicators]);

  // Check if there are pending indicators for "Approve All" button
  const hasPendingIndicators = pendingIndicators.length > 0;

  // Handle single indicator accept
  const handleAccept = async (indicatorId: string) => {
    if (!canEvaluate) return;

    setActionLoading(true);
    try {
      await laboratoryTaskService.evaluateIndicator(indicatorId, {
        action: IndicatorEvaluationAction.Accept,
      });
      onEvaluationComplete();
    } catch (error: any) {
      console.error("Failed to accept indicator:", error);
      Modal.error({
        title: "Lỗi",
        content: getApiErrorMessage(error, "Không thể chấp nhận chỉ tiêu"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle method change request (single)
  const handleMethodChangeRequest = async () => {
    try {
      const values = await methodChangeForm.validateFields();

      setActionLoading(true);

      if (
        methodChangeModal.mode === "single" &&
        methodChangeModal.indicatorId
      ) {
        await laboratoryTaskService.evaluateIndicator(
          methodChangeModal.indicatorId,
          {
            action: IndicatorEvaluationAction.RequestMethodChange,
            newMethodId: values.newMethodId,
            reason: values.reason,
          }
        );
      } else if (
        methodChangeModal.mode === "bulk" &&
        selectedIndicatorIds.length > 0
      ) {
        await laboratoryTaskService.requestMethodChange(taskId, {
          items: selectedIndicatorIds.map((id) => ({
            indicatorId: id,
            newMethodId: values.newMethodId,
          })),
          reason: values.reason,
        });
        setSelectedIndicatorIds([]);
      }

      setMethodChangeModal({ visible: false, mode: "single" });
      methodChangeForm.resetFields();
      onEvaluationComplete();
    } catch (error: any) {
      if (error.errorFields) return; // Form validation error
      console.error("Failed to request method change:", error);
      Modal.error({
        title: "Lỗi",
        content: getApiErrorMessage(error, "Không thể yêu cầu đổi phương pháp"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject (single or bulk)
  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields();

      setActionLoading(true);

      if (rejectModal.mode === "single" && rejectModal.indicatorId) {
        await laboratoryTaskService.evaluateIndicator(rejectModal.indicatorId, {
          action: IndicatorEvaluationAction.Reject,
          reason: values.reason,
        });
      } else if (
        rejectModal.mode === "bulk" &&
        selectedIndicatorIds.length > 0
      ) {
        await laboratoryTaskService.rejectIndicatorsForTesting(taskId, {
          indicatorIds: selectedIndicatorIds,
          reason: values.reason,
        });
        setSelectedIndicatorIds([]);
      }

      setRejectModal({ visible: false, mode: "single" });
      rejectForm.resetFields();
      onEvaluationComplete();
    } catch (error: any) {
      if (error.errorFields) return; // Form validation error
      console.error("Failed to reject indicator:", error);
      Modal.error({
        title: "Lỗi",
        content: getApiErrorMessage(error, "Không thể từ chối thử nghiệm"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle approve all remaining
  const handleApproveAllRemaining = async () => {
    Modal.confirm({
      title: "Xác nhận chấp nhận tất cả",
      content: `Bạn có chắc muốn chấp nhận thử nghiệm cho ${pendingIndicators.length} chỉ tiêu còn lại?`,
      okText: "Chấp nhận tất cả",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        setActionLoading(true);
        try {
          await laboratoryTaskService.approveAllRemainingIndicators(taskId);
          onEvaluationComplete();
        } catch (error: any) {
          console.error("Failed to approve all:", error);
          Modal.error({
            title: "Lỗi",
            content: getApiErrorMessage(
              error,
              "Không thể chấp nhận tất cả chỉ tiêu"
            ),
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Get count of selected indicators that are pending (can be accepted)
  const selectedPendingCount = useMemo(() => {
    return selectedIndicatorIds.filter((id) =>
      pendingIndicators.some((ind) => ind.id === id)
    ).length;
  }, [selectedIndicatorIds, pendingIndicators]);

  // Handle accept selected indicators
  const handleAcceptSelected = async () => {
    // Filter only pending indicators from selection
    const pendingIds = selectedIndicatorIds.filter((id) =>
      pendingIndicators.some((ind) => ind.id === id)
    );

    if (pendingIds.length === 0) {
      Modal.warning({
        title: "Không có chỉ tiêu cần chấp nhận",
        content: "Vui lòng chọn các chỉ tiêu đang chờ đánh giá",
      });
      return;
    }

    Modal.confirm({
      title: "Xác nhận chấp nhận",
      content: `Bạn có chắc muốn chấp nhận thử nghiệm cho ${pendingIds.length} chỉ tiêu đã chọn?`,
      okText: "Chấp nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        setActionLoading(true);
        try {
          // Accept each indicator sequentially
          for (const indicatorId of pendingIds) {
            await laboratoryTaskService.evaluateIndicator(indicatorId, {
              action: IndicatorEvaluationAction.Accept,
            });
          }
          setSelectedIndicatorIds([]);
          onEvaluationComplete();
        } catch (error: any) {
          console.error("Failed to accept selected indicators:", error);
          Modal.error({
            title: "Lỗi",
            content: getApiErrorMessage(
              error,
              "Không thể chấp nhận các chỉ tiêu đã chọn"
            ),
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Handle supplementary request
  const handleSupplementaryRequest = async () => {
    try {
      const values = await supplementaryForm.validateFields();
      setActionLoading(true);

      if (supplementaryModal.indicatorId) {
        await laboratoryTaskService.evaluateIndicator(
          supplementaryModal.indicatorId,
          {
            action: IndicatorEvaluationAction.RequestSupplementary,
            reason: values.reason,
          }
        );
      }

      setSupplementaryModal({ visible: false });
      supplementaryForm.resetFields();
      onEvaluationComplete();
    } catch (error: any) {
      if (error.errorFields) return; // Form validation error
      console.error("Failed to request supplementary:", error);
      Modal.error({
        title: "Lỗi",
        content: getApiErrorMessage(error, "Không thể gửi yêu cầu bổ sung"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Get status tag for indicator
  const getStatusTag = (record: LaboratoryTaskIndicatorDto) => {
    const status = record.approvalStatus;

    // Hiển thị "Chờ mẫu chung" nếu chỉ tiêu đang đợi mẫu từ Lab Vi Sinh
    if (record.isWaitingForSharedSample) {
      return (
        <Tooltip title="Chỉ tiêu này thuộc mẫu chung, đang chờ Lab Vi Sinh hoàn thành">
          <Tag color="gold">Chờ mẫu chung</Tag>
        </Tooltip>
      );
    }

    if (status === IndicatorApprovalStatus.CannotTest) {
      return <Tag color="orange">KTV báo không TN được</Tag>;
    }

    if (status === IndicatorApprovalStatus.SupplementaryRequested) {
      return (
        <Tooltip title={`Lý do: ${record.supplementaryRequestReason || "-"}`}>
          <Tag color="cyan">YC bổ sung</Tag>
        </Tooltip>
      );
    }

    return (
      <StatusTag color={IndicatorApprovalStatusColors[status]}>
        {IndicatorApprovalStatusLabels[status]}
      </StatusTag>
    );
  };

  // Get action buttons for indicator
  const getActionButtons = (record: LaboratoryTaskIndicatorDto) => {
    const status = record.approvalStatus;

    if (!canEvaluate) {
      return <></>;
    }

    // Không hiển thị button nào cho chỉ tiêu phụ (chỉ hiển thị thông tin)
    // Chỉ đánh giá cho chỉ tiêu cha
    if (record.parentIndicatorId) {
      return <></>;
    }

    // Không hiển thị button nào khi đang chờ KH xác nhận (SupplementaryRequested, MethodChangeRequested, TestingRejected)
    if (
      status === IndicatorApprovalStatus.SupplementaryRequested ||
      status === IndicatorApprovalStatus.MethodChangeRequested ||
      status === IndicatorApprovalStatus.TestingRejected
    ) {
      return <></>;
    }

    // Các trạng thái cần QLKT đánh giá: Pending và CannotTest (KTV báo không TN được)
    const needsEvaluation =
      status === IndicatorApprovalStatus.Pending ||
      status === IndicatorApprovalStatus.CannotTest;

    // Chỉ có thể YC bổ sung khi KTV báo không TN được (CannotTest)
    const canRequestSupplementary =
      status === IndicatorApprovalStatus.CannotTest;

    // Nếu không cần đánh giá và không thể YC bổ sung, không hiển thị button
    if (!needsEvaluation && !canRequestSupplementary) {
      return <></>;
    }

    const isCannotTest = status === IndicatorApprovalStatus.CannotTest;

    return (
      <Space size="small" wrap>
        {/* Buttons cho trạng thái Pending */}
        {needsEvaluation && !isCannotTest && (
          <>
            <Tooltip title="Chấp nhận thử nghiệm">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleAccept(record.id)}
                loading={actionLoading}
              >
                Chấp nhận TN
              </Button>
            </Tooltip>
            <Tooltip title="Yêu cầu đổi phương pháp">
              <Button
                size="small"
                icon={<SwapOutlined />}
                onClick={() =>
                  setMethodChangeModal({
                    visible: true,
                    indicatorId: record.id,
                    mode: "single",
                  })
                }
                loading={actionLoading}
              >
                Đổi PP
              </Button>
            </Tooltip>
            {/* Ẩn nút Từ chối TN nếu là Lab Hóa trong mẫu chung */}
            {!hideRejectButton && (
              <Tooltip title="Từ chối thử nghiệm">
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() =>
                    setRejectModal({
                      visible: true,
                      indicatorId: record.id,
                      mode: "single",
                    })
                  }
                  loading={actionLoading}
                >
                  Từ chối TN
                </Button>
              </Tooltip>
            )}
          </>
        )}

        {/* Buttons cho trạng thái CannotTest (KTV báo không TN được) */}
        {/* Chỉ hiển thị Từ chối TN - không hiển thị Chấp nhận (đã chấp nhận rồi) và Đổi PP */}
        {/* Ẩn nút Từ chối TN nếu là Lab Hóa trong mẫu chung */}
        {isCannotTest && !hideRejectButton && (
          <Tooltip title="Từ chối thử nghiệm">
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() =>
                setRejectModal({
                  visible: true,
                  indicatorId: record.id,
                  mode: "single",
                })
              }
              loading={actionLoading}
            >
              Từ chối TN
            </Button>
          </Tooltip>
        )}

        {/* Button YC bổ sung cho AcceptedForTesting và CannotTest */}
        {canRequestSupplementary && (
          <Tooltip title="Yêu cầu KH cung cấp thông tin bổ sung">
            <Button
              size="small"
              icon={<FileAddOutlined />}
              onClick={() =>
                setSupplementaryModal({ visible: true, indicatorId: record.id })
              }
              loading={actionLoading}
            >
              YC bổ sung
            </Button>
          </Tooltip>
        )}
      </Space>
    );
  };

  // Check if there are any indicators that need action (for showing/hiding action column)
  // Only parent indicators can have actions (sub-indicators are display-only)
  const hasActionableIndicators = useMemo(() => {
    if (!canEvaluate) return false;
    return indicators.some(
      (ind) =>
        !ind.parentIndicatorId && // Chỉ tiêu cha mới có thể đánh giá
        (ind.approvalStatus === IndicatorApprovalStatus.Pending ||
          ind.approvalStatus === IndicatorApprovalStatus.CannotTest)
    );
  }, [indicators, canEvaluate]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Mẫu",
        key: "sample",
        width: 150,
        render: (_: unknown, record: LaboratoryTaskIndicatorDto) => (
          <div>
            <Tag color="blue">{record.sampleCode}</Tag>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {record.sampleName}
            </div>
          </div>
        ),
      },
      {
        title: "Tên chỉ tiêu",
        dataIndex: "indicatorName",
        key: "indicatorName",
        width: 200,
        render: (value: string, record: IndicatorWithPosition) => {
          const isSubIndicator = !!record.parentIndicatorId;
          const isFirstSub = record._isFirstSub || false;
          const isLastSub = record._isLastSub || false;

          return (
            <div
              className={`evaluation-indicator-name-wrapper ${isSubIndicator ? "has-tree-line" : ""} ${isFirstSub ? "is-first-sub" : ""} ${isLastSub ? "is-last-sub" : ""}`}
              style={{
                paddingLeft: isSubIndicator ? 24 : 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div>
                <IndicatorName name={value} formattedName={record.indicatorFormattedName} />
                {record.indicatorGroupName && !isSubIndicator && (
                  <div style={{ marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {record.indicatorGroupName}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        title: "Phương pháp hiện tại",
        dataIndex: "methodName",
        key: "methodName",
        width: 200,
        render: (value: string, record: LaboratoryTaskIndicatorDto) => {
          // Không hiển thị phương pháp cho chỉ tiêu phụ
          if (record.parentIndicatorId) return null;
          return (
            <Tooltip title={value}>
              <IndicatorName
                name={value || "-"}
                formattedName={record.methodFormattedName}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              />
            </Tooltip>
          );
        },
      },
      {
        title: "Đơn giá",
        dataIndex: "unitPrice",
        key: "unitPrice",
        width: 120,
        render: (value: number, record: LaboratoryTaskIndicatorDto) => {
          // Không hiển thị đơn giá cho chỉ tiêu phụ
          if (record.parentIndicatorId) return null;
          return <Text>{value?.toLocaleString("vi-VN")} đ</Text>;
        },
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 150,
        render: (_: unknown, record: LaboratoryTaskIndicatorDto) => {
          // Không hiển thị trạng thái cho chỉ tiêu phụ
          if (record.parentIndicatorId) return null;
          return getStatusTag(record);
        },
      },
      // Cột Hành động - sẽ được filter ra nếu không có chỉ tiêu cần action
      {
        title: "Hành động",
        key: "actions",
        width: 250,
        fixed: "right" as const,
        render: (_: unknown, record: LaboratoryTaskIndicatorDto) =>
          getActionButtons(record),
        hidden: !hasActionableIndicators,
      },
    ].filter((col) => !("hidden" in col) || !col.hidden);

    return baseColumns;
  }, [hasActionableIndicators]);

  // Sort indicators: Group by sample, then by parent/sub indicator groups
  // Helper: tạo composite key từ indicatorId + methodId
  const makeGroupKey = (indicatorId: string, methodId: string | null | undefined) =>
    `${indicatorId}_${methodId || 'no-method'}`;

  // Within each sample, parent and sub-indicators are kept together
  // Also add position flags for tree line rendering
  const sortedIndicators = useMemo((): IndicatorWithPosition[] => {
    const needsEvaluation = (status: IndicatorApprovalStatus) =>
      status === IndicatorApprovalStatus.Pending ||
      status === IndicatorApprovalStatus.CannotTest;

    const sorted = [...indicators].sort((a, b) => {
      // First, sort by sample code
      const sampleCompare = (a.sampleCode || "").localeCompare(b.sampleCode || "");
      if (sampleCompare !== 0) return sampleCompare;

      // Same sample - now group by parent/sub relationship + methodId
      // Group key: for parent use indicatorId+methodId, for sub use parentIndicatorId+methodId
      const aGroupKey = a.parentIndicatorId
        ? makeGroupKey(a.parentIndicatorId, a.methodId)
        : makeGroupKey(a.indicatorId, a.methodId);
      const bGroupKey = b.parentIndicatorId
        ? makeGroupKey(b.parentIndicatorId, b.methodId)
        : makeGroupKey(b.indicatorId, b.methodId);

      // If they are in different groups within the same sample
      if (aGroupKey !== bGroupKey) {
        // Find the parent indicator of each group to determine priority
        const aParent = a.parentIndicatorId
          ? indicators.find(
              (i) =>
                i.indicatorId === a.parentIndicatorId &&
                i.sampleId === a.sampleId &&
                i.methodId === a.methodId
            )
          : a;
        const bParent = b.parentIndicatorId
          ? indicators.find(
              (i) =>
                i.indicatorId === b.parentIndicatorId &&
                i.sampleId === b.sampleId &&
                i.methodId === b.methodId
            )
          : b;

        // Sort groups by needs evaluation priority (parent's status determines group priority)
        const aParentNeedsEval = aParent
          ? needsEvaluation(aParent.approvalStatus)
          : false;
        const bParentNeedsEval = bParent
          ? needsEvaluation(bParent.approvalStatus)
          : false;

        if (aParentNeedsEval && !bParentNeedsEval) return -1;
        if (!aParentNeedsEval && bParentNeedsEval) return 1;

        // CannotTest groups before Pending groups (more urgent)
        if (aParent && bParent) {
          if (
            aParent.approvalStatus === IndicatorApprovalStatus.CannotTest &&
            bParent.approvalStatus === IndicatorApprovalStatus.Pending
          ) {
            return -1;
          }
          if (
            aParent.approvalStatus === IndicatorApprovalStatus.Pending &&
            bParent.approvalStatus === IndicatorApprovalStatus.CannotTest
          ) {
            return 1;
          }
        }

        // Same priority, maintain original relative order by group key
        return aGroupKey.localeCompare(bGroupKey);
      }

      // Same group - parent first, then sub-indicators
      if (!a.parentIndicatorId && b.parentIndicatorId) return -1;
      if (a.parentIndicatorId && !b.parentIndicatorId) return 1;

      // Both are sub-indicators in same group, keep original order
      return 0;
    });

    // Add position flags for tree line rendering
    return sorted.map((item, _index, arr): IndicatorWithPosition => {
      if (!item.parentIndicatorId) {
        return item; // Parent indicator, no flags needed
      }

      // Find siblings (sub-indicators with same parent AND same sample AND same methodId)
      // Because the same parent indicator can appear in different samples/methods
      const parentId = item.parentIndicatorId;
      const sampleId = item.sampleId;
      const methodId = item.methodId;
      const siblings = arr.filter(
        (i) =>
          i.parentIndicatorId === parentId &&
          i.sampleId === sampleId &&
          i.methodId === methodId
      );
      const siblingIndex = siblings.findIndex((s) => s.id === item.id);

      return {
        ...item,
        _isFirstSub: siblingIndex === 0,
        _isLastSub: siblingIndex === siblings.length - 1,
      };
    });
  }, [indicators]);

  // Row selection configuration
  const rowSelection:
    | TableRowSelection<LaboratoryTaskIndicatorDto>
    | undefined = useMemo(() => {
    if (!canEvaluate) return undefined;

    return {
      selectedRowKeys: selectedIndicatorIds,
      onChange: (selectedRowKeys: React.Key[]) => {
        setSelectedIndicatorIds(selectedRowKeys as string[]);
      },
      getCheckboxProps: (record: LaboratoryTaskIndicatorDto) => ({
        // Disable selection cho:
        // - Chỉ tiêu phụ (chỉ đánh giá cho chỉ tiêu cha)
        // - Chỉ tiêu đang chờ mẫu chung
        // - Chỉ tiêu không cần đánh giá
        disabled:
          !!record.parentIndicatorId ||
          (record.approvalStatus !== IndicatorApprovalStatus.Pending &&
            record.approvalStatus !== IndicatorApprovalStatus.CannotTest),
        name: record.id,
      }),
    };
  }, [selectedIndicatorIds, canEvaluate]);

  const selectedCount = selectedIndicatorIds.length;

  return (
    <>
      {/* Bulk action buttons */}
      {canEvaluate && (
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleAcceptSelected}
              disabled={selectedPendingCount === 0}
              loading={actionLoading}
            >
              Chấp nhận ({selectedPendingCount})
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={() =>
                setMethodChangeModal({ visible: true, mode: "bulk" })
              }
              disabled={selectedCount === 0}
              loading={actionLoading}
            >
              Đổi PP ({selectedCount})
            </Button>
            {/* Ẩn nút Từ chối TN bulk nếu là Lab Hóa trong mẫu chung */}
            {!hideRejectButton && (
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => setRejectModal({ visible: true, mode: "bulk" })}
                disabled={selectedCount === 0}
                loading={actionLoading}
              >
                Từ chối TN ({selectedCount})
              </Button>
            )}
          </Space>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={sortedIndicators}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 950 }}
        loading={loading || actionLoading}
        rowSelection={rowSelection}
        rowClassName={(record: IndicatorWithPosition) =>
          record.parentIndicatorId ? "sub-indicator-row" : ""
        }
      />

      {/* Method Change Modal */}
      <Modal
        title={
          methodChangeModal.mode === "single"
            ? "Yêu cầu đổi phương pháp"
            : `Yêu cầu đổi PP cho ${selectedCount} chỉ tiêu`
        }
        open={methodChangeModal.visible}
        onOk={handleMethodChangeRequest}
        onCancel={() => {
          setMethodChangeModal({ visible: false, mode: "single" });
          methodChangeForm.resetFields();
        }}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{ loading: actionLoading }}
        width={600}
        centered
      >
        <Form form={methodChangeForm} layout="vertical">
          <Form.Item
            name="newMethodId"
            label="Phương pháp mới"
            rules={[
              { required: true, message: "Vui lòng chọn phương pháp mới" },
            ]}
          >
            <Select
              placeholder="Chọn phương pháp mới"
              options={methods.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Lý do đổi phương pháp"
            rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do yêu cầu đổi phương pháp..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={
          rejectModal.mode === "single"
            ? "Từ chối thử nghiệm"
            : `Từ chối TN cho ${selectedCount} chỉ tiêu`
        }
        open={rejectModal.visible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModal({ visible: false, mode: "single" });
          rejectForm.resetFields();
        }}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: actionLoading }}
        width={600}
        centered
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do từ chối thử nghiệm..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Supplementary Request Modal */}
      <Modal
        title="Yêu cầu cung cấp bổ sung"
        open={supplementaryModal.visible}
        onOk={handleSupplementaryRequest}
        onCancel={() => {
          setSupplementaryModal({ visible: false });
          supplementaryForm.resetFields();
        }}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        okButtonProps={{ loading: actionLoading }}
        width={600}
        centered
      >
        <Form form={supplementaryForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Nội dung yêu cầu bổ sung"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung yêu cầu" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập nội dung cần khách hàng bổ sung..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EvaluationIndicatorTable;
