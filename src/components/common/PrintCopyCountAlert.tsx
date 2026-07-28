import React from "react";
import { Alert } from "antd";
import { PrinterOutlined } from "./Icon";
import { getPrintCopyCount } from "../../utils/formatters";

export interface PrintCopyCountAlertProps {
  /** Field "Số bản" (free-text) từ TestRequest - section Yêu cầu về kết quả */
  resultCopyCount?: string | null;
}

/**
 * Cảnh báo số bản cần in cho mỗi phiếu kết quả trong màn "Kết quả đã tạo".
 * Số bản >= 2 → hiển thị đúng số đã nhập; ngược lại → 1.
 */
const PrintCopyCountAlert: React.FC<PrintCopyCountAlertProps> = ({
  resultCopyCount,
}) => {
  const copyCount = getPrintCopyCount(resultCopyCount);
  return (
    <Alert
      type="warning"
      showIcon
      icon={<PrinterOutlined />}
      message={`Lưu ý: In ${copyCount} bản cho mỗi phiếu kết quả`}
      style={{ marginBottom: 12 }}
    />
  );
};

export default PrintCopyCountAlert;
