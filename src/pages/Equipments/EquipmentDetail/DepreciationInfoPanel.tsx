import React from "react";
import dayjs from "dayjs";
import { EquipmentDto } from "../../../services/equipmentService";
import { formatCurrency, safeDiv, safeDivCeil } from "./utils";

export interface DepreciationInfoPanelProps {
  equipment: EquipmentDto;
}

const HorizontalItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-item-horizontal">
    <span className="detail-item-label">{label}</span>
    <span className="detail-item-value">
      {value != null && value !== "" ? value : "-"}
    </span>
  </div>
);

const DepreciationInfoPanel: React.FC<DepreciationInfoPanelProps> = ({ equipment }) => {
  const depPerYear = safeDivCeil(equipment.price, equipment.depreciationPeriod);
  const depPerHour = safeDivCeil(
    safeDiv(equipment.price, equipment.depreciationPeriod),
    12 * 22 * 8,
  );

  return (
    <div className="detail-section">
      <div className="detail-section-title">Thông tin tài sản - khấu hao</div>
      <HorizontalItem label="Nguyên giá" value={formatCurrency(equipment.price)} />
      <HorizontalItem
        label="Thời gian khấu hao"
        value={
          equipment.depreciationPeriod != null
            ? `${equipment.depreciationPeriod} năm`
            : undefined
        }
      />
      <HorizontalItem
        label="Ngày nhập kho"
        value={
          equipment.importDate
            ? dayjs(equipment.importDate).format("DD/MM/YYYY")
            : undefined
        }
      />
      <HorizontalItem
        label="Khấu hao trung bình năm"
        value={depPerYear != null ? formatCurrency(depPerYear) : undefined}
      />
      <HorizontalItem
        label="Khấu hao trung bình giờ"
        value={depPerHour != null ? formatCurrency(depPerHour) : undefined}
      />
    </div>
  );
};

export default DepreciationInfoPanel;
