import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  Divider,
} from "antd";
import {
  MailOutlined,
  SendOutlined,
  FilePdfOutlined,
  LoadingOutlined,
} from "../../../components/common/Icon";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { quotationService, QuotationPdfSampleDto } from "../../../services/quotationService";
import { getApiErrorMessage } from "../../../utils/errorHandler";

interface SendQuotationEmailModalProps {
  visible: boolean;
  onCancel: () => void;
  customerName: string;
  samples: QuotationPdfSampleDto[];
  totalCost: number;
}

const SendQuotationEmailModal: React.FC<SendQuotationEmailModalProps> = ({
  visible,
  onCancel,
  customerName,
  samples,
  totalCost,
}) => {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [loadingPdfPreview, setLoadingPdfPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {},
        orderedList: {},
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: {},
        hardBreak: {},
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Nhập nội dung email...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "email-editor-content",
      },
    },
  });

  // Reset form and state when modal opens
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        to: "",
        cc: "",
        subject: "",
      });

      if (editor) {
        editor.commands.setContent("");
      }
    }
  }, [visible, form, editor]);

  const handlePreviewPdf = async () => {
    setLoadingPdfPreview(true);

    // Open a new tab immediately with loading state
    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Đang tải PDF báo giá...</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: #f5f5f5;
            }
            .loading-container {
              text-align: center;
            }
            .spinner {
              width: 50px;
              height: 50px;
              border: 3px solid #f3f3f3;
              border-top: 3px solid #1890ff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .loading-text {
              color: #666;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">Đang tạo PDF báo giá...</div>
          </div>
        </body>
        </html>
      `);
    }

    try {
      const pdfUrl = await quotationService.generatePdf({
        customerName: customerName,
        samples: samples,
        totalPrice: totalCost,
      });

      if (newTab) {
        // Redirect to PDF URL
        newTab.location.href = pdfUrl;
      }
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      if (newTab) {
        newTab.document.body.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
            <div style="text-align: center; color: #ff4d4f;">
              <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
              <div style="font-size: 18px;">Tạo PDF thất bại</div>
              <div style="color: #666; margin-top: 8px;">${getApiErrorMessage(error, "Vui lòng thử lại.")}</div>
            </div>
          </div>
        `;
      }
      message.error(getApiErrorMessage(error, "Tạo PDF thất bại. Vui lòng thử lại."));
    } finally {
      setLoadingPdfPreview(false);
    }
  };

  const handleSend = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      if (!values.to) {
        message.warning("Vui lòng nhập địa chỉ email người nhận");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const toEmails = values.to
        .split(/[,;]/)
        .map((e: string) => e.trim())
        .filter(Boolean);
      const ccEmails = values.cc
        ? values.cc
            .split(/[,;]/)
            .map((e: string) => e.trim())
            .filter(Boolean)
        : [];

      for (const email of [...toEmails, ...ccEmails]) {
        if (!emailRegex.test(email)) {
          message.error(`Email không hợp lệ: ${email}`);
          return;
        }
      }

      const bodyHtml = editor?.getHTML() || "";

      setSending(true);

      await quotationService.sendEmail({
        to: toEmails,
        cc: ccEmails,
        subject: values.subject,
        body: bodyHtml,
        customerName: customerName,
        samples: samples,
        totalPrice: totalCost,
      });

      message.success("Gửi email báo giá thành công");
      onCancel();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation failed
        return;
      }
      console.error("Failed to send email:", error);
      message.error(getApiErrorMessage(error, "Gửi email thất bại. Vui lòng thử lại."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <MailOutlined />
          <span>Gửi email báo giá</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      centered
      footer={
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={sending}
            onClick={handleSend}
          >
            Gửi email
          </Button>
        </Space>
      }
      styles={{
        body: {
          maxHeight: "calc(100vh - 250px)",
          overflowY: "auto",
          overflowX: "hidden",
        },
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="to"
          label="Đến (To)"
          rules={[
            { required: true, message: "Vui lòng nhập email người nhận" },
          ]}
        >
          <Input placeholder="Nhập email người nhận (phân cách bằng dấu phẩy nếu nhiều)" />
        </Form.Item>

        <Form.Item name="cc" label="CC">
          <Input placeholder="Nhập email CC (phân cách bằng dấu phẩy nếu nhiều)" />
        </Form.Item>

        <Form.Item
          name="subject"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề email" }]}
        >
          <Input placeholder="Nhập tiêu đề email" />
        </Form.Item>

        <Form.Item label="Nội dung email">
          <div className="email-editor-wrapper">
            <div className="email-editor-toolbar">
              <Space size={4} wrap>
                <Button
                  size="small"
                  type={editor?.isActive("bold") ? "primary" : "default"}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  <strong>B</strong>
                </Button>
                <Button
                  size="small"
                  type={editor?.isActive("italic") ? "primary" : "default"}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <em>I</em>
                </Button>
                <Button
                  size="small"
                  type={editor?.isActive("underline") ? "primary" : "default"}
                  onClick={() =>
                    editor?.chain().focus().toggleUnderline().run()
                  }
                >
                  <u>U</u>
                </Button>
                <Divider type="vertical" />
                <Button
                  size="small"
                  type={editor?.isActive("bulletList") ? "primary" : "default"}
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                >
                  • List
                </Button>
                <Button
                  size="small"
                  type={editor?.isActive("orderedList") ? "primary" : "default"}
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                >
                  1. List
                </Button>
              </Space>
            </div>
            <EditorContent editor={editor} />
          </div>
        </Form.Item>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ color: "rgba(0, 0, 0, 0.88)" }}>File đính kèm:</span>
          <div
            className="attachment-item"
            onClick={handlePreviewPdf}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "#fafafa",
              border: "1px solid #d9d9d9",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f0f0f0";
              e.currentTarget.style.borderColor = "#1890ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fafafa";
              e.currentTarget.style.borderColor = "#d9d9d9";
            }}
          >
            {loadingPdfPreview ? (
              <LoadingOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            ) : (
              <FilePdfOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
            )}
            <div>
              <div style={{ fontWeight: 500, color: "#262626" }}>
                BaoGia.pdf
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                Click để xem trước
              </div>
            </div>
          </div>
        </div>
      </Form>

      <style>{`
        .email-editor-wrapper {
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          overflow: hidden;
        }
        .email-editor-toolbar {
          padding: 8px;
          border-bottom: 1px solid #d9d9d9;
          background: #fafafa;
        }
        .email-editor-wrapper .email-editor-content {
          min-height: 150px;
          padding: 12px;
          outline: none;
        }
        .email-editor-wrapper .email-editor-content p {
          margin: 0 0 8px 0;
        }
        .email-editor-wrapper .email-editor-content p:last-child {
          margin-bottom: 0;
        }
        .email-editor-wrapper .email-editor-content ul,
        .email-editor-wrapper .email-editor-content ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        .email-editor-wrapper .email-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #bfbfbf;
          float: left;
          pointer-events: none;
          height: 0;
        }
        .email-editor-wrapper .ProseMirror {
          outline: none;
        }
        .email-editor-wrapper .ProseMirror:focus {
          outline: none;
        }
      `}</style>
    </Modal>
  );
};

export default SendQuotationEmailModal;
