import React, { useEffect, useRef, useState } from "react";
import { Button, Collapse, Empty, Modal, Space, Tag } from "antd";
import JsBarcode from "jsbarcode";
import "../../pages/Products/ProductDetail.css";

export interface BarcodePrintSection {
  key: string;
  header: string;
  barcodes: string[];
}

export interface BarcodePrintModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  printTitle: string;
  sections: BarcodePrintSection[];
  emptyText?: string;
}

const BARCODE_SCREEN_OPTIONS = {
  format: "CODE128" as const,
  width: 2,
  height: 60,
  displayValue: true,
  fontSize: 14,
  margin: 4,
};

const BARCODE_PRINT_OPTIONS = {
  format: "CODE128" as const,
  width: 1.5,
  height: 50,
  displayValue: true,
  fontSize: 12,
  margin: 5,
};

const generateBarcodeSvgMarkup = (content: string): string => {
  try {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svgEl, content, BARCODE_PRINT_OPTIONS);
    return svgEl.outerHTML;
  } catch {
    return `<div style="color:red;font-size:12px">Không thể tạo barcode: ${content}</div>`;
  }
};

const BarcodeDisplay: React.FC<{ content: string }> = ({ content }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, content, BARCODE_SCREEN_OPTIONS);
        setError(false);
      } catch {
        setError(true);
      }
    }
  }, [content]);

  if (error) {
    return <div style={{ color: "#ff4d4f", fontSize: 12 }}>Không thể tạo barcode: {content}</div>;
  }

  return <svg ref={svgRef} style={{ maxWidth: "100%", height: "auto" }} />;
};

const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  open,
  onClose,
  title,
  printTitle,
  sections,
  emptyText = "Chưa có barcode",
}) => {
  const allBarcodes = sections.flatMap((s) => s.barcodes);
  const isEmpty = allBarcodes.length === 0;

  const handlePrint = () => {
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const printWindow = window.open(
      "",
      "barcode_print",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
    if (!printWindow) return;

    const barcodeHtml = sections
      .map((section) => {
        const barcodes = section.barcodes
          .map((content) => {
            const svgMarkup = generateBarcodeSvgMarkup(content);
            return `<div class="barcode-item">${svgMarkup}</div>`;
          })
          .join("");
        return `
          <div class="section">
            <div class="section-header">${section.header}</div>
            ${barcodes}
          </div>`;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>In nhãn - ${printTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
          .actions { text-align: center; margin-bottom: 20px; }
          .btn { padding: 8px 20px; margin: 0 5px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
          .btn-print { background: #1890ff; color: white; }
          .btn-close { background: #fff; color: #666; border: 1px solid #d9d9d9; }
          .section { margin-bottom: 24px; page-break-inside: avoid; }
          .section-header { font-size: 16px; font-weight: bold; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #1890ff; }
          .barcode-item { text-align: center; margin: 16px 0; padding: 12px; border: 1px solid #eee; border-radius: 4px; }
          .barcode-item svg { max-width: 100%; }
          @media print { .actions { display: none; } }
        </style>
      </head>
      <body>
        <div class="actions">
          <button class="btn btn-print" onclick="window.print()">In</button>
          <button class="btn btn-close" onclick="window.close()">Đóng</button>
        </div>
        ${barcodeHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width={900}
      centered
      styles={{ body: { maxHeight: "85vh", overflowY: "auto" } }}
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            onClick={() => {
              handlePrint();
              onClose();
            }}
            disabled={isEmpty}
          >
            In barcode
          </Button>
        </Space>
      }
      destroyOnClose
    >
      {isEmpty ? (
        <Empty description={emptyText} />
      ) : (
        <Collapse
          className="barcode-lot-collapse"
          defaultActiveKey={sections.map((s) => s.key)}
          items={sections.map((section) => ({
            key: section.key,
            label: (
              <Space>
                <span>{section.header}</span>
                <Tag style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.2)", borderRadius: 18, padding: "2px 8px" }}>
                  {section.barcodes.length} barcode
                </Tag>
              </Space>
            ),
            children: section.barcodes.map((content) => (
              <div
                key={content}
                style={{
                  textAlign: "center",
                  margin: "16px 0",
                  padding: "12px",
                  border: "1px solid #f0f0f0",
                  borderRadius: 4,
                }}
              >
                <BarcodeDisplay content={content} />
              </div>
            )),
          }))}
        />
      )}
    </Modal>
  );
};

export default BarcodePrintModal;
