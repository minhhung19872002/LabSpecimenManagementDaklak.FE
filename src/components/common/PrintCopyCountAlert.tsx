import React from "react";
import { Alert, Col, Row, Typography } from "antd";
import { PrinterOutlined } from "./Icon";
import { getPrintCopyCount } from "../../utils/formatters";
import { ResultLanguage } from "../../types/testRequest";

const { Text } = Typography;

const LANG_MAP: Record<ResultLanguage, string> = {
  [ResultLanguage.Vietnamese]: "Tiếng Việt",
  [ResultLanguage.English]: "Tiếng Anh",
  [ResultLanguage.VietnameseAndEnglish]: "Tiếng Việt/Anh",
};

export interface PrintCopyCountAlertProps {
  resultCopyCount?: string | null;
  resultLanguage?: ResultLanguage;
  conformityDeclaration?: string;
  otherRequirements?: string;
  separatePassedResults?: boolean;
}

const PrintCopyCountAlert: React.FC<PrintCopyCountAlertProps> = ({
  resultCopyCount,
  resultLanguage,
  conformityDeclaration,
  otherRequirements,
  separatePassedResults,
}) => {
  const copyCount = getPrintCopyCount(resultCopyCount);

  const lines: { label: string; value: string }[] = [];
  if (resultLanguage != null) {
    lines.push({ label: "Ngôn ngữ", value: LANG_MAP[resultLanguage] || "Tiếng Việt" });
  }
  if (conformityDeclaration) {
    lines.push({ label: "Công bố hợp quy", value: conformityDeclaration });
  }
  if (otherRequirements) {
    lines.push({ label: "Yêu cầu khác", value: otherRequirements });
  }
  if (separatePassedResults) {
    lines.push({ label: "Tách riêng CT đạt", value: "Có" });
  }

  return (
    <Alert
      type="warning"
      showIcon
      icon={<PrinterOutlined />}
      message={`Lưu ý: In ${copyCount} bản cho mỗi phiếu kết quả`}
      description={
        lines.length > 0 ? (
          <Row gutter={[16, 4]} style={{ marginTop: 4 }}>
            {lines.map((item) => (
              <Col key={item.label} xs={24} sm={12} style={{ lineHeight: "24px" }}>
                <Text type="secondary" style={{ fontSize: 13 }}>{item.label}:</Text>{" "}
                <Text strong style={{ fontSize: 13 }}>{item.value}</Text>
              </Col>
            ))}
          </Row>
        ) : undefined
      }
      style={{ marginBottom: 12 }}
    />
  );
};

export default PrintCopyCountAlert;
