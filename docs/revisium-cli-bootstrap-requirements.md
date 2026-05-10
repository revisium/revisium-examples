# Revisium CLI Bootstrap Requirements

The examples should eventually bootstrap through `revisium-cli`. Until the CLI
has all required commands, examples use a small shared script built on
`@revisium/client`.

Examples use the same target format as `revisium-cli`:

```bash
export REVISIUM_URL="revisium://admin:admin@localhost:9222/admin/dictionary/master"
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

Application examples currently use `@revisium/client`:

```bash
npm install
npm run bootstrap:nestjs
```

Each app has:

- `bootstrap.config.json` for tables, seed rows, and endpoint types
- `scripts/bootstrap.mjs` wrapper
- shared root implementation in `scripts/bootstrap-example.mjs`

Recommended local bootstrap flow for all apps:

1. Install Node.js 22.13.0+.
2. Start Revisium locally with `npx @revisium/standalone@latest`.
3. Copy the example `.env.example` to `.env` if you need to override defaults.
4. Run `npm run bootstrap:<example-script>`.
5. Inspect and edit data in `http://localhost:9222`.
6. Stop standalone with `Ctrl+C`.
