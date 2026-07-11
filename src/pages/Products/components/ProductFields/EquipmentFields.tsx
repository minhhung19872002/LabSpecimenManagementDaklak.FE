import React from "react";
import { Row, Col, Form, AutoComplete } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import { RichTextEditor } from "../../../../components/common";
import { ProductFormData } from "../../schemas";
import type { BaseFieldsProps } from "./types";

const EquipmentFields: React.FC<BaseFieldsProps> = ({ identificationCodeOptions }) => {
  const { control, setValue, formState: { errors } } = useFormContext<ProductFormData>();

  return (
    <>
      <Row gutter={16}>
        <Col xs={24}>
          <Form.Item
            label="Tên vật tư"
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
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
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
      </Row>
    </>
  );
};

export default EquipmentFields;
