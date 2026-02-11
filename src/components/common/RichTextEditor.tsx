import React, { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Placeholder from "@tiptap/extension-placeholder";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string, plainText: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showToolbar?: boolean;
  /** Min height of editor content area (default: 32px, or 180px when showToolbar) */
  minHeight?: number;
}

const ToolbarButton: React.FC<{
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ active, onClick, title, children }) => (
  <button
    type="button"
    // Prevent editor from losing focus when clicking toolbar button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 30,
      height: 30,
      border: active ? "1px solid #91d5ff" : "1px solid transparent",
      borderRadius: 4,
      background: active ? "#e6f7ff" : "transparent",
      cursor: "pointer",
      color: active ? "#1677ff" : "#595959",
      fontSize: 16,
      padding: 0,
      lineHeight: 1,
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = "#e6e6e6";
        e.currentTarget.style.color = "#262626";
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#595959";
      }
    }}
  >
    {children}
  </button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  disabled = false,
  showToolbar = false,
  minHeight,
}) => {
  // Track if we're syncing from prop to avoid triggering onChange
  const isSyncingFromProp = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      Underline,
      Subscript,
      Superscript,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Skip onChange if we're syncing from prop
      if (isSyncingFromProp.current) {
        return;
      }
      const html = editor.getHTML();
      const plainText = editor.getText();
      onChange?.(html, plainText);
    },
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      isSyncingFromProp.current = true;
      editor.commands.setContent(value);
      // Reset flag after a microtask to ensure onUpdate has been processed
      Promise.resolve().then(() => {
        isSyncingFromProp.current = false;
      });
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const effectiveMinHeight = minHeight ?? (showToolbar ? 180 : 32);

  return (
    <div className={`rich-text-editor-wrapper ${showToolbar ? "with-toolbar" : ""}`}>
      {showToolbar && (
        <div
          className="rte-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
            borderBottom: "1px solid #f0f0f0",
            borderRadius: "6px 6px 0 0",
            background: "#fafafa",
          }}
        >
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="In đậm (Ctrl+B)"
          >
            <BoldOutlined style={{ fontSize: 16 }} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="In nghiêng (Ctrl+I)"
          >
            <ItalicOutlined style={{ fontSize: 16 }} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Gạch chân (Ctrl+U)"
          >
            <UnderlineOutlined style={{ fontSize: 16 }} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Gạch ngang (Ctrl+Shift+S)"
          >
            <StrikethroughOutlined style={{ fontSize: 16 }} />
          </ToolbarButton>
          <span
            style={{
              width: 1,
              height: 20,
              background: "#d9d9d9",
              margin: "0 4px",
            }}
          />
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Danh sách (Ctrl+Shift+8)"
          >
            <UnorderedListOutlined style={{ fontSize: 16 }} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Danh sách số (Ctrl+Shift+7)"
          >
            <OrderedListOutlined style={{ fontSize: 16 }} />
          </ToolbarButton>
          <span
            style={{
              width: 1,
              height: 20,
              background: "#d9d9d9",
              margin: "0 4px",
            }}
          />
          <ToolbarButton
            active={editor.isActive("superscript")}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            title="Chỉ số trên (Ctrl+.)"
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>X<sup style={{ fontSize: 9 }}>2</sup></span>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("subscript")}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            title="Chỉ số dưới (Ctrl+,)"
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>X<sub style={{ fontSize: 9 }}>2</sub></span>
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
      <style>{`
        .rich-text-editor-wrapper {
          width: 100%;
        }
        .rich-text-editor-wrapper .tiptap {
          box-sizing: border-box;
          min-height: ${effectiveMinHeight}px;
          padding: 4px 11px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          outline: none;
          transition: all 0.2s;
          font-size: 14px;
          line-height: 22px;
          background: #fff;
        }
        .rich-text-editor-wrapper.with-toolbar .tiptap {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          border-top: none;
        }
        .rich-text-editor-wrapper:hover .tiptap {
          border-color: #4096ff;
        }
        .rich-text-editor-wrapper:focus-within .tiptap {
          border-color: #1677ff;
          box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
        }
        .rich-text-editor-wrapper.with-toolbar:hover .rte-toolbar {
          border-color: #4096ff;
        }
        .rich-text-editor-wrapper.with-toolbar:focus-within .rte-toolbar {
          border-color: #1677ff;
          box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
        }
        .rich-text-editor-wrapper.with-toolbar:focus-within .tiptap {
          box-shadow: 0 2px 0 0 rgba(5, 145, 255, 0.1);
        }
        .rich-text-editor-wrapper .tiptap p {
          margin: 0;
          line-height: 22px;
        }
        .rich-text-editor-wrapper .tiptap ul,
        .rich-text-editor-wrapper .tiptap ol {
          margin: 4px 0;
          padding-left: 24px;
        }
        .rich-text-editor-wrapper .tiptap li {
          line-height: 22px;
        }
        .rich-text-editor-wrapper .tiptap li p {
          margin: 0;
        }
        .rich-text-editor-wrapper .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #bfbfbf;
          float: left;
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor-wrapper .ProseMirror {
          outline: none;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
