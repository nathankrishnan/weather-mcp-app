import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../global.css";
import { NearbyApp } from "./NearbyApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NearbyApp />
  </StrictMode>,
);
