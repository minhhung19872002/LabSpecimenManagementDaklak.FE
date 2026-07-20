import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, DatePicker, InputNumber, Button, Form, Input, Typography, message } from "antd";
import { NumericFormat } from "react-number-format";
import dayjs from "dayjs";
import {
  EquipmentDto,
  EquipmentCostConfigDto,
  CreateEquipmentCostConfigDto,
} from "../../../services/equipmentService";
import { formatNumber, safeMul, safeDiv, safeDivCeil } from "./utils";

const { Text } = Typography;

export interface CostConfigTabProps {
  equipment: EquipmentDto;
  activeCostConfig: EquipmentCostConfigDto | null;
  onSave: (data: CreateEquipmentCostConfigDto) => Promise<void>;
  saving: boolean;
}

const CostConfigTab: React.FC<CostConfigTabProps> = ({
  equipment,
  activeCostConfig,
  onSave,
  saving,
}) => {
  const [effectiveFrom, setEffectiveFrom] = useState<dayjs.Dayjs | null>(null);
  const [operatingHoursPerYear, setOperatingHoursPerYear] = useState<number | null>(null);
  const [averageSamplesPerYear, setAverageSamplesPerYear] = useState<number | null>(null);
  const [maintenanceCostRatio, setMaintenanceCostRatio] = useState<number | null>(null);
  const [calibrationCostPerYear, setCalibrationCostPerYear] = useState<number | null>(null);

  useEffect(() => {
    if (activeCostConfig) {
      setEffectiveFrom(dayjs(activeCostConfig.effectiveFrom));
      setOperatingHoursPerYear(activeCostConfig.operatingHoursPerYear ?? null);
      setAverageSamplesPerYear(activeCostConfig.averageSamplesPerYear ?? null);
      setMaintenanceCostRatio(activeCostConfig.maintenanceCostRatio ?? null);
      setCalibrationCostPerYear(activeCostConfig.calibrationCostPerYear ?? null);
    }
  }, [activeCostConfig]);

  const effectiveTo = useMemo(() => {
    if (!effectiveFrom) return null;
    return effectiveFrom.add(1, "year").subtract(1, "day");
  }, [effectiveFrom]);

  const electricityPerYear = safeMul(operatingHoursPerYear, equipment.powerConsumption);
  const electricityPerSample = safeDiv(electricityPerYear, averageSamplesPerYear);
  const depPerSample = safeDivCeil(
    safeDiv(equipment.price, equipment.depreciationPeriod),
    averageSamplesPerYear,
  );
  const maintenanceCost = equipment.price != null && maintenanceCostRatio != null
    ? equipment.price * maintenanceCostRatio / 100
    : null;
  const maintenanceCostPerSample = safeDiv(maintenanceCost, averageSamplesPerYear);
  const depHourAfterHC = safeDivCeil(calibrationCostPerYear, 12 * 22 * 8);
  const depSampleAfterHC = safeDivCeil(calibrationCostPerYear, averageSamplesPerYear);

  const handleSave = async () => {
    if (!effectiveFrom) {
      message.warning("Vui lòng chọn ngày hiệu lực");
      return;
    }
    if (!effectiveTo || effectiveTo.isBefore(dayjs(), "day") || effectiveTo.isSame(dayjs(), "day")) {
      message.warning("Ngày kết thúc hiệu lực phải lớn hơn ngày hiện tại");
      return;
    }
    if (operatingHoursPerYear != null && operatingHoursPerYear <= 0) {
      message.warning("Thời gian chạy máy phải lớn hơn 0");
      return;
    }
    if (averageSamplesPerYear != null && averageSamplesPerYear <= 0) {
      message.warning("Số mẫu trung bình phải lớn hơn 0");
      return;
    }

    await onSave({
      effectiveFrom: effectiveFrom.format("YYYY-MM-DD"),
      effectiveTo: effectiveTo.format("YYYY-MM-DD"),
      operatingHoursPerYear: operatingHoursPerYear ?? undefined,
      averageSamplesPerYear: averageSamplesPerYear ?? undefined,
      maintenanceCostRatio: maintenanceCostRatio ?? undefined,
      calibrationCostPerYear: calibrationCostPerYear ?? undefined,
    });
  };

  return (
    <Form layout="vertical" size="middle" className="cost-config-form">
      <div className="date-range-row">
        <Form.Item label={<Text strong>Hiệu lực từ</Text>} style={{ marginBottom: 0 }}>
          <DatePicker
            value={effectiveFrom}
            onChange={setEffectiveFrom}
            format="DD/MM/YYYY"
            style={{ width: 160 }}
          />
        </Form.Item>
        <div style={{ paddingBottom: 4 }}>
          <Text type="secondary">đến</Text>
        </div>
        <Form.Item label=" " style={{ marginBottom: 0 }}>
          <DatePicker
            value={effectiveTo}
            format="DD/MM/YYYY"
            style={{ width: 160 }}
            disabled
          />
        </Form.Item>
      </div>

      <div className="config-section-title">Thông số vận hành theo kỳ (năm)</div>

      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Thời gian chạy máy (h/năm)">
            <NumericFormat
              value={operatingHoursPerYear ?? ""}
              onValueChange={(v) => setOperatingHoursPerYear(v.floatValue ?? null)}
              allowNegative={false}
              decimalScale={1}
              thousandSeparator="."
              decimalSeparator=","
              customInput={Input}
              style={{ width: "100%" }}
              isAllowed={(v) => !v.floatValue || v.floatValue > 0}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Số mẫu trung bình (mẫu/năm)">
            <InputNumber
              value={averageSamplesPerYear}
              onChange={(v) => setAverageSamplesPerYear(v ?? null)}
              min={1}
              precision={0}
              style={{ width: "100%" }}
              controls={false}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Lượng điện tiêu thụ / năm">
            <Input
              value={electricityPerYear != null ? formatNumber(electricityPerYear) : ""}
              disabled
              style={{ width: "100%" }}
              addonAfter="kWh"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Lượng điện tiêu thụ / mẫu">
            <Input
              value={electricityPerSample != null ? formatNumber(electricityPerSample) : ""}
              disabled
              style={{ width: "100%" }}
              addonAfter="kWh"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Khấu hao TS trung bình / mẫu">
            <Input
              value={depPerSample != null ? formatNumber(depPerSample, 0) : ""}
              disabled
              style={{ width: "100%" }}
              addonAfter="đ"
            />
          </Form.Item>
        </Col>
      </Row>

      <div className="config-section-title">Dự toán chi phí vận hành</div>

      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Tỷ lệ duy tu bảo dưỡng (%/năm)">
            <InputNumber
              value={maintenanceCostRatio}
              onChange={(v) => setMaintenanceCostRatio(v ?? null)}
              min={0}
              precision={0}
              style={{ width: "100%" }}
              controls={false}
              addonAfter="%"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Mức phí duy tu bảo dưỡng">
            <Input
              value={maintenanceCost != null ? formatNumber(maintenanceCost, 0) : ""}
              disabled
              style={{ width: "100%" }}
              addonAfter="đ"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Chi phí duy tu bảo dưỡng / mẫu">
            <Input
              value={maintenanceCostPerSample != null ? formatNumber(Math.ceil(maintenanceCostPerSample), 0) : ""}
              disabled
              style={{ width: "100%" }}
              addonAfter="đ"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Chi phí hiệu chuẩn trung bình / năm">
            <NumericFormat
              value={calibrationCostPerYear ?? ""}
              onValueChange={(v) => setCalibrationCostPerYear(v.floatValue ?? null)}
              allowNegative={false}
              decimalScale={2}
              thousandSeparator="."
              decimalSeparator=","
              customInput={Input}
              addonAfter="đ"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Khấu hao trung bình giờ (sau HC)">
            <Input
              value={depHourAfterHC != null ? formatNumber(depHourAfterHC, 0) : ""}
              disabled
              style={{ width: "100%" }}
              addonAfter="đ"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Khấu hao trung bình / mẫu (sau HC)">
            <Input
              value={depSampleAfterHC != null ? formatNumber(depSampleAfterHC, 0) : ""}
              disabled
              style={{ width: "100%" }}
              addonAfter="đ"
            />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ textAlign: "right", marginTop: 16 }}>
        <Button type="primary" onClick={handleSave} loading={saving}>
          Lưu phiên bản cấu hình
        </Button>
      </div>
    </Form>
  );
};

export default CostConfigTab;
