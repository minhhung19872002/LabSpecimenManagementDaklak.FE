import React from "react";
import { Card, Space, Spin, Empty } from "antd";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LabelList, ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { ExperimentOutlined } from "../../../components/common/Icon";
import { LabContractDetailDto } from "../../../services/statisticsService";
import { formatCurrency, formatCurrencyFull } from "./utils";

interface Props {
  contractDetail: LabContractDetailDto | null;
  detailLoading: boolean;
}

const BAR_SIZE = 18;
const ROW_GAP = 8;
const MAX_SCROLL_HEIGHT = 480;

const ContractDetailPanel: React.FC<Props> = ({ contractDetail, detailLoading }) => {
  if (detailLoading) {
    return (
      <Card className="list-card" style={{ height: "100%" }}>
        <Spin style={{ display: "block", margin: "60px auto" }} />
      </Card>
    );
  }

  if (!contractDetail || contractDetail.samples.length === 0) {
    return (
      <Card className="list-card" style={{ height: "100%" }}>
        <Empty description="Không có dữ liệu" style={{ padding: 40 }} />
      </Card>
    );
  }

  const sorted = [...contractDetail.samples].sort((a, b) =>
    a.sampleCode.localeCompare(b.sampleCode)
  );

  const maxLabelLen = Math.max(...sorted.map((s) => s.sampleCode.length));
  const yAxisWidth = Math.min(200, Math.max(100, maxLabelLen * 7));
  const chartHeight = Math.max(200, sorted.length * (BAR_SIZE + ROW_GAP));

  return (
    <Card
      className="list-card"
      title={
        <Space>
          <ExperimentOutlined />
          Chi tiết mẫu trong hợp đồng: {contractDetail.contractNumber || contractDetail.requestNumber}
        </Space>
      }
      extra={
        <Space size={16} style={{ fontSize: 13, color: "#fff" }}>
          {contractDetail.contractDate && (
            <span>Ngày {dayjs(contractDetail.contractDate).format("DD/MM")}</span>
          )}
          <span>Tổng mẫu: {contractDetail.totalSamples}</span>
          <span>Tổng đơn giá HĐ: {formatCurrencyFull(contractDetail.totalPrice)}</span>
        </Space>
      }
    >
      <div style={{ padding: "8px 16px 0" }}>
        <div style={{ fontSize: 13, color: "#595959", marginBottom: 8 }}>
          Đơn giá từng mẫu trong {contractDetail.contractNumber || contractDetail.requestNumber}
        </div>
        <div style={{ overflowY: "auto", maxHeight: MAX_SCROLL_HEIGHT }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={sorted}
              margin={{ top: 4, right: 64, bottom: 4, left: 0 }}
              barCategoryGap={ROW_GAP}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: "#8c8c8c" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="sampleCode"
                width={yAxisWidth}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                formatter={(value) => [formatCurrencyFull(Number(value ?? 0)), "Đơn giá"]}
              />
              <Bar dataKey="price" fill="#52C41A" barSize={BAR_SIZE} radius={[0, 3, 3, 0]}>
                <LabelList
                  dataKey="price"
                  position="right"
                  formatter={(v) => formatCurrency(Number(v ?? 0))}
                  style={{ fontSize: 11, fill: "#595959" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default ContractDetailPanel;
