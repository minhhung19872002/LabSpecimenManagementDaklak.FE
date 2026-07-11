import React, { useEffect } from "react";
import { Row, Col, Form, Select, InputNumber, Button, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Controller, useFormContext, useFieldArray } from "react-hook-form";
import { ProductType } from "../../../../services/productService";
import { UnitDto } from "../../../../services/masterDataService";
import { clearableSelectProps } from "../../../../utils/formHelpers";
import { ProductFormData } from "../../schemas";
import type { SelectOption } from "./types";

const isChemOrBioOrStdOrSupplyOrSolventType = (type: number) =>
  type === ProductType.Chemical || type === ProductType.Biological ||
  type === ProductType.Standard || type === ProductType.Supply ||
  type === ProductType.Solvent;

const isPreparedSolutionType = (type: number) => type === ProductType.PreparedSolution;

// Types where volumeUnitId in SKU is auto-filled + locked from top-level volumeUnitId
const isAutoFillVolumeUnitType = (type: number) =>
  isChemOrBioOrStdOrSupplyOrSolventType(type) || isPreparedSolutionType(type);

export interface SkuSectionProps {
  units: UnitDto[];
  manufacturerOptions: SelectOption[];
  purchaseUnitOptions: SelectOption[];
  storageUnitOptions: SelectOption[];
  consumableUnitOptions: SelectOption[];
  tuphaManufacturerId: string | undefined;
}

