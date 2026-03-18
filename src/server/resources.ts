// Registers the two HTML resources the MCP host fetches when displaying the UI.
// Each resource is a compiled Vite output HTML file served as a string.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource } from "@modelcontextprotocol/ext-apps/server";
import { readFileSync } from "fs";
import { join } from "path";
import { MAIN_RESOURCE_URI, NEARBY_RESOURCE_URI, RESOURCE_MIME_TYPE } from "./constants";

// Helper: read a compiled HTML file from dist/
function readHtml(filename: string): string {
  const filePath = join(__dirname, "../../dist", filename);
  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read app resource HTML at ${filePath}:`, error);
    return `<html><body><p>Weather app is temporarily unavailable. Please try again in a moment.</p></body></html>`;
  }
}

// --- Resources ---
export function registerResources(server: McpServer): void {
  // Main Weather App
  // Handles: current conditions, hourly forecast, weekly forecast
  // Triggered by: get-current-weather, get-hourly-forecast, get-weekly-forecast
  registerAppResource(
    server,
    "Weather App",
    MAIN_RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: MAIN_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: readHtml("src/weather-app/main/weather.html"),
        },
      ],
    }),
  );

  // Nearby locations
  // Handles: nearby city comparison
  // Triggered by: get-nearby-weather
  registerAppResource(
    server,
    "Nearby Weather",
    NEARBY_RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: NEARBY_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: readHtml("src/weather-app/nearby/nearby.html"),
        },
      ],
    }),
  );
}
