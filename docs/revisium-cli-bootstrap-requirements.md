# Revisium CLI Bootstrap

Examples bootstrap through `revisium-cli` using the committed workspace config:

```text
.revisium/revisium-cli.config.json
```

The config is safe to store in git because it contains only local instance and
context metadata. It does not contain passwords, tokens, or API keys.

Examples use the same target format as `revisium-cli`:

```bash
export REVISIUM_URL="revisium://localhost:9222/admin/dictionary/master"
```

## CLI Pieces

| Need | Current tool |
| --- | --- |
| Resolve local target | `.revisium/revisium-cli.config.json` |
| Ensure project exists | `revisium project ensure --context <name>` |
| Bootstrap example | `revisium example bootstrap --config <file> --context <name> --commit` |
| Ensure endpoint | `revisium endpoint ensure --type REST_API --context <name>` |
| Apply schemas/migrations | `revisium migrate apply` |
| Upload seed rows | `revisium rows upload` |
| Sync schema and data | `revisium sync all` |
| Export schemas and rows | `revisium schema save`, `revisium rows save` |

## Local Bootstrap

```bash
npm install
npx @revisium/standalone@latest
```

In another terminal:

```bash
npm run bootstrap:nestjs
```

Each app has:

- `bootstrap.config.json` for tables, seed rows, and endpoint types
- `scripts/bootstrap.mjs` wrapper around `npx revisium example bootstrap`
- a draft context and matching `*-head` context in `.revisium/revisium-cli.config.json`
- generated endpoint ensure steps against the `*-head` context after commit, so runtime apps can read `master:head`

Recommended local bootstrap flow for all apps:

1. Install Node.js >=22.13.0.
2. Start Revisium locally with `npx @revisium/standalone@latest`.
3. Run `npm run bootstrap:all`, or run one `npm run bootstrap:<example-script>` command at a time.
4. Inspect and edit data in `http://localhost:9222`.
5. Stop standalone with `Ctrl+C`.

Use `npx @revisium/standalone@latest` without `--auth` for this repo. The CLI
instance uses `authMode: "none"` for local development.

One standalone process can host all example projects. Keep bootstrap commands
sequential because project creation, commits, and endpoint creation are write
operations against the same local server.
