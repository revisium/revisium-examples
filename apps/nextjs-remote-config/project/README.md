# Next.js Remote Config Example

This is a small App Router example that reads runtime configuration from Revisium. The schema and seed data live in `../bootstrap.config.json`; this folder is the runtime app.

## Architecture

```mermaid
flowchart LR
  Browser[Browser] --> Next[Next.js App Router]
  Next --> Route[/api/config/]
  Route --> Client[@revisium/client]
  Client --> Revisium[Revisium API]
  Revisium --> Tables[(FeatureFlag, PageCopy, Plan)]
```

## Revisium URL

Use one `REVISIUM_URL`, matching the Revisium CLI shape:

```text
revisium://[user:password@]host[:port]/organization/project/branch[:revision][?token=...|apikey=...]
```

Examples:

```env
REVISIUM_URL=revisium://your-username:your-password@localhost:9222/admin/web-config/master:head
REVISIUM_URL=revisium://your-username:your-password@localhost:8080/admin/web-config/master:head
REVISIUM_URL=revisium://cloud.revisium.io/my-org/web-config/master:head?apikey=rev_xxx
```

## Run

Bootstrap is done from the example root (`npm run bootstrap:nextjs`).

Run this app in a separate command after revisium bootstrap:

```bash
cd apps/nextjs-remote-config/project
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`.

## Endpoints

| Endpoint | Description |
| --- | --- |
| `GET /` | Renders remote config rows |
| `GET /api/config` | Returns assembled JSON config |

## Code Map

| Path | Purpose |
| --- | --- |
| `src/revisium/config-client.ts` | Reads rows with `@revisium/client` |
| `src/revisium/revisium-url.ts` | Parses `REVISIUM_URL` |
| `app/api/config/route.ts` | JSON API for the app |
| `app/page.tsx` | Server-rendered example UI |
