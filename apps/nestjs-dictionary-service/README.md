# NestJS Dictionary Service

Use Revisium as a typed reference-data service behind a NestJS backend.

This example is designed for local writable development first. Keep mutations in
**standalone** or **Docker Compose** and treat Cloud as consumer-mode unless you
have an explicit requirement for hosted writes.

The runnable app lives in [`project/`](./project/README.md). Bootstrap config,
seed rows, and environment contract stay at this example root.

## What This Shows

- dictionary/reference data stored outside the transactional application database
- schemas and seed data managed in Revisium
- `@revisium/client` consumed from a NestJS service
- the same NestJS code pointed at standalone, Docker, or Revisium Cloud

## Supported Modes

| Mode | URL | Notes |
| --- | --- | --- |
| Standalone | `http://localhost:9222` | Local development (mutable) |
| Docker Compose | `http://localhost:8080` | Local self-hosted service parity |
| Revisium Cloud | `https://cloud.revisium.io` | Managed read/consume mode |

## Prerequisites

- Node.js 22+
- NestJS application in a separate full example project
- Revisium instance in one supported mode
- API key, token, or username/password for the target Revisium project

## Architecture

```mermaid
flowchart LR
  Client[Frontend or API consumer] --> Nest[NestJS backend]
  Nest --> DictionaryService[Dictionary service]
  DictionaryService --> ClientSdk[@revisium/client]
  ClientSdk --> Revisium[Revisium API]
  Revisium --> Tables[(Dictionary tables)]
  Editor[Content manager] --> Admin[Admin UI]
  Admin --> Revisium
```

## Revisium Tables

Create a project named `dictionary` with these tables:

| Table | Purpose |
| --- | --- |
| `FaqCategory` | FAQ grouping and public slugs |
| `FaqItem` | FAQ content with FK to `FaqCategory` |
| `Country` | Stable country reference data |
| `Currency` | Stable currency reference data |

Minimal `FaqItem` schema:

```json
{
  "type": "object",
  "properties": {
    "question": { "type": "string", "default": "" },
    "answer": {
      "type": "string",
      "default": "",
      "contentMediaType": "text/markdown"
    },
    "order": { "type": "number", "default": 0 },
    "categoryId": {
      "type": "string",
      "default": "",
      "foreignKey": "FaqCategory"
    }
  },
  "required": ["question", "answer", "order", "categoryId"],
  "additionalProperties": false
}
```

Commit the revision and enable a generated API endpoint for `master/head`.

## Capability Coverage

This domain should show Revisium as a reference-data service with relations, structured content, assets, and computed values.

| Capability | Covered by | Notes |
| --- | --- | --- |
| Tables | `FaqCategory`, `FaqItem`, `Country`, `Currency`, `GlossaryTerm` | Reference data split by bounded type |
| Scalar FK | `FaqItem.categoryId` | FAQ item belongs to category |
| Nested FK | `GlossaryTerm.metadata.ownerCountryId` | Nested ownership/localization metadata |
| Array primitive FK | `FaqItem.relatedTermIds[]` | Related glossary terms |
| Array object FK | `FaqItem.localizedAnswers[].currencyId` | Localized answer can reference currency when pricing text is included |
| Array primitives | `FaqItem.tags[]` | Search/filter tags |
| Array objects | `FaqItem.localizedAnswers[]` | Locale-specific answers |
| File field | `FaqCategory.icon` | Category icon |
| Nested file | `FaqItem.media.heroImage` | Hero image inside media object |
| File array | `FaqItem.attachments[]` | Downloadable PDF/help assets |
| Nested file array | `FaqItem.media.gallery[]` | Multiple images under media object |
| Computed scalar | `FaqItem.primaryTag` | Reads the first search/filter tag |
| Computed nested | `FaqItem.summary.wordCount` | Derived from nested summary/body fields |
| Computed array index | `FaqItem.primaryTag` | Reads first tag |
| Computed aggregate | `FaqCategory.weightTotal` | Sums category weights |
| Generated API | `GET /FaqItem` through generated REST or GraphQL | NestJS typed client |
| MCP | `get_tables`, `search_rows` on `dictionary/master:head` | Agent can inspect and update reference data |

