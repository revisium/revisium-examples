# Docs And Website Integration

This repository is the public standalone examples catalog for Revisium. Keep the
integration lightweight: link to examples from docs and the marketing site, then
later render cards from `examples.json`.

## Goals

- make `revisium-examples` discoverable from `docs.revisium.io`
- make examples visible from `revisium.io`
- keep one catalog source in `examples.json`
- keep the first developer path simple: install Node.js, run standalone, bootstrap a demo

## docs.revisium.io

Add a top-level docs page:

```text
docs/examples.md
```

Suggested page title:

```text
Examples
```

Suggested page structure:

1. Start with one paragraph: "Examples are standalone demos for common Revisium use cases."
2. Show a table grouped by quickstart and applications.
3. Link directly to each example root README.
4. Include the terminal flow: install Node.js, run `npx @revisium/standalone@latest`, run a bootstrap command, stop with `Ctrl+C`.
5. Link back to relevant docs pages beside each example.

Suggested sidebar placement:

```ts
"quick-start",
"examples",
{
  type: "category",
  label: "Core Concepts",
  ...
}
```

## Docs Page Draft

````md
---
sidebar_position: 3
---

# Examples

Use Revisium examples when you want a small local project shape instead of only API reference material.

All examples run against local Revisium Standalone.

```bash
npx @revisium/standalone@latest
```

| Example | Use case | Bootstrap |
| --- | --- | --- |
| [Standalone Quickstart](https://github.com/revisium/revisium-examples/tree/master/quickstarts/standalone) | Local Revisium | none |
| [NestJS Dictionary Service](https://github.com/revisium/revisium-examples/tree/master/apps/nestjs-dictionary-service) | Reference data backend | `npm run bootstrap:nestjs` |
| [Next.js Remote Config](https://github.com/revisium/revisium-examples/tree/master/apps/nextjs-remote-config) | Runtime web config | `npm run bootstrap:nextjs` |
| [React Feature Flags](https://github.com/revisium/revisium-examples/tree/master/apps/react-feature-flags) | Client-visible flags | `npm run bootstrap:react` |
| [MCP Knowledge Base](https://github.com/revisium/revisium-examples/tree/master/apps/mcp-knowledge-base) | Agent memory and KB access | `npm run bootstrap:mcp-kb` |
````

## revisium.io

The landing page content is managed by Revisium itself. Do not add example copy
directly to the frontend unless the data model cannot support it.

Recommended first change:

1. Add an "Examples" link to the landing header/footer through the `main` row if the schema supports it.
2. Add a selected examples card only if it fits the existing use-case section.
3. Later, add a dedicated `example` table that mirrors `examples.json` if the landing page should render example cards dynamically.

Suggested landing copy:

```text
Examples
Small standalone demos for NestJS, Next.js, React, and MCP knowledge bases.
```

Suggested CTA:

```text
Browse examples -> https://github.com/revisium/revisium-examples
```

## Future Catalog Rendering

`examples.json` can drive:

- GitHub README tables
- docs examples page
- landing-page examples section
- CLI command such as `revisium examples list`

Keep the JSON small and public. Do not put secrets, customer names, or private endpoint URLs in it.

## Rollout Order

1. Publish the standalone examples catalog.
2. Add docs page linking to GitHub folders.
3. Add `revisium.io` header/footer or CTA link through the landing content project.
4. Add screenshots and short videos after examples are stable.
