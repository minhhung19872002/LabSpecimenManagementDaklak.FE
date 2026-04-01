import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Switch,
  Row,
  Col,
  Upload,
  Button,
  AutoComplete,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useForm, Controller } from "react-hook-form";
import "../Suppliers.css";
import { yupResolver } from "@hookform/resolvers/yup";
import { supplierSchema, SupplierFormData } from "../schemas";
import {
  SupplierDto,
  CreateUpdateSupplierDto,
  supplierService,
} from "../../../services/supplierService";
import type { UploadFile, RcFile } from "antd/es/upload";

const { TextArea } = Input;

interface SupplierModalProps {
  open: boolean;
  loading: boolean;
  editingSupplier: SupplierDto | null;
  onOk: (data: CreateUpdateSupplierDto) => void;
  onCancel: () => void;
}

const SupplierModal: React.FC<SupplierModalProps> = ({
  open,
  loading,
  editingSupplier,
  onOk,
  onCancel,
}) => {
  const [groupOptions, setGroupOptions] = useState<{ value: string }[]>([]);
  const [logoFileId, setLogoFileId] = useState<string | undefined>(undefined);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: yupResolver(supplierSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      taxCode: "",
      supplierGroup: "",
      phone: "",
      email: "",
      note: "",
      address: "",
      logoFileId: "",
      isActive: true,
    },
  });

  // Load supplier groups on modal open (with cleanup)
  useEffect(() => {
    if (open) {
      let cancelled = false;
      supplierService.getGroups().then((groups) => {
        if (!cancelled) {
          setGroupOptions(groups.map((g) => ({ value: g })));
        }
      }).catch(() => {
        if (!cancelled) {
          setGroupOptions([]);
        }
      });
      return () => { cancelled = true; };
    }
  }, [open]);

  // Reset form when modal opens/closes or editingSupplier changes
  useEffect(() => {
    if (open) {
      if (editingSupplier) {
        reset({
          code: editingSupplier.code || "",
          name: editingSupplier.name,
          taxCode: editingSupplier.taxCode || "",
          supplierGroup: editingSupplier.supplierGroup || "",
          phone: editingSupplier.phone || "",
          email: editingSupplier.email || "",
          note: editingSupplier.note || "",
          address: editingSupplier.address || "",
          logoFileId: editingSupplier.logoFileId || "",
          isActive: editingSupplier.isActive,
        });
        setLogoFileId(editingSupplier.logoFileId || undefined);
        const logoUrl = editingSupplier.logoUrl || (editingSupplier.logoFileId ? `/api/v1/files/${editingSupplier.logoFileId}` : undefined);
        setLogoPreviewUrl(logoUrl ? (logoUrl.startsWith("http") ? logoUrl : `${import.meta.env.VITE_API_BASE_URL || ""}${logoUrl}`) : undefined);
      } else {
        reset({
          code: "",
          name: "",
          taxCode: "",
          supplierGroup: "",
          phone: "",
          email: "",
          note: "",
          address: "",
          logoFileId: "",
          isActive: true,
        });
        setLogoFileId(undefined);
        setLogoPreviewUrl(undefined);
      }
    }
  }, [open, editingSupplier, reset]);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  const getLogoFullUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `${apiBaseUrl}${url}`;
  };

  const handleLogoUpload = async (file: RcFile) => {
    setUploading(true);
    try {
      const result = await supplierService.uploadLogo(file);
      setLogoFileId(result.fileId);
      setLogoPreviewUrl(getLogoFullUrl(result.url));
      setValue("logoFileId", result.fileId);
      message.success("Tải logo thành công");
    } catch {
      message.error("Không thể tải logo");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const onSubmit = (data: SupplierFormData) => {
    const payload: CreateUpdateSupplierDto = {
      code: data.code || undefined,
      name: data.name,
      taxCode: data.taxCode || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      logoFileId: logoFileId || undefined,
      supplierGroup: data.supplierGroup || undefined,
      note: data.note || undefined,
      isActive: data.isActive ?? true,
    };
    onOk(payload);
  };

  return (
    <Modal
      title={editingSupplier ? "Sửa nhà cung cấp" : "Tạo mới nhà cung cấp"}
      open={open}
      onCancel={onCancel}
      width="90vw"
      style={{ maxWidth: 700 }}
      centered
      destroyOnClose
      className="supplier-modal"
      styles={{ body: { maxHeight: "78vh", overflowY: "auto", overflowX: "hidden" } }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onCancel}>Hủy</Button>
          <Button
            type="primary"
            onClick={handleSubmit(onSubmit)}
            loading={loading}
          >
            Lưu
          </Button>
        </div>
      }
    >
      <Form layout="vertical" size="middle">
        <Row gutter={24}>
          {/* Left column */}
          <Col xs={24} sm={14}>
            <Form.Item
              label="ID nhà cung cấp"
              style={{ marginBottom: 16 }}
            >
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Hệ thống tự tạo nếu để trống"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Tên nhà cung cấp <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
              }
              validateStatus={errors.name ? "error" : ""}
              help={errors.name?.message}
              style={{ marginBottom: 16 }}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Nhập tên nhà cung cấp" />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Mã số thuế"
              style={{ marginBottom: 16 }}
            >
              <Controller
                name="taxCode"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Nhập mã số thuế"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Nhóm NCC"
              style={{ marginBottom: 16 }}
            >
              <Controller
                name="supplierGroup"
                control={control}
                render={({ field }) => (
                  <AutoComplete
                    {...field}
                    value={field.value || ""}
                    options={groupOptions}
                    placeholder="Chọn hoặc nhập nhóm NCC"
                    filterOption={(inputValue, option) =>
                      (option?.value as string)
                        ?.toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Số điện thoại <span style={{ color: "#ff4d4f" }}>*</span>
                </span>
              }
              validateStatus={errors.phone ? "error" : ""}
              help={errors.phone?.message}
              style={{ marginBottom: 16 }}
            >
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Nhập số điện thoại"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              validateStatus={errors.email ? "error" : ""}
              help={errors.email?.message}
              style={{ marginBottom: 16 }}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Nhập email"
                  />
                )}
              />
            </Form.Item>

          </Col>

          {/* Right column */}
          <Col xs={24} sm={10}>
            <Form.Item label="Logo" style={{ marginBottom: 16 }}>
              <Upload
                showUploadList={false}
                beforeUpload={handleLogoUpload}
                accept="image/*"
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    border: "1px dashed #d9d9d9",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    overflow: "hidden",
                    background: logoPreviewUrl ? "transparent" : "#fafafa",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1677ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d9d9d9"; }}
                >
                  {uploading ? (
                    <span style={{ color: "#999", fontSize: 13 }}>Đang tải...</span>
                  ) : logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt="Logo"
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }}
                    />
                  ) : (
                    <>
                      <UploadOutlined style={{ fontSize: 24, color: "#999", marginBottom: 4 }} />
                      <span style={{ fontSize: 12, color: "#999" }}>Tải ảnh lên</span>
                    </>
                  )}
                </div>
              </Upload>
            </Form.Item>

            <Form.Item label="Địa chỉ" style={{ marginBottom: 16 }}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    value={field.value || ""}
                    rows={4}
                    placeholder="Nhập địa chỉ"
                  />
                )}
              />
            </Form.Item>

            <div
              style={{
                background: "#f8f8f8",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Trạng thái</div>
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                    <div style={{ color: "#888", fontSize: 13 }}>Cho phép nhà cung cấp hoạt động</div>
                  </div>
                )}
              />
            </div>
          </Col>
        </Row>

        {/* Ghi chú - full width */}
        <Form.Item
          label="Ghi chú"
          validateStatus={errors.note ? "error" : ""}
          help={errors.note?.message}
          style={{ marginBottom: 16 }}
        >
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                value={field.value || ""}
                rows={3}
                placeholder="Nhập ghi chú thêm về nhà cung cấp..."
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SupplierModal;
