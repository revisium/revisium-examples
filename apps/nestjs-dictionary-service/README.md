# NestJS Dictionary Service

Use Revisium as a typed reference-data service behind a NestJS backend.

## What This Shows

- dictionary/reference data stored outside the transactional application database
- schemas and seed data managed in Revisium
- `@revisium/client` consumed from a NestJS service
- the same NestJS code pointed at standalone, Docker, or Revisium Cloud

## Supported Modes

| Mode | URL | Notes |
| --- | --- | --- |
| Standalone | `http://localhost:9222` | Local development |
| Docker Compose | `http://localhost:8080` | Local service parity with PostgreSQL |
| Revisium Cloud | `https://cloud.revisium.io` | Managed staging or production |

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
REVISIUM_REST_ENDPOINT=http://localhost:9222/endpoint/rest/admin/dictionary/master/head
REVISIUM_GRAPHQL_ENDPOINT=http://localhost:9222/endpoint/graphql/admin/dictionary/master/head
```

Cloud mode keeps the same shape and carries the API key in the URL:

```env
REVISIUM_URL=revisium://cloud.revisium.io/my-org/dictionary/master?apikey=rev_xxx
REVISIUM_REST_ENDPOINT=https://cloud.revisium.io/endpoint/rest/my-org/dictionary/master/head
REVISIUM_GRAPHQL_ENDPOINT=https://cloud.revisium.io/endpoint/graphql/my-org/dictionary/master/head
```

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
| 1 | `cp apps/nestjs-dictionary-service/.env.example apps/nestjs-dictionary-service/.env` | Fill one `REVISIUM_URL` |
| 2 | `npm install` | Install repo validation and bootstrap tooling |
| 3 | `npm run bootstrap:nestjs` | Create Revisium tables, seed rows, and REST/GraphQL endpoints |
| 4 | Copy the service snippet into your NestJS app | Keep the full app in its own project repository |

```bash
cp apps/nestjs-dictionary-service/.env.example apps/nestjs-dictionary-service/.env
npm install
npm run bootstrap:nestjs
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
