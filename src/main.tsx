import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/index.css";
import "katex/dist/katex.min.css";

import { App } from "./app/App";
import { AuthProvider } from "./features/auth/AuthProvider";
import { ToastProvider } from "./components/toast/ToastProvider";
import { GlobalTimersProvider } from "./features/items/timers/GlobalTimersProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <GlobalTimersProvider>
            <App />
          </GlobalTimersProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
