import React, { useState } from "react";
import { Typography } from "antd";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import { IndicatorImageDto } from "../../../types/testRequest";
import {
  IndicatorApprovalStatus,
  IndicatorApprovalStatusLabels,
  IndicatorApprovalStatusColors,
} from "../../../types/laboratoryTask";
import { formatDate } from "../../../utils/formatters";
import IndicatorImageCell from "../../../components/common/IndicatorImageCell";
import StatusTag from "../../../components/common/StatusTag";
import { IndicatorName } from "../../../components/common";

const { Text } = Typography;

interface IndicatorCollapsibleCellProps {
  indicators: any[];
  isTestRequestCancelled?: boolean;
}

// Cấu trúc để nhóm parent-child
interface GroupedIndicator {
  indicator: any;
  children: any[];
}

const UNSENT_GROUP_KEY = "__unsent__";

/**
 * Nhóm indicators theo quan hệ cha-con
 * - Parent indicators (parentIndicatorId = null) -> hiển thị trước
 * - Sub-indicators -> hiển thị dưới parent tương ứng
 * - Group key = indicatorId + testMethodId + specimenTypeId để xử lý trường hợp
 *   cùng chỉ tiêu + phương pháp nhưng khác nền mẫu (có giá khác nhau)
 */
const groupByParentChild = (indicators: any[]): GroupedIndicator[] => {
  const result: GroupedIndicator[] = [];
  const parentMap: Record<string, GroupedIndicator> = {};
  const orphanSubs: any[] = [];

  // Helper: tạo key từ indicatorId + testMethodId + specimenTypeId
  const makeKey = (
    indicatorId: string,
    testMethodId: string | null,
    specimenTypeId: string | null,
  ) =>
    `${indicatorId}_${testMethodId || "no-method"}_${specimenTypeId || "no-specimen"}`;

  // Bước 1: Tách parent và sub-indicators
  indicators.forEach((ind) => {
    if (!ind.parentIndicatorId) {
      // Đây là parent indicator - dùng composite key (bao gồm specimenTypeId)
      const key = makeKey(
        ind.indicatorId,
        ind.testMethodId,
        ind.specimenTypeId,
      );
      const grouped: GroupedIndicator = { indicator: ind, children: [] };
      parentMap[key] = grouped;
      result.push(grouped);
    }
  });

  // Bước 2: Gán sub-indicators cho parent có cùng testMethodId VÀ specimenTypeId
  indicators.forEach((ind) => {
    if (ind.parentIndicatorId) {
      // Tìm parent có cùng parentIndicatorId, testMethodId VÀ specimenTypeId
      const key = makeKey(
        ind.parentIndicatorId,
        ind.testMethodId,
        ind.specimenTypeId,
      );
      const parent = parentMap[key];
      if (parent) {
        parent.children.push(ind);
      } else {
        // Parent không có trong list (edge case) -> hiển thị như indicator độc lập
        orphanSubs.push(ind);
      }
    }
  });

  // Bước 3: Thêm orphan subs như là indicators độc lập
  orphanSubs.forEach((ind) => {
    result.push({ indicator: ind, children: [] });
  });

  return result;
};

