import React from "react";
import { Row, Col, Card, Tabs, Tag, Space, Typography } from "antd";
import {
  EquipmentDto,
  EquipmentCostConfigDto,
  CreateEquipmentCostConfigDto,
  EquipmentStatusLabels,
  EquipmentStatusColors,
} from "../../../services/equipmentService";
import GeneralInfoPanel from "./GeneralInfoPanel";
import DepreciationInfoPanel from "./DepreciationInfoPanel";
import CostConfigTab from "./CostConfigTab";
import CostConfigHistoryTab from "./CostConfigHistoryTab";
import TestLogTab from "./TestLogTab";

const { Text } = Typography;

export interface EquipmentDetailViewProps {
  equipment: EquipmentDto;
  activeCostConfig: EquipmentCostConfigDto | null;
  onSaveCostConfig: (data: CreateEquipmentCostConfigDto) => Promise<void>;
  savingCostConfig: boolean;
  costConfigRefreshKey?: number;
}

const PlaceholderTab: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ padding: "40px 0", textAlign: "center" }}>
    <Text type="secondary">{label} — Chức năng đang phát triển</Text>
  </div>
);

const EquipmentDetailView: React.FC<EquipmentDetailViewProps> = ({
  equipment,
  activeCostConfig,
  onSaveCostConfig,
  savingCostConfig,
  costConfigRefreshKey,
}) => {
  const tabItems = [
    {
      key: "test-log",
      label: "Nhật ký phép thử",
      children: <TestLogTab equipmentId={equipment.id} />,
    },
    {
      key: "cost-config",
      label: "Cấu hình chi phí",
      children: (
        <CostConfigTab
          equipment={equipment}
          activeCostConfig={activeCostConfig}
          onSave={onSaveCostConfig}
          saving={savingCostConfig}
        />
      ),
    },
    {
      key: "calibration",
      label: "Hiệu chuẩn",
      children: <PlaceholderTab label="Hiệu chuẩn" />,
    },
    {
      key: "maintenance",
      label: "Duy tu, bảo dưỡng",
      children: <PlaceholderTab label="Duy tu, bảo dưỡng" />,
    },
    {
      key: "history",
      label: "Lịch sử hoạt động",
      children: (
        <CostConfigHistoryTab
          equipmentId={equipment.id}
          refreshKey={costConfigRefreshKey}
        />
      ),
    },
  ];

  return (
    <Card
      className="list-card"
      title={
        <div className="card-header-flex">
          <Space wrap>
            <span>Chi tiết thiết bị</span>
            {equipment.code && (
              <Tag className="equipment-code-tag">{equipment.code}</Tag>
            )}
            <Tag color={EquipmentStatusColors[equipment.status]}>
              {EquipmentStatusLabels[equipment.status]}
            </Tag>
          </Space>
        </div>
      }
    >
      <Row gutter={20}>
        <Col xs={24} md={8} lg={7} className="detail-left-col">
          <GeneralInfoPanel equipment={equipment} />
          <DepreciationInfoPanel equipment={equipment} />
        </Col>
        <Col xs={24} md={16} lg={17}>
          <Tabs defaultActiveKey="test-log" items={tabItems} />
        </Col>
      </Row>
    </Card>
  );
};

export default EquipmentDetailView;
