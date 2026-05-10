# Examples Strategy

Examples should be a simple developer entry point: install Node.js, start local
Revisium, bootstrap a demo, run the app, inspect data.

## Positioning

Revisium examples should communicate:

- "Use Revisium beside your database for structured content, reference data, and config."
- "Start locally with one standalone process."
- "Agents can manage and inspect the same structured data through MCP."

The comparison point is not only a CMS. It is also Prisma-style developer
experience for non-transactional data: schemas, migrations, generated APIs, and
copyable examples.

## Developer Flow

1. Install Node.js 22.13.0+.
2. Run `npx @revisium/standalone@latest`.
3. Run one bootstrap command, for example `npm run bootstrap:react`.
4. Open `http://localhost:9222` and inspect the project.
5. Run the small demo app from `apps/<name>/project`.
6. Stop standalone with `Ctrl+C`.

## Content Plan

### Phase 1: Simple Standalone Catalog

- Root examples README
- `examples.json`
- README template
- standalone quickstart
- runnable NestJS, Next.js, React, and MCP examples

### Phase 2: Screenshots And Short Demos

- one Admin UI screenshot per example
- one generated endpoint screenshot or terminal output per example
- one 30-60 second terminal-first demo per top example

### Phase 3: Docs And Website Links

- `docs.revisium.io/examples`
- selected `revisium.io` CTA
- links from related use-case docs

## Distribution

| Channel | Content |
| --- | --- |
| `revisium.io` | "Examples" CTA and selected cards |
| `docs.revisium.io` | Examples index and links from related use-case pages |
| GitHub | `revisium-examples` README and topic tags |
| Blog/posts | "Revisium as a dictionary service", "Remote config without redeploys", "MCP knowledge base" |
| Release notes | Small "New examples" block whenever an example becomes runnable |

## Example Quality Bar

An example is ready to share when it has:

- terminal-first setup
- `.env.example`
- no hidden credentials
- one verification command
- docs links
- `npm run validate` coverage

Keep this repository focused on standalone demos and compact developer context.
