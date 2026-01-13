import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string, plainText: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  disabled = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const plainText = editor.getText();
      onChange?.(html, plainText);
    },
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor-wrapper">
      <EditorContent editor={editor} />
      <style>{`
        .rich-text-editor-wrapper {
          width: 100%;
        }
        .rich-text-editor-wrapper .tiptap {
          box-sizing: border-box;
          height: 40px;
          padding: 8px 11px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          outline: none;
          transition: all 0.2s;
          font-size: 14px;
          line-height: 22px;
          background: #fff;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .rich-text-editor-wrapper .tiptap:hover {
          border-color: #4096ff;
        }
        .rich-text-editor-wrapper .tiptap:focus,
        .rich-text-editor-wrapper .tiptap.ProseMirror-focused {
          border-color: #1677ff;
          box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
        }
        .rich-text-editor-wrapper .tiptap p {
          margin: 0;
          line-height: 22px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
