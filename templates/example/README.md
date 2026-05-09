# Example Title

One sentence that explains the user-facing result.

## What This Shows

- Revisium capability demonstrated
- Application or infrastructure pattern demonstrated
- Which API surface is used: generated REST, generated GraphQL, System API, CLI, or MCP

## Supported Modes

| Mode | URL | Notes |
| --- | --- | --- |
| Standalone | `http://localhost:9222` | Local zero-config development |
| Docker Compose | `http://localhost:8080` | Local service with PostgreSQL |
| Revisium Cloud | `https://cloud.revisium.io` | Managed environment |

Remove unsupported rows for the concrete example.

## Prerequisites

- Node.js 22+
- Revisium instance, depending on the selected mode
- API key or user credentials when the example requires authenticated calls

### Data management model

Prefer local writable services for all schema and row mutations:

- Standalone (`http://localhost:9222`) via `npx @revisium/standalone@latest`
- Docker Compose (`http://localhost:8080`) for local parity with PostgreSQL

Cloud endpoints are useful for verification and demos, but this example assumes
content is managed through local revisium (standalone/docker) so data changes are
explicit, reversible, and reproducible.

## Run

| Step | Command | Notes |
| --- | --- | --- |
| 1 | `npm install` | Install repo-level tooling and scripts |
| 2 | `npx @revisium/standalone@latest` | Start writable local Revisium on `:9222` |
| 3 | `cp .env.example .env` | Fill one `REVISIUM_URL` for local mode |
| 4 | `npm run bootstrap:<example-script>` | Create tables, seed rows, and endpoints |
| 5 | `cd project && npm install` | Install app dependencies |
| 6 | `npm run build && npm run dev` | Start the example app (swap script for this framework) |

```bash
# copy example env
cp .env.example .env

# install repo tooling and helper scripts
npm install

# start writable revisium service
npx @revisium/standalone@latest

# bootstrap tables, seed rows, and endpoints from this repo
npm run bootstrap:<example-script>

# open project/ and start the app
cd project
npm install
npm run dev
```

### See and manage data

Use the same writable local service used above:

- Admin UI: `http://localhost:9222`
- MCP (if using client): `http://localhost:9222/mcp`
- Generated endpoints: `http://localhost:9222/endpoint/rest/<org>/<project>/<branch>:head/<Table>`

Prefer this flow for writes and content changes. Move to Cloud only after data
is staged and the example is validated.

### Multi-demo workflow

You can run several examples against the same local Revisium process:

- Keep one `npx @revisium/standalone@latest` session on `:9222`.
- Use different projects in each example config (`dictionary`, `web-config`, etc.).
- Keep `REVISIUM_URL` pointed at the same host/port and switch only organization/project/branch when needed.

Check for a running process before starting another:

```bash
curl -fsS http://localhost:9222 >/dev/null && echo "standalone is up" || echo "start standalone first"
lsof -iTCP:9222 -sTCP:LISTEN
```

## Architecture

```mermaid
flowchart LR
  Developer[Developer] --> App[Example app]
  App --> API[Generated REST or GraphQL API]
  API --> Revisium[Revisium]
  Revisium --> Tables[(Project tables)]
  Agent[AI agent] --> MCP[MCP endpoint]
  MCP --> Revisium
```

## Revisium Tables

Describe:

- organization, project, and branch naming
- tables and schemas
- seed data
- endpoint type and revision target
- how to commit or promote content

## Capability Coverage

Follow [`docs/domain-demo-rules.md`](../../docs/domain-demo-rules.md) for application examples.

| Capability | Covered by | Notes |
| --- | --- | --- |
| Tables | `TableA`, `TableB`, `TableC` | At least 3 domain tables |
| Scalar FK | `TableA.parentId` | Top-level FK |
| Nested FK | `TableA.metadata.ownerId` | FK inside object |
| Array primitive FK | `TableA.relatedIds[]` | String array with `foreignKey` |
| Array object FK | `TableA.items[].itemId` | FK inside object array |
| Array primitives | `TableA.tags[]` | Primitive array |
| Array objects | `TableA.items[]` | Object array |
| File field | `TableA.image` | File schema |
| Nested file | `TableA.media.hero` | Nested file field |
| File array | `TableA.attachments[]` | Array of file objects |
| Nested file array | `TableA.media.gallery[]` | File array under object |
| Computed scalar | `TableA.total` | Simple formula |
| Computed nested | `TableA.summary.score` | Formula from nested fields |
| Computed array index | `TableA.primaryItemName` | Formula reads array index |
| Computed aggregate | `TableA.totalAmount` | Sum over array values |
| Generated API | REST or GraphQL endpoint | Read path |
| MCP | `search_rows` or `get_tables` | Agent path |

## Verify

```bash
# replace with the smallest useful smoke test for the example app
curl http://localhost:3000/health
```

## Docs

- Concept docs: `https://docs.revisium.io/...`
- API docs: `https://docs.revisium.io/apis/...`
