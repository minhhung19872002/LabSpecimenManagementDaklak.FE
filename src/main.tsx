import { createRoot } from "react-dom/client";
import { App as AntApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import "antd/dist/reset.css";
import "./styles/variables.css";
import "./index.css";
import "./i18n/config";
import App from "./App.tsx";
import theme from "./theme";

createRoot(document.getElementById("root")!).render(
  <ConfigProvider theme={theme} locale={viVN}>
    <AntApp>
      <App />
    </AntApp>
  </ConfigProvider>
);
