import React, { useMemo } from "react";
import { Row, Col, Form, Input, Select } from "antd";
import { DatePicker } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import dayjs from "dayjs";
import { RichTextEditor } from "../../../../components/common";
import { clearableSelectProps } from "../../../../utils/formHelpers";
import { ProductFormData } from "../../schemas";
import type { BaseFieldsProps, SelectOption } from "./types";

interface EquipmentFieldsProps extends BaseFieldsProps {
  manufacturerOptions: SelectOption[];
}

const EquipmentFields: React.FC<EquipmentFieldsProps> = ({ manufacturerOptions }) => {
  const { control, setValue, formState: { errors } } = useFormContext<ProductFormData>();

  const nameBasedManufacturerOptions = useMemo(
    () => manufacturerOptions.map((m) => ({ value: m.title, label: m.title })),
    [manufacturerOptions],
  );

  return (
    <>
      {/* Tên thiết bị | Mã thiết bị */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Tên thiết bị"
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
                  placeholder="Nhập tên thiết bị"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Mã thiết bị"
            required
            validateStatus={errors.identificationCode ? "error" : ""}
            help={errors.identificationCode?.message}
          >
            <Controller
              name="formattedIdentificationCode"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={(html, plainText) => {
                    field.onChange(html);
                    setValue("identificationCode", plainText);
                  }}
                  placeholder="Nhập mã thiết bị"
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Hãng sản xuất | Model */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item label="Hãng sản xuất">
            <Controller
              name="manufacturer"
              control={control}
              render={({ field }) => (
                <Select
                  {...clearableSelectProps(field)}
                  options={nameBasedManufacturerOptions}
                  showSearch
                  optionFilterProp="label"
                  allowClear
                  placeholder="Chọn hãng sản xuất"
                />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Model">
            <Controller
              name="equipmentModel"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ""} placeholder="Nhập model" />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Số serial | Năm sản xuất */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item label="Số serial">
            <Controller
              name="serialNumber"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ""} placeholder="Nhập số serial" />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Năm sản xuất">
            <Controller
              name="manufactureYear"
              control={control}
              render={({ field }) => (
                <DatePicker
                  picker="year"
                  value={field.value ? dayjs().year(field.value as number) : null}
                  onChange={(d) => field.onChange(d ? d.year() : null)}
                  placeholder="Chọn năm sản xuất"
                  style={{ width: "100%" }}
                />
              )}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Xuất xứ | Thông số kỹ thuật chính | Vị trí lắp đặt */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item label="Xuất xứ">
            <Controller
              name="origin"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ""} placeholder="Nhập xuất xứ" />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label="Thông số kỹ thuật chính">
            <Controller
              name="mainTechnicalSpecs"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ""} placeholder="Nhập thông số kỹ thuật" />
              )}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label="Vị trí lắp đặt">
            <Controller
              name="installationLocation"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ""} placeholder="Nhập vị trí lắp đặt" />
              )}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default EquipmentFields;
