// Generate sample code based on contract number
export const generateSampleCode = (contractNumber: string, index: number): string => {
  const orderNum = String(index).padStart(2, "0");
  return contractNumber ? `${contractNumber}/${orderNum}` : "";
};

// Print barcode for sample
export const printBarcode = (sampleCode: string, sampleName: string): void => {
  const printWindow = window.open("", "_blank", "width=400,height=300");
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>In Barcode - ${sampleCode}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
            margin: 0;
          }
          .barcode-container {
            display: inline-block;
            padding: 15px;
            border: 1px solid #ccc;
          }
          .sample-code {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 2px;
          }
          .sample-name {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
          }
          .barcode {
            font-family: 'Libre Barcode 39', cursive;
            font-size: 48px;
            letter-spacing: 0;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class="barcode-container">
          <div class="sample-code">${sampleCode}</div>
          <div class="barcode">*${sampleCode}*</div>
          <div class="sample-name">${sampleName || ""}</div>
        </div>
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
};
