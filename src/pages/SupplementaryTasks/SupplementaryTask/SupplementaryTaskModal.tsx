import React, { useEffect, useState } from "react";
import {
  Button, Checkbox, Col, Form, Image, Input, Modal, Row, Select, Space, Upload, message,
} from "antd";
import DatePicker from "antd/es/date-picker";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import {
  CreateSupplementaryTaskDto,
  SupplementaryTaskDto,
  SupplementaryTaskPriority,
  SupplementaryTaskStatus,
  UpdateSupplementaryTaskDto,
} from "../../../services/supplementaryTaskService";
import { fileService } from "../../../services/fileService";
import { clearableSelectProps } from "../../../utils/formHelpers";
import { PRIORITY_OPTIONS, STATUS_OPTIONS_EDIT } from "./utils";

interface FormValues {
  title: string;
  description?: string;
  assignedToId: string;
  dueDate?: string;
  priority: SupplementaryTaskPriority;
  status: SupplementaryTaskStatus;
  isPrivate: boolean;
}

interface UploadedImage {
  fileId: string;
  url: string;
}

export interface SupplementaryTaskModalProps {
  open: boolean;
  editingItem?: SupplementaryTaskDto;
  employeeOptions: { label: string; value: string }[];
  onClose: () => void;
  onSaved: () => void;
  onCreate: (input: CreateSupplementaryTaskDto) => Promise<void>;
  onUpdate: (id: string, input: UpdateSupplementaryTaskDto) => Promise<void>;
}

