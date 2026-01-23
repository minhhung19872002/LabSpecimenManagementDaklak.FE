import React, { useEffect, useRef, useState } from "react";
import { Spin, Alert } from "antd";
import { API_BASE_URL } from "../../services/api";

interface CollaboraEditorConfigResponse {
  editorUrl: string;
  wopiSrc: string;
  fileName: string;
  fileExtension: string;
}

interface CollaboraEditorProps {
  fileName: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  onDocumentReady?: () => void;
  height?: string | number;
}

const CollaboraEditor: React.FC<CollaboraEditorProps> = ({
  fileName,
  onReady,
  onError,
  onDocumentReady,
  height = "100%",
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorUrl, setEditorUrl] = useState<string | null>(null);

  // Fetch editor config from backend
  const fetchEditorConfig = async (): Promise<CollaboraEditorConfigResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/wopi/editor-url/${encodeURIComponent(fileName)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || "Failed to get editor config");
    }

    const json = await response.json();
    // Handle wrapped response (ABP framework wraps response in { data: ... })
    if (json.data) {
      return json.data;
    }
    return json;
  };

  // Handle PostMessage from Collabora iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin - in production, check against Collabora server URL
      console.log("[Collabora] PostMessage received:", event.data);

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.MessageId === "App_LoadingStatus") {
          if (data.Values?.Status === "Document_Loaded") {
            console.log("[Collabora] Document loaded");
            setLoading(false);
            onDocumentReady?.();
          }
        } else if (data.MessageId === "UI_Close") {
          console.log("[Collabora] Editor closed");
        } else if (data.MessageId === "Action_Save_Resp") {
          console.log("[Collabora] Document saved:", data.Values?.success);
        }
      } catch {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onDocumentReady]);

  useEffect(() => {
    let mounted = true;

    const initEditor = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch editor config from backend
        console.log("[Collabora] Fetching editor config for:", fileName);
        const config = await fetchEditorConfig();
        console.log("[Collabora] Config received:", config);

        if (!mounted) return;

        // 2. Set editor URL for iframe
        setEditorUrl(config.editorUrl);
        onReady?.();

        // Loading will be set to false when we receive Document_Loaded message
        // Set a timeout fallback in case message is not received
        setTimeout(() => {
          if (mounted) {
            setLoading(false);
          }
        }, 10000);
      } catch (err) {
        console.error("[Collabora] Error:", err);
        if (mounted) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          setError(errorMsg);
          setLoading(false);
          onError?.(errorMsg);
        }
      }
    };

    if (fileName) {
      initEditor();
    }

    return () => {
      mounted = false;
    };
  }, [fileName]);

  // Send PostMessage to Collabora iframe
  const sendMessage = (message: object) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify(message), "*");
    }
  };

  // Public method to save document (available for future use)
  const _saveDocument = () => {
    sendMessage({
      MessageId: "Action_Save",
      Values: {
        DontTerminateEdit: true,
        DontSaveIfUnmodified: false,
      },
    });
  };

  // Public method to close editor (available for future use)
  const _closeEditor = () => {
    sendMessage({
      MessageId: "Action_Close",
    });
  };

  // Suppress unused variable warnings
  void _saveDocument;
  void _closeEditor;

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message="Không thể mở Editor"
          description={error}
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            zIndex: 10,
          }}
        >
          <Spin size="large" tip="Đang tải Collabora Editor..." />
        </div>
      )}
      {editorUrl && (
        <iframe
          ref={iframeRef}
          src={editorUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          allow="fullscreen; clipboard-read; clipboard-write"
          title="Collabora Editor"
        />
      )}
    </div>
  );
};

export default CollaboraEditor;
