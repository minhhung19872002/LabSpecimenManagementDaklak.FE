import React from "react";
import { Empty } from "antd";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ContractMonthlyIndicatorDto } from "../../../services/statisticsService";

interface Props {
  indicators: ContractMonthlyIndicatorDto[];
  isMultiMonth: boolean;
}

const MONTH_COLORS = [
  "#1677ff", "#13c2c2", "#52c41a", "#fa8c16", "#722ed1",
  "#eb2f96", "#faad14", "#a0d911", "#08979c", "#c41d7f",
];

const BAR_SIZE = 14;
const CATEGORY_GAP = 4;
const MAX_SCROLL_HEIGHT = 440;
const X_AXIS_HEIGHT = 36;

const ContractIndicatorChart: React.FC<Props> = ({ indicators, isMultiMonth }) => {
  if (indicators.length === 0) {
    return <Empty description="Không có dữ liệu" style={{ padding: 40 }} />;
  }

  const monthKeyMap = new Map<string, string>();
  for (const item of indicators) {
    const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
    const label = `Tháng ${String(item.month).padStart(2, "0")}/${item.year}`;
    monthKeyMap.set(key, label);
  }
  const monthLabels = Array.from(monthKeyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, label]) => label);

  const shouldGroup = isMultiMonth && monthLabels.length > 1;
  // Always render all months — single-month mode uses same color, multi uses different colors
  const visibleMonths = monthLabels;

  // Sort by BE-provided createdAt (ngày tạo phiếu), then requestNumber as tiebreak
  const sorted = [...indicators].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return diff !== 0 ? diff : a.requestNumber.localeCompare(b.requestNumber);
  });

  const pivotMap = new Map<string, Record<string, number | string>>();
  for (const item of sorted) {
    const label = `Tháng ${String(item.month).padStart(2, "0")}/${item.year}`;
    if (!pivotMap.has(item.requestNumber)) {
      const displayLabel = item.contractNumber || item.requestNumber;
      pivotMap.set(item.requestNumber, { requestNumber: item.requestNumber, displayLabel });
    }
    (pivotMap.get(item.requestNumber) as Record<string, number | string>)[label] = item.indicatorCount;
  }

  const chartData = Array.from(pivotMap.values()).reverse();
  const chartBodyHeight = Math.max(200, chartData.length * (BAR_SIZE + CATEGORY_GAP));

  const maxTotal = Math.max(
    1,
    ...chartData.map((row) =>
      visibleMonths.reduce((sum, m) => sum + (((row as Record<string, unknown>)[m] as number) || 0), 0)
    )
  );

  const maxLabelLen = Math.max(...chartData.map((d) => String(d.displayLabel).length));
  const yAxisWidth = Math.min(200, Math.max(100, maxLabelLen * 7));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Scrollable area: bars + sticky axis inside */}
      <div style={{ overflowY: "auto", maxHeight: MAX_SCROLL_HEIGHT }}>
        {/* Main bars chart — no XAxis */}
        <ResponsiveContainer width="100%" height={chartBodyHeight}>
          <BarChart
            layout="vertical"
            data={chartData}
            barCategoryGap={CATEGORY_GAP}
            margin={{ top: 4, right: 24, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" domain={[0, maxTotal]} hide />
            <YAxis
              type="category"
              dataKey="displayLabel"
              width={yAxisWidth}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              formatter={(value) => [`${value} chỉ tiêu`]}
            />
            {visibleMonths.map((label, i) => (
              <Bar
                key={label}
                dataKey={label}
                name={label}
                stackId="stack"
                fill={shouldGroup ? MONTH_COLORS[i % MONTH_COLORS.length] : MONTH_COLORS[0]}
                barSize={BAR_SIZE}
                radius={i === visibleMonths.length - 1 ? [0, 3, 3, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Sticky X-axis — custom HTML, no recharts dependency */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "#fff",
            zIndex: 2,
            paddingLeft: yAxisWidth,
            paddingRight: 24,
            borderTop: "1px solid #f0f0f0",
            height: X_AXIS_HEIGHT,
          }}
        >
          <div style={{ position: "relative", height: "100%" }}>
            {Array.from({ length: 5 }, (_, i) => {
              const value = Math.round((maxTotal * i) / 4);
              const pct = i * 25;
              return (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    top: 6,
                    fontSize: 11,
                    color: "#8c8c8c",
                    transform:
                      i === 0 ? "none" : i === 4 ? "translateX(-100%)" : "translateX(-50%)",
                  }}
                >
                  {value}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend — always visible below chart */}
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16, padding: "6px 0 2px" }}>
        {visibleMonths.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 10, height: 10, borderRadius: 2,
                backgroundColor: shouldGroup ? MONTH_COLORS[i % MONTH_COLORS.length] : MONTH_COLORS[0],
              }}
            />
            <span style={{ fontSize: 12, color: "#595959" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractIndicatorChart;
