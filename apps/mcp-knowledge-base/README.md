# MCP Knowledge Base

Expose a local Revisium knowledge-base project to an AI agent through a small
stdio MCP server.

The runnable MCP server lives in [`project/`](./project/README.md). Bootstrap
config and seed data stay at this example root.

## What This Shows

- MCP access to Revisium data
- knowledge tables with JSON Schema and markdown content fields
- relationships through foreign keys
- practical KB shapes for memory, architecture notes, and work summaries

## Prerequisites

- Node.js 22+
- local Revisium Standalone on `http://localhost:9222`

## Run

Terminal 1:

```bash
npx @revisium/standalone@latest
```

Terminal 2:

```bash
npm install
cp apps/mcp-knowledge-base/.env.example apps/mcp-knowledge-base/.env
npm run bootstrap:mcp-kb
cd apps/mcp-knowledge-base/project
cp .env.example .env
npm install
npm run build
npm start
```

Register the built stdio server from `apps/mcp-knowledge-base/project`:

```bash
claude mcp add revisium-kb --env REVISIUM_URL="$(grep '^REVISIUM_URL=' .env | cut -d= -f2-)" -- node "$(pwd)/dist/main.js"
```

Stop standalone from terminal 1 with `Ctrl+C`.

## Architecture

```mermaid
flowchart LR
  Agent[AI agent] --> Server[Example MCP server]
  Server --> SDK[@revisium/client]
  SDK --> Revisium[Revisium Standalone :9222]
  Browser[Admin UI] --> Revisium
  Revisium --> Tables[(Knowledge-base tables)]
```

## Revisium Tables

Bootstrap creates project `knowledge-base` with these tables:

| Table | Purpose | Key fields |
| --- | --- | --- |
| `facts` | Stable knowledge with source and confidence | `topic`, `source`, `content`, `category`, `verified`, `confidence` |
| `decisions` | ADR-style decisions with supporting fact links | `date`, `status`, `context`, `decision`, `supportingFacts` |
| `tasks` | Work items linked to facts and decisions | `title`, `status`, `description`, `relatedFacts`, `relatedDecisions` |
| `attachments` | Evidence files linked from knowledge rows | `title`, `file` |
| `modules` | Codebase architecture by bounded area | `title`, `path`, `content` |
| `sessions` | Short work summaries connected to tasks and decisions | `date`, `summary`, `tasksStarted`, `tasksCompleted` |

## Capability Coverage

| Capability | Covered by | Notes |
| --- | --- | --- |
| Tables | `facts`, `decisions`, `tasks`, `modules`, `sessions`, `attachments` | Knowledge, work, architecture, and evidence |
| Scalar FK | `blockers.relatedTask` | Blocker points to task |
| Nested FK | `sessions.context.primaryDecisionId` | Nested session context references decision |
| Array primitive FK | `decisions.supportingFacts[]` | Fact links |
| Array object FK | `sessions.tasksCompleted[].taskId` | Object array with task FK |
| Array primitives | `facts.tags[]` | Search and classification tags |
| Array objects | `sessions.tasksCompleted[]` | Completed task entries |
| File field | `attachments.file` | Evidence file |
| Nested file | `facts.evidence.primaryFile` | File under evidence object |
| File array | `facts.attachments[]` | Multiple evidence files |
| Nested file array | `sessions.evidence.files[]` | Nested session evidence |
| Computed scalar | `facts.qualityScore` | Derived from confidence and verification state |
| Computed nested | `sessions.metrics.doneCount` | Derived from nested task arrays |
| Computed array index | `sessions.firstCompletedTaskId` | Reads first completed task |
| Computed aggregate | `sessions.totalLinkedItems` | Counts completed task links |
| Generated API | `POST /tables/facts/rows` | Useful for docs or dashboards |
| MCP | `kb_search`, `kb_get_row`, `kb_list_tables` | Agent workflow |

## Environment

Bootstrap writes to draft:

```env
REVISIUM_URL=revisium://admin:admin@localhost:9222/admin/knowledge-base/master
REVISIUM_MCP_URL=http://localhost:9222/mcp
```

Runtime reads committed `head`:

```env
REVISIUM_URL=revisium://admin:admin@localhost:9222/admin/knowledge-base/master:head
```

## See and Manage Data

- Admin UI: `http://localhost:9222`
- MCP endpoint: `http://localhost:9222/mcp`
- Generated REST base:
  `http://localhost:9222/endpoint/rest/admin/knowledge-base/master/head`

## Verify

```bash
curl -fsS -X POST http://localhost:9222/endpoint/rest/admin/knowledge-base/master/head/tables/facts/rows \
  -H 'content-type: application/json' \
  -d '{"first":10}'
```

After registering the MCP server, ask your MCP client to call `kb_search` for a
seeded topic.

## Docs

- MCP: https://docs.revisium.io/apis/mcp
- AI agent memory: https://docs.revisium.io/use-cases/ai-agent-memory
- Platform hierarchy: https://docs.revisium.io/core-concepts/platform-hierarchy
