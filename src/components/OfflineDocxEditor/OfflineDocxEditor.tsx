import { useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Spin, Alert } from "antd";
import { DocxEditor, type DocxEditorRef } from "@eigenpal/docx-editor-react";
import "@eigenpal/docx-editor-react/styles.css";

/**
 * Offline DOCX editor (client-side, no server).
 *
 * Replaces the Collabora/OnlyOffice iframe editors when there is no network:
 * it edits a .docx entirely in the browser via @eigenpal/docx-editor (Apache-2.0,
 * verified to preserve dashed borders / tables in the offline POC).
 *
 * Unlike the online editors it does NOT take a backend `fileName`; the document
 * is provided as an in-memory buffer (e.g. produced by generateResultFormOffline
 * or loaded from an IndexedDB draft store). Edited content is read back via the
 * imperative `save()` handle and persisted/synced by the caller.
 */
export interface OfflineDocxEditorHandle {
  /** Export the current document as a .docx ArrayBuffer (null if not ready). */
  save: () => Promise<ArrayBuffer | null>;
}

interface OfflineDocxEditorProps {
  /** The .docx to edit, in memory. */
  documentBuffer: ArrayBuffer | Blob | File;
  onReady?: () => void;
  onError?: (error: string) => void;
  height?: string | number;
  readOnly?: boolean;
}

const OfflineDocxEditor = forwardRef<OfflineDocxEditorHandle, OfflineDocxEditorProps>(
  ({ documentBuffer, onReady, onError, height = "100%", readOnly = false }, ref) => {
    const editorRef = useRef<DocxEditorRef>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (!editorRef.current) return null;
        return editorRef.current.save({ selective: false });
      },
    }));

    if (error) {
      return (
        <div style={{ padding: 24 }}>
          <Alert type="error" message="Không thể mở Editor offline" description={error} showIcon />
        </div>
      );
    }

    return (
      <div style={{ height, width: "100%", position: "relative" }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              zIndex: 10,
            }}
          >
            <Spin size="large" tip="Đang tải Editor offline..." />
          </div>
        )}
        <DocxEditor
          ref={editorRef}
          documentBuffer={documentBuffer}
          mode={readOnly ? "viewing" : "editing"}
          showToolbar={!readOnly}
          onEditorViewReady={() => {
            setLoading(false);
            onReady?.();
          }}
          onError={(e: unknown) => {
            const msg = e instanceof Error ? e.message : "Lỗi editor offline";
            setError(msg);
            setLoading(false);
            onError?.(msg);
          }}
        />
      </div>
    );
  }
);

OfflineDocxEditor.displayName = "OfflineDocxEditor";

export default OfflineDocxEditor;
