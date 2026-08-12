import React from "react";
import { Row, Col, Form, Input, InputNumber, Select, Space, Tooltip, AutoComplete, Radio, Tag } from "antd";
import { NumericFormat } from "react-number-format";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Controller, useFormContext } from "react-hook-form";
import { RichTextEditor } from "../../../../components/common";
import { clearableSelectProps } from "../../../../utils/formHelpers";
import { ProductType } from "../../../../services/productService";
import { ProductFormData } from "../../schemas";
import type { PreparedSolutionFieldsProps } from "./types";

const PreparedSolutionFields: React.FC<PreparedSolutionFieldsProps> = ({
  consumableUnitOptions,
  identificationCodeOptions,
  baseProductOptions,
  hasBaseSubstance,
  setHasBaseSubstance,
}) => {
  const { control, setValue, watch, clearErrors, formState: { errors } } = useFormContext<ProductFormData>();
  const watchedVolumeUnitId = watch("volumeUnitId");
  const consumptionUnitLabel = consumableUnitOptions.find((o) => o.value === watchedVolumeUnitId)?.title;

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} sm={14}>
          <Form.Item
            label="Tên dung dịch pha"
            validateStatus={errors.name ? "error" : ""}
            help={errors.name?.message}
          >
            <Controller
              name="formattedName"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("name", plainText);
                  }}
                  placeholder="Nhập tên vật tư/hóa chất"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={10}>
          <Form.Item label="Đơn vị tiêu hao">
            <Controller
              name="volumeUnitId"
              control={control}
              render={({ field }) => (
                <Select
                  {...clearableSelectProps(field)}
                  style={{ width: "100%" }}
                  placeholder="Chọn đơn vị"
                  allowClear
                  showSearch
                  optionFilterProp="title"
                  options={consumableUnitOptions}
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Mã nhận dạng"
            required
            validateStatus={errors.identificationCode ? "error" : ""}
            help={errors.identificationCode?.message}
          >
            <Controller
              name="identificationCode"
              control={control}
              render={({ field }) => (
                <AutoComplete
                  {...field}
                  value={field.value || ""}
                  options={identificationCodeOptions}
                  placeholder="Nhập mã nhận dạng"
                  filterOption={false}
                  notFoundContent={null}
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Công thức hóa học">
            <Controller
              name="formattedChemicalFormula"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("chemicalFormula", plainText);
                  }}
                  placeholder="VD: NaOH, H₂SO₄..."
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item label="Mục đích sử dụng">
            <Controller
              name="usagePurpose"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value || ""} placeholder="VD: Chuẩn bị dung dịch đệm pH 7.4" />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={
              <Space size={4}>
                Tồn kho tối thiểu
                <Tooltip title="Số lượng tồn kho tính theo đơn vị lưu kho">
                  <InfoCircleOutlined style={{ color: "#999" }} />
                </Tooltip>
              </Space>
            }
            required
            validateStatus={errors.minStockLevel ? "error" : ""}
            help={errors.minStockLevel?.message}
          >
            <Controller
              name="minStockLevel"
              control={control}
              render={({ field }) => (
                <NumericFormat
                  value={field.value ?? ""}
                  onValueChange={(values) => field.onChange(values.floatValue ?? null)}
                  onBlur={field.onBlur}
                  allowNegative={false}
                  decimalScale={0}
                  customInput={Input}
                  addonAfter={consumptionUnitLabel || undefined}
                  style={{ width: "100%" }}
                  placeholder="VD: 5"
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Form.Item label="Cấu hình kỹ thuật">
            <Controller
              name="formattedConcentration"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  showToolbar
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("concentration", plainText);
                  }}
                  placeholder="VD: 0.1 mol/L, pH 7.4 ± 0.05"
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item label="Hạn sử dụng">
            <Controller
              name="shelfLifeDays"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  style={{ width: "100%" }}
                  min={1}
                  precision={0}
                  addonAfter="ngày"
                  placeholder="VD: 30"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label="Chất nền (Base substance)">
            <Radio.Group
              value={hasBaseSubstance}
              onChange={(e) => {
                setHasBaseSubstance(e.target.value);
                if (!e.target.value) setValue("baseProductId", undefined);
              }}
            >
              <Radio value={true}>Có</Radio>
              <Radio value={false}>Không</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        {hasBaseSubstance && (
          <Col xs={24} sm={8}>
            <Form.Item
              label="Chọn chất nền"
              required
              validateStatus={errors.baseProductId ? "error" : ""}
              help={errors.baseProductId?.message}
            >
              <Controller
                name="baseProductId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...clearableSelectProps(field)}
                    style={{ width: "100%" }}
                    placeholder="Tìm hóa chất / sinh phẩm / dung môi"
                    allowClear
                    showSearch
                    optionFilterProp="title"
                    options={baseProductOptions}
                    onChange={(v) => {
                      field.onChange(v);
                      if (v) clearErrors("baseProductId");
                    }}
                    optionRender={(option) => {
                      const typeColors: Record<number, string> = {
                        [ProductType.Chemical]: "blue",
                        [ProductType.Biological]: "green",
                        [ProductType.Solvent]: "orange",
                      };
                      const typeLabels: Record<number, string> = {
                        [ProductType.Chemical]: "Hóa chất",
                        [ProductType.Biological]: "Sinh phẩm",
                        [ProductType.Solvent]: "Dung môi",
                      };
                      const t = (option.data as any).productType as number;
                      return (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {option.label}
                          </span>
                          <Tag color={typeColors[t]} style={{ marginLeft: 6, flexShrink: 0, marginBottom: 0 }}>
                            {typeLabels[t]}
                          </Tag>
                        </div>
                      );
                    }}
                  />
                )}
              />
            </Form.Item>
          </Col>
        )}
      </Row>
    </>
  );
};

export default PreparedSolutionFields;
