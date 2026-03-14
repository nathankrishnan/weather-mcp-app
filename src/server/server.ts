import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./tools";
import { registerResources } from "./resources";

const PORT = 3001;

const server = new McpServer({
  name: "Weather MCP App",
  version: "1.0.0",
});

registerTools(server);
registerResources(server);

const app = express();
app.use(cors());
app.use(express.json());

app.all("/mcp", async (req, res) => {
  try {
    // Stateless: create a transport per request
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Weather MCP server running at http://localhost:${PORT}/mcp`);
});
