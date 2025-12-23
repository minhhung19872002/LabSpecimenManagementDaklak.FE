import { useState, useRef, useEffect, useCallback } from "react";
import { message } from "antd";
import { useGetResultFormEditorConfigQuery } from "../../../store/api/testRequestApi";
import { DETAIL_MESSAGES } from "../constants";

export const useOnlyOfficeEditor = () => {
  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [editorConfig, setEditorConfig] = useState<any>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const docEditorRef = useRef<any>(null);

  // RTK Query for editor config
  const { data: editorConfigData } = useGetResultFormEditorConfigQuery(generatedFileName!, {
    skip: !generatedFileName,
  });

  // Update editor config when data is loaded
  useEffect(() => {
    if (editorConfigData && generatedFileName) {
      setEditorConfig(editorConfigData);
      setEditorLoading(true);
      setEditorModalVisible(true);
      setGeneratedFileName(null);
    }
  }, [editorConfigData, generatedFileName]);

  // Load OnlyOffice script when modal opens
  useEffect(() => {
    if (!editorModalVisible || !editorConfig) return;

    const scriptId = "onlyoffice-api-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `${editorConfig.documentServerUrl}/web-apps/apps/api/documents/api.js`;
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        setEditorLoading(false);
      };
      script.onerror = () => {
        message.error(DETAIL_MESSAGES.editorLoadError);
        setEditorLoading(false);
      };
      document.head.appendChild(script);
    } else {
      if ((window as any).DocsAPI) {
        setScriptLoaded(true);
      }
      setEditorLoading(false);
    }
  }, [editorModalVisible, editorConfig]);

  // Initialize editor when script is loaded and modal is visible
  useEffect(() => {
    if (!scriptLoaded || !editorConfig || !editorModalVisible) return;

    // Wait for DOM to be ready
    const initTimer = setTimeout(() => {
      try {
        if (docEditorRef.current) {
          docEditorRef.current.destroyEditor();
        }

        // Build config
        const config = {
          document: {
            fileType: editorConfig.config.document.fileType,
            key: editorConfig.config.document.key,
            title: editorConfig.config.document.title,
            url: editorConfig.config.document.url,
            permissions: {
              edit: true,
              download: true,
              print: true,
              comment: true,
              copy: true,
              fillForms: true,
              modifyContentControl: true,
              modifyFilter: true,
              review: true,
            },
          },
          documentType: editorConfig.config.documentType,
          editorConfig: {
            mode: "edit",
            lang: "vi",
            user: editorConfig.config.editorConfig?.user || { id: "1", name: "Editor" },
            customization: {
              autosave: false,
              forcesave: true,
              plugins: false,
            },
          },
          height: "100%",
          width: "100%",
          type: "desktop",
          events: {
            onDocumentReady: () => {
              console.log("Result form document is ready");
            },
            onError: (event: any) => {
              console.error("OnlyOffice error:", event);
              const errorCode = event?.data?.errorCode || event?.data;
              if (errorCode === -2 || errorCode === -4 || errorCode === -5) {
                console.warn("OnlyOffice temporary error:", errorCode);
                return;
              }
              message.error(DETAIL_MESSAGES.editorError);
            },
          },
        };

        docEditorRef.current = new (window as any).DocsAPI.DocEditor(
          "result-form-editor-container",
          config
        );
      } catch (err) {
        console.error("Failed to initialize editor:", err);
        message.error(DETAIL_MESSAGES.editorInitError);
      }
    }, 200);

    return () => {
      clearTimeout(initTimer);
    };
  }, [scriptLoaded, editorConfig, editorModalVisible]);

  // Cleanup editor on modal close
  useEffect(() => {
    if (!editorModalVisible && docEditorRef.current) {
      try {
        docEditorRef.current.destroyEditor();
        docEditorRef.current = null;
      } catch (err) {
        console.error("Failed to destroy editor:", err);
      }
    }
  }, [editorModalVisible]);

  const handleCloseEditorModal = useCallback(() => {
    if (docEditorRef.current) {
      try {
        docEditorRef.current.destroyEditor();
        docEditorRef.current = null;
      } catch (e) {
        console.log("Editor destroy error:", e);
      }
    }
    setEditorModalVisible(false);
    setEditorConfig(null);
    setScriptLoaded(false);
  }, []);

  const openEditor = useCallback((fileName: string) => {
    setGeneratedFileName(fileName);
  }, []);

  return {
    editorModalVisible,
    editorLoading,
    editorContainerRef,
    handleCloseEditorModal,
    openEditor,
  };
};
