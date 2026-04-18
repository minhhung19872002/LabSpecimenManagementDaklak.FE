// UAT deployment test - 2026-02-21 (SSH Key Authentication Test)
import { createRoot } from "react-dom/client";
import { App as AntApp, ConfigProvider } from "antd";
import { HelmetProvider } from "react-helmet-async";
import viVN from "antd/locale/vi_VN";
import "antd/dist/reset.css";
import "./styles/variables.css";
import "./index.css";
import "./i18n/config";
import App from "./App.tsx";
import theme from "./theme";
import { registerSW } from "virtual:pwa-register";

// Register service worker for PWA offline support
registerSW({
  onNeedRefresh() {
    // Dispatch event để AppUpdateNotification hiển thị dialog
    window.dispatchEvent(new CustomEvent("sw-update-available"));
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
  onRegistered(registration) {
    console.log("Service Worker registered:", registration);
    // Kiểm tra SW update định kỳ (mỗi 5 phút)
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error("Service Worker registration error:", error);
  },
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ConfigProvider theme={theme} locale={viVN}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </HelmetProvider>
);
