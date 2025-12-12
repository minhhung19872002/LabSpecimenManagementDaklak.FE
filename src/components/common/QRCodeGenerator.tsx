import React, { useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Button, Space, Typography, Tooltip, Card, Descriptions, message } from 'antd';
import {
  DownloadOutlined,
  PrinterOutlined,
  CopyOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface QRCodeGeneratorProps {
  value: string; // The data to encode in QR code
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
  includeMargin?: boolean;
  fgColor?: string;
  bgColor?: string;
  imageSettings?: {
    src: string;
    height: number;
    width: number;
    excavate?: boolean;
  };
  // Report specific
  reportNumber?: string;
  reportDate?: string;
  customerName?: string;
  specimenCode?: string;
  showDetails?: boolean;
  title?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 200,
  level = 'M',
  includeMargin = true,
  fgColor = '#000000',
  bgColor = '#ffffff',
  imageSettings,
  reportNumber,
  reportDate,
  customerName,
  specimenCode,
  showDetails = true,
  title = 'Mã QR Truy Xuất',
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `QR_${reportNumber || 'report'}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      message.success('Đã tải xuống mã QR');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(value);
      message.success('Đã sao chép đường dẫn');
    } catch (err) {
      message.error('Không thể sao chép');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const canvas = canvasRef.current?.querySelector('canvas');
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>In Mã QR - ${reportNumber || 'Report'}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .container {
                text-align: center;
                border: 1px solid #ccc;
                padding: 20px;
                border-radius: 8px;
              }
              h2 { margin: 0 0 10px 0; }
              img { margin: 20px 0; }
              .info {
                text-align: left;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px dashed #ccc;
              }
              .info p { margin: 5px 0; }
              .label { font-weight: bold; }
              @media print {
                body { padding: 0; }
                .container { border: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${title}</h2>
              <img src="${imgData}" alt="QR Code" width="${size}" height="${size}" />
              <div class="info">
                ${reportNumber ? `<p><span class="label">Số báo cáo:</span> ${reportNumber}</p>` : ''}
                ${reportDate ? `<p><span class="label">Ngày báo cáo:</span> ${reportDate}</p>` : ''}
                ${customerName ? `<p><span class="label">Khách hàng:</span> ${customerName}</p>` : ''}
                ${specimenCode ? `<p><span class="label">Mã mẫu:</span> ${specimenCode}</p>` : ''}
                <p><span class="label">URL:</span> <small>${value}</small></p>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  // Generate verification URL for the report
  const generateVerificationUrl = () => {
    // This would typically point to a public verification page
    const baseUrl = window.location.origin;
    return `${baseUrl}/verify/${reportNumber}`;
  };

  return (
    <Card
      title={
        <Space>
          <QrcodeOutlined />
          <span>{title}</span>
        </Space>
      }
      size="small"
      style={{ width: 'fit-content' }}
    >
      <div ref={canvasRef} style={{ textAlign: 'center' }}>
        <QRCodeCanvas
          value={value || generateVerificationUrl()}
          size={size}
          level={level}
          includeMargin={includeMargin}
          fgColor={fgColor}
          bgColor={bgColor}
          imageSettings={imageSettings ? {
            ...imageSettings,
            excavate: imageSettings.excavate ?? false
          } : undefined}
        />
      </div>

      {showDetails && (
        <Descriptions
          column={1}
          size="small"
          style={{ marginTop: 12 }}
          labelStyle={{ fontWeight: 'bold' }}
        >
          {reportNumber && (
            <Descriptions.Item label="Số báo cáo">{reportNumber}</Descriptions.Item>
          )}
          {reportDate && (
            <Descriptions.Item label="Ngày báo cáo">{reportDate}</Descriptions.Item>
          )}
          {customerName && (
            <Descriptions.Item label="Khách hàng">{customerName}</Descriptions.Item>
          )}
          {specimenCode && (
            <Descriptions.Item label="Mã mẫu">{specimenCode}</Descriptions.Item>
          )}
        </Descriptions>
      )}

      <Space style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
        <Tooltip title="Tải xuống PNG">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            size="small"
          >
            Tải xuống
          </Button>
        </Tooltip>
        <Tooltip title="In mã QR">
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small">
            In
          </Button>
        </Tooltip>
        <Tooltip title="Sao chép đường dẫn">
          <Button icon={<CopyOutlined />} onClick={handleCopyLink} size="small">
            Sao chép
          </Button>
        </Tooltip>
      </Space>

      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Quét mã QR để xác minh báo cáo
        </Text>
      </div>
    </Card>
  );
};

// Batch QR Code Generator for multiple reports
interface BatchQRCodeProps {
  reports: Array<{
    id: string;
    reportNumber: string;
    reportDate: string;
    customerName?: string;
    specimenCode?: string;
  }>;
  baseUrl?: string;
}

export const BatchQRCodeGenerator: React.FC<BatchQRCodeProps> = ({
  reports,
  baseUrl = window.location.origin,
}) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {reports.map((report) => (
        <QRCodeGenerator
          key={report.id}
          value={`${baseUrl}/verify/${report.reportNumber}`}
          reportNumber={report.reportNumber}
          reportDate={report.reportDate}
          customerName={report.customerName}
          specimenCode={report.specimenCode}
          size={150}
          showDetails={true}
        />
      ))}
    </div>
  );
};

// Mini QR Code for inline use (e.g., in tables)
interface MiniQRCodeProps {
  value: string;
  size?: number;
  showTooltip?: boolean;
  tooltipText?: string;
}

export const MiniQRCode: React.FC<MiniQRCodeProps> = ({
  value,
  size = 64,
  showTooltip = true,
  tooltipText = 'Quét để xác minh',
}) => {
  const content = (
    <div style={{ cursor: 'pointer' }}>
      <QRCodeSVG value={value} size={size} level="L" />
    </div>
  );

  if (showTooltip) {
    return <Tooltip title={tooltipText}>{content}</Tooltip>;
  }

  return content;
};

export default QRCodeGenerator;
