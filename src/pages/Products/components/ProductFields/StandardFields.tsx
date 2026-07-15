import React from "react";
import { Row, Col, Form, Input, InputNumber, Select, Space, Tooltip, AutoComplete } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Controller, useFormContext } from "react-hook-form";
import { RichTextEditor } from "../../../../components/common";
import { clearableSelectProps } from "../../../../utils/formHelpers";
import { STANDARD_CERTIFICATION_OPTIONS } from "../../../../services/productService";
import { ProductFormData } from "../../schemas";
import type { BaseFieldsProps } from "./types";

const StandardFields: React.FC<BaseFieldsProps> = ({ consumableUnitOptions, identificationCodeOptions }) => {
  const { control, setValue, formState: { errors } } = useFormContext<ProductFormData>();

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item label="Loại chất chuẩn">
            <Controller
              name="standardCertificationType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value !== null && field.value !== undefined ? field.value : undefined}
                  onChange={(v) => field.onChange(v ?? null)}
                  onBlur={field.onBlur}
                  style={{ width: "100%" }}
                  placeholder="Chọn loại chất chuẩn"
                  allowClear
                  options={STANDARD_CERTIFICATION_OPTIONS}
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={14}>
          <Form.Item
            label="Tên chất chuẩn"
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
        <Col xs={24} sm={14}>
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
        <Col xs={24} sm={10}>
          <Form.Item label="Nguồn gốc / Chủng loại">
            <Controller
              name="formattedOrigin"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("origin", plainText);
                  }}
                  placeholder="VD: NIST, Merck..."
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            label={
              <Space size={4}>
                Số CAS
                <Tooltip title="Mã định danh quốc tế cho hóa chất">
                  <InfoCircleOutlined style={{ color: "#999" }} />
                </Tooltip>
              </Space>
            }
          >
            <Controller
              name="casNumber"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value || ""} placeholder="VD: 64-17-5" />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label="Nồng độ/Bản sao/Hoạt tính">
            <Controller
              name="formattedConcentration"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("concentration", plainText);
                  }}
                  placeholder="VD: ≥ 99.5%"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
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
                <InputNumber {...field} style={{ width: "100%" }} min={0} placeholder="VD: 10" />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
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
                  placeholder="VD: C₂H₅OH"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label="Giá trị chứng nhận">
            <Controller
              name="formattedCertifiedValue"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("certifiedValue", plainText);
                  }}
                  placeholder="VD: 1000 mg/L"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label="Độ không đảm bảo đo">
            <Controller
              name="formattedMeasurementUncertainty"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("measurementUncertainty", plainText);
                  }}
                  placeholder="VD: ± 2 mg/L (k=2, 0.2%)"
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={14}>
          <Form.Item label="Liên kết chất chuẩn">
            <Controller
              name="standardLink"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value || ""} placeholder="VD: https://www.nist.gov/..." />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={10}>
          <Form.Item label="Cấp độ phân tích">
            <Controller
              name="analysisGrade"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value || ""} placeholder="VD: HPLC grade" />
              )}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StandardFields;
