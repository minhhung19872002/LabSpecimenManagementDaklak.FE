import { Modal, Form, Select, Tooltip, Button, Divider } from "antd";
import { Controller, UseFormReturn, useFieldArray } from "react-hook-form";
import Icon, { DeleteOutlined, PlusOutlined } from "../../../../components/common/Icon";
import { IndicatorDto } from "../types";
import { IndicatorFormData } from "../schemas/indicatorSchema";
import { RichTextEditor } from "../../../../components/common";
import { clearableSelectProps } from "../../../../utils/formHelpers";

interface SelectOption {
  value: string;
  label: string;
}

interface IndicatorModalProps {
  open: boolean;
  loading: boolean;
  editingIndicator: IndicatorDto | null;
  form: UseFormReturn<IndicatorFormData>;
  groupOptions: SelectOption[];
  laboratoryOptions: SelectOption[];
  onOk: (data: IndicatorFormData) => void;
  onCancel: () => void;
}

const IndicatorModal: React.FC<IndicatorModalProps> = ({
  open,
  loading,
  editingIndicator,
  form,
  groupOptions,
  laboratoryOptions,
  onOk,
  onCancel,
}) => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subIndicators",
  });

  return (
    <Modal
      title={editingIndicator ? "Sửa chỉ tiêu" : "Thêm chỉ tiêu mới"}
      open={open}
      onOk={handleSubmit(onOk)}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editingIndicator ? "Cập nhật" : "Thêm mới"}
      cancelText="Hủy"
      width={680}
      centered
      styles={{ body: { paddingTop: 16, maxHeight: "70vh", overflowY: "auto" } }}
    >
      <Form layout="vertical">
        <Form.Item
          label="Nhóm chỉ tiêu"
          validateStatus={errors.indicatorGroupId ? "error" : ""}
          help={errors.indicatorGroupId?.message}
        >
          <Controller
            name="indicatorGroupId"
            control={control}
            render={({ field }) => (
              <Select
                {...clearableSelectProps(field)}
                placeholder="Không phân nhóm"
                allowClear
                showSearch
                optionFilterProp="label"
                options={groupOptions}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label="Khoa phòng thực hiện"
          required
          validateStatus={errors.laboratoryId ? "error" : ""}
          help={errors.laboratoryId?.message}
        >
          <Controller
            name="laboratoryId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Chọn khoa phòng"
                showSearch
                optionFilterProp="label"
                options={laboratoryOptions}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={
            <span>
              Tên chỉ tiêu{" "}
              <Tooltip
                title={
                  <div>
                    <div>Phím tắt định dạng:</div>
                    <div>Ctrl+B: Đậm</div>
                    <div>Ctrl+I: Nghiêng</div>
                    <div>Ctrl+U: Gạch chân</div>
                    <div>Ctrl+,: Chỉ số dưới (x₂)</div>
                    <div>Ctrl+.: Chỉ số trên (x²)</div>
                  </div>
                }
              >
                <span style={{ cursor: "help" }}>
                  <Icon name="info-circle" style={{ color: "#8c8c8c" }} />
                </span>
              </Tooltip>
            </span>
          }
          required
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
                placeholder="Tên chỉ tiêu"
              />
            )}
          />
        </Form.Item>

        {/* Sub-indicators section - only show when editing */}
        {editingIndicator && (
          <>
            <Divider style={{ margin: "12px 0" }} />
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>Chỉ tiêu phụ</span>
              <span style={{ color: "#8c8c8c", marginLeft: 8, fontSize: 12 }}>
                (Kế thừa phương pháp thử và ĐVT từ chỉ tiêu cha)
              </span>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <Form.Item
                    validateStatus={
                      errors.subIndicators?.[index]?.name ? "error" : ""
                    }
                    help={errors.subIndicators?.[index]?.name?.message}
                    style={{ marginBottom: 0 }}
                  >
                    <Controller
                      name={`subIndicators.${index}.formattedName`}
                      control={control}
                      render={({ field: subField }) => (
                        <RichTextEditor
                          value={subField.value || ""}
                          onChange={(html, plainText) => {
                            subField.onChange(html);
                            setValue(`subIndicators.${index}.name`, plainText);
                          }}
                          placeholder={`Chỉ tiêu phụ ${index + 1}`}
                        />
                      )}
                    />
                  </Form.Item>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => remove(index)}
                  style={{ marginTop: 4 }}
                />
              </div>
            ))}

            <Button
              type="dashed"
              onClick={() => append({ name: "", formattedName: "" })}
              icon={<PlusOutlined />}
              block
              style={{ marginBottom: 12 }}
            >
              Thêm chỉ tiêu phụ
            </Button>
          </>
        )}

        <Form.Item label="Trạng thái">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Select {...field}>
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Ngừng</Select.Option>
              </Select>
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IndicatorModal;