const IndicatorCollapsibleCell: React.FC<IndicatorCollapsibleCellProps> = ({
  indicators,
  isTestRequestCancelled = false,
}) => {
  // Group indicators by laboratory
  const unsentIndicators = indicators.filter((ind) => !ind.laboratoryId);
  const sentIndicators = indicators.filter((ind) => ind.laboratoryId);
  const groupedByLab: Record<string, { labName: string; indicators: any[] }> =
    {};

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

  // Build all groups (unsent first, then sent)
  const allGroups: { key: string; name: string; indicators: any[] }[] = [];

  if (unsentIndicators.length > 0) {
    allGroups.push({
      key: UNSENT_GROUP_KEY,
      name: "Chưa phân khoa phòng",
      indicators: unsentIndicators,
    });
  }

  Object.entries(groupedByLab).forEach(
    ([labId, { labName, indicators: labIndicators }]) => {
      allGroups.push({
        key: labId,
        name: labName,
        indicators: labIndicators,
      });
    },
  );

  // Initialize with first group expanded by default
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (allGroups.length > 0) {
      return new Set([allGroups[0].key]);
    }
    return new Set();
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const renderIndicator = (
    ind: any,
    idx: number,
    isSubIndicator: boolean = false,
    isLastSub: boolean = false,
    hasChildren: boolean = false,
  ) => {
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

    const indicatorImages: IndicatorImageDto[] = ind.images || [];

    return (
      <div
        key={idx}
        style={{
          marginBottom: 4,
          padding: "8px 12px",
          paddingLeft: isSubIndicator ? 28 : 12,
          background: isSubIndicator ? "#f5f5f5" : "#FAFAFA",
          borderRadius: 8,
          position: "relative",
        }}
      >
        {/* Tree line connector from parent to children */}
        {hasChildren && !isSubIndicator && (
          <div
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              bottom: -4, // Extend down to connect with first child
              width: 1,
              backgroundColor: "#d9d9d9",
            }}
          />
        )}
        {/* Tree line cho sub-indicator */}
        {isSubIndicator && (
          <>
            {/* Vertical line - extends above to connect with previous item's line */}
            <div
              style={{
                position: "absolute",
                left: 8,
                top: -4, // Extend up to cover the marginBottom gap
                bottom: isLastSub ? "50%" : -4, // Extend down for non-last items
                width: 1,
                backgroundColor: "#d9d9d9",
              }}
            />
            {/* Horizontal line */}
            <div
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                width: 12,
                height: 1,
                backgroundColor: "#d9d9d9",
              }}
            />
          </>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <IndicatorName
            name={ind.indicatorName}
            formattedName={ind.indicatorFormattedName}
            style={{ fontSize: 11 }}
          />
          {ind.originalUnitPrice ? (
            <span style={{ fontSize: 11 }}>
              -{" "}
              <span style={{ textDecoration: "line-through", color: "#bbb" }}>
                {ind.originalUnitPrice.toLocaleString("vi-VN")}đ
              </span>{" "}
              <span style={{ color: "#52c41a", fontWeight: 600 }}>0đ</span>
            </span>
          ) : ind.unitPrice > 0 ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              - {ind.unitPrice?.toLocaleString("vi-VN")}đ
            </Text>
          ) : null}
          {isTestRequestCancelled ? (
            <StatusTag
              color="error"
              style={{ fontSize: 10, minWidth: 55 }}
            >
              Hủy bỏ
            </StatusTag>
          ) : hasApprovalStatus && approvalStatusLabel ? (
            <StatusTag
              color={approvalStatusColor || "default"}
              style={{ fontSize: 10, minWidth: 55 }}
            >
              {approvalStatusLabel}
            </StatusTag>
          ) : null}
        </div>
        <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
          {ind.requestDate && (
            <span>YC xong: {formatDate(ind.requestDate)}</span>
          )}
          {ind.requestDate && ind.testDate && (
            <span style={{ margin: "0 4px" }}>|</span>
          )}
          {ind.testDate && <span>Ngày TN: {formatDate(ind.testDate)}</span>}
        </div>
        {indicatorImages.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <IndicatorImageCell
              images={indicatorImages}
              canUpload={false}
              maxImages={5}
            />
          </div>
        )}
      </div>
    );
  };

  // Render một nhóm parent-child
  const renderGroupedIndicator = (grouped: GroupedIndicator, idx: number) => {
    const hasChildren = grouped.children.length > 0;
    return (
      <div key={idx}>
        {/* Parent indicator */}
        {renderIndicator(grouped.indicator, idx, false, false, hasChildren)}
        {/* Sub-indicators */}
        {grouped.children.map((child, childIdx) =>
          renderIndicator(
            child,
            `${idx}-${childIdx}` as any,
            true,
            childIdx === grouped.children.length - 1,
            false,
          ),
        )}
      </div>
    );
  };

  return (
    <div style={{ maxHeight: 300, overflowY: "auto" }}>
      {allGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.key);
        const isUnsent = group.key === UNSENT_GROUP_KEY;

        return (
          <div key={group.key} style={{ marginBottom: 8 }}>
            {/* Group header - clickable */}
            <div
              onClick={() => toggleGroup(group.key)}
              style={{
                padding: "6px 10px",
                fontWeight: 400,
                fontSize: 12,
                color: isUnsent ? "#faad14" : "#000",
                background: isUnsent ? "#fffbe6" : "#F5F5F5",
                borderRadius: 8,
                marginBottom: isExpanded ? 4 : 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: isUnsent ? "1px solid #ffe58f" : "none",
              }}
            >
              <span>
                {group.name} ({group.indicators.length})
              </span>
              {isExpanded ? (
                <UpOutlined style={{ fontSize: 10 }} />
              ) : (
                <DownOutlined style={{ fontSize: 10 }} />
              )}
            </div>
            {/* Group content - collapsible */}
            {isExpanded && (
              <div style={{ paddingLeft: 8 }}>
                {groupByParentChild(group.indicators).map((grouped, idx) =>
                  renderGroupedIndicator(grouped, idx),
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default IndicatorCollapsibleCell;
