import React from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Collapse,
  Tooltip,
  Checkbox,
  Typography,
  Card,
} from "antd";
import StatusTag from "../../../components/common/StatusTag";
import { CheckOutlined, CloseOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "../../../utils/formatters";
import {
  QualityManagementIndicatorDto,
  QualityIndicatorApprovalStatus,
  QualityIndicatorApprovalStatusLabels,
  QualityIndicatorApprovalStatusColors,
  QualityManagementStatus,
} from "../../../types/qualityManagement";
import IndicatorImageCell from "../../../components/common/IndicatorImageCell";
import { IndicatorName } from "../../../components/common";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

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

// Group indicators by sample
interface SampleGroup {
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  specimenTypeName: string;
  indicators: QualityManagementIndicatorDto[];
}

const IndicatorTable: React.FC<IndicatorTableProps> = ({
  indicators,
  taskStatus: _taskStatus,
  onApprove,
  onReject,
  onIndicatorUpdate: _onIndicatorUpdate,
  selectedPendingIds,
  onPendingSelectChange,
}) => {
  const getApprovalStatusTag = (status: QualityIndicatorApprovalStatus) => (
    <StatusTag color={QualityIndicatorApprovalStatusColors[status]}>
      {QualityIndicatorApprovalStatusLabels[status]}
    </StatusTag>
  );

  // Check permissions
  const canApprove = authService.hasPermission(PERMISSIONS.TestResults.Approve);
  const canReject = authService.hasPermission(PERMISSIONS.TestResults.Reject);

  // Check if actions should be disabled based on task status and permissions
  // Allow approving pending indicators even after ResultSent (for partial send scenarios)
  const actionsDisabled = !canApprove && !canReject;

  // Group indicators by sample
  const groupedData: SampleGroup[] = React.useMemo(() => {
    const groups: Record<string, SampleGroup> = {};
    indicators.forEach((ind) => {
      const key = ind.sampleId;
      if (!groups[key]) {
        groups[key] = {
          sampleId: key,
          sampleCode: ind.sampleCode || "",
          sampleName: ind.sampleName || "",
          specimenTypeName: ind.specimenTypeName || "",
          indicators: [],
        };
      }
      groups[key].indicators.push(ind);
    });
    return Object.values(groups);
  }, [indicators]);

  // Handle select all PENDING in a sample group (for bulk approve/reject)
  const handleSelectAllPendingInGroup = (
    group: SampleGroup,
    checked: boolean,
  ) => {
    const pendingIds = group.indicators
      .filter(
        (ind) =>
          ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval,
      )
      .map((ind) => ind.id);

    if (checked) {
      const newSelected = [...new Set([...selectedPendingIds, ...pendingIds])];
      onPendingSelectChange(newSelected);
    } else {
      const newSelected = selectedPendingIds.filter(
        (id) => !pendingIds.includes(id),
      );
      onPendingSelectChange(newSelected);
    }
  };

  // Check if all pending indicators in group are selected
  const isAllPendingSelectedInGroup = (group: SampleGroup): boolean => {
    const pendingIds = group.indicators
      .filter(
        (ind) =>
          ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval,
      )
      .map((ind) => ind.id);
    if (pendingIds.length === 0) return false;
    return pendingIds.every((id) => selectedPendingIds.includes(id));
  };

  // Generate columns based on whether group has pending indicators
  const getColumns = (
    hasPendingIndicators: boolean,
  ): ColumnsType<QualityManagementIndicatorDto> => {
    const cols: ColumnsType<QualityManagementIndicatorDto> = [];

    // Only show checkbox column if there are pending indicators
    if (hasPendingIndicators && !actionsDisabled) {
      cols.push({
        title: () => null,
        dataIndex: "checkbox",
        key: "checkbox",
        width: 50,
        render: (_, record) => {
          const isPending =
            record.approvalStatus ===
            QualityIndicatorApprovalStatus.PendingApproval;

          if (isPending) {
            return (
              <Checkbox
                checked={selectedPendingIds.includes(record.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onPendingSelectChange([...selectedPendingIds, record.id]);
                  } else {
                    onPendingSelectChange(
                      selectedPendingIds.filter((id) => id !== record.id),
                    );
                  }
                }}
              />
            );
          }
          return null;
        },
      });
    }

    // Base columns
    cols.push(
      {
        title: "Tên chỉ tiêu",
        dataIndex: "indicatorName",
        key: "indicatorName",
        width: 200,
        ellipsis: true,
        render: (value: string, record) =>
          value ? (
            <IndicatorName
              name={value}
              formattedName={record.indicatorFormattedName}
            />
          ) : (
            "-"
          ),
      },
      {
        title: "Phương pháp",
        dataIndex: "methodName",
        key: "methodName",
        width: 150,
        ellipsis: true,
        render: (value: string, record) =>
          value ? (
            <IndicatorName
              name={value}
              formattedName={record.methodFormattedName}
            />
          ) : (
            "-"
          ),
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
        title: "Hình ảnh",
        key: "images",
        width: 120,
        render: (_, record) => {
          return (
            <IndicatorImageCell
              images={record.images || []}
              canUpload={false}
              maxImages={5}
            />
          );
        },
      },
      {
        title: "Ngày gửi KQ",
        dataIndex: "resultSentDate",
        key: "resultSentDate",
        width: 110,
        render: (date: string) => formatDate(date),
      },
      {
        title: "Ngày duyệt",
        dataIndex: "approvalDate",
        key: "approvalDate",
        width: 110,
        render: (date: string) => formatDate(date),
      },
      {
        title: "So với",
        dataIndex: "standardName",
        key: "standardName",
        width: 150,
        ellipsis: true,
        render: (text: string) => text || "-",
      },
      {
        title: "Giới hạn",
        key: "limit",
        width: 120,
        render: (_, record) => {
          if (record.comparisonOperator && record.allowedLimit) {
            return `${record.comparisonOperator} ${record.allowedLimit}`;
          }
          return record.referenceLimit || "-";
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "approvalStatus",
        key: "approvalStatus",
        width: 120,
        render: (status: QualityIndicatorApprovalStatus) =>
          getApprovalStatusTag(status),
      },
    );

    // Only show actions column if there are pending indicators
    if (hasPendingIndicators && !actionsDisabled) {
      cols.push({
        title: "Thao tác",
        key: "actions",
        width: 180,
        fixed: "right" as const,
        align: "center" as const,
        render: (_, record) => {
          const isPending =
            record.approvalStatus ===
            QualityIndicatorApprovalStatus.PendingApproval;
          if (!isPending) {
            return null;
          }
          return (
            <Space size="small">
              {canApprove && (
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
              )}
              {canReject && (
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
              )}
            </Space>
          );
        },
      });
    }

    return cols;
  };

  return (
    <Collapse defaultActiveKey={groupedData.map((g) => g.sampleId)} ghost>
      {groupedData.map((group) => {
        const approvedCount = group.indicators.filter(
          (ind) =>
            ind.approvalStatus === QualityIndicatorApprovalStatus.Approved,
        ).length;
        const pendingCount = group.indicators.filter(
          (ind) =>
            ind.approvalStatus ===
            QualityIndicatorApprovalStatus.PendingApproval,
        ).length;

        // Build sample display name
        const sampleDisplayName = group.sampleName
          ? `${group.sampleCode} - ${group.sampleName}`
          : group.sampleCode;

        return (
          <Panel
            key={group.sampleId}
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
                <Text strong>{sampleDisplayName}</Text>
                {group.specimenTypeName && (
                  <Text type="secondary">({group.specimenTypeName})</Text>
                )}
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
            <Card
              size="small"
              style={{ margin: 0, boxShadow: "none", overflow: "hidden" }}
              bodyStyle={{ padding: 0 }}
            >
              <Table
                columns={getColumns(pendingCount > 0)}
                dataSource={group.indicators}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 1320 }}
              />
            </Card>
          </Panel>
        );
      })}
    </Collapse>
  );
};

export default IndicatorTable;
