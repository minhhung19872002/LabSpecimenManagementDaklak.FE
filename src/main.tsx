import { createRoot } from "react-dom/client";
import { App as AntApp } from "antd";
import "antd/dist/reset.css";
import "./index.css";
import "./i18n/config";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <AntApp>
    <App />
  </AntApp>
);
