import React from "react";
import { Typography } from "antd";
import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";
import { computePerSample, formatPerSample, formatSamples } from "./utils";
import { formatNormQuantity } from "../../BatchNorms/BatchNorms/utils";

export interface ForecastCalculationProps {
  row: YearlyForecastRowDto;
  year: number;
  estimatedSamples: number | null | undefined;
}

/** "Xem tính toán": từng vật tư định mức ÷ số mẫu dự toán */
const ForecastCalculation: React.FC<ForecastCalculationProps> = ({ row, year, estimatedSamples }) => (
  <div style={{ padding: "4px 8px" }}>
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      BR-01 · Tiêu hao / mẫu ({row.testMethodName}) ÷ Số mẫu dự toán năm {year} · BR-03 làm tròn 4 chữ số
    </Typography.Text>
    {row.normLines.length === 0 ? (
      <div>
        <Typography.Text type="warning">Phương pháp chưa có định mức vật tư đầy đủ.</Typography.Text>
      </div>
    ) : !estimatedSamples || estimatedSamples <= 0 ? (
      <div>
        <Typography.Text type="danger">BR-02 · Chưa có số liệu dự toán mẫu năm {year}</Typography.Text>
      </div>
    ) : (
      <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
        {row.normLines.map((line) => (
          <li key={line.methodBatchNormId}>
            <b>{line.productName}</b>
            {line.productCode ? ` (${line.productCode})` : ""}: {formatNormQuantity(line.batchQuantity)}{" "}
            {line.unitName} ÷ {formatSamples(estimatedSamples)} ={" "}
            <b>
              {formatPerSample(computePerSample(line.batchQuantity, estimatedSamples))} {line.unitName}
            </b>{" "}
            / mẫu
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default ForecastCalculation;