const SupplementaryTaskModal: React.FC<SupplementaryTaskModalProps> = ({
  open,
  editingItem,
  employeeOptions,
  onClose,
  onSaved,
  onCreate,
  onUpdate,
}) => {
  const isEdit = !!editingItem;
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      assignedToId: "",
      dueDate: undefined,
      priority: SupplementaryTaskPriority.Medium,
      status: SupplementaryTaskStatus.Pending,
      isPrivate: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && editingItem) {
      reset({
        title: editingItem.title,
        description: editingItem.description ?? "",
        assignedToId: editingItem.assignedToId,
        dueDate: editingItem.dueDate ?? undefined,
        priority: editingItem.priority,
        status: editingItem.status,
        isPrivate: editingItem.isPrivate,
      });
      setImages(editingItem.imageUrls.map((url) => ({ fileId: url, url })));
    } else {
      reset({
        title: "",
        description: "",
        assignedToId: "",
        dueDate: undefined,
        priority: SupplementaryTaskPriority.Medium,
        status: SupplementaryTaskStatus.Pending,
        isPrivate: false,
      });
      setImages([]);
    }
  }, [open, editingItem, isEdit, reset]);

  const handleUpload = async (file: File, fileList: File[]) => {
    const remaining = 5 - images.length;
    const idx = fileList.indexOf(file);
    if (idx === 0 && fileList.length > remaining) {
      message.warning(remaining <= 0 ? "Đã đạt tối đa 5 hình ảnh." : `Chỉ có thể thêm ${remaining} hình nữa.`);
    }
    if (idx >= remaining) return false;
    if (!file.type.startsWith("image/")) { message.error(`${file.name}: Chỉ chấp nhận file hình ảnh`); return false; }
    if (file.size > 10 * 1024 * 1024) { message.error(`${file.name}: Kích thước tối đa 10MB`); return false; }

    setUploading(true);
    try {
      const result = await fileService.uploadImage(file);
      const url = fileService.getFileUrl(result.fileId);
      setImages((prev) => prev.length >= 5 ? prev : [...prev, { fileId: result.fileId, url }]);
    } catch {
      message.error(`Upload ${file.name} thất bại`);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const onSubmit = async (data: FormValues) => {
    if (!data.assignedToId) { message.error("Vui lòng chọn nhân viên"); return; }
    setSubmitting(true);
    try {
      const imageUrls = images.map((i) => i.url);
      if (isEdit && editingItem) {
        await onUpdate(editingItem.id, {
          title: data.title,
          description: data.description || undefined,
          assignedToId: data.assignedToId,
          dueDate: data.dueDate || undefined,
          priority: data.priority,
          status: data.status,
          isPrivate: data.isPrivate,
          imageUrls,
        });
      } else {
        await onCreate({
          title: data.title,
          description: data.description || undefined,
          assignedToId: data.assignedToId,
          dueDate: data.dueDate || undefined,
          priority: data.priority,
          isPrivate: data.isPrivate,
          imageUrls,
        });
      }
      onSaved();
      onClose();
    } catch {
      message.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Chỉnh sửa công việc" : "Giao công việc mới"}
      width={680}
      centered
      onCancel={onClose}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEdit ? "Lưu" : "Giao việc"}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" style={{ marginTop: 8 }}>
        {/* Tên công việc */}
        <Form.Item
          label="Tên công việc"
          required
          validateStatus={errors.title ? "error" : ""}
          help={errors.title?.message}
        >
          <Controller
            name="title"
            control={control}
            rules={{ required: "Vui lòng nhập tên công việc" }}
            render={({ field }) => (
              <Input {...field} placeholder="Nhập tên công việc" maxLength={500} />
            )}
          />
        </Form.Item>

        {/* Mô tả */}
        <Form.Item label="Mô tả">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea {...field} rows={3} maxLength={2000} showCount placeholder="Mô tả chi tiết công việc" />
            )}
          />
        </Form.Item>

        <Row gutter={16}>
          {/* Giao cho */}
          <Col xs={24} sm={14}>
            <Form.Item
              label="Giao cho"
              required
              validateStatus={errors.assignedToId ? "error" : ""}
              help={errors.assignedToId?.message}
            >
              <Controller
                name="assignedToId"
                control={control}
                rules={{ required: "Vui lòng chọn nhân viên" }}
                render={({ field }) => (
                  <Select
                    {...clearableSelectProps(field)}
                    options={employeeOptions}
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn nhân viên"
                  />
                )}
              />
            </Form.Item>
          </Col>

          {/* Mức ưu tiên */}
          <Col xs={24} sm={10}>
            <Form.Item label="Mức ưu tiên">
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select {...clearableSelectProps(field)} options={PRIORITY_OPTIONS} placeholder="Chọn mức ưu tiên" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Công việc giao riêng */}
          <Col xs={24} sm={14}>
            <Form.Item label="Công việc giao riêng">
              <Controller
                name="isPrivate"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  >
                    <span style={{ color: "#8c8c8c", fontSize: 13 }}>
                      Chỉ người được giao và Ban giám đốc có thể xem
                    </span>
                  </Checkbox>
                )}
              />
            </Form.Item>
          </Col>

          {/* Hạn hoàn thành */}
          <Col xs={24} sm={10}>
            <Form.Item label="Hạn hoàn thành">
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày hết hạn"
                    disabledDate={(current) => !isEdit && current && current < dayjs().startOf("day")}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Trạng thái — chỉ hiện khi edit */}
        {isEdit && (
          <Row>
            <Col xs={24}>
              <Form.Item label="Trạng thái">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onChange={field.onChange} options={STATUS_OPTIONS_EDIT} placeholder="Chọn trạng thái" style={{ width: "100%" }} />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Hình ảnh */}
        <Form.Item
          label={
            <span>
              Hình ảnh đính kèm{" "}
              <span style={{ color: "#8c8c8c", fontWeight: 400, fontSize: 13 }}>(Tùy chọn, tối đa 5 ảnh)</span>
            </span>
          }
          style={{ marginBottom: 0 }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Image.PreviewGroup>
              {images.map((img, index) => (
                <div key={img.fileId} style={{ position: "relative", display: "inline-block" }}>
                  <Image
                    src={img.url}
                    alt={`Hình ${index + 1}`}
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 6 }}
                  />
                  <Button
                    type="text" danger size="small" icon={<CloseOutlined />}
                    onClick={() => setImages((prev) => prev.filter((i) => i.fileId !== img.fileId))}
                    style={{
                      position: "absolute", top: -8, right: -8, background: "white",
                      borderRadius: "50%", padding: 0, width: 20, height: 20, minWidth: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              ))}
            </Image.PreviewGroup>
            {images.length < 5 && (
              <Upload accept="image/*" multiple showUploadList={false} beforeUpload={handleUpload} disabled={uploading}>
                <div
                  style={{
                    width: 100, height: 100, border: "1px dashed #d9d9d9", borderRadius: 6,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: uploading ? "not-allowed" : "pointer", background: "#fafafa", gap: 4,
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  <PlusOutlined style={{ fontSize: 20, color: "#8c8c8c" }} />
                  <span style={{ fontSize: 12, color: "#8c8c8c" }}>Upload</span>
                </div>
              </Upload>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SupplementaryTaskModal;
