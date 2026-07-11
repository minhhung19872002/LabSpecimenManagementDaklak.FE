import React from "react";
import { Form, Input, Tag, Radio } from "antd";
import { Controller, useFormContext } from "react-hook-form";
import { RichTextEditor } from "../../../../components/common";
import { ProductType } from "../../../../services/productService";
import { ProductFormData } from "../../schemas";
import AttachmentSection from "../AttachmentSection";
import type { SharedFieldsProps } from "./types";

const SharedFields: React.FC<SharedFieldsProps> = ({
  categoryTags,
  categoryTagInput,
  setCategoryTagInput,
  handleAddTag,
  handleRemoveTag,
  existingAttachments,
  newAttachments,
  setNewAttachments,
  setExistingAttachments,
  setRemovedAttachmentIds,
}) => {
  const { control, setValue, watch } = useFormContext<ProductFormData>();
  const productType = watch("productType");

  const showSupplyFields = productType === ProductType.Supply;
  const showGhsField =
    productType === ProductType.Biological ||
    productType === ProductType.Standard ||
    productType === ProductType.Supply ||
    productType === ProductType.Solvent ||
    productType === ProductType.PreparedSolution;

  return (
    <>
      <Form.Item label="Nhóm/Phân loại (Tags)">
        <div
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            padding: "4px 8px",
            minHeight: 36,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 4,
          }}
        >
          {categoryTags.map((tag) => (
            <Tag key={tag} closable onClose={() => handleRemoveTag("categories", tag)} color="blue">
              {tag}
            </Tag>
          ))}
          <Input
            variant="borderless"
            size="small"
            value={categoryTagInput}
            onChange={(e) => setCategoryTagInput(e.target.value)}
            onPressEnter={() => handleAddTag("categories", categoryTagInput, setCategoryTagInput)}
            onBlur={() => handleAddTag("categories", categoryTagInput, setCategoryTagInput)}
            placeholder="Thêm phân loại..."
            style={{ flex: 1, minWidth: 100 }}
          />
        </div>
      </Form.Item>

      <Form.Item label="Điều kiện bảo quản">
        <Controller
          name="formattedStorageConditions"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value || ""}
              onChange={(html, plainText) => {
                field.onChange(html);
                setValue("storageConditions", plainText);
              }}
              placeholder="Nhập điều kiện bảo quản"
            />
          )}
        />
      </Form.Item>

      {showSupplyFields && (
        <Form.Item label="Trạng thái vô trùng">
          <Controller
            name="isSterile"
            control={control}
            render={({ field }) => (
              <Radio.Group
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <Radio value={true}>Đã tiệt trùng</Radio>
                <Radio value={false}>Chưa tiệt trùng</Radio>
              </Radio.Group>
            )}
          />
        </Form.Item>
      )}

      {showGhsField && (
        <Form.Item label="Mã nguy hiểm GHS/ MSDS">
          <Controller
            name="ghsCode"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value || ""} placeholder="VD: 64-17-5" />
            )}
          />
        </Form.Item>
      )}

      <Form.Item label="Tài liệu đính kèm (SDS/MSDS)">
        <AttachmentSection
          existingAttachments={existingAttachments}
          newAttachments={newAttachments}
          onAddAttachment={(att) => setNewAttachments((prev) => [...prev, att])}
          onRemoveExisting={(id) => {
            setExistingAttachments((prev) => prev.filter((a) => a.id !== id));
            setRemovedAttachmentIds((prev) => [...prev, id]);
          }}
          onRemoveNew={(fileId) =>
            setNewAttachments((prev) => prev.filter((a) => a.fileId !== fileId))
          }
        />
      </Form.Item>
    </>
  );
};

export default SharedFields;
