# MCP Knowledge Base

Use a local writable Revisium instance for primary knowledge-base authoring, with
Cloud as an optional read/inspect MCP endpoint.

The runnable MCP server lives in [`project/`](./project/README.md). Bootstrap config
and seed data stay at this example root, while `project/` contains the runnable app.

## What This Shows

- MCP access to live Revisium projects
- knowledge tables with JSON Schema and markdown content fields
- relationships through foreign keys
- practical KB shapes for memory, architecture notes, and regression results

## Supported Modes

| Mode | URL | Notes |
| --- | --- | --- |
| Revisium Cloud | `https://cloud.revisium.io/mcp` | Optional managed read access |
| Standalone | `http://localhost:9222/mcp` | Local copy for writable tests |
| Docker Compose | `http://localhost:8080/mcp` | Self-hosted copy of the same schema |

## Run

| Step | Command or action | Notes |
| --- | --- | --- |
| 1 | `npm install` | Install repo validation and bootstrap tooling |
| 2 | `cp apps/mcp-knowledge-base/.env.example apps/mcp-knowledge-base/.env` | Fill one `REVISIUM_URL` |
| 3 | `npx @revisium/standalone@latest` | Start writable local Revisium (`:9222`) |
| 4 | `npm run bootstrap:mcp-kb` | Create KB tables, seed rows, and endpoints |
| 5 | `cd apps/mcp-knowledge-base/project && cp .env.example .env && npm install` | Prepare MCP server env and dependencies |
| 6 | `npm run build` | Build MCP server |
| 7 | `npm start` | Run MCP server |
| 8 | Register this stdio MCP server | Use the command below from `apps/mcp-knowledge-base/project` |

```bash
claude mcp add revisium-kb --env REVISIUM_URL="$(grep '^REVISIUM_URL=' .env | cut -d= -f2-)" -- node "$(pwd)/dist/main.js"
```

## See and Manage Data

- Admin UI: `http://localhost:9222`
- MCP local endpoint: `http://localhost:9222/mcp`
- MCP Cloud endpoint: `https://cloud.revisium.io/mcp` (optional read-only inspection)
- REST visibility check:
  `http://localhost:9222/endpoint/rest/admin/knowledge-base/master/head/facts`

Use local instances for all content edits; promote to Cloud only after review and
snapshot export.

```bash
npm install
cp apps/mcp-knowledge-base/.env.example apps/mcp-knowledge-base/.env

# terminal 1
npx @revisium/standalone@latest

# terminal 2
npm run bootstrap:mcp-kb
cd apps/mcp-knowledge-base/project
cp .env.example .env
npm install
npm run build
npm start
```

## Architecture

```mermaid
flowchart LR
  Agent[AI agent] --> MCP[Revisium MCP]
  MCP --> Cloud[Revisium Cloud]
  Cloud --> Memory[(memory project)]
  Cloud --> CoreKB[(kb-revisium-core project)]
  Cloud --> Regression[(regression-matrix project)]
  Human[Human reviewer] --> Admin[Admin UI]
  Admin --> Cloud
```

## Live Cloud Research Snapshot

Read-only MCP inspection found organization `revisium-kb` with these projects:

| Project | Visibility | Tables | Notable row counts |
| --- | --- | --- | --- |
| `memory` | private | 8 | `facts` 97, `decisions` 38, `tasks` 47 |
| `kb-revisium-core` | private | 4 | `modules` 16, `decisions` 7 |
| `regression-matrix` | public | 4 | `test-cases` 208, `issues` 26, `test-results` 16 |

Useful table shapes:

| Project | Table | Schema pattern |
| --- | --- | --- |
| `memory` | `facts` | topic, source, markdown content, category enum, verified, confidence |
| `memory` | `decisions` | date, status enum, context, decision, rationale, supporting fact FKs |
| `memory` | `tasks` | phase/status enums plus FK arrays to facts and decisions |
| `kb-revisium-core` | `modules` | title, source path, markdown content |
| `regression-matrix` | `test-cases` | operation matrix across MCP, REST, GraphQL, generated APIs |

## Revisium Tables

Recommended KB table model:

| Table | Purpose | Key fields |
| --- | --- | --- |
| `facts` | Stable knowledge with source and confidence | `topic`, `source`, `content`, `category`, `verified`, `confidence` |
| `decisions` | ADR-style decisions with supporting fact links | `date`, `status`, `context`, `decision`, `supportingFacts` |
| `tasks` | Work items linked to facts and decisions | `title`, `status`, `description`, `relatedFacts`, `relatedDecisions` |
| `attachments` | Evidence files linked from knowledge rows | `title`, `file` |
| `modules` | Codebase architecture by bounded area | `title`, `path`, `content` |
| `sessions` | Short work summaries connected to tasks and decisions | `date`, `summary`, `tasksStarted`, `tasksCompleted` |

## Capability Coverage

This domain should show Revisium as an agent-readable, human-reviewable knowledge base.

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
| Generated API | Optional read-only API for public KBs | Useful for docs or dashboards |
| MCP | Primary access path: `get_tables`, `search_rows`, `get_row` | Agent workflow |

## Environment

Use the same Revisium URL format as `revisium-cli`:

```text
revisium://[user:password@]host[:port]/organization/project/branch[:revision][?token=...|apikey=...]
```

```env
REVISIUM_URL=revisium://your-username:your-password@localhost:9222/admin/knowledge-base/master
REVISIUM_MCP_URL=http://localhost:9222/mcp
```

Cloud mode uses `https://cloud.revisium.io/mcp` and carries the API key in the Revisium URL.

```env
REVISIUM_URL=revisium://cloud.revisium.io/my-org/knowledge-base/master?apikey=rev_xxx
REVISIUM_MCP_URL=https://cloud.revisium.io/mcp
```

## MCP Setup

```bash
claude mcp add --transport http revisium-cloud https://cloud.revisium.io/mcp
```

Example read-only calls:

```text
get_projects(organizationId: "revisium-kb")
get_tables(uri: "revisium-kb/memory/master:head", includeSchema: true, includeRowCount: true)
search_rows(uri: "revisium-kb/regression-matrix/master:head", query: "generated endpoint")
```

## Local Copy Pattern

To recreate the KB locally:

1. Start standalone or Docker Compose.
2. Create project `memory`.
3. Create tables in dependency order: `facts`, `decisions`, `tasks`, `blockers`, then `sessions`.
4. Use `contentMediaType: "text/markdown"` for long-form knowledge.
5. Use foreign keys for relationships instead of embedding all context in one row.
6. Commit revisions after reviewed imports.

## Agent Prompt Pattern

```text
Use Revisium MCP. Read from org/project/branch:head unless explicitly asked to edit.
Start with search_rows for the topic. Fetch exact rows before citing facts.
Do not commit a draft revision without explicit approval.
```

## Verify

Run a search against the cloud KB:

```text
search_rows(uri: "revisium-kb/memory/master:head", query: "landing page")
```

Expected result: matching rows with row IDs and table IDs. Fetch specific rows before acting on the content.

## Docs

- MCP: https://docs.revisium.io/apis/mcp
- AI agent memory: https://docs.revisium.io/use-cases/ai-agent-memory
- Platform hierarchy: https://docs.revisium.io/core-concepts/platform-hierarchy
