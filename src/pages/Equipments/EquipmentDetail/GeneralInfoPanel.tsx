import React from "react";
import { Row, Col } from "antd";
import { EquipmentDto } from "../../../services/equipmentService";
import { formatNumber } from "./utils";

export interface GeneralInfoPanelProps {
  equipment: EquipmentDto;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-item">
    <span className="detail-item-label">{label}</span>
    <span className="detail-item-value">
      {value != null && value !== "" ? value : "-"}
    </span>
  </div>
);

const GeneralInfoPanel: React.FC<GeneralInfoPanelProps> = ({ equipment }) => {
  return (
    <div className="detail-section">
      <div className="detail-section-title">Thông tin chung</div>
      <DetailItem label="Tên thiết bị" value={equipment.name} />
      <Row gutter={16}>
        <Col span={12}>
          <DetailItem label="Mã tài sản" value={equipment.assetCode} />
        </Col>
        <Col span={12}>
          <DetailItem label="Hãng sản xuất" value={equipment.manufacturer} />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <DetailItem label="Số serial NSX" value={equipment.serialNumber} />
        </Col>
        <Col span={12}>
          <DetailItem
            label="Công suất sử dụng"
            value={
              equipment.powerConsumption != null
                ? `${formatNumber(equipment.powerConsumption)} kW`
                : undefined
            }
          />
        </Col>
      </Row>
      <DetailItem label="Vị trí lắp đặt" value={equipment.location} />
    </div>
  );
};

export default GeneralInfoPanel;
