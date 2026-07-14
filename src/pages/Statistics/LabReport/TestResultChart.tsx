import React from "react";
import { Empty } from "antd";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Dayjs } from "dayjs";

interface Props {
  passCount: number;
  failCount: number;
  dateRange: [Dayjs, Dayjs];
}

const COLOR_PASS = "#1677ff";
const COLOR_FAIL = "#ff4d4f";

const TestResultChart: React.FC<Props> = ({ passCount, failCount, dateRange }) => {
  const total = passCount + failCount;
  const rangeLabel = `${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}`;

  const data = [
    { name: "Đạt", value: passCount, color: COLOR_PASS },
    { name: "Không đạt", value: failCount, color: COLOR_FAIL },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#595959", fontSize: 13 }}>
          <span style={{ fontSize: 16 }}>⏱</span>
          <span style={{ fontWeight: 500 }}>Kết quả thử nghiệm</span>
        </div>
        <span
          style={{
            fontSize: 12,
            color: "#1677ff",
            border: "1px solid #1677ff",
            borderRadius: 4,
            padding: "2px 8px",
          }}
        >
          {rangeLabel}
        </span>
      </div>

      {/* Legend + total */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 16 }}>
          {data.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: d.color }} />
              <span style={{ fontSize: 12, color: "#595959" }}>{d.name}</span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#595959" }}>
          Tổng số chỉ tiêu: <strong>{total.toLocaleString()}</strong>
        </span>
      </div>

      {/* Chart */}
      {total === 0 ? (
        <Empty description="Không có dữ liệu" style={{ padding: 40 }} />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={85}
              outerRadius={120}
              dataKey="value"
              label={({ cx = 0, cy = 0, midAngle = 0, outerRadius: or = 0, value = 0 }) => {
                if (!value) return null;
                const RADIAN = Math.PI / 180;
                const r = or + 20;
                const x = cx + r * Math.cos(-midAngle * RADIAN);
                const y = cy + r * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#595959">
                    {Number(value).toLocaleString()}
                  </text>
                );
              }}
              labelLine={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${Number(value).toLocaleString()} chỉ tiêu`, String(name)]} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TestResultChart;
