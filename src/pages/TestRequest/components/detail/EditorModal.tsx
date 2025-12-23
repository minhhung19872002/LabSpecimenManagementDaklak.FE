import React from "react";
import { Modal, Button, Spin } from "antd";
import { CloseOutlined } from "@ant-design/icons";

interface EditorModalProps {
  visible: boolean;
  loading: boolean;
  editorContainerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

const EditorModal: React.FC<EditorModalProps> = ({
  visible,
  loading,
  editorContainerRef,
  onClose,
}) => {
  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
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
        <Button icon={<CloseOutlined />} onClick={onClose}>
          Đóng
        </Button>
      }
      closable={false}
      destroyOnClose
      centered={false}
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <Spin size="large" tip="Đang tải editor..." />
        </div>
      ) : (
        <div
          id="result-form-editor-container"
          ref={editorContainerRef}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </Modal>
  );
};

export default EditorModal;
