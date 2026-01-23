import React, { useEffect, useRef, useState } from "react";
import { Spin, Alert } from "antd";
import { API_BASE_URL } from "../../services/api";

// OnlyOffice types
interface OnlyOfficeConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions?: {
      edit?: boolean;
      download?: boolean;
      print?: boolean;
      review?: boolean;
      comment?: boolean;
    };
  };
  documentType: string;
  editorConfig: {
    callbackUrl?: string;
    lang?: string;
    mode?: string;
    user?: {
      id: string;
      name: string;
    };
    customization?: Record<string, unknown>;
  };
  token?: string;
  height?: string;
  width?: string;
  type?: string;
}

interface OnlyOfficeEditorConfigResponse {
  documentServerUrl: string;
  config: OnlyOfficeConfig;
}

interface OnlyOfficeEditorProps {
  fileName: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  onDocumentReady?: () => void;
  height?: string | number;
}

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (
        elementId: string,
        config: OnlyOfficeConfig & { events?: Record<string, unknown> }
      ) => {
        destroyEditor: () => void;
      };
    };
  }
}

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
  fileName,
  onReady,
  onError,
  onDocumentReady,
  height = "100%",
}) => {
  const editorRef = useRef<{ destroyEditor: () => void } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setScriptLoaded] = useState(false);
  const editorIdRef = useRef(`onlyoffice-editor-${Date.now()}`);

  // Wait for DocsAPI to be available with timeout
  const waitForDocsAPI = (timeout = 10000): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.DocsAPI) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.DocsAPI) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error("Timeout waiting for OnlyOffice API"));
        }
      }, 100);
    });
  };

  // Load OnlyOffice API script
  const loadScript = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.DocsAPI) {
        resolve();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector(
        `script[src="${url}"]`
      ) as HTMLScriptElement;
      if (existingScript) {
        // Script exists, wait for DocsAPI to be available
        waitForDocsAPI()
          .then(resolve)
          .catch(reject);
        return;
      }

      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = () => {
        // After script loads, wait for DocsAPI to initialize
        waitForDocsAPI()
          .then(resolve)
          .catch(reject);
      };
      script.onerror = () => reject(new Error("Failed to load OnlyOffice API script"));
      document.head.appendChild(script);
    });
  };

  // Fetch editor config from backend
  const fetchEditorConfig = async (): Promise<OnlyOfficeEditorConfigResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/result-forms/editor-config/${encodeURIComponent(fileName)}`,
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

  useEffect(() => {
    let mounted = true;

    const initEditor = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch editor config from backend
        console.log("[OnlyOffice] Fetching editor config for:", fileName);
        const editorConfig = await fetchEditorConfig();
        console.log("[OnlyOffice] Config received:", editorConfig);

        if (!mounted) return;

        // 2. Load OnlyOffice API script
        const apiUrl = `${editorConfig.documentServerUrl}/web-apps/apps/api/documents/api.js`;
        console.log("[OnlyOffice] Loading API script from:", apiUrl);
        await loadScript(apiUrl);
        console.log("[OnlyOffice] API script loaded successfully");

        if (!mounted) return;
        setScriptLoaded(true);

        // 3. Destroy existing editor if any
        if (editorRef.current) {
          try {
            editorRef.current.destroyEditor();
          } catch {
            // Ignore destroy errors
          }
          editorRef.current = null;
        }

        // 4. Create editor config with events
        console.log("[OnlyOffice] Document permissions:", editorConfig.config.document?.permissions);
        console.log("[OnlyOffice] Editor mode:", editorConfig.config.editorConfig?.mode);
        console.log("[OnlyOffice] Callback URL:", editorConfig.config.editorConfig?.callbackUrl);

        const config = {
          ...editorConfig.config,
          events: {
            onAppReady: () => {
              if (mounted) {
                setLoading(false);
                onReady?.();
              }
            },
            onDocumentReady: () => {
              if (mounted) {
                onDocumentReady?.();
              }
            },
            onError: (event: { data?: { errorCode?: number; errorDescription?: string } }) => {
              const errorMsg = event.data?.errorDescription || `Error code: ${event.data?.errorCode}`;
              if (mounted) {
                setError(errorMsg);
                onError?.(errorMsg);
              }
            },
          },
        };

        // 5. Initialize editor
        console.log("[OnlyOffice] Initializing editor with config:", config);
        editorRef.current = new window.DocsAPI!.DocEditor(editorIdRef.current, config);
        console.log("[OnlyOffice] Editor initialized successfully");
      } catch (err) {
        console.error("[OnlyOffice] Error:", err);
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
      if (editorRef.current) {
        try {
          editorRef.current.destroyEditor();
        } catch {
          // Ignore destroy errors
        }
        editorRef.current = null;
      }
    };
  }, [fileName]);

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
    <div
      ref={containerRef}
      style={{ height, width: "100%", position: "relative" }}
    >
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
          <Spin size="large" tip="Đang tải Editor..." />
        </div>
      )}
      <div
        id={editorIdRef.current}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
};

export default OnlyOfficeEditor;
