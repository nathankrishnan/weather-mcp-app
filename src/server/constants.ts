// Shared constants used by tools and resources

import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps";

// The MIME type that marks this as an MCP app ("text/html;profile=mcp-app")
// signals to the host that this resource should be rendered as an app iframe
export { RESOURCE_MIME_TYPE };

// tools.ts references these to tell the host which UI to open.
// ext-apps hosts expect app resources to use the ui:// scheme.
export const MAIN_RESOURCE_URI = "ui://weather/main";
export const NEARBY_RESOURCE_URI = "ui://weather/nearby";
