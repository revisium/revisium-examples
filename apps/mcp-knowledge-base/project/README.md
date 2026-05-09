# MCP Knowledge Base Example

This is a small stdio MCP server that exposes a Revisium knowledge-base project to an AI agent. The schema and seed data live in `../bootstrap.config.json`; this folder is the runtime app.

## Architecture

```mermaid
flowchart LR
  Agent[AI agent] --> MCP[This MCP server]
  MCP --> Client[@revisium/client]
  Client --> Revisium[Revisium API]
  Revisium --> Tables[(facts, decisions, tasks, sessions)]
```

## Revisium URL

Use one `REVISIUM_URL`, matching the Revisium CLI shape:

```text
revisium://[user:password@]host[:port]/organization/project/branch[:revision][?token=...|apikey=...]
```

Examples:

```env
REVISIUM_URL=revisium://your-username:your-password@localhost:9222/admin/knowledge-base/master:head
REVISIUM_URL=revisium://your-username:your-password@localhost:8080/admin/knowledge-base/master:head
REVISIUM_URL=revisium://cloud.revisium.io/my-org/knowledge-base/master:head?apikey=rev_xxx
```

## Run

First bootstrap the Revisium project from the catalog repository:

```bash
cd ../../../
npm install
npm run bootstrap:mcp-kb
```

Then build this MCP server from the repo root:

```bash
cd apps/mcp-knowledge-base/project
cp .env.example .env
npm install
npm run build
```

Register it with an MCP client:

```bash
claude mcp add revisium-kb --env REVISIUM_URL="$(grep '^REVISIUM_URL=' .env | cut -d= -f2-)" -- node "$(pwd)/dist/main.js"
```

## Tools

| Tool | Description |
| --- | --- |
| `kb_search` | Searches facts, decisions, tasks, modules, blockers, and sessions |
| `kb_get_row` | Reads one row by table ID and row ID |
| `kb_list_tables` | Lists available KB tables and row counts |

## Code Map

| Path | Purpose |
| --- | --- |
| `src/revisium/kb-client.ts` | Reads Revisium rows with `@revisium/client` |
| `src/mcp/server.ts` | Defines MCP tools |
| `src/revisium/revisium-url.ts` | Parses `REVISIUM_URL` |
