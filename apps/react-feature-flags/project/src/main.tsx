import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { FlagsProvider } from "./features/flags/FlagsProvider";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FlagsProvider>
      <App />
    </FlagsProvider>
  </StrictMode>,
);
