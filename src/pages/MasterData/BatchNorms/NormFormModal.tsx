import React, { useEffect, useMemo, useState } from "react";
import { Alert, Form, Input, Modal, Select, message } from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { NumericFormat } from "react-number-format";
import type { ProductDto } from "../../../services/productService";
import { batchNormService, type MethodBatchNormDto } from "../../../services/serviceCatalogService";
import { clearableSelectProps } from "../../../utils/formHelpers";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import { getNormUnitName } from "./BatchNorms/utils";

interface NormFormValues {
  productId: string | null;
  batchQuantity: number | null;
}

const schema: yup.ObjectSchema<NormFormValues> = yup.object({
  productId: yup.string().nullable().defined(),
  batchQuantity: yup.number().nullable().defined().min(0, "Tổng tiêu hao không được âm"),
});

export interface NormFormModalProps {
  open: boolean;
  testMethodId: string;
  testMethodName: string;
  /** null = thêm mới */
  norm: MethodBatchNormDto | null;
  products: ProductDto[];
  /** Vật tư đã có định mức trong phương pháp (BR-05: Phương pháp + Vật tư duy nhất) */
  usedProductIds: string[];
  onSaved: (norm: MethodBatchNormDto) => void;
  onCancel: () => void;
}

/** Form thêm / sửa 1 dòng định mức — Vật tư và Tổng tiêu hao không bắt buộc */
const NormFormModal: React.FC<NormFormModalProps> = ({
  open,
  testMethodId,
  testMethodName,
  norm,
  products,
  usedProductIds,
  onSaved,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);
  const { control, handleSubmit, reset, watch } = useForm<NormFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { productId: null, batchQuantity: null },
  });

  useEffect(() => {
    if (open) {
      reset({ productId: norm?.productId ?? null, batchQuantity: norm?.batchQuantity ?? null });
    }
  }, [open, norm, reset]);

  const productId = watch("productId");
  const selectedProduct = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  const productOptions = useMemo(() => {
    const used = new Set(usedProductIds.filter((id) => id !== norm?.productId));
    return products.map((p) => ({
      value: p.id,
      label: `${p.code} - ${p.name}`,
      disabled: used.has(p.id),
    }));
  }, [products, usedProductIds, norm?.productId]);

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const input = { testMethodId, productId: values.productId, batchQuantity: values.batchQuantity };
      const saved = norm ? await batchNormService.update(norm.id, input) : await batchNormService.create(input);
      message.success(norm ? "Đã cập nhật định mức" : "Đã thêm định mức");
      onSaved(saved);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không lưu được định mức"));
    } finally {
      setSaving(false);
    }
  });

  const unitName = getNormUnitName(selectedProduct) ?? norm?.unitName ?? undefined;
  const missing = !productId || watch("batchQuantity") == null;

  return (
    <Modal
      open={open}
      title={norm ? `Sửa định mức ${norm.code}` : "Thêm vật tư vào định mức"}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={saving}
      onOk={onSubmit}
      onCancel={onCancel}
      destroyOnHidden
      centered
      width={560}
    >
      <Form layout="vertical">
        <Form.Item label="Phương pháp">
          <Input value={testMethodName} disabled />
        </Form.Item>
        <Form.Item label="Vật tư">
          <Controller
            name="productId"
            control={control}
            render={({ field }) => (
              <Select
                {...clearableSelectProps(field)}
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Chọn vật tư / hóa chất"
                options={productOptions}
                style={{ width: "100%" }}
              />
            )}
          />
        </Form.Item>
        <Controller
          name="batchQuantity"
          control={control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Tổng tiêu hao cho 1 mẫu"
              validateStatus={fieldState.error ? "error" : undefined}
              help={fieldState.error?.message}
            >
              <NumericFormat
                value={field.value ?? ""}
                onValueChange={(values) => field.onChange(values.floatValue ?? null)}
                allowNegative={false}
                decimalScale={6}
                thousandSeparator="."
                decimalSeparator=","
                customInput={Input}
                addonAfter={unitName || "ĐVT"}
                style={{ width: "100%" }}
                placeholder="Lượng vật tư tiêu hao cho 1 mẫu"
              />
            </Form.Item>
          )}
        />
        {missing && (
          <Alert
            type="warning"
            showIcon
            message="Thiếu vật tư hoặc tổng tiêu hao → phương pháp vẫn hiện “cần thiết lập tiêu hao” khi chấp nhận thử nghiệm."
          />
        )}
      </Form>
    </Modal>
  );
};

export default NormFormModal;