const SkuSection: React.FC<SkuSectionProps> = ({
  units,
  manufacturerOptions,
  purchaseUnitOptions,
  storageUnitOptions,
  consumableUnitOptions,
  tuphaManufacturerId,
}) => {
  const { control, setValue, watch, formState: { errors } } = useFormContext<ProductFormData>();
  const { fields: skuFields, append: appendSku, remove: removeSku } = useFieldArray({
    control,
    name: "skus",
  });

  const watchedType = watch("productType");
  const topVolumeUnitId = watch("volumeUnitId");
  const watchedSkus = watch("skus") || [];

  useEffect(() => {
    if (isAutoFillVolumeUnitType(watchedType) && skuFields.length > 0) {
      skuFields.forEach((_, i) => {
        setValue(`skus.${i}.volumeUnitId`, topVolumeUnitId || "");
      });
    }
  }, [topVolumeUnitId, watchedType]);

  const getUsedManufacturerIds = (excludeIndex: number) =>
    watchedSkus
      .filter((_, i) => i !== excludeIndex)
      .map((s) => s?.manufacturerId)
      .filter(Boolean) as string[];

  const addEmptySku = () => {
    const isFirstSkuForPrepared = isPreparedSolutionType(watchedType) && skuFields.length === 0;
    appendSku({
      manufacturerId: isFirstSkuForPrepared ? (tuphaManufacturerId || "") : "",
      baseUnitId: undefined,
      packagingQuantity: undefined as any,
      packagingUnitId: undefined as any,
      volumePerUnit: undefined as any,
      volumeUnitId: isAutoFillVolumeUnitType(watchedType)
        ? (topVolumeUnitId || undefined)
        : undefined as any,
    });
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "#1677ff", color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>3</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Cấu hình hãng sản xuất &amp; Đơn vị quy đổi (SKUs)</span>
        </div>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addEmptySku}>
          Thêm Hãng &amp; Quy Cách
        </Button>
      </div>

      {skuFields.map((field, index) => {
        const usedIds = getUsedManufacturerIds(index);
        const filteredManufacturerOptions = manufacturerOptions.map((opt) => ({
          ...opt,
          disabled: usedIds.includes(opt.value as string),
        }));
        const sku = watchedSkus[index];
        const purchaseUnit = sku ? units.find((u) => u.id === sku.baseUnitId)?.name : undefined;
        const storageUnit = sku ? units.find((u) => u.id === sku.packagingUnitId)?.name : undefined;
        const consumableUnit = sku ? units.find((u) => u.id === sku.volumeUnitId)?.name : undefined;
        const qty = sku?.packagingQuantity;
        const vol = sku?.volumePerUnit;

        type Seg = { text: string; color: string };
        let previewSegments: Seg[] = [];
        if (purchaseUnit && qty && storageUnit && vol && consumableUnit) {
          const total = (qty * vol).toLocaleString();
          previewSegments = [
            { text: purchaseUnit, color: "#1677ff" },
            { text: " → ", color: "#8c8c8c" },
            { text: `${qty} ${storageUnit}`, color: "#d4380d" },
            { text: " → ", color: "#8c8c8c" },
            { text: `${total} ${consumableUnit}`, color: "#389e0d" },
          ];
        } else if (purchaseUnit && qty && storageUnit) {
          previewSegments = [
            { text: purchaseUnit, color: "#1677ff" },
            { text: " → ", color: "#8c8c8c" },
            { text: `${qty} ${storageUnit}`, color: "#d4380d" },
          ];
        } else if (qty && storageUnit && vol && consumableUnit) {
          const total = (qty * vol).toLocaleString();
          previewSegments = [
            { text: `${qty} ${storageUnit}`, color: "#d4380d" },
            { text: " → ", color: "#8c8c8c" },
            { text: `${total} ${consumableUnit}`, color: "#389e0d" },
          ];
        }

        return (
          <div
            key={field.id}
            style={{ marginBottom: 16, padding: "12px 16px", border: "1px solid #f0f0f0", borderRadius: 8, background: "#fafafa", position: "relative" }}
          >
            <Popconfirm
              title="Xóa quy cách này?"
              onConfirm={() => removeSku(index)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
              />
            </Popconfirm>
            <Row gutter={[12, 0]}>
              <Col xs={24} md={5}>
                <Form.Item
                  label="Hãng sản xuất"
                  required
                  validateStatus={errors.skus?.[index]?.manufacturerId ? "error" : ""}
                  help={errors.skus?.[index]?.manufacturerId?.message}
                  style={{ marginBottom: 8 }}
                >
                  <Controller
                    name={`skus.${index}.manufacturerId`}
                    control={control}
                    render={({ field: f }) => (
                      <Select
                        {...f}
                        placeholder="Chọn hãng"
                        showSearch
                        optionFilterProp="title"
                        options={filteredManufacturerOptions}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item label="Đơn vị mua hàng" style={{ marginBottom: 8 }}>
                  <Controller
                    name={`skus.${index}.baseUnitId`}
                    control={control}
                    render={({ field: f }) => (
                      <Select
                        {...clearableSelectProps(f)}
                        placeholder="Chọn"
                        allowClear
                        showSearch
                        optionFilterProp="title"
                        options={purchaseUnitOptions}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Quy cách đóng gói / Đơn vị lưu kho"
                  required
                  validateStatus={errors.skus?.[index]?.packagingQuantity || errors.skus?.[index]?.packagingUnitId ? "error" : ""}
                  help={errors.skus?.[index]?.packagingQuantity?.message || errors.skus?.[index]?.packagingUnitId?.message}
                  style={{ marginBottom: 8 }}
                >
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ flexShrink: 0, color: "#8c8c8c" }}>=</span>
                    <Controller
                      name={`skus.${index}.packagingQuantity`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          {...f}
                          style={{ width: 70, flexShrink: 0 }}
                          min={1}
                          precision={0}
                          placeholder="SL"
                          status={errors.skus?.[index]?.packagingQuantity ? "error" : undefined}
                        />
                      )}
                    />
                    <Controller
                      name={`skus.${index}.packagingUnitId`}
                      control={control}
                      render={({ field: f }) => (
                        <Select
                          {...clearableSelectProps(f)}
                          style={{ flex: 1, minWidth: 0 }}
                          placeholder="ĐV lưu kho"
                          allowClear
                          showSearch
                          optionFilterProp="title"
                          options={storageUnitOptions}
                          status={errors.skus?.[index]?.packagingUnitId ? "error" : undefined}
                        />
                      )}
                    />
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24} md={7}>
                <Form.Item
                  label="Dung tích mỗi đơn vị"
                  required
                  validateStatus={errors.skus?.[index]?.volumePerUnit || errors.skus?.[index]?.volumeUnitId ? "error" : ""}
                  help={errors.skus?.[index]?.volumePerUnit?.message || errors.skus?.[index]?.volumeUnitId?.message}
                  style={{ marginBottom: 8 }}
                >
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ flexShrink: 0, color: "#8c8c8c" }}>=</span>
                    <Controller
                      name={`skus.${index}.volumePerUnit`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          {...f}
                          style={{ width: 60, flexShrink: 0 }}
                          min={1}
                          precision={0}
                          placeholder="SL"
                          status={errors.skus?.[index]?.volumePerUnit ? "error" : undefined}
                        />
                      )}
                    />
                    <Controller
                      name={`skus.${index}.volumeUnitId`}
                      control={control}
                      render={({ field: f }) => (
                        <Select
                          {...clearableSelectProps(f)}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            background: isAutoFillVolumeUnitType(watchedType) ? "#f5f5f5" : undefined,
                          }}
                          placeholder="ĐV tiêu hao"
                          allowClear
                          showSearch
                          optionFilterProp="title"
                          options={consumableUnitOptions}
                          status={errors.skus?.[index]?.volumeUnitId ? "error" : undefined}
                          disabled={isAutoFillVolumeUnitType(watchedType)}
                        />
                      )}
                    />
                  </div>
                </Form.Item>
              </Col>
            </Row>
            {previewSegments.length > 0 && (
              <>
                <div style={{ borderTop: "1px dashed #e8e8e8", margin: "8px 0" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span style={{ color: "#8c8c8c", flexShrink: 0 }}>Sơ đồ quy đổi trực quan:</span>
                  <span style={{ padding: "4px 14px", border: "1px solid #d9d9d9", borderRadius: 4, fontWeight: 600 }}>
                    {previewSegments.map((s, i) => (
                      <span key={i} style={{ color: s.color }}>{s.text}</span>
                    ))}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}

      {skuFields.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#8c8c8c", border: "1px dashed #d9d9d9", borderRadius: 8 }}>
          Chưa có quy cách đóng gói nào. Bấm <b>+ Thêm Hãng &amp; Quy Cách</b> để thêm.
        </div>
      )}
    </>
  );
};

export default SkuSection;
