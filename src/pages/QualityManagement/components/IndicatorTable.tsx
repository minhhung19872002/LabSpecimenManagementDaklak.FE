import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Select,
  Collapse,
  message,
  Tooltip,
  Checkbox,
  Typography,
} from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { qualityManagementService } from "../../../services/qualityManagementService";
import {
  standardService,
  StandardWithIndicatorsDto,
} from "../../../services/masterDataService";
import {
  QualityManagementIndicatorDto,
  QualityIndicatorApprovalStatus,
  QualityIndicatorApprovalStatusLabels,
  QualityIndicatorApprovalStatusColors,
  QualityManagementStatus,
} from "../../../types/qualityManagement";

const { Panel } = Collapse;
const { Text } = Typography;

interface IndicatorTableProps {
  indicators: QualityManagementIndicatorDto[];
  taskStatus: QualityManagementStatus;
  onApprove: (indicatorId: string) => void;
  onReject: (indicatorId: string) => void;
  onIndicatorUpdate: () => void;
  // Bulk action selection props (for pending indicators)
  selectedPendingIds: string[];
  onPendingSelectChange: (ids: string[]) => void;
}

// Group indicators by laboratory
interface LabGroup {
  laboratoryId: string;
  laboratoryName: string;
  indicators: QualityManagementIndicatorDto[];
}

