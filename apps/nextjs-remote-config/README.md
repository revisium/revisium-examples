# Next.js Remote Config

Load runtime content, feature switches, and pricing settings from Revisium in a Next.js app.

The runnable app lives in [`project/`](./project/README.md). Keep mutable data operations
in local Revisium (standalone or docker compose) and use Cloud only as a consume/verify surface.

## What This Shows

- Revisium as a configuration store for web apps
- App Router server-side reads from generated APIs
- draft/head separation for preview and production
- Cloud usage for public demos and managed environments

## Supported Modes

| Mode | URL | Notes |
| --- | --- | --- |
| Standalone | `http://localhost:9222` | Local development (mutable) |
| Docker Compose | `http://localhost:8080` | Local integration with PostgreSQL |
| Revisium Cloud | `https://cloud.revisium.io` | Managed preview and production |

## Architecture

```mermaid
flowchart LR
  Browser[Browser] --> Next[Next.js app]
  Next --> Cache[Next.js cache or revalidation]
  Cache --> Endpoint[Generated Revisium API]
  Endpoint --> Revisium[Revisium]
  Revisium --> Tables[(Config and content tables)]
  Editor[Editor] --> Admin[Admin UI]
  Admin --> Revisium
```

## Revisium Tables

Create project `web-config` with tables:

| Table | Row examples | Purpose |
| --- | --- | --- |
| `FeatureFlag` | `new-checkout`, `pricing-banner` | Boolean and rollout config |
| `PageCopy` | `home-hero`, `pricing-faq` | Marketing copy managed outside deploys |
| `Plan` | `free`, `team`, `enterprise` | Pricing or packaging data |

Minimal `FeatureFlag` schema:

```json
{
  "type": "object",
  "properties": {
    "enabled": { "type": "boolean", "default": false },
    "rollout": { "type": "number", "default": 0 },
    "description": { "type": "string", "default": "" }
  },
  "required": ["enabled", "rollout", "description"],
  "additionalProperties": false
}
```

## Capability Coverage

This domain should show website content and runtime settings that can change without a Next.js redeploy.

| Capability | Covered by | Notes |
| --- | --- | --- |
| Tables | `FeatureFlag`, `PageCopy`, `Plan`, `Asset` | Config, CMS copy, pricing, and media |
| Scalar FK | `PageCopy.heroAssetId` | Page copy references an asset row |
| Nested FK | `Plan.metadata.featuredFlagId` | Nested config references rollout flag |
| Array primitive FK | `PageCopy.relatedFlagIds[]` | Related feature flags |
| Array object FK | `Plan.features[].flagId` | Feature list can link to controlling flag |
| Array primitives | `FeatureFlag.segments[]` | Audience segments |
| Array objects | `Plan.features[]` | Pricing feature rows |
| File field | `Asset.file` | Shared media asset |
| Nested file | `PageCopy.media.heroImage` | Hero image embedded in content structure |
| File array | `PageCopy.attachments[]` | Downloadable content |
| Nested file array | `PageCopy.media.gallery[]` | Content gallery |
| Computed scalar | `Plan.annualPrice` | Derived from monthly price |
| Computed nested | `Plan.display.badge` | Derived from nested display fields |
| Computed array index | `PageCopy.primaryCtaLabel` | Reads first CTA |
| Computed aggregate | `Plan.featureCount` | Counts/sums feature array values where supported |
| Generated API | Server-side read from generated endpoint | Next.js App Router |
| MCP | `search_rows` on `web-config/master:head` | Agent/editor workflows |

## Environment

Use the same Revisium URL format as `revisium-cli`:

```text
revisium://[user:password@]host[:port]/organization/project/branch[:revision][?token=...|apikey=...]
```

```env
REVISIUM_URL=revisium://admin:admin@localhost:9222/admin/web-config/master
```

Use generated `draft` endpoints for preview reads and generated `head` endpoints for production reads.

Cloud mode keeps the same shape and carries the API key in the URL:

```env
REVISIUM_URL=revisium://cloud.revisium.io/my-org/web-config/master?apikey=rev_xxx
```

## Next.js Shape

Recommended file layout:

```text
app/
  page.tsx
  api/revalidate/route.ts
src/
  revisium/
    client.ts
    flags.ts
    page-copy.ts
```

The app should fetch server-side and cache according to the business need:

- high-churn flags: short cache or explicit revalidation
- public content: static generation with webhook/manual revalidation
- preview routes: draft revision only

## See and Manage Data

- Admin UI: `http://localhost:9222`
- Generated REST endpoint: `http://localhost:9222/endpoint/rest/admin/web-config/master/head`
- Generated GraphQL endpoint: `http://localhost:9222/endpoint/graphql/admin/web-config/master/head`
- MCP endpoint (if enabled): `http://localhost:9222/mcp`

Mutations should be done in standalone/docker-compose. Use Cloud for read/preview after bootstrap.

## Run

| Step | Command | Notes |
| --- | --- | --- |
| 1 | `npm install` | Install repo validation and bootstrap tooling |
| 2 | `cp apps/nextjs-remote-config/.env.example apps/nextjs-remote-config/.env` | Fill one `REVISIUM_URL` |
| 3 | `npx @revisium/standalone@latest` | Start writable local Revisium (`:9222`) |
| 4 | `npm run bootstrap:nextjs` | Create Revisium tables, seed rows, and endpoints |
| 5 | `cd apps/nextjs-remote-config/project && npm install` | Install app dependencies |
| 6 | `npm run dev` | Starts Next.js on port `3000` |
| 7 | `curl -fsS http://localhost:3000/api/config` | Verify generated config response |
| 8 | `curl -fsS -X POST http://localhost:9222/endpoint/rest/admin/web-config/master/head/tables/FeatureFlag/rows -H 'content-type: application/json' -d '{"first":10}'` | Verify local seeded rows |

```bash
cp apps/nextjs-remote-config/.env.example apps/nextjs-remote-config/.env
npm install
# terminal 1
npx @revisium/standalone@latest

# terminal 2
npm run bootstrap:nextjs
cd apps/nextjs-remote-config/project
npm install
npm run dev
```

## Verify

```bash
curl -fsS http://localhost:3000/api/config
```

Expected result: JSON config assembled from Revisium rows.

## Docs

- Configuration store: https://docs.revisium.io/use-cases/configuration-store
- Generated APIs: https://docs.revisium.io/apis/generated-apis
- Next.js project structure: https://nextjs.org/docs/app/getting-started/project-structure
