import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// AuthProvider and CookieProvider are mounted inside App.tsx so that they
// share the same module boundary as BrowserRouter.  Mounting them here
// previously caused the React internal dispatcher to be null in lazy-loaded
// route chunks, producing: "Cannot read properties of null (reading 'useContext')".
createRoot(document.getElementById("root")!).render(
  <App />
);
