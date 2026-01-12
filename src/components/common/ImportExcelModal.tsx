import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Table,
  Space,
  message,
  Typography,
  Alert,
  Progress,
  Tag,
  Tabs,
  Descriptions,
  Result,
} from 'antd';
import {
  UploadOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  InboxOutlined,
} from './Icon';
import { importService, downloadBlobAsFile, PreviewResultDto, ImportResultDto } from '../../services/importService';

const { Text, Title } = Typography;
const { Dragger } = Upload;

export type ImportType = 'test-requests' | 'specimens' | 'customers' | 'test-methods';

interface ImportExcelModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  importType: ImportType;
  title?: string;
}

const importConfig: Record<ImportType, {
  title: string;
  description: string;
  templateFilename: string;
  previewFn: (file: File) => Promise<PreviewResultDto>;
  importFn: (file: File) => Promise<ImportResultDto>;
  downloadTemplateFn: () => Promise<Blob>;
  columns: { title: string; dataIndex: string; key: string; width?: number }[];
}> = {
  'test-requests': {
    title: 'Nhập Yêu cầu thử nghiệm',
    description: 'Tải lên file Excel (.xlsx) để nhập yêu cầu thử nghiệm hàng loạt',
    templateFilename: 'test-requests-template.xlsx',
    previewFn: importService.previewTestRequests,
    importFn: importService.importTestRequests,
    downloadTemplateFn: importService.downloadTestRequestsTemplate,
    columns: [
      { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName', width: 150 },
      { title: 'Email', dataIndex: 'customerEmail', key: 'customerEmail', width: 150 },
      { title: 'Điện thoại', dataIndex: 'customerPhone', key: 'customerPhone', width: 120 },
      { title: 'Địa chỉ', dataIndex: 'customerAddress', key: 'customerAddress', width: 200 },
      { title: 'TAT (ngày)', dataIndex: 'tatDays', key: 'tatDays', width: 100 },
      { title: 'Ghi chú', dataIndex: 'notes', key: 'notes', width: 150 },
    ],
  },
  'specimens': {
    title: 'Nhập Mẫu thử',
    description: 'Tải lên file Excel (.xlsx) để nhập mẫu thử hàng loạt',
    templateFilename: 'specimens-template.xlsx',
    previewFn: importService.previewSpecimens,
    importFn: importService.importSpecimens,
    downloadTemplateFn: importService.downloadSpecimensTemplate,
    columns: [
      { title: 'Mã mẫu', dataIndex: 'specimenCode', key: 'specimenCode', width: 120 },
      { title: 'Tên mẫu', dataIndex: 'name', key: 'name', width: 150 },
      { title: 'Loại mẫu', dataIndex: 'specimenType', key: 'specimenType', width: 120 },
      { title: 'Ngày nhận', dataIndex: 'receivedDate', key: 'receivedDate', width: 120 },
      { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 80 },
      { title: 'Ghi chú', dataIndex: 'notes', key: 'notes', width: 150 },
    ],
  },
  'customers': {
    title: 'Nhập Khách hàng',
    description: 'Tải lên file Excel (.xlsx) để nhập khách hàng hàng loạt',
    templateFilename: 'customers-template.xlsx',
    previewFn: importService.previewCustomers,
    importFn: importService.importCustomers,
    downloadTemplateFn: importService.downloadCustomersTemplate,
    columns: [
      { title: 'Mã KH', dataIndex: 'code', key: 'code', width: 100 },
      { title: 'Tên khách hàng', dataIndex: 'name', key: 'name', width: 200 },
      { title: 'Email', dataIndex: 'email', key: 'email', width: 150 },
      { title: 'Điện thoại', dataIndex: 'phone', key: 'phone', width: 120 },
      { title: 'Địa chỉ', dataIndex: 'address', key: 'address', width: 200 },
      { title: 'Mã số thuế', dataIndex: 'taxCode', key: 'taxCode', width: 120 },
    ],
  },
  'test-methods': {
    title: 'Nhập Phương pháp thử',
    description: 'Tải lên file Excel (.xlsx) để nhập phương pháp thử hàng loạt',
    templateFilename: 'test-methods-template.xlsx',
    previewFn: importService.previewTestMethods,
    importFn: importService.importTestMethods,
    downloadTemplateFn: importService.downloadTestMethodsTemplate,
    columns: [
      { title: 'Mã', dataIndex: 'code', key: 'code', width: 100 },
      { title: 'Tên phương pháp', dataIndex: 'name', key: 'name', width: 200 },
      { title: 'Mô tả', dataIndex: 'description', key: 'description', width: 200 },
      { title: 'Tiêu chuẩn', dataIndex: 'standard', key: 'standard', width: 150 },
    ],
  },
};

const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  open,
  onClose,
  onSuccess,
  importType,
  title,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResultDto | null>(null);
  const [importResult, setImportResult] = useState<ImportResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const config = importConfig[importType];

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setLoading(false);
    setImportProgress(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      message.error('Chỉ chấp nhận file Excel (.xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const result = await config.previewFn(selectedFile);
      setPreviewData(result);
      setStep('preview');
    } catch (error: any) {
      console.error('Preview error:', error);
      message.error(error.response?.data?.message || 'Lỗi xử lý file. Vui lòng kiểm tra định dạng file.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setStep('importing');
    setLoading(true);
    setImportProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await config.importFn(file);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
      setStep('result');

      if (result.success) {
        message.success(result.message || `Import thành công ${result.importedRows} dòng`);
        onSuccess?.();
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Import error:', error);
      setImportResult({
        success: false,
        totalRows: previewData?.totalRows || 0,
        importedRows: 0,
        skippedRows: 0,
        failedRows: previewData?.totalRows || 0,
        errors: [],
        message: error.response?.data?.message || 'Lỗi import dữ liệu',
      });
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      message.loading({ content: 'Đang tải file mẫu...', key: 'download' });
      const blob = await config.downloadTemplateFn();
      downloadBlobAsFile(blob, config.templateFilename);
      message.success({ content: 'Tải file mẫu thành công!', key: 'download' });
    } catch (error) {
      console.error('Download template error:', error);
      message.error({ content: 'Lỗi tải file mẫu', key: 'download' });
    }
  };

  const errorColumns = [
    { title: 'Dòng', dataIndex: 'row', key: 'row', width: 70 },
    { title: 'Cột', dataIndex: 'column', key: 'column', width: 100 },
    { title: 'Trường', dataIndex: 'field', key: 'field', width: 120 },
    { title: 'Giá trị', dataIndex: 'value', key: 'value', width: 120 },
    { title: 'Lỗi', dataIndex: 'errorMessage', key: 'errorMessage' },
  ];

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined style={{ color: '#52c41a' }} />
          <span>{title || config.title}</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={1000}
      footer={null}
      centered
      destroyOnClose
    >
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              Tải file mẫu
            </Button>
          </Space>

          <Dragger
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              handleFileSelect(file);
              return false;
            }}
            disabled={loading}
          >
            <p className="ant-upload-drag-icon">
              {loading ? (
                <Progress type="circle" percent={50} size={48} status="active" />
              ) : (
                <InboxOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              )}
            </p>
            <p className="ant-upload-text">
              {loading ? 'Đang xử lý file...' : 'Kéo thả file Excel vào đây hoặc click để chọn'}
            </p>
            <p className="ant-upload-hint">{config.description}</p>
          </Dragger>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && previewData && (
        <>
          <Alert
            type={previewData.invalidRows > 0 ? 'warning' : 'success'}
            icon={previewData.invalidRows > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
            message={
              previewData.invalidRows > 0
                ? `Có ${previewData.invalidRows} dòng lỗi trong tổng số ${previewData.totalRows} dòng`
                : `Sẵn sàng import ${previewData.validRows} dòng dữ liệu`
            }
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Tabs
            items={[
              {
                key: 'valid',
                label: (
                  <span>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    {' '}Dữ liệu hợp lệ ({previewData.validRows})
                  </span>
                ),
                children: (
                  <Table
                    columns={[
                      { title: 'STT', key: 'index', width: 60, render: (_, __, idx) => idx + 1 },
                      ...config.columns,
                    ]}
                    dataSource={previewData.validData?.map((row, idx) => ({ ...row, key: idx })) || []}
                    size="small"
                    scroll={{ x: 'max-content', y: 300 }}
                    pagination={{ pageSize: 10, size: 'small' }}
                  />
                ),
              },
              {
                key: 'errors',
                label: (
                  <span>
                    <WarningOutlined style={{ color: previewData.invalidRows > 0 ? '#faad14' : undefined }} />
                    {' '}Lỗi ({previewData.invalidRows})
                    {previewData.invalidRows > 0 && (
                      <Tag color="warning" style={{ marginLeft: 8 }}>
                        {previewData.invalidRows}
                      </Tag>
                    )}
                  </span>
                ),
                children: (
                  <Table
                    columns={errorColumns}
                    dataSource={previewData.errors?.map((err, idx) => ({ ...err, key: idx })) || []}
                    size="small"
                    scroll={{ y: 300 }}
                    pagination={{ pageSize: 10, size: 'small' }}
                    locale={{ emptyText: 'Không có lỗi' }}
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
                disabled={previewData.validRows === 0}
              >
                Import {previewData.validRows} dòng hợp lệ
              </Button>
            </Space>
          </div>
        </>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Title level={4}>Đang import dữ liệu...</Title>
          <Progress percent={importProgress} status="active" style={{ maxWidth: 400, margin: '20px auto' }} />
          <Text type="secondary">Vui lòng không đóng cửa sổ này</Text>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && importResult && (
        <div style={{ padding: 20 }}>
          {importResult.success ? (
            <Result
              status="success"
              title="Import thành công!"
              subTitle={importResult.message}
              extra={
                <Descriptions bordered column={1} size="small" style={{ maxWidth: 400, margin: '0 auto' }}>
                  <Descriptions.Item label="Tổng số dòng">{importResult.totalRows}</Descriptions.Item>
                  <Descriptions.Item label="Thành công">
                    <Tag color="success">{importResult.importedRows}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Bỏ qua">
                    <Tag color="default">{importResult.skippedRows}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thất bại">
                    <Tag color="error">{importResult.failedRows}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              }
            />
          ) : (
            <Result
              status="error"
              title="Import thất bại"
              subTitle={importResult.message}
              extra={
                importResult.errors && importResult.errors.length > 0 && (
                  <Table
                    columns={errorColumns}
                    dataSource={importResult.errors.map((err, idx) => ({ ...err, key: idx }))}
                    size="small"
                    scroll={{ y: 200 }}
                    pagination={false}
                  />
                )
              }
            />
          )}

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Space>
              <Button onClick={resetState}>Import thêm</Button>
              <Button type="primary" onClick={handleClose}>
                Đóng
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ImportExcelModal;
