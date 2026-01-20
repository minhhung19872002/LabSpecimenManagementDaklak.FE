// @ts-nocheck
import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Table,
  Alert,
  Space,
  Tag,
  Collapse,
  Typography,
  Statistic,
  Row,
  Col,
  message
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload';
import { IndicatorDto } from '../../../../services/masterDataService';
import {
  SpecimenImportPreviewResult,
} from '../types/importTypes';
import { parseAndValidateSpecimenExcel, convertToSampleFormData } from '../utils/importSpecimens';
import { SampleFormData, IndicatorMethodInfo } from '../types';

const { Text } = Typography;
const { Panel } = Collapse;

interface ImportSpecimenModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (newSamples: SampleFormData[]) => void;
  indicators: IndicatorDto[];
  indicatorMethodsMap: Record<string, IndicatorMethodInfo[]>;
  existingSamplesCount: number;
  sampleCodePrefix: string;
}

export const ImportSpecimenModal: React.FC<ImportSpecimenModalProps> = ({
  open,
  onCancel,
  onConfirm,
  indicators,
  indicatorMethodsMap,
  existingSamplesCount,
  sampleCodePrefix
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<SpecimenImportPreviewResult | null>(null);

  const handleFileChange = (info: { fileList: UploadFile[] }) => {
    setFileList(info.fileList.slice(-1)); // Only keep last file
    setPreviewResult(null); // Reset preview when file changes
  };

  const handlePreview = async () => {
    if (!fileList.length || !fileList[0].originFileObj) return;

    setLoading(true);
    try {
      const buffer = await fileList[0].originFileObj.arrayBuffer();
      const result = parseAndValidateSpecimenExcel(buffer, indicators, indicatorMethodsMap);
      setPreviewResult(result);
    } catch (error) {
      message.error('Lỗi khi đọc file Excel');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!previewResult || !previewResult.isValid) return;

    const newSamples = convertToSampleFormData(
      previewResult.specimens,
      existingSamplesCount,
      sampleCodePrefix
    );

    onConfirm(newSamples);
    handleClose();
    message.success(`Đã thêm ${newSamples.length} mẫu vào danh sách`);
  };

  const handleClose = () => {
    setFileList([]);
    setPreviewResult(null);
    onCancel();
  };

  const hasErrors = previewResult && !previewResult.isValid;

  return (
    <Modal
      title="Nhập danh sách mẫu từ Excel"
      open={open}
      onCancel={handleClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Đóng
        </Button>,
        !previewResult && (
          <Button
            key="preview"
            type="primary"
            loading={loading}
            onClick={handlePreview}
            disabled={!fileList.length}
          >
            Xem trước
          </Button>
        ),
        previewResult && !hasErrors && (
          <Button
            key="import"
            type="primary"
            onClick={handleConfirmImport}
          >
            Xác nhận thêm {previewResult.validSpecimens} mẫu
          </Button>
        )
      ].filter(Boolean)}
    >
      {/* Step 1: Upload file */}
      {!previewResult && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="Hướng dẫn"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Tải template mẫu để xem cấu trúc file</li>
                <li>Các mẫu có cùng "Tên mẫu" sẽ được gộp lại với nhiều chỉ tiêu</li>
                <li>"Chỉ tiêu kiểm nghiệm" phải tồn tại trong danh mục hệ thống</li>
                <li>Dữ liệu sẽ được thêm vào danh sách mẫu hiện tại (không thay thế)</li>
              </ul>
            }
            type="info"
            showIcon
          />
          <Upload.Dragger
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
            accept=".xlsx,.xls"
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click hoặc kéo file Excel vào đây</p>
            <p className="ant-upload-hint">Hỗ trợ file .xlsx, .xls</p>
          </Upload.Dragger>
        </Space>
      )}

      {/* Step 2: Preview */}
      {previewResult && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Summary Statistics */}
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Tổng dòng" value={previewResult.totalRows} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Số mẫu"
                value={previewResult.totalSpecimens}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Mẫu hợp lệ"
                value={previewResult.validSpecimens}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Tổng chỉ tiêu"
                value={previewResult.totalIndicators}
              />
            </Col>
          </Row>

          {/* Errors */}
          {hasErrors && (
            <Alert
              type="error"
              message={`Có ${previewResult.errors.length} lỗi cần sửa`}
              description={
                <ul style={{ maxHeight: 150, overflow: 'auto', marginBottom: 0 }}>
                  {previewResult.errors.map((err, idx) => (
                    <li key={idx}>
                      Dòng {err.rowNumber}, cột "{err.columnName}": {err.errorMessage}
                    </li>
                  ))}
                </ul>
              }
            />
          )}

          {/* Preview Table */}
          <Collapse defaultActiveKey={['0']}>
            {previewResult.specimens.map((specimen, idx) => (
              <Panel
                key={idx}
                header={
                  <Space>
                    {specimen.isValid ? (
                      <Tag color="green">Hợp lệ</Tag>
                    ) : (
                      <Tag color="red">Lỗi</Tag>
                    )}
                    <Text strong>{specimen.sampleName}</Text>
                    <Text type="secondary">
                      ({specimen.indicators.length} chỉ tiêu)
                    </Text>
                  </Space>
                }
              >
                <div style={{ marginBottom: 8 }}>
                  <Space size="large" wrap>
                    {specimen.specimenTypeName && (
                      <Text>Loại mẫu: <Text strong>{specimen.specimenTypeName}</Text></Text>
                    )}
                    {specimen.samplingAddress && (
                      <Text>Địa chỉ: <Text strong>{specimen.samplingAddress}</Text></Text>
                    )}
                    {specimen.sampleQuantity && (
                      <Text>Lượng mẫu: <Text strong>{specimen.sampleQuantity}</Text></Text>
                    )}
                    {specimen.statusText && (
                      <Text>Tình trạng: <Text strong>{specimen.statusText}</Text></Text>
                    )}
                  </Space>
                </div>
                <Table
                  size="small"
                  dataSource={specimen.indicators}
                  rowKey="rowNumber"
                  pagination={false}
                  columns={[
                    {
                      title: 'Dòng',
                      dataIndex: 'rowNumber',
                      width: 60
                    },
                    {
                      title: 'Chỉ tiêu',
                      dataIndex: 'indicatorName'
                    },
                    {
                      title: 'Phương pháp',
                      dataIndex: 'testMethodName',
                      render: (val) => val || <Text type="secondary">-</Text>
                    },
                    {
                      title: 'Trạng thái',
                      width: 150,
                      render: (_, record) =>
                        record.isValid ? (
                          <Tag color="green">OK</Tag>
                        ) : (
                          <Tag color="red">{record.errorMessage}</Tag>
                        )
                    }
                  ]}
                />
              </Panel>
            ))}
          </Collapse>

          <Button onClick={() => setPreviewResult(null)}>
            ← Chọn file khác
          </Button>
        </Space>
      )}
    </Modal>
  );
};

export default ImportSpecimenModal;
