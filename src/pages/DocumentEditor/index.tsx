import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Spin, Button, message } from "antd";
import { ArrowLeftOutlined } from "../../components/common/Icon";
import { OnlyOfficeEditor } from "../../components/OnlyOfficeEditor";
import { CollaboraEditor } from "../../components/CollaboraEditor";
import {
  OfflineDocxEditor,
  type OfflineDocxEditorHandle,
} from "../../components/OfflineDocxEditor";
import { getResultDraft, saveResultDraft } from "../../services/offline";
import { API_BASE_URL } from "../../services/api";

type EditorProvider = "OnlyOffice" | "Collabora";

const DocumentEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileName = searchParams.get("file");
  // When present, edit an offline-generated result-form draft entirely
  // client-side (no backend / Collabora). See generateResultFormOffline.
  const offlineDraftId = searchParams.get("offlineDraft");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<EditorProvider | null>(null);

  // Offline draft state
  const offlineRef = useRef<OfflineDocxEditorHandle>(null);
  const [draftBuffer, setDraftBuffer] = useState<ArrayBuffer | null>(null);
  const [draftFileName, setDraftFileName] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Load offline draft (if any) instead of the online editor flow.
  useEffect(() => {
    if (!offlineDraftId) return;
    let mounted = true;
    (async () => {
      try {
        const draft = await getResultDraft(offlineDraftId);
        if (!mounted) return;
        if (!draft) {
          setError("Không tìm thấy phiếu kết quả offline.");
          setLoading(false);
          return;
        }
        setDraftFileName(draft.fileName);
        setDraftBuffer(await draft.blob.arrayBuffer());
        setLoading(false);
      } catch {
        if (mounted) {
          setError("Không mở được phiếu kết quả offline.");
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [offlineDraftId]);

  // Fetch editor provider config (online flow only).
  useEffect(() => {
    if (offlineDraftId) return;
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/config/document-editor`);
        if (response.ok) {
          const data = await response.json();
          const providerValue = data.provider || data.data?.provider || "OnlyOffice";
          setProvider(providerValue as EditorProvider);
        } else {
          setProvider("OnlyOffice");
        }
      } catch {
        setProvider("OnlyOffice");
      }
    };
    fetchConfig();
  }, [offlineDraftId]);

  useEffect(() => {
    if (offlineDraftId) return;
    if (!fileName) {
      setError("Không tìm thấy tên file");
      setLoading(false);
    }
  }, [fileName, offlineDraftId]);

  const handleBack = () => {
    window.close();
    setTimeout(() => navigate(-1), 100);
  };

  const handleSaveDraft = useCallback(async () => {
    if (!offlineDraftId || !offlineRef.current) return;
    setSaving(true);
    try {
      const buffer = await offlineRef.current.save();
      if (!buffer) throw new Error("Không lấy được nội dung tài liệu");
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      await saveResultDraft({
        id: offlineDraftId,
        fileName: draftFileName,
        blob,
        status: "pending-sync",
      });
      message.success("Đã lưu nháp. Sẽ đồng bộ khi có mạng.");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Lưu nháp thất bại");
    } finally {
      setSaving(false);
    }
  }, [offlineDraftId, draftFileName]);

  if (error) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div style={{ color: "#ff4d4f", fontSize: 16 }}>{error}</div>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          Quay lại
        </Button>
      </div>
    );
  }

  // ---- Offline draft editor ----
  if (offlineDraftId) {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 16px",
            borderBottom: "1px solid #f0f0f0",
            background: "#fafafa",
          }}
        >
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} size="small">
            Quay lại
          </Button>
          <span style={{ fontWeight: 600 }}>{draftFileName || "Phiếu kết quả (offline)"}</span>
          <span style={{ flex: 1 }} />
          <Button type="primary" loading={saving} onClick={handleSaveDraft} size="small">
            Lưu nháp
          </Button>
        </div>
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                zIndex: 1000,
              }}
            >
              <Spin size="large" tip="Đang tải tài liệu..." />
            </div>
          )}
          {draftBuffer && (
            <OfflineDocxEditor
              ref={offlineRef}
              documentBuffer={draftBuffer}
              height="100%"
              onReady={() => setLoading(false)}
              onError={(err) => {
                setError(err);
                message.error(`Lỗi: ${err}`);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // ---- Online editor flow (unchanged) ----
  if (!fileName || !provider) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
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
            zIndex: 1000,
          }}
        >
          <Spin size="large" tip="Đang tải tài liệu..." />
        </div>
      )}

      {provider === "OnlyOffice" && (
        <OnlyOfficeEditor
          fileName={fileName}
          height="100vh"
          onReady={() => setLoading(false)}
          onDocumentReady={() => setLoading(false)}
          onError={(err) => {
            setLoading(false);
            setError(err);
            message.error(`Lỗi: ${err}`);
          }}
        />
      )}

      {provider === "Collabora" && (
        <CollaboraEditor
          fileName={fileName}
          height="100vh"
          onReady={() => setLoading(false)}
          onDocumentReady={() => setLoading(false)}
          onError={(err) => {
            setLoading(false);
            setError(err);
            message.error(`Lỗi: ${err}`);
          }}
        />
      )}
    </div>
  );
};

export default DocumentEditorPage;
