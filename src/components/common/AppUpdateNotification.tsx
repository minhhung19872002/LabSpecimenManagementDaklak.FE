import { useEffect, useRef, useCallback } from "react";
import { Modal } from "antd";
import { Icon } from "@iconify/react";

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 phút
const VERSION_URL = "/version.json";

// Hash của bundle ĐANG CHẠY, nhúng lúc build (xem vite.config.ts `define`).
// Chỉ dùng ở bản production; dev dùng version.json tĩnh nên bỏ qua để khỏi bung popup nhầm.
const RUNNING_BUILD_HASH =
  import.meta.env.PROD && typeof __BUILD_HASH__ !== "undefined"
    ? __BUILD_HASH__
    : null;

/**
 * Component kiểm tra phiên bản mới của ứng dụng.
 * Poll file version.json mỗi 5 phút, nếu phát hiện build hash thay đổi
 * thì hiển thị dialog yêu cầu người dùng cập nhật.
 */
const AppUpdateNotification: React.FC = () => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isShowingModal = useRef(false);

  const showUpdateModal = useCallback(() => {
    if (isShowingModal.current) return;
    isShowingModal.current = true;

    Modal.confirm({
      title: "Phiên bản mới",
      icon: (
        <Icon
          icon="mdi:cellphone-arrow-down"
          width={24}
          style={{ color: "#1890ff", marginRight: 8 }}
        />
      ),
      content:
        "Ứng dụng đã được cập nhật phiên bản mới. Vui lòng tải lại trang để sử dụng phiên bản mới nhất.",
      okText: "Cập nhật ngay",
      cancelText: "Để sau",
      centered: true,
      onOk() {
        // Clear all caches then reload
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
      },
      onCancel() {
        isShowingModal.current = false;
        // Hiển thị lại dialog sau 10 phút nếu user chưa cập nhật
        setTimeout(() => showUpdateModal(), 10 * 60 * 1000);
      },
    });
  }, []);

  const checkForUpdate = useCallback(async () => {
    // Chỉ kiểm tra ở bản build (dev không có version.json khớp với bundle).
    if (!RUNNING_BUILD_HASH) return;

    try {
      const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;

      const data = await res.json();
      const remoteBuildHash = data.buildHash;

      if (!remoteBuildHash) return;

      // So hash bundle ĐANG CHẠY với hash trên server. Khác nhau = đã deploy bản mới.
      // (Trước đây lấy hash server lần đầu làm "hiện tại" nên luôn bằng nhau → không bao
      //  giờ hiện popup; nay đối chiếu với hash nhúng trong bundle nên phát hiện đúng.)
      if (remoteBuildHash !== RUNNING_BUILD_HASH) {
        showUpdateModal();
      }
    } catch {
      // Bỏ qua lỗi mạng (offline)
    }
  }, [showUpdateModal]);

  useEffect(() => {
    // Check ngay khi mount
    checkForUpdate();

    // Poll định kỳ
    intervalRef.current = setInterval(checkForUpdate, VERSION_CHECK_INTERVAL);

    // Cũng check khi user quay lại tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForUpdate]);

  // Lắng nghe SW update event từ main.tsx
  useEffect(() => {
    const handleSWUpdate = () => showUpdateModal();
    window.addEventListener("sw-update-available", handleSWUpdate);
    return () =>
      window.removeEventListener("sw-update-available", handleSWUpdate);
  }, [showUpdateModal]);

  return null; // Không render gì, chỉ quản lý logic
};

export default AppUpdateNotification;
