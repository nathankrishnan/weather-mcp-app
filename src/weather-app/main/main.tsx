// React entry point: mounts WeatherApp into the #root div

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../global.css";
import { WeatherApp } from "./WeatherApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WeatherApp />
  </StrictMode>,
);
