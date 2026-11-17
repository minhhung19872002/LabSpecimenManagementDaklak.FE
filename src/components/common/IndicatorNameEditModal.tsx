import React, { useEffect, useState } from "react";
import { Alert, Button, Modal, Typography } from "antd";
import RichTextEditor from "./RichTextEditor";
import IndicatorName from "./IndicatorName";
import {
  CUSTOM_INDICATOR_NAME_MAX_LENGTH,
  CustomIndicatorName,
  isSameIndicatorName,
  toPlainIndicatorName,
} from "../../utils/indicatorName";

const { Text } = Typography;

export interface IndicatorNameEditModalProps {
  open: boolean;
  /** Tên đang dùng trên chứng từ */
  value?: CustomIndicatorName;
  /** Tên trong danh mục — để so sánh và "Khôi phục tên danh mục" */
  masterName?: { name: string; formattedName?: string | null };
  onOk: (value: CustomIndicatorName) => void;
  onCancel: () => void;
}

/**
 * Admin sửa tên chỉ tiêu trên chứng từ (phiếu thử nghiệm / báo giá). KHÔNG đổi danh mục.
 * Giá trị chỉ được lưu khi bấm nút lưu của chứng từ.
 */
const IndicatorNameEditModal: React.FC<IndicatorNameEditModalProps> = ({
  open,
  value,
  masterName,
  onOk,
  onCancel,
}) => {
  const [formattedName, setFormattedName] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    const initial = value ?? {
      name: masterName?.name || "",
      formattedName: masterName?.formattedName || masterName?.name || "",
    };
    setFormattedName(initial.formattedName);
    setName(initial.name);
  }, [open, value, masterName]);

  const plainName = name.replace(/\s+/g, " ").trim() || toPlainIndicatorName(formattedName);
  const error = !plainName
    ? "Tên chỉ tiêu không được để trống"
    : plainName.length > CUSTOM_INDICATOR_NAME_MAX_LENGTH
      ? `Tên chỉ tiêu tối đa ${CUSTOM_INDICATOR_NAME_MAX_LENGTH} ký tự (hiện ${plainName.length})`
      : undefined;
  const isMasterName = !!masterName && isSameIndicatorName({ name: plainName, formattedName }, masterName);

  const handleRestore = () => {
    if (!masterName) return;
    setFormattedName(masterName.formattedName || masterName.name);
    setName(masterName.name);
  };

  return (
    <Modal
      title="Sửa tên chỉ tiêu trên chứng từ"
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      centered
      width={560}
      footer={[
        <Button key="restore" onClick={handleRestore} disabled={!masterName || isMasterName}>
          Khôi phục tên danh mục
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="ok"
          type="primary"
          disabled={!!error}
          onClick={() => onOk({ name: plainName, formattedName: formattedName.trim() || plainName })}
        >
          Áp dụng
        </Button>,
      ]}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Chỉ đổi tên trên chứng từ này, không đổi danh mục. Tên mới được lưu khi bấm nút Lưu."
      />
      {masterName && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Tên danh mục: </Text>
          <IndicatorName name={masterName.name} formattedName={masterName.formattedName} />
        </div>
      )}
      <RichTextEditor
        value={formattedName}
        onChange={(html, plainText) => {
          setFormattedName(html);
          setName(plainText);
        }}
        placeholder="Tên chỉ tiêu"
      />
      {error && (
        <Text type="danger" style={{ display: "block", marginTop: 4 }}>
          {error}
        </Text>
      )}
    </Modal>
  );
};

export default IndicatorNameEditModal;
