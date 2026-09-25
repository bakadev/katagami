import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "~/lib/theme/ThemeProvider";
import { AuthProvider } from "~/lib/auth/AuthProvider";
import { Toaster } from "~/components/ui/sonner";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
      <Toaster richColors closeButton position="bottom-right" />
    </ThemeProvider>
  </React.StrictMode>,
);
