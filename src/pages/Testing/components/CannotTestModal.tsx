import React, { useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  Upload,
  message,
  Image,
  Space,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { testingService } from '../../../services/testingService';
import { IndicatorName } from '../../../components/common';

const { TextArea } = Input;
const { Text } = Typography;

interface CannotTestModalProps {
  visible: boolean;
  taskId: string;
  indicatorId: string;
  indicatorName: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const CannotTestModal: React.FC<CannotTestModalProps> = ({
  visible,
  taskId,
  indicatorId,
  indicatorName,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // Reset form when modal opens
  React.useEffect(() => {
    if (visible) {
      form.resetFields();
      setFileList([]);
    }
  }, [visible, form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 1. Gọi API markCannotTest để tạo rejection history
      await testingService.markCannotTest(taskId, indicatorId, {
        reason: values.reason.trim(),
      });

      // 2. Nếu có file ảnh, upload lên (cần tìm rejectionHistoryId từ response)
      // Note: Backend sẽ tạo rejectionHistory và trả về indicator DTO
      // Để upload ảnh, cần gọi API getRejectionHistory để lấy ID mới nhất
      if (fileList.length > 0) {
        try {
          // Lấy rejection history mới nhất
          const histories = await testingService.getRejectionHistory(indicatorId);
          const latestHistory = histories.find(h => h.isCannotTest);

          if (latestHistory) {
            const filesToUpload = fileList
              .filter(f => f.originFileObj)
              .map(f => f.originFileObj as File);

            if (filesToUpload.length > 0) {
              await testingService.uploadRejectionHistoryImages(
                latestHistory.id,
                filesToUpload
              );
            }
          }
        } catch (uploadError) {
          console.error('Upload images error:', uploadError);
          // Không throw lỗi vì đã tạo rejection history thành công
          message.warning('Đã báo không TN được nhưng upload hình ảnh thất bại');
        }
      }

      message.success('Đã báo không thể thử nghiệm chỉ tiêu');
      onSuccess();
    } catch (error: any) {
      console.error('Cannot test error:', error);
      if (error?.response?.data?.error?.message) {
        message.error(error.response.data.error.message);
      } else if (error?.errorFields) {
        // Form validation error
      } else {
        message.error('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [form, taskId, indicatorId, fileList, onSuccess]);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewVisible(true);
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ được upload file hình ảnh');
        return Upload.LIST_IGNORE;
      }

      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Kích thước file không được vượt quá 5MB');
        return Upload.LIST_IGNORE;
      }

      // Check max files (5)
      if (fileList.length >= 5) {
        message.error('Tối đa 5 hình ảnh');
        return Upload.LIST_IGNORE;
      }

      return false; // Prevent auto upload
    },
    fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList.slice(0, 5)); // Max 5 files
    },
    onRemove: (file) => {
      setFileList(prev => prev.filter(f => f.uid !== file.uid));
    },
    onPreview: handlePreview,
    listType: 'picture-card',
    accept: 'image/*',
    multiple: true,
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <>
      <Modal
        title="Không thể thử nghiệm"
        open={visible}
        onCancel={onCancel}
        confirmLoading={loading}
        okText="Xác nhận"
        cancelText="Hủy"
        onOk={handleSubmit}
        width={500}
        destroyOnClose
        centered
        getContainer={() => document.body}
        wrapClassName="cannot-test-modal-fullscreen"
        style={{ top: 0 }}
        styles={{
          mask: { position: "fixed", inset: 0 },
          wrapper: {
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Chỉ tiêu: </Text>
          <IndicatorName name={indicatorName} style={{ fontWeight: 600 }} />
        </div>

        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="reason"
            label="Lý do không thể thử nghiệm"
            rules={[
              { required: true, message: 'Vui lòng nhập lý do' },
              { max: 1000, message: 'Lý do không được vượt quá 1000 ký tự' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập lý do không thể thử nghiệm..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <span>Hình ảnh đính kèm</span>
                <Text type="secondary">(Tùy chọn, tối đa 5 ảnh)</Text>
              </Space>
            }
          >
            <Upload {...uploadProps}>
              {fileList.length >= 5 ? null : uploadButton}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewImage,
          onVisibleChange: (value) => {
            setPreviewVisible(value);
          },
        }}
      />
    </>
  );
};

export default CannotTestModal;
