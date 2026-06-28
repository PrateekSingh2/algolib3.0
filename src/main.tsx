import { createRoot } from "react-dom/client";
import { loader } from "@monaco-editor/react";
import App from "./App.tsx";
import "./index.css";

// Globally configure Monaco Editor to use Cloudflare's CDN (cdnjs).
// This prevents infinite "Loading..." hangs caused by unpkg or jsdelivr rate-limiting/blocking.
loader.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs' } });

// AuthProvider and CookieProvider are mounted inside App.tsx so that they
// share the same module boundary as BrowserRouter.  Mounting them here
// previously caused the React internal dispatcher to be null in lazy-loaded
// route chunks, producing: "Cannot read properties of null (reading 'useContext')".
createRoot(document.getElementById("root")!).render(
  <App />
);
