import React, { useState } from 'react';
import { Upload, Button, message, Modal, Image, Typography } from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

const { Text } = Typography;

interface FileUploadProps {
  value?: UploadFile[];
  onChange?: (files: UploadFile[]) => void;
  maxCount?: number;
  accept?: string;
  listType?: 'text' | 'picture' | 'picture-card';
  disabled?: boolean;
  multiple?: boolean;
  maxSize?: number; // MB
}

const FileUpload: React.FC<FileUploadProps> = ({
  value = [],
  onChange,
  maxCount = 5,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  listType = 'picture-card',
  disabled = false,
  multiple = true,
  maxSize = 10, // 10MB default
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>(value);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ fontSize: 48, color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <FileImageOutlined style={{ fontSize: 48, color: '#722ed1' }} />;
      default:
        return <FileOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />;
    }
  };

  const isImageFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      if (file.originFileObj) {
        file.preview = await getBase64(file.originFileObj);
      }
    }

    if (isImageFile(file.name)) {
      setPreviewImage(file.url || (file.preview as string));
      setPreviewOpen(true);
      setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
    } else {
      // For non-image files, open in new tab or download
      if (file.url) {
        window.open(file.url, '_blank');
      } else {
        message.info('File sẽ được xem sau khi tải lên server');
      }
    }
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    onChange?.(newFileList);
  };

  const beforeUpload = (file: File) => {
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`File phải nhỏ hơn ${maxSize}MB!`);
      return false;
    }
    return false; // Return false to prevent automatic upload
  };

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    setFileList(newFileList);
    onChange?.(newFileList);
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải lên</div>
    </div>
  );

  // Custom item render for non-image files
  const itemRender = (
    originNode: React.ReactElement,
    file: UploadFile,
    _fileList: UploadFile[],
    actions: { download: () => void; preview: () => void; remove: () => void }
  ) => {
    if (listType !== 'picture-card') {
      return originNode;
    }

    if (isImageFile(file.name)) {
      return originNode;
    }

    // Custom render for non-image files
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          position: 'relative',
        }}
      >
        {getFileIcon(file.name)}
        <Text
          ellipsis
          style={{ fontSize: 12, marginTop: 4, maxWidth: '100%', textAlign: 'center' }}
        >
          {file.name}
        </Text>
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          className="file-actions"
        >
          <EyeOutlined
            style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
            onClick={actions.preview}
          />
          <DeleteOutlined
            style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
            onClick={actions.remove}
          />
        </div>
        <style>{`
          .ant-upload-list-item:hover .file-actions {
            display: flex !important;
          }
        `}</style>
      </div>
    );
  };

  return (
    <>
      <Upload
        listType={listType}
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        onRemove={handleRemove}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        maxCount={maxCount}
        itemRender={itemRender}
      >
        {fileList.length >= maxCount ? null : (
          listType === 'picture-card' ? uploadButton : (
            <Button icon={<UploadOutlined />} disabled={disabled}>
              Chọn file
            </Button>
          )
        )}
      </Upload>
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <Image
          alt={previewTitle}
          style={{ width: '100%' }}
          src={previewImage}
          preview={false}
        />
      </Modal>
    </>
  );
};

export default FileUpload;
