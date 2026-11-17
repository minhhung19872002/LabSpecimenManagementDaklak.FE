import React from "react";
import { Button, Input, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { NumericFormat } from "react-number-format";
import { IndicatorName } from "../../../../components/common";
import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";
import { formatSamples, type ForecastMethodGroup } from "./utils";

type ForecastTableRow =
  | { kind: "group"; key: string; group: ForecastMethodGroup; children: ForecastTableRow[] }
  | { kind: "service"; key: string; row: YearlyForecastRowDto };

const GROUP_BG = "#f5f7fa";

export interface ForecastTableProps {
  groups: ForecastMethodGroup[];
  year: number;
  readOnly: boolean;
  loading: boolean;
  drafts: Record<string, number | null>;
  /** testMethodId của các nhóm đang mở */
  expandedKeys: string[];
  onExpandedKeysChange: (keys: string[]) => void;
  onValueChange: (testMethodIndicatorId: string, value: number | null) => void;
  onViewCalculation: (testMethodIndicatorId: string) => void;
}

/** 1 bảng duy nhất: dòng nhóm = phương pháp (tổng mẫu), dòng con = dịch vụ */
const ForecastTable: React.FC<ForecastTableProps> = ({
  groups,
  year,
  readOnly,
  loading,
  drafts,
  expandedKeys,
  onExpandedKeysChange,
  onValueChange,
  onViewCalculation,
}) => {
  const dataSource: ForecastTableRow[] = groups.map((g) => ({
    kind: "group",
    key: g.testMethodId,
    group: g,
    children: g.rows.map((r) => ({ kind: "service", key: r.testMethodIndicatorId, row: r })),
  }));

  const valueOf = (row: YearlyForecastRowDto) =>
    row.testMethodIndicatorId in drafts ? drafts[row.testMethodIndicatorId] : row.estimatedSamples;

  const groupCell = (r: ForecastTableRow, colSpan?: number) =>
    r.kind === "group" ? { colSpan, style: { background: GROUP_BG } } : {};

  const columns: ColumnsType<ForecastTableRow> = [
    {
      title: "Mã DV",
      key: "serviceCode",
      width: 260,
      onCell: (r) => groupCell(r, 2),
      render: (_, r) =>
        r.kind === "group" ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <b>{r.group.testMethodName}</b>
            <Tag style={{ margin: 0 }}>{r.group.testMethodCode}</Tag>
            <span style={{ color: "#8c8c8c", fontSize: 13 }}>{r.group.rows.length} dịch vụ</span>
            {r.group.missingCount > 0 && (
              <Tag color="red" style={{ margin: 0 }}>
                {r.group.missingCount} thiếu dự toán
              </Tag>
            )}
          </span>
        ) : (
          r.row.serviceCode || "—"
        ),
    },
    {
      title: "Dịch vụ",
      key: "service",
      onCell: (r) => groupCell(r, 0),
      render: (_, r) =>
        r.kind === "service" && (
          <span>
            <IndicatorName name={r.row.indicatorName} formattedName={r.row.indicatorFormattedName ?? undefined} />
            <span style={{ color: "#8c8c8c" }}> · {r.row.specimenTypeName || "Mọi nền mẫu"}</span>
          </span>
        ),
    },
    {
      title: `Năm ${year - 1}`,
      key: "previous",
      width: 120,
      align: "right",
      onCell: (r) => groupCell(r),
      render: (_, r) =>
        r.kind === "group" ? (
          <span style={{ color: "#8c8c8c" }}>
            {r.group.previousTotal > 0 ? formatSamples(r.group.previousTotal) : "—"}
          </span>
        ) : (
          formatSamples(r.row.previousYearSamples)
        ),
    },
    {
      title: `Dự toán ${year} (mẫu)`,
      key: "estimated",
      width: 180,
      align: "right",
      onCell: (r) => groupCell(r),
      render: (_, r) => {
        if (r.kind === "group") return <b>Tổng {formatSamples(r.group.estimatedTotal)} mẫu</b>;
        const value = valueOf(r.row);
        if (readOnly) return formatSamples(value);
        const id = r.row.testMethodIndicatorId;
        return (
          <NumericFormat
            value={value ?? ""}
            onValueChange={(values) => onValueChange(id, values.floatValue ?? null)}
            allowNegative={false}
            decimalScale={0}
            thousandSeparator="."
            decimalSeparator=","
            customInput={Input}
            size="small"
            status={!value || value <= 0 ? "error" : undefined}
            style={{ width: "100%", textAlign: "right", background: id in drafts ? "#fffbe6" : undefined }}
            placeholder="Nhập số mẫu"
          />
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      onCell: (r) => groupCell(r),
      render: (_, r) => {
        if (r.kind === "group") return null;
        const value = valueOf(r.row);
        return value && value > 0 ? (
          <Tag color="green">Đủ điều kiện</Tag>
        ) : (
          <Tag color="red">Thiếu dự toán</Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      onCell: (r) => groupCell(r),
      render: (_, r) =>
        r.kind === "service" && (
          <Button
            type="link"
            size="small"
            style={{ paddingInline: 0 }}
            onClick={() => onViewCalculation(r.row.testMethodIndicatorId)}
          >
            Xem tính toán
          </Button>
        ),
    },
  ];

  return (
    <Table<ForecastTableRow>
      columns={columns}
      dataSource={dataSource}
      rowKey="key"
      size="small"
      bordered
      loading={loading}
      pagination={false}
      scroll={{ x: 900 }}
      expandable={{
        indentSize: 0,
        expandedRowKeys: expandedKeys,
        onExpandedRowsChange: (keys) => onExpandedKeysChange(keys as string[]),
      }}
      locale={{ emptyText: "Không có dịch vụ nào (cần khai báo định mức theo mẻ cho phương pháp trước)" }}
    />
  );
};

export default ForecastTable;
