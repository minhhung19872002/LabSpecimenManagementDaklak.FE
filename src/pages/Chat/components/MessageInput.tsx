/**
 * MessageInput - Text input with send button
 */

import { useState, useRef, useCallback } from 'react';
import { Button, Input, Space, Upload, Tooltip } from 'antd';
import {
  SendOutlined,
  PaperClipOutlined,
  SmileOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { TextArea } = Input;

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

const MessageInput = ({ onSend, disabled = false }: MessageInputProps) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const textAreaRef = useRef<any>(null);

  const handleSend = useCallback(async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || sending) return;

    setSending(true);
    try {
      await onSend(trimmedContent);
      setContent('');
      textAreaRef.current?.focus();
    } finally {
      setSending(false);
    }
  }, [content, sending, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: () => false, // Prevent auto upload
    showUploadList: false,
    multiple: true,
    accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  };

  return (
    <div className="message-input">
      <div className="input-toolbar">
        <Space>
          <Upload {...uploadProps}>
            <Tooltip title="Đính kèm file">
              <Button type="text" icon={<PaperClipOutlined />} disabled={disabled} />
            </Tooltip>
          </Upload>
          <Upload {...uploadProps} accept="image/*">
            <Tooltip title="Gửi hình ảnh">
              <Button type="text" icon={<PictureOutlined />} disabled={disabled} />
            </Tooltip>
          </Upload>
          <Tooltip title="Emoji">
            <Button type="text" icon={<SmileOutlined />} disabled={disabled} />
          </Tooltip>
        </Space>
      </div>

      <div className="input-main">
        <TextArea
          ref={textAreaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={disabled || sending}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={sending}
          disabled={disabled || !content.trim()}
        />
      </div>
    </div>
  );
};

export default MessageInput;
