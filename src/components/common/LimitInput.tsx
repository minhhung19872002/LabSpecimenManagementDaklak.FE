import React, { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Placeholder from "@tiptap/extension-placeholder";

interface LimitInputProps {
  value?: string;
  /**
   * onChange callback - compatible with Ant Design Form.Item
   * Receives the HTML value (with subscript/superscript formatting)
   */
  onChange?: (html: string) => void;
  /**
   * Optional callback to get plain text value (useful for validation)
   */
  onPlainTextChange?: (plainText: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/**
 * Simple rich text input for limit values
 * Only supports subscript and superscript (no bold, italic, etc.)
 *
 * Usage:
 * - Type normally for regular text
 * - Use keyboard shortcuts:
 *   - Ctrl+, (or Cmd+,) for subscript
 *   - Ctrl+. (or Cmd+.) for superscript
 *
 * Example values: "10²", "H₂O", "10⁻³"
 *
 * With Ant Design Form.Item:
 * <Form.Item name="allowedLimit">
 *   <LimitInput placeholder="Giới hạn" />
 * </Form.Item>
 */
const LimitInput: React.FC<LimitInputProps> = ({
  value,
  onChange,
  onPlainTextChange,
  placeholder = "Nhập giới hạn...",
  disabled = false,
  style,
}) => {
  // Track if we're syncing from prop to avoid triggering onChange
  const isSyncingFromProp = useRef(false);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
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
      // Call onChange with HTML (compatible with Form.Item)
      onChange?.(html);
      // Call onPlainTextChange if provided (for validation)
      onPlainTextChange?.(plainText);
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

  return (
    <div className={`limit-input-wrapper ${disabled ? "disabled" : ""}`} style={style}>
      <EditorContent editor={editor} />
      <style>{`
        .limit-input-wrapper {
          width: 100%;
        }
        .limit-input-wrapper .tiptap.ProseMirror {
          box-sizing: border-box !important;
          height: 40px !important;
          min-height: 40px !important;
          max-height: 40px !important;
          padding: 4px 11px !important;
          border: 1px solid #d9d9d9 !important;
          border-radius: 6px !important;
          outline: none !important;
          transition: all 0.2s !important;
          font-size: 14px !important;
          line-height: 22px !important;
          background: #fff !important;
          overflow: hidden !important;
          display: flex !important;
          align-items: center !important;
        }
        .limit-input-wrapper:hover .tiptap.ProseMirror {
          border-color: #4096ff !important;
        }
        .limit-input-wrapper:focus-within .tiptap.ProseMirror {
          border-color: #1677ff !important;
          box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1) !important;
        }
        .limit-input-wrapper .tiptap.ProseMirror p {
          margin: 0 !important;
          line-height: 22px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .limit-input-wrapper .tiptap.ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #bfbfbf;
          float: left;
          pointer-events: none;
          height: 0;
        }
        .limit-input-wrapper .ProseMirror {
          outline: none !important;
          width: 100% !important;
        }
        /* Disabled state */
        .limit-input-wrapper.disabled .tiptap.ProseMirror {
          background-color: rgba(0, 0, 0, 0.04) !important;
          cursor: not-allowed !important;
        }
        /* Tablet breakpoint - match index.css */
        @media screen and (max-width: 992px) {
          .limit-input-wrapper .tiptap.ProseMirror {
            height: 36px !important;
            min-height: 36px !important;
            max-height: 36px !important;
          }
        }
        /* Mobile breakpoint - match index.css */
        @media screen and (max-width: 768px) {
          .limit-input-wrapper .tiptap.ProseMirror {
            height: 32px !important;
            min-height: 32px !important;
            max-height: 32px !important;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Extract plain text from HTML and convert superscript/subscript to mathematical notation
 * - <sup>2</sup> → ^2 (for power notation, e.g., 10² → 10^2)
 * - <sub>2</sub> → _2 (for subscript, less common in limits)
 *
 * This allows the extracted text to be parsed by parseResultToNumber()
 * Example: "<p>10<sup>2</sup></p>" → "10^2" → parseResultToNumber returns 100
 */
export const extractPlainTextFromLimit = (html: string | undefined | null): string => {
  if (!html) return "";
  // Convert superscript tags to ^ notation (handle tags with attributes like <sup class="...">)
  let result = html.replace(/<sup[^>]*>([^<]*)<\/sup>/gi, "^$1");
  // Convert subscript tags (less common for limits, but handle it)
  result = result.replace(/<sub[^>]*>([^<]*)<\/sub>/gi, "_$1");
  // Remove remaining HTML tags
  result = result.replace(/<[^>]*>/g, "");
  // Decode common HTML entities
  result = result.replace(/&nbsp;/g, " ");
  result = result.replace(/&amp;/g, "&");
  result = result.replace(/&lt;/g, "<");
  result = result.replace(/&gt;/g, ">");
  result = result.replace(/&quot;/g, '"');
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  return result.trim();
};

export default LimitInput;
