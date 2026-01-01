import React from "react";
import { Modal, Form, Row, Col, Select, Input, DatePicker } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import dayjs from "dayjs";
import { NCRSeverity, NCRStatus } from "../../../services/ncrService";
import { DepartmentDto } from "../../../services/masterDataService";
import { NCRFormData } from "../schemas";
import { NCR_TYPES } from "../hooks";

const { TextArea } = Input;

interface NCRFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: UseFormReturn<NCRFormData>;
  departments: DepartmentDto[];
  onCancel: () => void;
  onSubmit: (data: NCRFormData) => void;
}

const NCRFormModal: React.FC<NCRFormModalProps> = ({
  open,
  isEditing,
  form,
  departments,
  onCancel,
  onSubmit,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Modal
      title={isEditing ? "Cập nhật NCR" : "Tạo NCR mới"}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={onCancel}
      okText="Lưu"
      cancelText="Hủy"
      width={700}
      centered
      styles={{ body: { maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" } }}
    >
      <Form layout="vertical">
        <Form.Item
          label="Tiêu đề"
          required
          validateStatus={errors.title ? "error" : ""}
          help={errors.title?.message}
        >
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Mô tả ngắn gọn vấn đề" />
            )}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Loại NCR"
              required
              validateStatus={errors.type ? "error" : ""}
              help={errors.type?.message}
            >
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Chọn loại">
                    {NCR_TYPES.map((t) => (
                      <Select.Option key={t.value} value={t.value}>
                        {t.label}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Mức độ"
              required
              validateStatus={errors.severity ? "error" : ""}
              help={errors.severity?.message}
            >
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Chọn mức độ">
                    <Select.Option value={NCRSeverity.Minor}>Nhẹ</Select.Option>
                    <Select.Option value={NCRSeverity.Major}>Nghiêm trọng</Select.Option>
                    <Select.Option value={NCRSeverity.Critical}>Rất nghiêm trọng</Select.Option>
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Phòng ban">
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Chọn phòng ban" allowClear>
                    {departments.map((d) => (
                      <Select.Option key={d.id} value={d.name}>
                        {d.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Hạn xử lý"
              required
              validateStatus={errors.dueDate ? "error" : ""}
              help={errors.dueDate?.message}
            >
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.toDate() ?? null)}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Mã liên quan (Test/Specimen/Equipment)">
          <Controller
            name="relatedEntityCode"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value || ""} placeholder="TEST-xxx, SPE-xxx, EQP-xxx" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Mô tả chi tiết"
          required
          validateStatus={errors.description ? "error" : ""}
          help={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={3}
                placeholder="Mô tả chi tiết vấn đề không phù hợp"
              />
            )}
          />
        </Form.Item>

        {isEditing && (
          <>
            <Form.Item label="Người xử lý">
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <Input {...field} value={field.value || ""} placeholder="ID người xử lý" />
                )}
              />
            </Form.Item>

            <Form.Item label="Nguyên nhân gốc">
              <Controller
                name="rootCause"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    value={field.value || ""}
                    rows={2}
                    placeholder="Phân tích nguyên nhân gốc rễ"
                  />
                )}
              />
            </Form.Item>

            <Form.Item label="Hành động khắc phục">
              <Controller
                name="correctiveAction"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    value={field.value || ""}
                    rows={2}
                    placeholder="Mô tả các hành động khắc phục"
                  />
                )}
              />
            </Form.Item>

            <Form.Item label="Hành động phòng ngừa">
              <Controller
                name="preventiveAction"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    value={field.value || ""}
                    rows={2}
                    placeholder="Mô tả các hành động phòng ngừa"
                  />
                )}
              />
            </Form.Item>

            <Form.Item label="Trạng thái">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <Select.Option value={NCRStatus.Open}>Mở</Select.Option>
                    <Select.Option value={NCRStatus.InProgress}>Đang xử lý</Select.Option>
                    <Select.Option value={NCRStatus.Resolved}>Đã giải quyết</Select.Option>
                    <Select.Option value={NCRStatus.Closed}>Đã đóng</Select.Option>
                  </Select>
                )}
              />
            </Form.Item>
          </>
        )}

        <Form.Item label="Ghi chú">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextArea {...field} value={field.value || ""} rows={2} placeholder="Ghi chú bổ sung" />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NCRFormModal;