## Environment

Use the same Revisium URL format as `revisium-cli`:

```text
revisium://[user:password@]host[:port]/organization/project/branch[:revision][?token=...|apikey=...]
```

```env
REVISIUM_URL=revisium://your-username:your-password@localhost:9222/admin/dictionary/master
```

Cloud mode keeps the same shape and carries the API key in the URL. Read/write should be done via local revisium unless you specifically deploy writable Cloud access:

```env
REVISIUM_URL=revisium://cloud.revisium.io/my-org/dictionary/master?apikey=rev_xxx
```

## See and Manage Data

Use these URLs after bootstrap:

- Admin UI: `http://localhost:9222`
- Generated REST API:
  `http://localhost:9222/endpoint/rest/admin/dictionary/master/head`
- Generated GraphQL API:
  `http://localhost:9222/endpoint/graphql/admin/dictionary/master/head`
- Docker Compose equivalent REST base:
  `http://localhost:8080/endpoint/rest/admin/dictionary/master/head`

For mutation workflows, use standalone/docker-compose and keep `REVISIUM_URL` aligned to
that instance.

## Developer Context

Full framework applications should live in separate project repositories. This example keeps the compact context a developer needs to wire Revisium into a NestJS service.

Use `@revisium/client` inside the service layer:

```ts
import { RevisiumClient } from "@revisium/client";

const client = new RevisiumClient({ baseUrl: "http://localhost:9222" });
client.loginWithApiKey("rev_xxx");

const revision = await client.revision({
  org: "admin",
  project: "dictionary",
  branch: "master",
  revision: "head",
});

const rows = await revision.getRows("FaqItem", { first: 100 });
const faqItems = rows.edges.map(({ node }) => ({
  id: node.id,
  ...node.data,
}));
```

In a real NestJS app, put this behind a small `DictionaryService` and keep URL parsing/auth selection in application config. The same service can point at standalone, Docker, or Cloud by changing `REVISIUM_URL`.

## Run

| Step | Command | Notes |
| --- | --- | --- |
| 1 | `npm install` | Install repo tooling and shared helper script |
| 2 | `cp apps/nestjs-dictionary-service/.env.example apps/nestjs-dictionary-service/.env` | Fill one `REVISIUM_URL` for standalone (default) |
| 3 | `npx @revisium/standalone@latest` | Start writable local Revisium (`:9222`) |
| 4 | `npm run bootstrap:nestjs` | Create tables, rows, and `REST_API`/`GRAPHQL` endpoints |
| 5 | `cd apps/nestjs-dictionary-service/project && npm install` | Install app dependencies |
| 6 | `npm run build && npm run start` | Run the NestJS app |
| 7 | `curl -fsS http://localhost:3000/faq` | Smoke test app output |
| 8 | `curl -fsS http://localhost:9222/endpoint/rest/admin/dictionary/master/head/FaqItem` | Confirm schema data in Revisium |

```bash
cp apps/nestjs-dictionary-service/.env.example apps/nestjs-dictionary-service/.env
npm install
# terminal 1
npx @revisium/standalone@latest

# terminal 2
npm run bootstrap:nestjs
cd apps/nestjs-dictionary-service/project
npm install
npm run build
npm run start
```

## Verify

```bash
curl -fsS http://localhost:9222/endpoint/rest/admin/dictionary/master/head/FaqItem
```

Expected result: list of FAQ rows read from Revisium. The separate NestJS project should expose its own app-level route around the same `@revisium/client` call.

## Docs

- Full NestJS guide: https://docs.revisium.io/guides/dictionary-service-nestjs
- Generated APIs: https://docs.revisium.io/apis/generated-apis
- Foreign keys: https://docs.revisium.io/core-concepts/foreign-keys
