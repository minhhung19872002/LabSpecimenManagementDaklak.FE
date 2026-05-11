import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Typography,
  Button,
  Upload,
  Spin,
  message,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  equipmentService,
  EquipmentDto,
  EquipmentStatus,
  EquipmentStatusLabels,
  EQUIPMENT_STATUS_OPTIONS,
  ALLOWED_STATUS_TRANSITIONS,
  EquipmentAttachmentDto,
  CreateEquipmentAttachmentDto,
} from "../../../services/equipmentService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import "../Equipments.css";

const { Text, Title } = Typography;
const { Dragger } = Upload;

interface Props {
  open: boolean;
  equipmentId?: string;
  onClose: () => void;
  onUpdated: () => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FilePdfOutlined style={{ fontSize: 20, color: "#e74c3c" }} />;
  if (ext === "docx" || ext === "doc") return <FileWordOutlined style={{ fontSize: 20, color: "#2b579a" }} />;
  return <FileImageOutlined style={{ fontSize: 20, color: "#1890ff" }} />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileCard: React.FC<{
  fileName: string;
  fileSize?: number;
  fileType?: string;
  onPreview?: () => void;
  onRemove?: () => void;
}> = ({ fileName, fileSize, fileType, onPreview, onRemove }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      border: "1px solid #f0f0f0",
      borderRadius: 10,
      marginBottom: 8,
      background: "#fff",
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 8,
        background: "#FEF2F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {getFileIcon(fileName)}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Text strong style={{ fontSize: 13, display: "block" }} ellipsis>
        {fileName}
      </Text>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
        {fileType && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            Loại: {fileType}
          </Text>
        )}
        {fileSize != null && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {formatFileSize(fileSize)}
          </Text>
        )}
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
      {onPreview && (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={onPreview} style={{ color: "#1677ff", fontSize: 13 }}>
          Xem trước
        </Button>
      )}
      {onRemove && (
        <Button type="text" size="small" icon={<DeleteOutlined />} onClick={onRemove} style={{ color: "#ff4d4f" }} />
      )}
    </div>
  </div>
);

