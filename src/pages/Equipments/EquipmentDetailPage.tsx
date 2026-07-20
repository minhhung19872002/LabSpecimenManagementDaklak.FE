import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spin, Card, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  equipmentService,
  EquipmentDto,
  EquipmentCostConfigDto,
  CreateEquipmentCostConfigDto,
} from "../../services/equipmentService";
import EquipmentDetailView from "./EquipmentDetail/EquipmentDetailView";
import "../../styles/ListCard.css";
import "./EquipmentDetail.css";

const EquipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<EquipmentDto | null>(null);
  const [activeCostConfig, setActiveCostConfig] = useState<EquipmentCostConfigDto | null>(null);
  const [savingCostConfig, setSavingCostConfig] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [eq, config] = await Promise.all([
        equipmentService.get(id),
        equipmentService.getActiveCostConfig(id).catch(() => null),
      ]);
      setEquipment(eq);
      setActiveCostConfig(config ?? null);
    } catch {
      message.error("Không thể tải thông tin thiết bị");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveCostConfig = useCallback(
    async (data: CreateEquipmentCostConfigDto) => {
      if (!id) return;
      setSavingCostConfig(true);
      try {
        await equipmentService.saveCostConfig(id, data);
        message.success("Đã lưu phiên bản cấu hình");
        await loadData();
      } catch {
        message.error("Không thể lưu cấu hình chi phí");
      } finally {
        setSavingCostConfig(false);
      }
    },
    [id, loadData],
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="equipment-detail">
        <Card className="list-card">
          <div style={{ textAlign: "center", padding: 40 }}>
            Không tìm thấy thiết bị
            <br />
            <Button type="link" onClick={() => navigate("/equipments")}>
              Quay lại danh sách
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="equipment-detail">
      <div className="back-button-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/equipments")}>
          Quay lại
        </Button>
      </div>

      <EquipmentDetailView
        equipment={equipment}
        activeCostConfig={activeCostConfig}
        onSaveCostConfig={handleSaveCostConfig}
        savingCostConfig={savingCostConfig}
      />
    </div>
  );
};

export default EquipmentDetailPage;
