# Next.js Remote Config

Load runtime content, feature switches, and pricing settings from Revisium in a
Next.js app.

The runnable app lives in [`project/`](./project/README.md). Bootstrap config,
seed rows, and environment contract stay at this example root.

## What This Shows

- Revisium as a configuration store for web apps
- App Router server-side reads through `@revisium/client`
- generated REST and GraphQL endpoints for committed data
- draft/head separation for editable config and runtime reads

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
npm run bootstrap:nextjs
cd apps/nextjs-remote-config/project
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`.

Stop standalone from terminal 1 with `Ctrl+C`.

## Architecture

```mermaid
flowchart LR
  Browser[Browser] --> Next[Next.js app]
  Next --> Route[/api/config]
  Route --> SDK[@revisium/client]
  SDK --> Revisium[Revisium Standalone :9222]
  Editor[Admin UI] --> Revisium
  Revisium --> Tables[(Config and content tables)]
```

## Revisium Tables

Bootstrap creates project `web-config` with these tables:

| Table | Row examples | Purpose |
| --- | --- | --- |
| `FeatureFlag` | `new-checkout`, `pricing-banner` | Boolean and rollout config |
| `PageCopy` | `home-hero`, `pricing-faq` | Page copy managed outside deploys |
| `Plan` | `free`, `team`, `enterprise` | Pricing or packaging data |
| `Asset` | `hero-image`, `pricing-pdf` | Shared media |

## Capability Coverage

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
| Computed nested | `Plan.display.badge` | Derived from plan name |
| Computed array index | `PageCopy.primaryCtaLabel` | Reads first CTA |
| Computed aggregate | `Plan.featureCount` | Counts pricing feature rows |
| Generated API | Server-side read from generated endpoint | Next.js App Router |
| MCP | `search_rows` on `web-config/master:head` | Agent/editor workflows |

## Environment

Bootstrap writes to draft:

```env
REVISIUM_URL=revisium://localhost:9222/admin/web-config/master
```

Runtime reads committed `head`:

```env
REVISIUM_URL=revisium://localhost:9222/admin/web-config/master:head
```

## See and Manage Data

- Admin UI: `http://localhost:9222`
- Generated REST base:
  `http://localhost:9222/endpoint/rest/admin/web-config/master/head`
- Generated GraphQL base:
  `http://localhost:9222/endpoint/graphql/admin/web-config/master/head`
- MCP endpoint: `http://localhost:9222/mcp`

## Verify

```bash
curl -fsS http://localhost:3000/api/config

curl -fsS -X POST http://localhost:9222/endpoint/rest/admin/web-config/master/head/tables/FeatureFlag/rows \
  -H 'content-type: application/json' \
  -d '{"first":10}'
```

## Docs

- Configuration store: https://docs.revisium.io/use-cases/configuration-store
- Generated APIs: https://docs.revisium.io/apis/generated-apis
- Next.js project structure: https://nextjs.org/docs/app/getting-started/project-structure
