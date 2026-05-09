# React Feature Flags

Read client-facing feature flags from Revisium without redeploying a React app.

## What This Shows

- Revisium as a lightweight remote configuration service
- public generated endpoint for safe client-readable config
- private draft workflow before flags become production-visible
- the same schema usable from standalone, Docker, or Cloud

## Supported Modes

| Mode | URL | Notes |
| --- | --- | --- |
| Standalone | `http://localhost:9222` | Local development |
| Docker Compose | `http://localhost:8080` | Local service parity |
| Revisium Cloud | `https://cloud.revisium.io` | Managed flag source |

## Architecture

```mermaid
flowchart LR
  Browser[React app in browser] --> FlagsProvider[FlagsProvider]
  FlagsProvider --> PublicEndpoint[Public generated head endpoint]
  PublicEndpoint --> Revisium[Revisium]
  Revisium --> FeatureFlag[(FeatureFlag table)]
  Editor[Product manager] --> Admin[Admin UI]
  Admin --> Revisium
```

## Revisium Tables

Create project `frontend-config` with table `FeatureFlag`.

Recommended row IDs:

- `new-navigation`
- `beta-search`
- `checkout-v2`

The full `FeatureFlag` schema is defined in [`bootstrap.config.json`](./bootstrap.config.json). It includes base flag fields plus targeting, rules, media, arrays, and computed fields used by the capability matrix below.

## Capability Coverage

This domain should show the minimum flag system plus richer structures that prove Revisium can model real frontend rollout rules.

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
| Computed aggregate | `FeatureFlag.totalRuleWeight` | Sums rollout weights in rules where supported |
| Generated API | Public `head` endpoint read by browser | No write credentials in frontend |
| MCP | `get_tables`, `search_rows` on `frontend-config/master:head` | Agent can audit flags |

## Runtime Pattern

Do not expose write-capable credentials in the browser.

Preferred options:

1. Public generated `head` endpoint for non-sensitive flags.
2. Your backend proxies private flags and filters what the browser can see.
3. Static build step snapshots public flags into frontend assets.

## Environment

Use the same Revisium URL format as `revisium-cli`:

```text
revisium://[user:password@]host[:port]/organization/project/branch[:revision][?token=...|apikey=...]
```

```env
REVISIUM_URL=revisium://your-username:your-password@localhost:9222/admin/frontend-config/master
VITE_REVISIUM_PUBLIC_FEATURE_FLAG_TABLE_URL=http://localhost:9222/endpoint/rest/admin/frontend-config/master/head/FeatureFlag
```

Cloud mode keeps bootstrap credentials in the Revisium URL and points the browser at the public generated endpoint:

```env
REVISIUM_URL=revisium://cloud.revisium.io/my-org/frontend-config/master?apikey=rev_xxx
VITE_REVISIUM_PUBLIC_FEATURE_FLAG_TABLE_URL=https://cloud.revisium.io/endpoint/rest/my-org/frontend-config/master/head/FeatureFlag
```

## React Shape

```text
src/
  features/
    flags/
      flags-client.ts
      FlagsProvider.tsx
      useFlag.ts
```

The `FlagsProvider` should load flags once on app start, then refresh on a short interval only if the product needs near-real-time behavior.

## Run

| Step | Command | Notes |
| --- | --- | --- |
| 1 | `cp apps/react-feature-flags/.env.example apps/react-feature-flags/.env` | Fill one `REVISIUM_URL` |
| 2 | `npm install` | Install repo validation and bootstrap tooling |
| 3 | `npm run bootstrap:react` | Create Revisium tables, seed rows, and REST/GraphQL endpoints |
| 4 | `npm run dev` | Starts the React app |
| 5 | Toggle a flag in Revisium | Commit before reading from `head` |

```bash
cp apps/react-feature-flags/.env.example apps/react-feature-flags/.env
npm install
npm run bootstrap:react
npm run dev
```

The first real implementation should add:

- Vite React project
- `FlagsProvider`
- `useFlag("flag-id")`
- small demo UI that reacts to a flag row

## Verify

Toggle a flag in Revisium, commit the revision, reload the React app, and confirm the UI changes.

## Docs

- Configuration store: https://docs.revisium.io/use-cases/configuration-store
- Generated APIs: https://docs.revisium.io/apis/generated-apis
- Permissions: https://docs.revisium.io/auth-permissions/permissions
