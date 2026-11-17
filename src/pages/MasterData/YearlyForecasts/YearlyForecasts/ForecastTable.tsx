import React from "react";
import { Input, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { NumericFormat } from "react-number-format";
import { IndicatorName } from "../../../../components/common";
import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";
import ForecastCalculation from "./ForecastCalculation";
import { formatSamples } from "./utils";

export interface ForecastTableProps {
  rows: YearlyForecastRowDto[];
  year: number;
  readOnly: boolean;
  drafts: Record<string, number | null>;
  onValueChange: (testMethodIndicatorId: string, value: number | null) => void;
}

/** Bảng dự toán các dịch vụ của 1 phương pháp */
const ForecastTable: React.FC<ForecastTableProps> = ({ rows, year, readOnly, drafts, onValueChange }) => {
  const valueOf = (row: YearlyForecastRowDto) =>
    row.testMethodIndicatorId in drafts ? drafts[row.testMethodIndicatorId] : row.estimatedSamples;

  const columns: ColumnsType<YearlyForecastRowDto> = [
    { title: "Mã DV", dataIndex: "serviceCode", key: "serviceCode", width: 110, render: (v) => v || "—" },
    {
      title: "Dịch vụ",
      key: "service",
      render: (_, r) => (
        <span>
          <IndicatorName name={r.indicatorName} formattedName={r.indicatorFormattedName ?? undefined} />
          <span style={{ color: "#8c8c8c" }}> · {r.specimenTypeName || "Mọi nền mẫu"}</span>
        </span>
      ),
    },
    {
      title: `Năm ${year - 1}`,
      dataIndex: "previousYearSamples",
      key: "previous",
      width: 110,
      align: "right",
      render: (v) => formatSamples(v),
    },
    {
      title: `Dự toán ${year} (mẫu)`,
      key: "estimated",
      width: 170,
      align: "right",
      render: (_, r) => {
        const value = valueOf(r);
        if (readOnly) return formatSamples(value);
        const dirty = r.testMethodIndicatorId in drafts;
        return (
          <NumericFormat
            value={value ?? ""}
            onValueChange={(values) => onValueChange(r.testMethodIndicatorId, values.floatValue ?? null)}
            allowNegative={false}
            decimalScale={0}
            thousandSeparator="."
            decimalSeparator=","
            customInput={Input}
            size="small"
            style={{ width: "100%", textAlign: "right", background: dirty ? "#fffbe6" : undefined }}
            placeholder="Nhập số mẫu"
          />
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_, r) => {
        const value = valueOf(r);
        return value && value > 0 ? <Tag color="green">Đã có</Tag> : <Tag color="red">Thiếu dự toán</Tag>;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={rows}
      rowKey="testMethodIndicatorId"
      size="small"
      pagination={false}
      expandable={{
        columnTitle: "Tính toán",
        columnWidth: 80,
        expandedRowRender: (r) => <ForecastCalculation row={r} year={year} estimatedSamples={valueOf(r)} />,
      }}
    />
  );
};

export default ForecastTable;
