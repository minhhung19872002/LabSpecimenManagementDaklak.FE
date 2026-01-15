// @ts-nocheck
import React, { useState } from 'react';
import {
  Upload,
  Button,
  Modal,
  Table,
  Space,
  message,
  Typography,
  Alert,
  Progress,
  Tag,
  Tabs,
  Descriptions,
} from 'antd';
import {
  UploadOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
} from './Icon';
import * as XLSX from 'xlsx';

const { Text, Title } = Typography;
// Suppress unused Title warning - may be used in future
void Title;

interface ColumnMapping {
  excelColumn: string;
  systemField: string;
  displayName: string;
  required: boolean;
  type?: 'string' | 'number' | 'date' | 'boolean';
  validator?: (value: any) => boolean;
}

interface ValidationResult {
  row: number;
  field: string;
  value: any;
  error: string;
}

interface ExcelImportProps {
  templateName?: string;
  templateUrl?: string;
  columnMappings: ColumnMapping[];
  onImport: (data: any[]) => Promise<void>;
  onDownloadTemplate?: () => void;
  maxRows?: number;
  title?: string;
  description?: string;
}

const ExcelImport: React.FC<ExcelImportProps> = ({
  templateName = 'template',
  columnMappings,
  onImport,
  onDownloadTemplate,
  maxRows = 1000,
  title = 'Nhập dữ liệu từ Excel',
  description = 'Tải lên file Excel (.xlsx, .xls) để nhập dữ liệu hàng loạt',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const validateRow = (row: any, rowIndex: number): ValidationResult[] => {
    const errors: ValidationResult[] = [];

    columnMappings.forEach((mapping) => {
      const value = row[mapping.systemField];

      // Check required
      if (mapping.required && (value === undefined || value === null || value === '')) {
        errors.push({
          row: rowIndex + 1,
          field: mapping.displayName,
          value,
          error: `${mapping.displayName} là bắt buộc`,
        });
        return;
      }

      // Type validation
      if (value !== undefined && value !== null && value !== '') {
        if (mapping.type === 'number' && isNaN(Number(value))) {
          errors.push({
            row: rowIndex + 1,
            field: mapping.displayName,
            value,
            error: `${mapping.displayName} phải là số`,
          });
        }

        if (mapping.type === 'date' && isNaN(Date.parse(value))) {
          errors.push({
            row: rowIndex + 1,
            field: mapping.displayName,
            value,
            error: `${mapping.displayName} phải là ngày hợp lệ`,
          });
        }

        // Custom validator
        if (mapping.validator && !mapping.validator(value)) {
          errors.push({
            row: rowIndex + 1,
            field: mapping.displayName,
            value,
            error: `${mapping.displayName} không hợp lệ`,
          });
        }
      }
    });

    return errors;
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

          // Map Excel columns to system fields
          const mappedData = jsonData.map((row: any) => {
            const mappedRow: any = {};
            columnMappings.forEach((mapping) => {
              mappedRow[mapping.systemField] = row[mapping.excelColumn];
            });
            return mappedRow;
          });

          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Lỗi đọc file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        message.error('Chỉ chấp nhận file Excel (.xlsx, .xls)');
        return;
      }

      // Parse Excel file
      const data = await parseExcelFile(file);

      if (data.length === 0) {
        message.error('File Excel không có dữ liệu');
        return;
      }

      if (data.length > maxRows) {
        message.error(`File Excel không được vượt quá ${maxRows} dòng`);
        return;
      }

      // Validate all rows
      const allErrors: ValidationResult[] = [];
      data.forEach((row, index) => {
        const rowErrors = validateRow(row, index);
        allErrors.push(...rowErrors);
      });

      setPreviewData(data);
      setValidationErrors(allErrors);
      setStep('preview');
      setModalVisible(true);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      message.error('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.');
    }
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      message.error('Vui lòng sửa các lỗi trước khi import');
      return;
    }

    setStep('importing');
    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onImport(previewData);

      clearInterval(progressInterval);
      setImportProgress(100);

      setImportResult({
        success: previewData.length,
        failed: 0,
        errors: [],
      });
      setStep('result');
      message.success(`Đã import thành công ${previewData.length} dòng dữ liệu`);
    } catch (error: any) {
      setImportResult({
        success: 0,
        failed: previewData.length,
        errors: [error.message || 'Lỗi import dữ liệu'],
      });
      setStep('result');
      message.error('Lỗi import dữ liệu');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (onDownloadTemplate) {
      onDownloadTemplate();
      return;
    }

    // Generate template from column mappings
    const templateData = [
      columnMappings.reduce((acc, mapping) => {
        acc[mapping.excelColumn] = mapping.required ? '(Bắt buộc)' : '(Tùy chọn)';
        return acc;
      }, {} as Record<string, string>),
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    XLSX.writeFile(wb, `${templateName}.xlsx`);
    message.success('Đã tải xuống file mẫu');
  };

  const resetState = () => {
    setPreviewData([]);
    setValidationErrors([]);
    setIsImporting(false);
    setImportProgress(0);
    setStep('upload');
    setImportResult(null);
  };

  const handleClose = () => {
    setModalVisible(false);
    resetState();
  };

  const previewColumns = columnMappings.map((mapping) => ({
    title: (
      <span>
        {mapping.displayName}
        {mapping.required && <Text type="danger"> *</Text>}
      </span>
    ),
    dataIndex: mapping.systemField,
    key: mapping.systemField,
    ellipsis: true,
  }));

  // Add row number column
  previewColumns.unshift({
    title: 'STT',
    dataIndex: 'rowIndex',
    key: 'rowIndex',
    ellipsis: false,
  } as any);

  const errorColumns = [
    { title: 'Dòng', dataIndex: 'row', key: 'row', width: 80 },
    { title: 'Trường', dataIndex: 'field', key: 'field', width: 150 },
    { title: 'Giá trị', dataIndex: 'value', key: 'value', width: 150 },
    { title: 'Lỗi', dataIndex: 'error', key: 'error' },
  ];

  return (
    <>
      <Space>
        <Upload
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={(file) => {
            handleFileUpload(file);
            return false;
          }}
        >
          <Button type="primary" icon={<FileExcelOutlined />}>
            {title}
          </Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
          Tải file mẫu
        </Button>
      </Space>

      <Modal
        title={
          <Space>
            <FileExcelOutlined />
            <span>{title}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={handleClose}
        width={1000}
        footer={null}
        centered
      >
        {step === 'upload' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Upload.Dragger
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false;
              }}
            >
              <p className="ant-upload-drag-icon">
                <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              </p>
              <p className="ant-upload-text">Kéo thả file Excel vào đây hoặc click để chọn</p>
              <p className="ant-upload-hint">{description}</p>
            </Upload.Dragger>
          </div>
        )}

        {step === 'preview' && (
          <>
            <Alert
              type={validationErrors.length > 0 ? 'error' : 'success'}
              icon={validationErrors.length > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
              message={
                validationErrors.length > 0
                  ? `Có ${validationErrors.length} lỗi cần sửa`
                  : `Sẵn sàng import ${previewData.length} dòng dữ liệu`
              }
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Tabs
              items={[
                {
                  key: 'preview',
                  label: (
                    <span>
                      Xem trước ({previewData.length})
                    </span>
                  ),
                  children: (
                    <Table
                      columns={previewColumns}
                      dataSource={previewData.map((row, index) => ({
                        ...row,
                        rowIndex: index + 1,
                        key: index,
                      }))}
                      size="small"
                      scroll={{ x: 'max-content', y: 300 }}
                      pagination={{ pageSize: 10 }}
                    />
                  ),
                },
                {
                  key: 'errors',
                  label: (
                    <span>
                      Lỗi ({validationErrors.length})
                      {validationErrors.length > 0 && (
                        <Tag color="error" style={{ marginLeft: 8 }}>
                          {validationErrors.length}
                        </Tag>
                      )}
                    </span>
                  ),
                  children: (
                    <Table
                      columns={errorColumns}
                      dataSource={validationErrors.map((err, index) => ({
                        ...err,
                        key: index,
                      }))}
                      size="small"
                      scroll={{ y: 300 }}
                      pagination={{ pageSize: 10 }}
                    />
                  ),
                },
              ]}
            />

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleClose}>Hủy</Button>
                <Button icon={<ReloadOutlined />} onClick={resetState}>
                  Chọn file khác
                </Button>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleImport}
                  disabled={validationErrors.length > 0}
                >
                  Import {previewData.length} dòng
                </Button>
              </Space>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Title level={4}>Đang import dữ liệu...</Title>
            <Progress percent={importProgress} status="active" />
            <Text type="secondary">Vui lòng không đóng cửa sổ này</Text>
          </div>
        )}

        {step === 'result' && importResult && (
          <div style={{ padding: 20 }}>
            <Alert
              type={importResult.failed === 0 ? 'success' : 'error'}
              message={importResult.failed === 0 ? 'Import thành công!' : 'Import thất bại'}
              description={
                <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                  <Descriptions.Item label="Thành công">
                    <Tag color="success">{importResult.success} dòng</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thất bại">
                    <Tag color="error">{importResult.failed} dòng</Tag>
                  </Descriptions.Item>
                  {importResult.errors.length > 0 && (
                    <Descriptions.Item label="Chi tiết lỗi">
                      {importResult.errors.map((err, index) => (
                        <div key={index}>
                          <Text type="danger">{err}</Text>
                        </div>
                      ))}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              }
              showIcon
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" onClick={handleClose}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ExcelImport;