const EquipmentDetailModal: React.FC<Props> = ({ open, equipmentId, onClose, onUpdated }) => {
  const [equipment, setEquipment] = useState<EquipmentDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>(EquipmentStatus.InStock);
  const [originalStatus, setOriginalStatus] = useState<EquipmentStatus>(EquipmentStatus.InStock);
  const [manufacturer, setManufacturer] = useState("");
  const [origin, setOrigin] = useState("");
  const [model, setModel] = useState("");
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState<dayjs.Dayjs | null>(null);
  const [notes, setNotes] = useState("");

  const [existingAttachments, setExistingAttachments] = useState<EquipmentAttachmentDto[]>([]);
  const [newAttachments, setNewAttachments] = useState<CreateEquipmentAttachmentDto[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);

  const [receiptLockedFields, setReceiptLockedFields] = useState<Set<string>>(new Set());

  const canEdit = authService.hasPermission(PERMISSIONS.Equipments.Edit);
  const canUpdateStatus = authService.hasPermission(PERMISSIONS.Equipments.UpdateStatus);

  const isFieldLocked = (field: string) => !canEdit || receiptLockedFields.has(field);

  useEffect(() => {
    if (open && equipmentId) {
      loadEquipment(equipmentId);
    } else {
      resetForm();
    }
  }, [open, equipmentId]);

  const resetForm = () => {
    setEquipment(null);
    setName("");
    setSerialNumber("");
    setStatus(EquipmentStatus.InStock);
    setOriginalStatus(EquipmentStatus.InStock);
    setManufacturer("");
    setOrigin("");
    setModel("");
    setWarrantyExpiryDate(null);
    setNotes("");
    setExistingAttachments([]);
    setNewAttachments([]);
    setRemovedAttachmentIds([]);
    setReceiptLockedFields(new Set());
  };

  const loadEquipment = async (id: string) => {
    setLoading(true);
    try {
      const data = await equipmentService.get(id);
      setEquipment(data);
      setName(data.name);
      setSerialNumber(data.serialNumber);
      setStatus(data.status);
      setOriginalStatus(data.status);
      setManufacturer(data.manufacturer || "");
      setOrigin(data.origin || "");
      setModel(data.model || "");
      setWarrantyExpiryDate(data.warrantyExpiryDate ? dayjs(data.warrantyExpiryDate) : null);
      setNotes(data.notes || "");
      setExistingAttachments(data.attachments || []);
      setNewAttachments([]);
      setRemovedAttachmentIds([]);

      if (data.goodsReceiptId) {
        const locked = new Set<string>();
        if (data.name) locked.add("name");
        if (data.serialNumber) locked.add("serialNumber");
        if (data.model) locked.add("model");
        if (data.manufacturer) locked.add("manufacturer");
        if (data.lotNumber) locked.add("lotNumber");
        if (data.lotExpiryDate) locked.add("lotExpiryDate");
        setReceiptLockedFields(locked);
      } else {
        setReceiptLockedFields(new Set());
      }
    } catch {
      message.error("Không thể tải thông tin thiết bị");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = canUpdateStatus
    ? [
        { value: originalStatus, label: EquipmentStatusLabels[originalStatus] },
        ...ALLOWED_STATUS_TRANSITIONS[originalStatus].map((s) => ({
          value: s,
          label: EquipmentStatusLabels[s],
        })),
      ]
    : EQUIPMENT_STATUS_OPTIONS;

  const handleUpload = async (file: File) => {
    try {
      const result = await equipmentService.uploadFile(file);
      setNewAttachments((prev) => [...prev, {
        fileId: result.fileId,
        fileName: result.fileName,
        fileSize: result.fileSize,
      }]);
      message.success(`Đã tải lên ${file.name}`);
    } catch {
      message.error("Không thể tải lên file");
    }
    return false;
  };

  const handleSave = async () => {
    if (!equipment) return;
    if (!name.trim()) { message.warning("Vui lòng nhập tên thiết bị"); return; }
    if (!serialNumber.trim()) { message.warning("Vui lòng nhập serial number"); return; }

    setSaving(true);
    try {
      if (status !== originalStatus && canUpdateStatus) {
        await equipmentService.updateStatus(equipment.id, { status, notes: notes || undefined });
      }

      for (const id of removedAttachmentIds) {
        await equipmentService.deleteAttachment(equipment.id, id);
      }

      await equipmentService.update(equipment.id, {
        name: name.trim(),
        serialNumber: serialNumber.trim(),
        model: model.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        origin: origin.trim() || undefined,
        warrantyExpiryDate: warrantyExpiryDate?.format("YYYY-MM-DD") || undefined,
        price: equipment.price,
        notes: notes.trim() || undefined,
        attachments: [
          ...existingAttachments.map((a) => ({
            fileId: a.fileId,
            fileName: a.fileName,
            fileSize: a.fileSize,
            fileType: a.fileType,
          })),
          ...newAttachments,
        ],
      });

      message.success("Đã cập nhật thiết bị");
      onUpdated();
      onClose();
    } catch {
      message.error("Không thể cập nhật thiết bị");
    } finally {
      setSaving(false);
    }
  };

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: 900 }}
      centered
      destroyOnClose
      className="equipment-detail-modal"
      styles={{
        body: { maxHeight: "78vh", overflowY: "auto", overflowX: "hidden", padding: "0 4px 0px" },
        header: { padding: "20px 24px 0", marginBottom: 0, borderBottom: "none" },
      }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 0" }}>
          <Button onClick={onClose}>Hủy bỏ</Button>
          {canEdit && (
            <Button type="primary" onClick={handleSave} loading={saving}>
              Lưu &amp; Đóng
            </Button>
          )}
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Spin /></div>
      ) : equipment ? (
        <>
          <div style={{ marginBottom: 20 }}>
            <Title level={4} style={{ margin: 0 }}>Chi tiết thông tin thiết bị</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Điền thông tin chi tiết</Text>
          </div>

          <Form layout="vertical" size="middle">
            <Row gutter={16}>
              <Col xs={24} sm={24} md={10}>
                <Form.Item label={<Text strong>Tên thiết bị <Text type="danger">*</Text></Text>} style={{ marginBottom: 16 }}>
                  <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isFieldLocked("name")} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={7}>
                <Form.Item label={<Text strong>Serial number <Text type="danger">*</Text></Text>} style={{ marginBottom: 16 }}>
                  <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} disabled={isFieldLocked("serialNumber")} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={7}>
                <Form.Item label={<Text strong>Trạng thái</Text>} style={{ marginBottom: 16 }}>
                  <Select
                    value={status}
                    onChange={setStatus}
                    disabled={!canUpdateStatus || equipment.status === EquipmentStatus.Disposed}
                    options={statusOptions}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={24} md={8}>
                <Form.Item label={<Text strong>Nhà cung cấp</Text>} style={{ marginBottom: 16 }}>
                  <Input value={equipment.supplierName || ""} disabled />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item label={<Text strong>Hãng sản xuất</Text>} style={{ marginBottom: 16 }}>
                  <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} disabled={isFieldLocked("manufacturer")} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item label={<Text strong>Xuất xứ</Text>} style={{ marginBottom: 16 }}>
                  <Input value={origin} onChange={(e) => setOrigin(e.target.value)} disabled={!canEdit} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={12} sm={12} md={6}>
                <Form.Item label={<Text strong>Hạn bảo hành</Text>} style={{ marginBottom: 16 }}>
                  <DatePicker
                    value={warrantyExpiryDate}
                    onChange={setWarrantyExpiryDate}
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                    disabled={!canEdit}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} sm={12} md={6}>
                <Form.Item label={<Text strong>Model</Text>} style={{ marginBottom: 16 }}>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} disabled={isFieldLocked("model")} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={12} md={6}>
                <Form.Item label={<Text strong>Lượt sử dụng</Text>} style={{ marginBottom: 16 }}>
                  <InputNumber value={equipment.usageCount} disabled style={{ width: "100%" }} controls={false} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={12} md={6}>
                <Form.Item label={<Text strong>Lượt bảo dưỡng</Text>} style={{ marginBottom: 16 }}>
                  <InputNumber value={equipment.maintenanceCount} disabled style={{ width: "100%" }} controls={false} />
                </Form.Item>
              </Col>
            </Row>

            <Text strong style={{ display: "block", marginBottom: 12 }}>Tài liệu đính kèm</Text>
            {canEdit && (
              <Dragger
                multiple
                showUploadList={false}
                beforeUpload={(file) => { handleUpload(file); return false; }}
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                style={{ marginBottom: 12, borderRadius: 8 }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 32, color: "#bbb" }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 13, margin: 0 }}>
                  Kéo thả file hoặc <strong>nhấn để tải lên</strong>
                </p>
                <p className="ant-upload-hint" style={{ fontSize: 12, margin: "4px 0 0", color: "#999" }}>
                  Hỗ trợ PDF, DOCX, JPG (Tối đa 10MB)
                </p>
              </Dragger>
            )}

            {existingAttachments.map((att) => (
              <FileCard
                key={att.id}
                fileName={att.fileName}
                fileSize={att.fileSize}
                fileType={att.fileType}
                onPreview={() => window.open(`${baseUrl}${att.url}`, "_blank")}
                onRemove={canEdit ? () => {
                  setExistingAttachments((prev) => prev.filter((a) => a.id !== att.id));
                  setRemovedAttachmentIds((prev) => [...prev, att.id]);
                } : undefined}
              />
            ))}

            {newAttachments.map((att) => (
              <FileCard
                key={att.fileId}
                fileName={att.fileName}
                fileSize={att.fileSize}
                fileType={att.fileType}
                onRemove={() => setNewAttachments((prev) => prev.filter((a) => a.fileId !== att.fileId))}
              />
            ))}
          </Form>
        </>
      ) : null}
    </Modal>
  );
};

export default EquipmentDetailModal;
