import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Spin, Button, message } from "antd";
import { ArrowLeftOutlined } from "../../components/common/Icon";
import { OnlyOfficeEditor } from "../../components/OnlyOfficeEditor";

const DocumentEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileName = searchParams.get("file");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileName) {
      setError("Không tìm thấy tên file");
      setLoading(false);
    }
  }, [fileName]);

  const handleBack = () => {
    // Try to close the tab, if it fails (not opened by script), go back
    window.close();
    // Fallback: navigate back if window.close() doesn't work
    setTimeout(() => {
      navigate(-1);
    }, 100);
  };

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

  if (!fileName) {
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
    </div>
  );
};

export default DocumentEditorPage;
