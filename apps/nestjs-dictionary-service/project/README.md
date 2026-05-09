# NestJS Dictionary Service Example

This is a small NestJS app that reads a dictionary-style Revisium project through `@revisium/client`. The schema and seed data live in `../bootstrap.config.json`; this folder is the runtime app.

## Architecture

```mermaid
flowchart LR
  Browser[HTTP client] --> Nest[NestJS app]
  Nest --> Service[DictionaryService]
  Service --> Client[@revisium/client]
  Client --> Revisium[Revisium API]
  Revisium --> Tables[(FaqCategory, FaqItem, GlossaryTerm)]
```

## Revisium URL

Use one `REVISIUM_URL`, matching the Revisium CLI shape:

```text
revisium://[user:password@]host[:port]/organization/project/branch[:revision][?token=...|apikey=...]
```

Examples:

```env
REVISIUM_URL=revisium://your-username:your-password@localhost:9222/admin/dictionary/master:head
REVISIUM_URL=revisium://your-username:your-password@localhost:8080/admin/dictionary/master:head
REVISIUM_URL=revisium://cloud.revisium.io/my-org/dictionary/master:head?apikey=rev_xxx
```

## Run

First bootstrap the Revisium project from the catalog repository:

```bash
cd ../../../
npm install
npm run bootstrap:nestjs
```

Then run this app from the repo root:

```bash
cd apps/nestjs-dictionary-service/project
cp .env.example .env
npm install
npm run build
npm start
```

Open `http://localhost:3000`.

## Endpoints

| Endpoint | Description |
| --- | --- |
| `GET /health` | Simple liveness check |
| `GET /faq` | Returns FAQ rows from Revisium |
| `GET /dictionary` | Returns a summary of dictionary tables and row counts |

## Code Map

| Path | Purpose |
| --- | --- |
| `src/main.ts` | Bootstraps Nest and loads `.env` |
| `src/dictionary/dictionary.service.ts` | Reads Revisium tables |
| `src/revisium/revisium-dictionary-client.ts` | Connects to Revisium through `@revisium/client` |
| `src/revisium/revisium-url.ts` | Parses `REVISIUM_URL` |
