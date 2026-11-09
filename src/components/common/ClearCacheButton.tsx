import React from "react";
import { Modal, Tooltip } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import "./ClearCacheButton.css";

/** Xóa Cache Storage (precache của Service Worker) rồi tải lại trang */
export const clearCacheAndReload = () => {
  const reload = () => window.location.reload();
  if ("caches" in window) {
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(reload)
      .catch(reload);
  } else {
    reload();
  }
};

export const confirmClearCache = () => {
  Modal.confirm({
    title: "Xóa cache & tải lại",
    content: "Ứng dụng sẽ xóa toàn bộ bộ nhớ đệm và tải lại trang. Bạn có chắc chắn?",
    okText: "Xóa & tải lại",
    cancelText: "Hủy",
    centered: true,
    onOk: clearCacheAndReload,
  });
};

const ClearCacheButton: React.FC = () => (
  <Tooltip title="Xóa cache & tải lại" placement="bottom">
    <div
      className="clear-cache-btn"
      role="button"
      aria-label="Xóa cache & tải lại"
      onClick={confirmClearCache}
    >
      <ClearOutlined className="clear-cache-btn-icon" />
    </div>
  </Tooltip>
);

export default ClearCacheButton;
