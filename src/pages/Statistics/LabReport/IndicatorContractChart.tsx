import React, { useRef, useEffect } from "react";
import { Empty } from "antd";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { IndicatorContractCountDto } from "../../../services/statisticsService";

export interface IndicatorContractChartProps {
  data: IndicatorContractCountDto[];
  isMultiMonth: boolean;
}

const MONTH_COLORS = [
  "#1677ff", "#13c2c2", "#52c41a", "#fa8c16", "#722ed1",
  "#eb2f96", "#faad14", "#a0d911", "#08979c", "#c41d7f",
];

const BAR_SIZE = 14;
const CATEGORY_GAP = 4;
const BAR_SLOT = 22;
const Y_AXIS_WIDTH = 200;
const MAX_SCROLL_HEIGHT = 440;
const X_AXIS_HEIGHT = 36;

// ── Canvas-based text measurement for pixel-accurate truncation ──────────────
let _canvasCtx: CanvasRenderingContext2D | null = null;
function getCanvasCtx(): CanvasRenderingContext2D | null {
  if (!_canvasCtx) {
    try {
      const canvas = document.createElement("canvas");
      _canvasCtx = canvas.getContext("2d");
      if (_canvasCtx) _canvasCtx.font = "11px Arial, sans-serif";
    } catch {
      /* no-op */
    }
  }
  return _canvasCtx;
}

function truncateLabel(text: string, maxPx: number): string {
  const ctx = getCanvasCtx();
  const measure = (s: string) => ctx ? ctx.measureText(s).width : s.length * 6.5;
  if (measure(text) <= maxPx) return text;
  const ellipsis = "…";
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (measure(text.slice(0, mid) + ellipsis) <= maxPx) lo = mid;
    else hi = mid - 1;
  }
  return lo === 0 ? ellipsis : text.slice(0, lo) + ellipsis;
}

// ── Custom Y-axis tick ────────────────────────────────────────────────────────
const YAxisTick = ({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) => {
  const full = String(payload?.value ?? "");
  // x is the right edge of the Y-axis area; leave 8px gap before bars
  const display = truncateLabel(full, (x ?? 0) - 8);
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="#595959">
      <title>{full}</title>
      {display}
    </text>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const IndicatorContractChart: React.FC<IndicatorContractChartProps> = ({ data, isMultiMonth }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top whenever data changes (e.g. filter month switch)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [data]);

  if (data.length === 0) {
    return <Empty description="Không có dữ liệu" style={{ padding: 40 }} />;
  }

  const monthKeyMap = new Map<string, string>();
  for (const item of data) {
    const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
    const label = `Tháng ${String(item.month).padStart(2, "0")}/${item.year}`;
    monthKeyMap.set(key, label);
  }
  const monthLabels = Array.from(monthKeyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, label]) => label);

  const shouldGroup = isMultiMonth && monthLabels.length > 1;

  // Pivot: indicatorName → { monthLabel: contractCount }
  const pivotMap = new Map<string, Record<string, number | string>>();
  for (const item of data) {
    const monthLabel = `Tháng ${String(item.month).padStart(2, "0")}/${item.year}`;
    if (!pivotMap.has(item.indicatorName)) {
      pivotMap.set(item.indicatorName, { indicatorName: item.indicatorName });
    }
    (pivotMap.get(item.indicatorName) as Record<string, number | string>)[monthLabel] = item.contractCount;
  }

  // Sort ascending by total so highest count renders at top (chart flips vertical)
  const chartData = Array.from(pivotMap.values()).sort((a, b) => {
    const ta = monthLabels.reduce((s, m) => s + (((a as Record<string, unknown>)[m] as number) || 0), 0);
    const tb = monthLabels.reduce((s, m) => s + (((b as Record<string, unknown>)[m] as number) || 0), 0);
    return ta - tb;
  });

  const chartBodyHeight = chartData.length * BAR_SLOT;

  const maxTotal = Math.max(
    1,
    ...chartData.map((row) =>
      monthLabels.reduce((s, m) => s + (((row as Record<string, unknown>)[m] as number) || 0), 0)
    )
  );

  // Deduplicated integer ticks — avoids "0 0 1 1 1" when maxTotal is small
  const ticks = [...new Set([0, 1, 2, 3, 4].map((i) => Math.round((maxTotal * i) / 4)))];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div ref={scrollRef} style={{ overflowY: "auto", flex: 1, minHeight: 0, maxHeight: MAX_SCROLL_HEIGHT }}>
        {/* key forces ResponsiveContainer remount when row count changes → avoids blank chart on filter switch */}
        <ResponsiveContainer key={chartData.length} width="100%" height={chartBodyHeight}>
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
              dataKey="indicatorName"
              width={Y_AXIS_WIDTH}
              tick={<YAxisTick />}
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              formatter={(value) => [`${value} hợp đồng`]}
            />
            {monthLabels.map((label, i) => (
              <Bar
                key={label}
                dataKey={label}
                name={label}
                stackId="stack"
                fill={shouldGroup ? MONTH_COLORS[i % MONTH_COLORS.length] : MONTH_COLORS[0]}
                barSize={BAR_SIZE}
                radius={i === monthLabels.length - 1 ? [0, 3, 3, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Sticky X-axis with deduplicated integer ticks */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "#fff",
            zIndex: 2,
            paddingLeft: Y_AXIS_WIDTH,
            paddingRight: 24,
            borderTop: "1px solid #f0f0f0",
            height: X_AXIS_HEIGHT,
          }}
        >
          <div style={{ position: "relative", height: "100%" }}>
            {ticks.map((value) => {
              const pct = maxTotal === 0 ? 0 : (value / maxTotal) * 100;
              return (
                <span
                  key={value}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    top: 6,
                    fontSize: 11,
                    color: "#8c8c8c",
                    transform:
                      pct === 0 ? "none" : pct === 100 ? "translateX(-100%)" : "translateX(-50%)",
                  }}
                >
                  {value}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16, padding: "6px 0 2px" }}>
        {monthLabels.map((label, i) => (
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

export default IndicatorContractChart;
