import React from "react";
import { Alert, Collapse, Empty, Space, Spin, Tag, Typography } from "antd";
import ForecastToolbar, { type ForecastToolbarProps } from "./ForecastToolbar";
import ForecastTable from "./ForecastTable";
import type { ForecastMethodGroup } from "./utils";

export interface YearlyForecastsViewProps extends ForecastToolbarProps {
  groups: ForecastMethodGroup[];
  missingCount: number;
  totalCount: number;
  drafts: Record<string, number | null>;
  activeGroupKeys: string[];
  onActiveGroupKeysChange: (keys: string[]) => void;
  onValueChange: (testMethodIndicatorId: string, value: number | null) => void;
}

/** L4 — Dự toán mẫu hàng năm */
const YearlyForecastsView: React.FC<YearlyForecastsViewProps> = ({
  groups,
  missingCount,
  totalCount,
  drafts,
  activeGroupKeys,
  onActiveGroupKeysChange,
  onValueChange,
  ...toolbarProps
}) => {
  const { year, isLocked, canEdit, loading } = toolbarProps;
  return (
    <div style={{ padding: 16 }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        Tổng số mẫu dự kiến trong năm cho từng dịch vụ — mẫu số để chia chi phí 1 Mẻ thành 1 Phép thử. Danh sách tự
        sinh từ các phương pháp đã có định mức theo mẻ.
      </Typography.Paragraph>
      <ForecastToolbar {...toolbarProps} />

      {isLocked ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={`Năm ${year} đã khóa — chỉ xem (sau 31/12, bản ghi năm cũ chuyển Read-Only).`}
        />
      ) : (
        missingCount > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message={`Còn ${missingCount}/${totalCount} dịch vụ chưa có dự toán năm ${year}`}
            description="Dịch vụ thiếu dự toán sẽ hiện popup “cần thiết lập tiêu hao” khi chấp nhận thử nghiệm và không trừ kho khi trả kết quả."
          />
        )
      )}

      <Spin spinning={loading}>
        {groups.length === 0 ? (
          <Empty description="Không có dịch vụ nào (cần khai báo định mức theo mẻ cho phương pháp trước)" />
        ) : (
          <Collapse
            activeKey={activeGroupKeys}
            onChange={(keys) => onActiveGroupKeysChange(keys as string[])}
            items={groups.map((g) => ({
              key: g.testMethodId,
              label: (
                <Space>
                  <b>{g.testMethodCode}</b>
                  <span>{g.testMethodName}</span>
                  <Tag>{g.rows.length} dịch vụ</Tag>
                  {g.missingCount > 0 && <Tag color="red">Thiếu {g.missingCount}</Tag>}
                </Space>
              ),
              children: (
                <ForecastTable
                  rows={g.rows}
                  year={year}
                  readOnly={isLocked || !canEdit}
                  drafts={drafts}
                  onValueChange={onValueChange}
                />
              ),
            }))}
          />
        )}
      </Spin>

      <Typography.Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
        • Sau 31/12, bản ghi năm cũ chuyển Read-Only. • Đầu năm: Clone dữ liệu năm cũ sang năm mới (chỉ điền dòng còn
        trống) → sửa lại số mẫu dự toán. • [Mã DV + Năm] — 1 dịch vụ / 1 năm chỉ có 1 dự toán. • Tiêu hao / mẫu lấy
        theo năm của ngày trả kết quả.
      </Typography.Paragraph>
    </div>
  );
};

export default YearlyForecastsView;
