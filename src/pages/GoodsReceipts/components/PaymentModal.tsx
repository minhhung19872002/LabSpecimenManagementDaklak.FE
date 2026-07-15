import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button, Row, Col, Upload, message, Typography } from "antd";
import { UploadOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { getFileIcon, formatFileSize } from "../../../utils/fileUtils";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { paymentSchema, PaymentFormData } from "../schemas";
import { PAYMENT_METHOD_OPTIONS } from "../../../services/goodsReceiptService";
import { api } from "../../../services/api";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Text } = Typography;
const { Dragger } = Upload;

interface UploadedFile {
  uid: string;
  fileId: string;
  fileName: string;
  fileSize?: number;
}


interface PaymentModalProps {
  open: boolean;
  loading: boolean;
  totalAmount: number;
  totalPaid: number;
  onOk: (data: PaymentFormData) => void;
  onCancel: () => void;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const MAX_FILES = 5;

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  loading,
  totalAmount,
  totalPaid,
  onOk,
  onCancel,
}) => {
  const remaining = totalAmount - totalPaid;
  const [fileList, setFileList] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: yupResolver(paymentSchema) as any,
    defaultValues: {
      amount: 0,
      paymentMethod: 0,
      paymentDate: dayjs().format("YYYY-MM-DD"),
      phone: "",
      representativeName: "",
      notes: "",
      invoiceFiles: [],
    },
  });

  useEffect(() => {
    if (open) {
      setFileList([]);
      reset({
        amount: remaining,
        paymentMethod: 0,
        paymentDate: dayjs().format("YYYY-MM-DD"),
        phone: "",
        representativeName: "",
        notes: "",
        invoiceFiles: [],
      });
    }
  }, [open, remaining, reset]);

  const handleUploadFile = async (file: File, allFiles: File[]) => {
    const remaining = MAX_FILES - fileList.length;
    const idx = allFiles.indexOf(file);
    if (idx === 0 && allFiles.length > remaining) {
      message.warning(remaining <= 0
        ? `Đã đạt tối đa ${MAX_FILES} file`
        : `Chỉ có thể thêm ${remaining} file nữa`);
    }
    if (idx >= remaining) return false;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.upload<{ fileId: string; fileName: string; fileSize: number }>(
        "/api/v1/files/upload",
        formData
      );
      const newFile: UploadedFile = {
        uid: response.data.fileId,
        fileId: response.data.fileId,
        fileName: response.data.fileName,
        fileSize: response.data.fileSize,
      };
      setFileList((prev) => {
        const updated = prev.length >= MAX_FILES ? prev : [...prev, newFile];
        setValue("invoiceFiles", updated.map((f) => ({ fileId: f.fileId, fileName: f.fileName, fileSize: f.fileSize })), { shouldValidate: true });
        return updated;
      });
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Tải file thất bại");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleRemoveFile = (uid: string) => {
    setFileList((prev) => {
      const updated = prev.filter((f) => f.uid !== uid);
      setValue("invoiceFiles", updated.map((f) => ({ fileId: f.fileId, fileName: f.fileName, fileSize: f.fileSize })), { shouldValidate: true });
      return updated;
    });
  };

  const currentAmount = watch("amount") || 0;
  const afterPayment = remaining - currentAmount;

  return (
    <Modal
      title="Thanh toán"
      open={open}
      onCancel={onCancel}
      centered
      destroyOnClose
      width={600}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" } }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onCancel}>Đóng</Button>
          <Button type="primary" onClick={handleSubmit(onOk)} loading={loading}>
            Thanh toán
          </Button>
        </div>
      }
    >
      <Form layout="vertical" size="middle">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={<span>Phương thức thanh toán <span style={{ color: "#ff4d4f" }}>*</span></span>}
              validateStatus={errors.paymentMethod ? "error" : ""}
              help={errors.paymentMethod?.message}
            >
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select {...field} options={PAYMENT_METHOD_OPTIONS} />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label={<span>Ngày tất toán <span style={{ color: "#ff4d4f" }}>*</span></span>}
              validateStatus={errors.paymentDate ? "error" : ""}
              help={errors.paymentDate?.message}
            >
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.format("YYYY-MM-DD") || "")}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={<span>Số tiền thanh toán <span style={{ color: "#ff4d4f" }}>*</span></span>}
              validateStatus={errors.amount ? "error" : ""}
              help={errors.amount?.message}
              extra="Chỉ nhập số (VNĐ)"
            >
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: "100%" }}
                    placeholder="Nhập số tiền"
                    min={remaining > 0 ? 1 : 0}
                    max={remaining > 0 ? remaining : undefined}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => Number(value?.replace(/,/g, "") || 0)}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Tổng tiền">
              <InputNumber
                style={{ width: "100%" }}
                value={totalAmount}
                disabled
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                suffix="VNĐ"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Số tiền còn lại">
              <InputNumber
                style={{ width: "100%" }}
                value={Math.max(0, afterPayment)}
                disabled
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                suffix="VNĐ"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Điện thoại">
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input {...field} value={field.value || ""} placeholder="Nhập số điện thoại" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Người đại diện">
          <Controller
            name="representativeName"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value || ""} placeholder="Nhập tên người đại diện" />
            )}
          />
        </Form.Item>

        <Form.Item label="Ghi chú">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextArea {...field} value={field.value || ""} rows={3} placeholder="Nhập ghi chú (nếu có)" />
            )}
          />
        </Form.Item>

        {/* Invoice file upload */}
        <Form.Item
          label={<span>Hóa đơn đính kèm <span style={{ color: "#ff4d4f" }}>*</span></span>}
          validateStatus={errors.invoiceFiles ? "error" : ""}
          help={errors.invoiceFiles?.message as string}
        >
          {fileList.length < MAX_FILES && (
            <Dragger
              multiple
              showUploadList={false}
              beforeUpload={(file, list) => { handleUploadFile(file, list); return false; }}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.docx"
              disabled={uploading}
              style={{ marginBottom: fileList.length > 0 ? 8 : 0, borderRadius: 8 }}
            >
              <p className="ant-upload-drag-icon" style={{ margin: "8px 0 4px" }}>
                <UploadOutlined style={{ fontSize: 24, color: "#bbb" }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 13, margin: 0 }}>
                Kéo thả hoặc <strong>nhấn để tải lên</strong>
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 12, margin: "2px 0 8px", color: "#999" }}>
                PDF, DOCX, JPG, PNG · Tối đa {MAX_FILES} file · 10MB/file
              </p>
            </Dragger>
          )}
          {fileList.map((f) => (
            <div
              key={f.uid}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                border: "1px solid #f0f0f0",
                borderRadius: 10,
                marginBottom: 8,
                background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: "#FEF2F2",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {getFileIcon(f.fileName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 13, display: "block" }} ellipsis={{ tooltip: f.fileName }}>
                  {f.fileName}
                </Text>
                {f.fileSize && (
                  <Text type="secondary" style={{ fontSize: 11 }}>{formatFileSize(f.fileSize)}</Text>
                )}
              </div>
              <Button
                type="text" size="small" icon={<EyeOutlined />}
                onClick={() => window.open(`${BASE_URL}/api/v1/files/${f.fileId}`, "_blank")}
              />
              <Button
                type="text" size="small"
                icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                onClick={() => handleRemoveFile(f.uid)}
              />
            </div>
          ))}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PaymentModal;
