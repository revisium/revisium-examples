# NestJS Dictionary Service

Use Revisium as a typed reference-data service behind a NestJS backend.

The runnable app lives in [`project/`](./project/README.md). Bootstrap config,
seed rows, and environment contract stay at this example root.

## What This Shows

- dictionary/reference data stored outside the transactional app database
- schemas and seed data managed in Revisium
- `@revisium/client` consumed from a NestJS service
- generated REST and GraphQL endpoints for committed data

## Prerequisites

- Node.js 22.13.0+
- local Revisium Standalone on `http://localhost:9222`

## Run

Terminal 1:

```bash
npx @revisium/standalone@latest
```

Terminal 2:

```bash
npm install
npm run bootstrap:nestjs
cd apps/nestjs-dictionary-service/project
cp .env.example .env
npm install
npm run build
npm start
```

Open `http://localhost:3000`.

Stop standalone from terminal 1 with `Ctrl+C`.

## Architecture

```mermaid
flowchart LR
  Client[HTTP client] --> Nest[NestJS app]
  Nest --> Service[DictionaryService]
  Service --> SDK[@revisium/client]
  SDK --> Revisium[Revisium Standalone :9222]
  Browser[Admin UI] --> Revisium
  Revisium --> Tables[(Dictionary tables)]
```

## Revisium Tables

Bootstrap creates project `dictionary` with these tables:

| Table | Purpose |
| --- | --- |
| `FaqCategory` | FAQ grouping and public slugs |
| `FaqItem` | FAQ content with FK to `FaqCategory` |
| `Country` | Stable country reference data |
| `Currency` | Stable currency reference data |
| `GlossaryTerm` | Searchable glossary entries |

## Capability Coverage

| Capability | Covered by | Notes |
| --- | --- | --- |
| Tables | `FaqCategory`, `FaqItem`, `Country`, `Currency`, `GlossaryTerm` | Reference data split by type |
| Scalar FK | `FaqItem.categoryId` | FAQ item belongs to category |
| Nested FK | `GlossaryTerm.metadata.ownerCountryId` | Nested ownership/localization metadata |
| Array primitive FK | `FaqItem.relatedTermIds[]` | Related glossary terms |
| Array object FK | `FaqItem.localizedAnswers[].currencyId` | Localized answer can reference currency |
| Array primitives | `FaqItem.tags[]` | Search/filter tags |
| Array objects | `FaqItem.localizedAnswers[]` | Locale-specific answers |
| File field | `FaqCategory.icon` | Category icon |
| Nested file | `FaqItem.media.heroImage` | Hero image inside media object |
| File array | `FaqItem.attachments[]` | Downloadable help assets |
| Nested file array | `FaqItem.media.gallery[]` | Multiple images under media object |
| Computed scalar | `FaqItem.primaryTag` | Reads the first search/filter tag |
| Computed nested | `FaqItem.summary.wordCount` | Counts localized answers |
| Computed array index | `FaqItem.primaryTag` | Reads first tag |
| Computed aggregate | `FaqCategory.weightTotal` | Sums category weights |
| Generated API | `POST /tables/FaqItem/rows` | App can read generated REST or GraphQL |
| MCP | `get_tables`, `search_rows` on `dictionary/master:head` | Agent can inspect reference data |

## Environment

Bootstrap writes to draft:

```env
REVISIUM_URL=revisium://localhost:9222/admin/dictionary/master
```

Runtime reads committed `head`:

```env
REVISIUM_URL=revisium://localhost:9222/admin/dictionary/master:head
PORT=3000
```

## See and Manage Data

- Admin UI: `http://localhost:9222`
- Generated REST base:
  `http://localhost:9222/endpoint/rest/admin/dictionary/master/head`
- Generated GraphQL base:
  `http://localhost:9222/endpoint/graphql/admin/dictionary/master/head`

## Verify

```bash
curl -fsS http://localhost:3000/faq

curl -fsS -X POST http://localhost:9222/endpoint/rest/admin/dictionary/master/head/tables/FaqItem/rows \
  -H 'content-type: application/json' \
  -d '{"first":10}'
```

## Docs

- Full NestJS guide: https://docs.revisium.io/guides/dictionary-service-nestjs
- Generated APIs: https://docs.revisium.io/apis/generated-apis
- Foreign keys: https://docs.revisium.io/core-concepts/foreign-keys
