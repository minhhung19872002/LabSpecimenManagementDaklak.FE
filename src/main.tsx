// UAT deployment test - 2026-02-20 (Test #2)
import { createRoot } from "react-dom/client";
import { App as AntApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import "antd/dist/reset.css";
import "./styles/variables.css";
import "./index.css";
import "./i18n/config";
import App from "./App.tsx";
import theme from "./theme";
import { registerSW } from "virtual:pwa-register";

// Register service worker for PWA offline support
const updateSW = registerSW({
  onNeedRefresh() {
    // Update when user is not actively using the page (tab hidden or on next visit)
    if (document.hidden) {
      updateSW(true);
    } else {
      // Update when user leaves and comes back to the tab
      const handleVisibilityChange = () => {
        if (document.hidden) {
          updateSW(true);
          document.removeEventListener("visibilitychange", handleVisibilityChange);
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
  onRegistered(registration) {
    console.log("Service Worker registered:", registration);
  },
  onRegisterError(error) {
    console.error("Service Worker registration error:", error);
  },
});

createRoot(document.getElementById("root")!).render(
  <ConfigProvider theme={theme} locale={viVN}>
    <AntApp>
      <App />
    </AntApp>
  </ConfigProvider>
);
