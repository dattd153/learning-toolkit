import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppStoreProvider } from "./state/AppStore";
import { ToastProvider } from "./state/Toast";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStoreProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AppStoreProvider>
  </StrictMode>,
);
