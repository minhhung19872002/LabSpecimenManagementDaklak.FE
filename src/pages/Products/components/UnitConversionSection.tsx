import React from "react";
import { Button, InputNumber, Select, Typography } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { CreateUpdateProductUnitConversionDto } from "../../../services/productService";
import { UnitDto } from "../../../services/masterDataService";

const { Text } = Typography;

interface UnitConversionSectionProps {
  conversions: CreateUpdateProductUnitConversionDto[];
  units: UnitDto[];
  onChange: (conversions: CreateUpdateProductUnitConversionDto[]) => void;
  onCreateUnit?: () => void;
}

const UnitConversionSection: React.FC<UnitConversionSectionProps> = ({
  conversions,
  units,
  onChange,
  onCreateUnit,
}) => {
  const unitOptions = units.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  const handleAdd = () => {
    onChange([
      { quantity: 1, baseUnitId: "", convertedQuantity: 1, convertedUnitId: "" },
      ...conversions,
    ]);
  };

  const handleRemove = (index: number) => {
    const next = [...conversions];
    next.splice(index, 1);
    onChange(next);
  };

  const handleChange = (
    index: number,
    field: keyof CreateUpdateProductUnitConversionDto,
    value: any
  ) => {
    const next = [...conversions];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  return (
    <div>
      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexShrink: 0 }}>
        <Button
          type="primary"
          size="small"
          onClick={onCreateUnit}
          style={{ borderRadius: 6, fontWeight: 500, fontSize: 13, flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Thêm đơn vị quy đổi
        </Button>
        <Button
          type="primary"
          shape="circle"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, minWidth: 24, width: 24, height: 24, padding: 0, fontSize: 12 }}
        />
      </div>

      {/* Conversion rows */}
      {conversions.length > 0 && (
        <div
          style={{
            border: "1px solid #f0f0f0",
            borderRadius: 8,
            overflowX: "auto",
          }}
        >
          <div style={{ minWidth: 500 }}>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr 50px 1fr 1.5fr 32px",
              gap: 8,
              padding: "8px 12px",
              background: "#fafafa",
              borderBottom: "1px solid #f0f0f0",
              alignItems: "center",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Số lượng</Text>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Đơn vị chính</Text>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, textAlign: "center" }}>=</Text>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Số lượng</Text>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Đơn vị quy đổi</Text>
            <div />
          </div>

          {/* Rows */}
          {conversions.map((conv, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr 50px 1fr 1.5fr 32px",
                gap: 8,
                padding: "8px 12px",
                alignItems: "center",
                borderBottom: index < conversions.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <InputNumber
                value={conv.quantity}
                min={0.01}
                onChange={(v) => handleChange(index, "quantity", v || 1)}
                style={{ width: "100%" }}
                size="small"
              />
              <Select
                value={conv.baseUnitId || undefined}
                placeholder="Chọn"
                options={unitOptions}
                onChange={(v) => handleChange(index, "baseUnitId", v)}
                style={{ width: "100%" }}
                size="small"
              />
              <Text strong style={{ textAlign: "center", color: "#999" }}>=</Text>
              <InputNumber
                value={conv.convertedQuantity}
                min={0.01}
                onChange={(v) => handleChange(index, "convertedQuantity", v || 1)}
                style={{ width: "100%" }}
                size="small"
              />
              <Select
                value={conv.convertedUnitId || undefined}
                placeholder="Chọn"
                options={unitOptions}
                onChange={(v) => handleChange(index, "convertedUnitId", v)}
                style={{ width: "100%" }}
                size="small"
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => handleRemove(index)}
                size="small"
                style={{ color: "#999" }}
              />
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitConversionSection;
