import React from "react";
import { Descriptions, Modal } from "antd";
import { IndicatorName } from "../../../../components/common";
import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";
import ForecastCalculation from "./ForecastCalculation";
import { formatSamples } from "./utils";

export interface ForecastCalculationModalProps {
  /** null = đóng */
  row: YearlyForecastRowDto | null;
  year: number;
  estimatedSamples: number | null | undefined;
  onClose: () => void;
}

/** Popup "Xem tính toán": tiêu hao 1 phép thử của từng vật tư định mức */
const ForecastCalculationModal: React.FC<ForecastCalculationModalProps> = ({ row, year, estimatedSamples, onClose }) => (
  <Modal
    open={!!row}
    title="Xem tính toán tiêu hao 1 phép thử"
    footer={null}
    onCancel={onClose}
    centered
    destroyOnHidden
    width={640}
  >
    {row && (
      <>
        <Descriptions size="small" column={1} bordered style={{ marginBottom: 12 }}>
          <Descriptions.Item label="Mã DV">{row.serviceCode || "—"}</Descriptions.Item>
          <Descriptions.Item label="Dịch vụ">
            <IndicatorName name={row.indicatorName} formattedName={row.indicatorFormattedName ?? undefined} />
            <span style={{ color: "#8c8c8c" }}> · {row.specimenTypeName || "Mọi nền mẫu"}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Phương pháp">
            {row.testMethodName} ({row.testMethodCode})
          </Descriptions.Item>
          <Descriptions.Item label={`Dự toán ${year}`}>{formatSamples(estimatedSamples)} mẫu</Descriptions.Item>
        </Descriptions>
        <ForecastCalculation row={row} year={year} estimatedSamples={estimatedSamples} />
      </>
    )}
  </Modal>
);

export default ForecastCalculationModal;
