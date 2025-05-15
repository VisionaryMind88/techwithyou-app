import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { MockAuthProvider } from "./context/mock-auth-context";

// Use the MockAuthProvider for debugging
createRoot(document.getElementById("root")!).render(
  <MockAuthProvider>
    <App />
  </MockAuthProvider>
);
