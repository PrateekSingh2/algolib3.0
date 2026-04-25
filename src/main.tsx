import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieProvider } from "@/contexts/CookieContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <CookieProvider>
      <App />
    </CookieProvider>
  </AuthProvider>,
);
