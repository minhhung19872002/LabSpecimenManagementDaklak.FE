import React, { useState, useEffect } from "react";
import { Table, Input, Tag, Button, Typography, Tooltip, Space } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  TestingIndicatorDto,
  SaveIndicatorResultDto,
} from "../../../types/testing";
import {
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
} from "../../../types/laboratoryTask";

const { Text } = Typography;

interface IndicatorEditTableProps {
  indicators: TestingIndicatorDto[];
  onResultsChange: (results: SaveIndicatorResultDto[]) => void;
  onShowRejectionHistory: (indicatorId: string, indicatorName: string) => void;
  onSaveIndicator: (indicatorId: string) => void;
  onSubmitForApproval: (indicatorId: string) => void;
  submitting?: boolean;
}

const IndicatorEditTable: React.FC<IndicatorEditTableProps> = ({
  indicators,
  onResultsChange,
  onShowRejectionHistory,
  onSaveIndicator,
  onSubmitForApproval,
  submitting = false,
}) => {
  const [editedResults, setEditedResults] = useState<
    Map<string, SaveIndicatorResultDto>
  >(new Map());

  // Track indicator IDs to detect actual changes
  const indicatorIds = indicators.map((ind) => ind.id).join(",");

  // Initialize edited results from indicators - only when indicator list changes
  useEffect(() => {
    const initialResults = new Map<string, SaveIndicatorResultDto>();
    indicators.forEach((ind) => {
      initialResults.set(ind.id, {
        indicatorId: ind.id,
        methodId: ind.methodId,
        unit: ind.unit,
        result: ind.result,
      });
    });
    setEditedResults(initialResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorIds]);

  const handleFieldChange = (
    indicatorId: string,
    field: keyof SaveIndicatorResultDto,
    value: string | undefined
  ) => {
    const newResults = new Map(editedResults);
    const current = newResults.get(indicatorId) || {
      indicatorId,
      methodId: undefined,
      unit: undefined,
      result: undefined,
    };
    newResults.set(indicatorId, { ...current, [field]: value });
    setEditedResults(newResults);

    // Notify parent of changes
    onResultsChange(Array.from(newResults.values()));
  };

  const getApprovalStatusTag = (status: IndicatorApprovalStatus) => {
    const label = IndicatorApprovalStatusLabels[status];
    const color = IndicatorApprovalStatusColors[status];

    const iconMap: Record<IndicatorApprovalStatus, React.ReactNode> = {
      [IndicatorApprovalStatus.Pending]: <ClockCircleOutlined />,
      [IndicatorApprovalStatus.Entered]: <SyncOutlined />,
      [IndicatorApprovalStatus.Approved]: <CheckCircleOutlined />,
      [IndicatorApprovalStatus.Rejected]: <CloseCircleOutlined />,
    };

    return (
      <Tag color={color} icon={iconMap[status]}>
        {label}
      </Tag>
    );
  };

  const columns: ColumnsType<TestingIndicatorDto> = [
    {
      title: "Tên chỉ tiêu",
      dataIndex: "indicatorName",
      key: "indicatorName",
      width: 200,
      fixed: "left" as const,
      render: (value: string) => value || "-",
    },
    {
      title: "Phương pháp",
      dataIndex: "methodName",
      key: "method",
      width: 180,
      render: (value: string) => value || <Text type="secondary">-</Text>,
    },
    {
      title: "ĐVT",
      key: "unit",
      width: 150,
      render: (_, record) => {
        const currentValue =
          editedResults.get(record.id)?.unit ?? record.unit ?? "";
        // Disable if: no edit permission OR already submitted (Entered) OR approved
        const isDisabled =
          !record.canEdit ||
          record.approvalStatus === IndicatorApprovalStatus.Entered ||
          record.approvalStatus === IndicatorApprovalStatus.Approved;

        return (
          <Input
            value={currentValue}
            onChange={(e) =>
              handleFieldChange(record.id, "unit", e.target.value)
            }
            onBlur={() => onSaveIndicator(record.id)}
            disabled={isDisabled}
            placeholder="-"
          />
        );
      },
    },
    {
      title: "Kết quả",
      key: "result",
      width: 200,
      render: (_, record) => {
        const currentValue =
          editedResults.get(record.id)?.result ?? record.result ?? "";
        // Disable if: no edit permission OR already submitted (Entered) OR approved
        const isDisabled =
          !record.canEdit ||
          record.approvalStatus === IndicatorApprovalStatus.Entered ||
          record.approvalStatus === IndicatorApprovalStatus.Approved;

        return (
          <Input
            value={currentValue}
            onChange={(e) =>
              handleFieldChange(record.id, "result", e.target.value)
            }
            onBlur={() => onSaveIndicator(record.id)}
            disabled={isDisabled}
            placeholder="Nhập KQ"
          />
        );
      },
    },
    {
      title: "Ngày nhập",
      dataIndex: "entryDate",
      key: "entryDate",
      width: 100,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Ngày giao việc",
      dataIndex: "assignedDate",
      key: "assignedDate",
      width: 130,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Ngày hoàn thành",
      dataIndex: "completionDate",
      key: "completionDate",
      width: 150,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Lý do từ chối",
      key: "rejectionReason",
      width: 180,
      render: (_, record) => {
        const hasHistory = record.rejectionHistoryCount > 0;
        const latestReason = record.latestRejectionReason;

        if (!hasHistory && !latestReason) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            {latestReason && (
              <Tooltip title={latestReason}>
                <Text
                  type="danger"
                  ellipsis
                  style={{ maxWidth: 150, display: "block" }}
                >
                  {latestReason}
                </Text>
              </Tooltip>
            )}
            {hasHistory && (
              <Button
                type="link"
                size="small"
                icon={<HistoryOutlined />}
                onClick={() =>
                  onShowRejectionHistory(record.id, record.indicatorName || "")
                }
                style={{ padding: 0, height: "auto" }}
              >
                Xem lịch sử ({record.rejectionHistoryCount})
              </Button>
            )}
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_, record) => {
        const canEditRow =
          record.canEdit &&
          record.approvalStatus !== IndicatorApprovalStatus.Entered &&
          record.approvalStatus !== IndicatorApprovalStatus.Approved;

        // If approved - show tag
        if (record.approvalStatus === IndicatorApprovalStatus.Approved) {
          return (
            <Tag color="success">
              <CheckCircleOutlined /> Đã duyệt
            </Tag>
          );
        }

        // If submitted (Entered) - show waiting tag
        if (record.approvalStatus === IndicatorApprovalStatus.Entered) {
          return (
            <Tag color="warning">
              <ClockCircleOutlined /> Chờ duyệt
            </Tag>
          );
        }

        // Editable row - show submit button only
        return (
          <Button
            type="primary"
            size="small"
            loading={submitting}
            onClick={() => onSubmitForApproval(record.id)}
            disabled={!canEditRow}
          >
            Gửi duyệt
          </Button>
        );
      },
    },
  ];

  // Sort indicators theo id để cố định vị trí
  const sortedIndicators = [...indicators].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  return (
    <div>
      <Table
        columns={columns}
        dataSource={sortedIndicators}
        rowKey="id"
        pagination={false}
        scroll={{ x: 1500 }}
        size="small"
      />
    </div>
  );
};

export default IndicatorEditTable;
