# Revisium CLI Bootstrap Requirements

The examples should bootstrap through `revisium-cli` and a small shared script. Today
the examples are optimized for local writable Revisium and then optional Cloud verification.

Examples use the same target format as `revisium-cli`:

```bash
export REVISIUM_URL="revisium://admin:admin@localhost:9222/admin/dictionary/master"
export REVISIUM_URL="revisium://cloud.revisium.io/my-org/dictionary/master?apikey=rev_xxx"
```

## Current Supported Pieces

| Need | Current tool |
| --- | --- |
| Apply schemas/migrations | `revisium migrate apply` |
| Upload seed rows | `revisium rows upload` |
| Sync schema and data | `revisium sync all` |
| Export schemas and rows | `revisium schema save`, `revisium rows save` |

## Missing CLI Pieces

| Need | Proposed command |
| --- | --- |
| Ensure project exists | `revisium project ensure --url "$REVISIUM_URL"` |
| Create endpoint | `revisium endpoint ensure --type REST_API --url revisium://...` |
| Bootstrap from one config | `revisium example bootstrap --config bootstrap.config.json` |
| Print endpoint URLs | `revisium endpoint list --url revisium://...` |

## Interim Script

Until those CLI commands exist, application examples use `@revisium/client`:

```bash
npm install
npm run bootstrap:nestjs
```

Each app has:

- `bootstrap.config.json` for tables, seed rows, and endpoint types
- `scripts/bootstrap.mjs` wrapper
- shared root implementation in `scripts/bootstrap-example.mjs`

Recommended local bootstrap flow for all apps:

- Set `.env` with `REVISIUM_URL` (prefer `localhost` while composing).
- Start Revisium locally with `npx @revisium/standalone@latest` (or Docker Compose equivalent).
- Run `npm run bootstrap:<example-script>`.
- Use `@revisium/client` read/write APIs via the same URL format.
