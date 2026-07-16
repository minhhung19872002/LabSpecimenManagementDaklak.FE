import React from "react";
import { Row, Col, Form, Input, InputNumber, Select, Space, Tooltip, AutoComplete, Radio } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Controller, useFormContext } from "react-hook-form";
import { RichTextEditor } from "../../../../components/common";
import { clearableSelectProps } from "../../../../utils/formHelpers";
import { ProductFormData } from "../../schemas";
import type { BaseFieldsProps } from "./types";

const SupplyFields: React.FC<BaseFieldsProps> = ({ consumableUnitOptions, identificationCodeOptions }) => {
  const { control, setValue, watch, formState: { errors } } = useFormContext<ProductFormData>();
  const watchedIsReusable = watch("isReusable");

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} sm={14}>
          <Form.Item
            label="Tên vật tư tiêu hao"
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
        <Col xs={24} sm={8}>
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
        <Col xs={24} sm={8}>
          <Form.Item label="Thông số kích thước/ Dung tích">
            <Controller
              name="formattedPackagingSpec"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("packagingSpec", plainText);
                  }}
                  placeholder="VD: 10mL, φ25mm × 100mm"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label="Vật liệu cấu thành">
            <Controller
              name="formattedMaterialComposition"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("materialComposition", plainText);
                  }}
                  placeholder="VD: Polypropylene, Polyethylene"
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
          <Form.Item label="Mã nguy hiểm GHS/ MSDS">
            <Controller
              name="ghsCode"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value || ""} placeholder="VD: GHS02, GHS06" />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item label="Trạng thái vô trùng">
            <Controller
              name="isSterile"
              control={control}
              render={({ field }) => (
                <Radio.Group value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                  <Radio value={true}>Đã tiệt trùng</Radio>
                  <Radio value={false}>Chưa tiệt trùng</Radio>
                </Radio.Group>
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label="Khả năng tái sử dụng">
            <Controller
              name="isReusable"
              control={control}
              render={({ field }) => (
                <Radio.Group
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <Radio value={true}>Có</Radio>
                  <Radio value={false}>Không</Radio>
                </Radio.Group>
              )}
            />
          </Form.Item>
        </Col>
        {watchedIsReusable === true && (
          <Col xs={24} sm={8}>
            <Form.Item label="Số lần tái sử dụng">
              <Controller
                name="maxReuseCount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    min={1}
                    precision={0}
                    style={{ width: "100%" }}
                    placeholder="VD: 5"
                  />
                )}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={16}>
          <Form.Item label="Cấu hình kỹ thuật">
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
                  placeholder="Nhập cấu hình kỹ thuật"
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default SupplyFields;
