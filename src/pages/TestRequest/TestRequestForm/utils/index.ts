// Generate sample code based on contract number
export const generateSampleCode = (contractNumber: string, index: number): string => {
  const orderNum = String(index).padStart(2, "0");
  return contractNumber ? `${contractNumber}/${orderNum}` : "";
};

// Sample info for barcode printing
export interface SampleBarcodeInfo {
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  storageLocation?: string;
  notes?: string;
}

// Show barcode preview with print button
export const printBarcode = (sample: SampleBarcodeInfo): void => {
  const { sampleCode, sampleName, samplingAddress, sampleQuantity, storageLocation } = sample;

  // Calculate window size and center position relative to current window
  const width = 400;
  const height = 400;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const printWindow = window.open("", "barcode_preview", `width=${width},height=${height},left=${left},top=${top},scrollbars=no,resizable=yes`);
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode - ${sampleCode}</title>
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
          .barcode-container {
            display: inline-block;
            padding: 12px 20px;
            border: 2px solid #333;
            border-radius: 8px;
            min-width: 280px;
            background: white;
          }
          .header {
            font-size: 11px;
            font-weight: bold;
            color: #1890ff;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .sample-code {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 1px;
          }
          .barcode {
            font-family: 'Libre Barcode 39', cursive;
            font-size: 44px;
            letter-spacing: 0;
            margin: 4px 0;
          }
          .sample-name {
            font-size: 13px;
            font-weight: 600;
            color: #333;
            margin: 6px 0;
            padding-bottom: 6px;
            border-bottom: 1px dashed #ccc;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #666;
            margin: 3px 0;
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
            .barcode-container { border-width: 1px; }
          }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class="actions">
          <button class="btn btn-print" onclick="window.print()">In Barcode</button>
          <button class="btn btn-close" onclick="window.close()">Đóng</button>
        </div>
        <div class="barcode-container">
          <div class="header">Phiếu mẫu xét nghiệm</div>
          <div class="sample-code">${sampleCode}</div>
          <div class="barcode">*${sampleCode}*</div>
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
  }
};