const IndicatorTable: React.FC<IndicatorTableProps> = ({
  indicators,
  taskStatus,
  onApprove,
  onReject,
  onIndicatorUpdate,
  selectedPendingIds,
  onPendingSelectChange,
}) => {
  const [standardsWithIndicators, setStandardsWithIndicators] = useState<
    StandardWithIndicatorsDto[]
  >([]);
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [updatingStandard, setUpdatingStandard] = useState<string | null>(null);

  useEffect(() => {
    loadStandards();
  }, []);

  const loadStandards = async () => {
    setLoadingStandards(true);
    try {
      const result = await standardService.getWithIndicators();
      setStandardsWithIndicators(result);
    } catch (error) {
      console.error("Error loading standards:", error);
    } finally {
      setLoadingStandards(false);
    }
  };

  // Get standards that contain a specific indicator (by indicatorId)
  const getStandardsForIndicator = useMemo(() => {
    return (indicatorId: string) => {
      return standardsWithIndicators.filter((standard) =>
        standard.indicators.some((si) => si.indicatorId === indicatorId)
      );
    };
  }, [standardsWithIndicators]);

  const handleStandardChange = async (
    indicatorId: string,
    standardId: string | undefined
  ) => {
    setUpdatingStandard(indicatorId);
    try {
      await qualityManagementService.updateIndicatorStandard(
        indicatorId,
        standardId || undefined
      );
      // message.success('Đã cập nhật tiêu chuẩn so sánh');
      onIndicatorUpdate();
    } catch (error) {
      console.error("Error updating standard:", error);
      message.error("Không thể cập nhật tiêu chuẩn");
    } finally {
      setUpdatingStandard(null);
    }
  };

  const getApprovalStatusTag = (status: QualityIndicatorApprovalStatus) => (
    <Tag color={QualityIndicatorApprovalStatusColors[status]}>
      {QualityIndicatorApprovalStatusLabels[status]}
    </Tag>
  );

  // Check if actions should be disabled based on task status
  const actionsDisabled = taskStatus === QualityManagementStatus.ResultSent;

  // Group indicators by laboratory
  const groupedData: LabGroup[] = React.useMemo(() => {
    const groups: Record<string, LabGroup> = {};
    indicators.forEach((ind) => {
      const key = ind.laboratoryId;
      if (!groups[key]) {
        groups[key] = {
          laboratoryId: key,
          laboratoryName: ind.laboratoryName || "Không xác định",
          indicators: [],
        };
      }
      groups[key].indicators.push(ind);
    });
    return Object.values(groups);
  }, [indicators]);

  // Handle select all PENDING in a lab group (for bulk approve/reject)
  const handleSelectAllPendingInGroup = (labGroup: LabGroup, checked: boolean) => {
    const pendingIds = labGroup.indicators
      .filter(
        (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval
      )
      .map((ind) => ind.id);

    if (checked) {
      const newSelected = [
        ...new Set([...selectedPendingIds, ...pendingIds]),
      ];
      onPendingSelectChange(newSelected);
    } else {
      const newSelected = selectedPendingIds.filter(
        (id) => !pendingIds.includes(id)
      );
      onPendingSelectChange(newSelected);
    }
  };

  // Check if all pending indicators in group are selected
  const isAllPendingSelectedInGroup = (labGroup: LabGroup): boolean => {
    const pendingIds = labGroup.indicators
      .filter(
        (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval
      )
      .map((ind) => ind.id);
    if (pendingIds.length === 0) return false;
    return pendingIds.every((id) => selectedPendingIds.includes(id));
  };

  const columns: ColumnsType<QualityManagementIndicatorDto> = [
    {
      title: () => null, // Header will be in Panel
      dataIndex: "checkbox",
      key: "checkbox",
      width: 50,
      render: (_, record) => {
        const isPending =
          record.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval;

        // Pending indicators use selectedPendingIds (for bulk approve/reject)
        if (isPending && !actionsDisabled) {
          return (
            <Checkbox
              checked={selectedPendingIds.includes(record.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  onPendingSelectChange([...selectedPendingIds, record.id]);
                } else {
                  onPendingSelectChange(
                    selectedPendingIds.filter((id) => id !== record.id)
                  );
                }
              }}
            />
          );
        }

        // Approved, Rejected or other status - no checkbox needed
        return null;
      },
    },
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Tên mẫu",
      key: "sample",
      width: 180,
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div>
            <Text strong>{record.sampleCode}</Text>
            {record.sampleName && (
              <Text type="secondary"> - {record.sampleName}</Text>
            )}
          </div>
          {record.specimenTypeName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Loại: {record.specimenTypeName}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Phương pháp",
      dataIndex: "methodName",
      key: "methodName",
      width: 150,
      ellipsis: true,
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      key: "unit",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
      width: 100,
      align: "center" as const,
      render: (text: string) => <Text strong>{text || "-"}</Text>,
    },
    {
      title: "Ngày gửi KQ",
      dataIndex: "resultSentDate",
      key: "resultSentDate",
      width: 110,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Ngày duyệt",
      dataIndex: "approvalDate",
      key: "approvalDate",
      width: 110,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "So với",
      dataIndex: "standardId",
      key: "standardId",
      width: 180,
      render: (standardId: string, record) => {
        // Filter standards that contain this indicator
        const availableStandards = getStandardsForIndicator(record.indicatorId);
        return (
          <Select
            style={{ width: "100%" }}
            placeholder={
              availableStandards.length === 0
                ? "Không có tiêu chuẩn"
                : "Chọn tiêu chuẩn"
            }
            allowClear
            value={standardId}
            onChange={(value) => handleStandardChange(record.id, value)}
            loading={updatingStandard === record.id || loadingStandards}
            disabled={actionsDisabled || availableStandards.length === 0}
            size="small"
          >
            {availableStandards.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Giới hạn",
      dataIndex: "referenceLimit",
      key: "referenceLimit",
      width: 120,
      render: (text: string) => text || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      width: 120,
      render: (status: QualityIndicatorApprovalStatus) =>
        getApprovalStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      fixed: "right" as const,
      align: "center" as const,
      render: (_, record) => {
        const isPending =
          record.approvalStatus ===
          QualityIndicatorApprovalStatus.PendingApproval;
        if (!isPending || actionsDisabled) {
          return null;
        }
        return (
          <Space size="small">
            <Tooltip title="Duyệt">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => onApprove(record.id)}
              >
                Duyệt
              </Button>
            </Tooltip>
            <Tooltip title="Từ chối">
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => onReject(record.id)}
              >
                Từ chối
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Collapse defaultActiveKey={groupedData.map((g) => g.laboratoryId)} ghost>
      {groupedData.map((group) => {
        const approvedCount = group.indicators.filter(
          (ind) =>
            ind.approvalStatus === QualityIndicatorApprovalStatus.Approved
        ).length;
        const pendingCount = group.indicators.filter(
          (ind) =>
            ind.approvalStatus ===
            QualityIndicatorApprovalStatus.PendingApproval
        ).length;

        return (
          <Panel
            key={group.laboratoryId}
            header={
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Checkbox for pending indicators (bulk approve/reject) */}
                {pendingCount > 0 && !actionsDisabled && (
                  <Tooltip title="Chọn tất cả chỉ tiêu chờ duyệt">
                    <Checkbox
                      checked={isAllPendingSelectedInGroup(group)}
                      onChange={(e) =>
                        handleSelectAllPendingInGroup(group, e.target.checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Tooltip>
                )}
                <Text strong>{group.laboratoryName}</Text>
                <Space size="small">
                  <Tag color="blue">{group.indicators.length} chỉ tiêu</Tag>
                  {approvedCount > 0 && (
                    <Tag color="success">{approvedCount} đã duyệt</Tag>
                  )}
                  {pendingCount > 0 && (
                    <Tag color="warning">{pendingCount} chờ duyệt</Tag>
                  )}
                </Space>
              </div>
            }
          >
            <Table
              columns={columns}
              dataSource={group.indicators}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 1400 }}
            />
          </Panel>
        );
      })}
    </Collapse>
  );
};

export default IndicatorTable;
