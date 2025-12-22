import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { App as AntApp } from "antd";
import "antd/dist/reset.css";
import "./index.css";
import "./i18n/config";
import App from "./App.tsx";
import { store } from "./store";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <AntApp>
      <App />
    </AntApp>
  </Provider>
);
