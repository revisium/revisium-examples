# NestJS Dictionary Service

Use Revisium as a typed reference-data service behind a NestJS backend.

## What This Shows

- dictionary/reference data stored outside the transactional application database
- schemas and seed data managed in Revisium
- generated REST or GraphQL client consumed from NestJS
- the same NestJS code pointed at standalone, Docker, or Revisium Cloud

## Supported Modes

| Mode | URL | Notes |
| --- | --- | --- |
| Standalone | `http://localhost:9222` | Local development |
| Docker Compose | `http://localhost:8080` | Local service parity with PostgreSQL |
| Revisium Cloud | `https://cloud.revisium.io` | Managed staging or production |

## Prerequisites

- Node.js 22+
- NestJS project or `nest new`
- Revisium instance in one supported mode
- Generated endpoint enabled for the project branch

## Architecture

```mermaid
flowchart LR
  Client[Frontend or API consumer] --> Nest[NestJS backend]
  Nest --> DictionaryClient[Generated Revisium client]
  DictionaryClient --> Endpoint[Generated REST or GraphQL endpoint]
  Endpoint --> Revisium[Revisium]
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

## NestJS Shape

Recommended module boundary:

```text
src/features/dictionary/
  generated/              # generated OpenAPI or GraphQL client
  dictionary.module.ts
  dictionary-client.ts    # wraps generated client with auth/base URL
  queries/
    get-faq-items.query.ts
    get-faq-items.handler.ts
```

The backend should not know whether Revisium is standalone, Docker, or Cloud. Keep that in environment variables.

## Run

| Step | Command | Notes |
| --- | --- | --- |
| 1 | `cp apps/nestjs-dictionary-service/.env.example apps/nestjs-dictionary-service/.env` | Fill one `REVISIUM_URL` |
| 2 | `npm install` | Install repo validation and bootstrap tooling |
| 3 | `npm run bootstrap:nestjs` | Create Revisium tables, seed rows, and REST/GraphQL endpoints |
| 4 | `(inside your NestJS app) npm run generate:dictionary-api` | Generate client from Revisium endpoint |
| 5 | `(inside your NestJS app) npm run start:dev` | Start the NestJS app |

```bash
cp apps/nestjs-dictionary-service/.env.example apps/nestjs-dictionary-service/.env
npm install
npm run bootstrap:nestjs

# inside your NestJS application repo
npm run generate:dictionary-api
npm run start:dev
```

The first real implementation should add:

- `package.json`
- generated client script
- one controller/query handler
- one smoke test that calls a seeded `FaqItem`

## Verify

```bash
curl -fsS http://localhost:3000/faq
```

Expected result: list of FAQ rows read from Revisium, not from the NestJS database.

## Docs

- Full NestJS guide: https://docs.revisium.io/guides/dictionary-service-nestjs
- Generated APIs: https://docs.revisium.io/apis/generated-apis
- Foreign keys: https://docs.revisium.io/core-concepts/foreign-keys
