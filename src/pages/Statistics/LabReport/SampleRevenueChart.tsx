import React, { useEffect, useRef } from "react";
import { Empty } from "antd";
import { Chart } from "@antv/g2";
import dayjs from "dayjs";
import { LabDailyStatDto } from "../../../services/statisticsService";

interface DailyChartPoint {
  date: string;
  sampleCount: number;
  revenueMillion: number;
}

interface Props {
  data: LabDailyStatDto[];
}

const ChartCanvas: React.FC<{ data: DailyChartPoint[] }> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 300,
      paddingRight: 64,
    });

    chart
      .interval()
      .data(data)
      .encode("x", "date")
      .encode("y", "sampleCount")
      .style({ fill: "#5AD8A6" })
      .axis("x", { labelFormatter: (v: string) => dayjs(v).format("DD/MM"), title: false })
      .axis("y", { title: "Mẫu" })
      .tooltip({
        title: (d: DailyChartPoint) => dayjs(d.date).format("DD/MM/YYYY"),
        items: [{ channel: "y", name: "Số mẫu" }],
      });

    chart
      .line()
      .data(data)
      .encode("x", "date")
      .encode("y", "revenueMillion")
      .scale("y", { key: "rightY" })
      .style({ stroke: "#1D3E8F", lineWidth: 2 })
      .axis("y", { position: "right", title: "Triệu đ" })
      .tooltip({ items: [{ channel: "y", name: "Doanh thu (triệu đ)" }] });

    chart
      .point()
      .data(data)
      .encode("x", "date")
      .encode("y", "revenueMillion")
      .scale("y", { key: "rightY" })
      .style({ r: 4, fill: "#1D3E8F", stroke: "#fff", lineWidth: 1.5 })
      .tooltip(false);

    chart.render();

    return () => {
      chart.destroy();
    };
  }, [data]);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 8 }}>
        <span style={{ marginRight: 16 }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              background: "#5AD8A6",
              borderRadius: 2,
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />
          Số mẫu
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 20,
              height: 2,
              background: "#1D3E8F",
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />
          Triệu đ
        </span>
      </div>
      <div ref={containerRef} />
    </div>
  );
};

const SampleRevenueChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return <Empty description="Không có dữ liệu" style={{ padding: 40 }} />;
  }

  const chartData = data.map((d) => ({
    date: d.date,
    sampleCount: d.sampleCount,
    revenueMillion: +(d.revenue / 1_000_000).toFixed(2),
  }));

  return <ChartCanvas data={chartData} />;
};

export default SampleRevenueChart;
