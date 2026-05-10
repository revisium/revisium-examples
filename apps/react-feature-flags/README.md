# React Feature Flags

Read client-facing feature flags from Revisium without redeploying a React app.

The runnable app lives in [`project/`](./project/README.md). Bootstrap config,
seed rows, and environment contract stay at this example root.

## What This Shows

- Revisium as a lightweight remote configuration service
- public generated endpoint for client-readable config
- private draft workflow before flags become visible at `head`
- no write-capable credentials in browser code

## Prerequisites

- Node.js 22+
- local Revisium Standalone on `http://localhost:9222`

## Run

Terminal 1:

```bash
npx @revisium/standalone@latest
```

Terminal 2:

```bash
npm install
cp apps/react-feature-flags/.env.example apps/react-feature-flags/.env
npm run bootstrap:react
cd apps/react-feature-flags/project
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL printed in the terminal.

Stop standalone from terminal 1 with `Ctrl+C`.

## Architecture

```mermaid
flowchart LR
  Browser[React app] --> Provider[FlagsProvider]
  Provider --> Endpoint[Public generated endpoint]
  Endpoint --> Revisium[Revisium Standalone :9222]
  Editor[Admin UI] --> Revisium
  Revisium --> FeatureFlag[(FeatureFlag table)]
```

## Revisium Tables

Bootstrap creates project `frontend-config` with these tables:

| Table | Purpose |
| --- | --- |
| `FeatureFlag` | Flag definitions, rollout rules, and UI metadata |
| `AudienceSegment` | Reusable rollout audiences |
| `Asset` | Public assets used by flag-driven UI |

Recommended flag row IDs:

- `new-navigation`
- `beta-search`
- `checkout-v2`

## Capability Coverage

| Capability | Covered by | Notes |
| --- | --- | --- |
| Tables | `FeatureFlag`, `AudienceSegment`, `Asset` | Flags, segment targeting, visual assets |
| Scalar FK | `FeatureFlag.defaultSegmentId` | Default rollout segment |
| Nested FK | `FeatureFlag.targeting.ownerSegmentId` | FK inside targeting object |
| Array primitive FK | `FeatureFlag.segmentIds[]` | Segment allow-list |
| Array object FK | `FeatureFlag.rules[].segmentId` | Rule list with FK per rule |
| Array primitives | `FeatureFlag.environments[]` | `dev`, `staging`, `prod` |
| Array objects | `FeatureFlag.rules[]` | Rule conditions and rollout percentages |
| File field | `Asset.file` | Optional flag artwork or announcement image |
| Nested file | `FeatureFlag.ui.bannerImage` | Banner image for enabled feature |
| File array | `FeatureFlag.assets[]` | Asset list for UI experiments |
| Nested file array | `FeatureFlag.ui.gallery[]` | Nested UI asset gallery |
| Computed scalar | `FeatureFlag.isFullyRolledOut` | Derived from `enabled` and `rollout` |
| Computed nested | `FeatureFlag.targeting.summary` | Derived from nested targeting fields |
| Computed array index | `FeatureFlag.primaryEnvironment` | Reads first environment |
| Computed aggregate | `FeatureFlag.totalRuleWeight` | Sums rollout weights in rules |
| Generated API | Public `head` endpoint read by browser | No write credentials in frontend |
| MCP | `get_tables`, `search_rows` on `frontend-config/master:head` | Agent can audit flags |

## Environment

Bootstrap writes to draft:

```env
REVISIUM_URL=revisium://admin:admin@localhost:9222/admin/frontend-config/master
```

The browser app reads the generated public endpoint:

```env
VITE_REVISIUM_PUBLIC_FEATURE_FLAG_TABLE_URL=http://localhost:9222/endpoint/rest/admin/frontend-config/master/head/tables/FeatureFlag/rows
```

## See and Manage Data

- Admin UI: `http://localhost:9222`
- Public feature endpoint:
  `http://localhost:9222/endpoint/rest/admin/frontend-config/master/head/tables/FeatureFlag/rows`
- MCP endpoint: `http://localhost:9222/mcp`

## Verify

```bash
curl -fsS -X POST http://localhost:9222/endpoint/rest/admin/frontend-config/master/head/tables/FeatureFlag/rows \
  -H 'content-type: application/json' \
  -d '{"first":10}'
```

Then toggle a flag in Revisium, commit the revision, reload the React app, and
confirm the UI changes.

## Docs

- Configuration store: https://docs.revisium.io/use-cases/configuration-store
- Generated APIs: https://docs.revisium.io/apis/generated-apis
- Permissions: https://docs.revisium.io/auth-permissions/permissions
