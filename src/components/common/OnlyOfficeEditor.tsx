import React, { useEffect, useRef, useState } from "react";
import { Modal, Spin, message, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import {
  formTemplateService,
  OnlyOfficeEditorConfigDto,
} from "../../services/masterDataService";

declare global {
  interface Window {
    DocsAPI: any;
  }
}

type OnlyOfficeMode = "edit" | "view";

interface OnlyOfficeEditorProps {
  visible: boolean;
  fileName: string;
  onClose: () => void;

  // NEW
  mode?: OnlyOfficeMode; // default: "edit"
  user?: { id: string; name: string };
  permissions?: Partial<{
    edit: boolean;
    download: boolean;
    print: boolean;
    comment: boolean;
    copy: boolean;
    fillForms: boolean;
    modifyContentControl: boolean;
    modifyFilter: boolean;
    review: boolean;
  }>;
}

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
  visible,
  fileName,
  onClose,

  mode = "edit",
  user = { id: "1", name: "Editor" },
  permissions,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [editorConfig, setEditorConfig] =
    useState<OnlyOfficeEditorConfigDto | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const loadScript = async () => {
      try {
        setLoading(true);
        setScriptLoaded(false);

        const config = await formTemplateService.getEditorConfig(fileName);
        setEditorConfig(config);

        const scriptId = "onlyoffice-api-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
          script = document.createElement("script");
          script.id = scriptId;
          script.src = `${config.documentServerUrl}/web-apps/apps/api/documents/api.js`;
          script.async = true;

          script.onload = () => {
            setScriptLoaded(true);
            setLoading(false);
          };

          script.onerror = () => {
            message.error(
              "Không thể tải OnlyOffice Document Server. Vui lòng kiểm tra cấu hình."
            );
            setLoading(false);
          };

          document.head.appendChild(script);
        } else {
          if (window.DocsAPI) setScriptLoaded(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load editor config:", err);
        message.error("Không thể tải cấu hình editor");
        setLoading(false);
      }
    };

    loadScript();
  }, [visible, fileName]);

  useEffect(() => {
    if (
      !scriptLoaded ||
      !editorConfig ||
      !editorContainerRef.current ||
      !visible
    )
      return;

    const initTimer = setTimeout(() => {
      try {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.destroyEditor();
        }

        const isEditMode = mode === "edit";

        // Default permissions
        const defaultPermissions = {
          edit: isEditMode, // quan trọng: view => false
          download: true,
          print: true,
          comment: true,
          copy: true,
          fillForms: true,
          modifyContentControl: true,
          modifyFilter: true,
          review: true,
        };

        const finalPermissions = {
          ...defaultPermissions,
          ...(permissions || {}),
        };

        // Nếu mode=view mà permissions.edit vẫn true do override -> ép về false để preview đúng nghĩa
        if (!isEditMode) {
          finalPermissions.edit = false;
        }

        const config = {
          document: {
            fileType: editorConfig.config.document.fileType,
            key: editorConfig.config.document.key,
            title: editorConfig.config.document.title,
            url: editorConfig.config.document.url,
            permissions: finalPermissions,
          },
          documentType: editorConfig.config.documentType,
          editorConfig: {
            mode: isEditMode ? "edit" : "view", // preview
            lang: "vi",
            user,
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
              console.log("Document is ready");
            },
            onError: (event: any) => {
              console.error("OnlyOffice error:", event);
              const errorCode = event?.data?.errorCode || event?.data;
              if (errorCode === -2 || errorCode === -4 || errorCode === -5)
                return;
              message.error("Có lỗi xảy ra với document editor");
            },
            onWarning: (event: any) => {
              const warningCode = event?.data?.warningCode || event?.data;
              if (warningCode === -101) return;
              console.warn("OnlyOffice warning:", event);
            },
            onRequestSaveAs: (event: any) => {
              console.log("Save as requested", event);
            },
          },
        };

        editorInstanceRef.current = new window.DocsAPI.DocEditor(
          "onlyoffice-editor-container",
          config
        );
      } catch (err) {
        console.error("Failed to initialize editor:", err);
        message.error("Không thể khởi tạo editor");
      }
    }, 100);

    return () => clearTimeout(initTimer);
  }, [scriptLoaded, editorConfig, visible, mode, user, permissions]);

  useEffect(() => {
    if (!visible && editorInstanceRef.current) {
      try {
        editorInstanceRef.current.destroyEditor();
        editorInstanceRef.current = null;
      } catch (err) {
        console.error("Failed to destroy editor:", err);
      }
    }
  }, [visible]);

  const handleClose = () => {
    if (editorInstanceRef.current) {
      try {
        editorInstanceRef.current.destroyEditor();
        editorInstanceRef.current = null;
      } catch (err) {
        console.error("Failed to destroy editor:", err);
      }
    }
    onClose();
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleClose}
      width="100vw"
      style={{ top: 0, margin: 0, padding: 0, maxWidth: "100vw" }}
      styles={{
        body: { height: "calc(100vh - 53px)", padding: 0, overflow: "hidden" },
        wrapper: { padding: 0 },
        mask: { padding: 0 },
        header: { display: "none" },
        footer: { marginTop: 0, padding: "10px 16px" },
      }}
      wrapClassName="fullscreen-modal"
      footer={
        <Button icon={<CloseOutlined />} onClick={handleClose}>
          Đóng
        </Button>
      }
      closable={false}
      destroyOnClose
      centered={false}
    >
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Spin size="large" tip="Đang tải editor..." />
        </div>
      ) : (
        <div
          id="onlyoffice-editor-container"
          ref={editorContainerRef}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </Modal>
  );
};

export default OnlyOfficeEditor;
