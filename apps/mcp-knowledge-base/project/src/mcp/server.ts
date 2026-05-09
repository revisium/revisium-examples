import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RevisiumKbClient } from "../revisium/kb-client.js";

export function createKbServer(): McpServer {
  const kb = new RevisiumKbClient();
  const server = new McpServer(
    {
      name: "revisium-kb",
      version: "0.1.0",
    },
    {
      instructions:
        "Use these tools to inspect the Revisium knowledge-base project configured by REVISIUM_URL.",
    },
  );

  server.registerTool(
    "kb_list_tables",
    {
      title: "List KB tables",
      description: "List available knowledge-base tables and row counts.",
    },
    async () => textResult(await kb.listTables()),
  );

  server.registerTool(
    "kb_get_row",
    {
      title: "Get KB row",
      description: "Read one knowledge-base row by table ID and row ID.",
      inputSchema: {
        tableId: z.string().min(1),
        rowId: z.string().min(1),
      },
    },
    async ({ tableId, rowId }) => textResult(await kb.getRow(tableId, rowId)),
  );

  server.registerTool(
    "kb_search",
    {
      title: "Search KB",
      description: "Search knowledge-base rows across facts, decisions, tasks, modules, blockers, and sessions.",
      inputSchema: {
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ query, limit }) => textResult(await kb.search(query, limit ?? 10)),
  );

  return server;
}

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}
