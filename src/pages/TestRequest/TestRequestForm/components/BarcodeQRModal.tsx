// @ts-nocheck
import React, { useRef, useEffect, useState } from "react";
import { Modal, Tabs, Button, Space } from "antd";
import { PrinterOutlined } from "../../../../components/common/Icon";
import QRCode from "qrcode";

export interface SampleCodeInfo {
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  storageLocation?: string;
}

interface BarcodeQRModalProps {
  visible: boolean;
  onClose: () => void;
  sampleInfo: SampleCodeInfo | null;
}

const BarcodeQRModal: React.FC<BarcodeQRModalProps> = ({
  visible,
  onClose,
  sampleInfo,
}) => {
  const [activeTab, setActiveTab] = useState<string>("qrcode");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeContainerRef = useRef<HTMLDivElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Generate QR Code when modal opens or sample changes
  useEffect(() => {
    if (visible && sampleInfo && qrCanvasRef.current) {
      const qrData = JSON.stringify({
        code: sampleInfo.sampleCode,
        name: sampleInfo.sampleName,
        address: sampleInfo.samplingAddress,
        quantity: sampleInfo.sampleQuantity,
        storage: sampleInfo.storageLocation,
      });

      QRCode.toCanvas(qrCanvasRef.current, qrData, {
        width: 180,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    }
  }, [visible, sampleInfo, activeTab]);

  const handlePrint = () => {
    if (!sampleInfo) return;

    const { sampleCode, sampleName, samplingAddress, sampleQuantity, storageLocation } = sampleInfo;

    // Calculate window size and center position
    const width = 450;
    const height = 500;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const printWindow = window.open(
      "",
      "code_preview",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=no,resizable=yes`
    );

    if (!printWindow) return;

    // Generate QR code for print
    const qrDataUrl = qrCanvasRef.current?.toDataURL("image/png") || "";

    const isQRCode = activeTab === "qrcode";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${isQRCode ? "QR Code" : "Barcode"} - ${sampleCode}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 15px;
            margin: 0;
            background: #f5f5f5;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .actions {
            margin-bottom: 15px;
          }
          .btn {
            padding: 8px 20px;
            margin: 0 5px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          }
          .btn-print {
            background: #1890ff;
            color: white;
          }
          .btn-print:hover {
            background: #40a9ff;
          }
          .btn-close {
            background: #fff;
            color: #666;
            border: 1px solid #d9d9d9;
          }
          .btn-close:hover {
            background: #f5f5f5;
          }
          .code-container {
            display: inline-block;
            padding: 16px 24px;
            border: 2px solid #333;
            border-radius: 8px;
            min-width: 300px;
            background: white;
          }
          .header {
            font-size: 11px;
            font-weight: bold;
            color: #1890ff;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .sample-code {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .qr-code {
            margin: 10px 0;
          }
          .qr-code img {
            width: 180px;
            height: 180px;
          }
          .barcode {
            font-family: 'Libre Barcode 39', cursive;
            font-size: 48px;
            letter-spacing: 0;
            margin: 8px 0;
          }
          .sample-name {
            font-size: 13px;
            font-weight: 600;
            color: #333;
            margin: 8px 0;
            padding-bottom: 8px;
            border-bottom: 1px dashed #ccc;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #666;
            margin: 4px 0;
            text-align: left;
          }
          .info-row .label {
            font-weight: 600;
            color: #333;
            min-width: 70px;
          }
          .info-row .value {
            flex: 1;
            text-align: right;
          }
          @media print {
            body {
              margin: 0;
              padding: 5px;
              background: white;
            }
            .actions { display: none; }
            .code-container { border-width: 1px; }
          }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class="actions">
          <button class="btn btn-print" onclick="window.print()">In ${isQRCode ? "QR Code" : "Barcode"}</button>
          <button class="btn btn-close" onclick="window.close()">Đóng</button>
        </div>
        <div class="code-container">
          <div class="header">Phiếu mẫu xét nghiệm</div>
          <div class="sample-code">${sampleCode}</div>
          ${isQRCode
            ? `<div class="qr-code"><img src="${qrDataUrl}" alt="QR Code" /></div>`
            : `<div class="barcode">*${sampleCode}*</div>`
          }
          <div class="sample-name">${sampleName || ""}</div>
          ${samplingAddress ? `
          <div class="info-row">
            <span class="label">Địa chỉ:</span>
            <span class="value">${samplingAddress}</span>
          </div>
          ` : ""}
          ${sampleQuantity ? `
          <div class="info-row">
            <span class="label">Số lượng:</span>
            <span class="value">${sampleQuantity}</span>
          </div>
          ` : ""}
          ${storageLocation ? `
          <div class="info-row">
            <span class="label">Vị trí lưu:</span>
            <span class="value">${storageLocation}</span>
          </div>
          ` : ""}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!sampleInfo) return null;

  const { sampleCode, sampleName, samplingAddress, sampleQuantity, storageLocation } = sampleInfo;

  const tabItems = [
    {
      key: "qrcode",
      label: "QR Code",
      children: (
        <div ref={qrContainerRef} style={{ textAlign: "center", padding: "16px 0" }}>
          <div
            style={{
              display: "inline-block",
              padding: "16px 24px",
              border: "2px solid #333",
              borderRadius: 8,
              minWidth: 280,
              background: "white",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: "bold",
                color: "#1890ff",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Phiếu mẫu xét nghiệm
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 8,
                letterSpacing: 1,
              }}
            >
              {sampleCode}
            </div>
            <div style={{ margin: "10px 0" }}>
              <canvas ref={qrCanvasRef} />
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#333",
                margin: "8px 0",
                paddingBottom: 8,
                borderBottom: "1px dashed #ccc",
              }}
            >
              {sampleName || ""}
            </div>
            {samplingAddress && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", margin: "4px 0" }}>
                <span style={{ fontWeight: 600, color: "#333", minWidth: 70 }}>Địa chỉ:</span>
                <span style={{ flex: 1, textAlign: "right" }}>{samplingAddress}</span>
              </div>
            )}
            {sampleQuantity && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", margin: "4px 0" }}>
                <span style={{ fontWeight: 600, color: "#333", minWidth: 70 }}>Số lượng:</span>
                <span style={{ flex: 1, textAlign: "right" }}>{sampleQuantity}</span>
              </div>
            )}
            {storageLocation && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", margin: "4px 0" }}>
                <span style={{ fontWeight: 600, color: "#333", minWidth: 70 }}>Vị trí lưu:</span>
                <span style={{ flex: 1, textAlign: "right" }}>{storageLocation}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "barcode",
      label: "Barcode",
      children: (
        <div ref={barcodeContainerRef} style={{ textAlign: "center", padding: "16px 0" }}>
          <link
            href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap"
            rel="stylesheet"
          />
          <div
            style={{
              display: "inline-block",
              padding: "16px 24px",
              border: "2px solid #333",
              borderRadius: 8,
              minWidth: 280,
              background: "white",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: "bold",
                color: "#1890ff",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Phiếu mẫu xét nghiệm
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 4,
                letterSpacing: 1,
              }}
            >
              {sampleCode}
            </div>
            <div
              style={{
                fontFamily: "'Libre Barcode 39', cursive",
                fontSize: 48,
                letterSpacing: 0,
                margin: "8px 0",
              }}
            >
              *{sampleCode}*
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#333",
                margin: "8px 0",
                paddingBottom: 8,
                borderBottom: "1px dashed #ccc",
              }}
            >
              {sampleName || ""}
            </div>
            {samplingAddress && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", margin: "4px 0" }}>
                <span style={{ fontWeight: 600, color: "#333", minWidth: 70 }}>Địa chỉ:</span>
                <span style={{ flex: 1, textAlign: "right" }}>{samplingAddress}</span>
              </div>
            )}
            {sampleQuantity && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", margin: "4px 0" }}>
                <span style={{ fontWeight: 600, color: "#333", minWidth: 70 }}>Số lượng:</span>
                <span style={{ flex: 1, textAlign: "right" }}>{sampleQuantity}</span>
              </div>
            )}
            {storageLocation && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", margin: "4px 0" }}>
                <span style={{ fontWeight: 600, color: "#333", minWidth: 70 }}>Vị trí lưu:</span>
                <span style={{ flex: 1, textAlign: "right" }}>{storageLocation}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="In mã mẫu"
      open={visible}
      onCancel={onClose}
      width={450}
      footer={
        <Space>
          <Button onClick={onClose}>Đóng</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            In {activeTab === "qrcode" ? "QR Code" : "Barcode"}
          </Button>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        centered
      />
    </Modal>
  );
};

export default BarcodeQRModal;
