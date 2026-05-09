# Docs And Website Integration

This repository should become the public examples catalog for Revisium. The integration should be lightweight at first: link to examples from docs and the marketing site, then later render cards from `examples.json`.

## Goals

- make `revisium-examples` discoverable from `docs.revisium.io`
- make examples visible from `revisium.io` without hardcoding app copy in the frontend
- keep one catalog source in `examples.json`
- route users by intent: local quickstart, framework integration, Cloud, MCP, self-hosted

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

1. Start with one paragraph: "Examples are ready-to-run or reference integrations for common Revisium use cases."
2. Show a table grouped by category:
   - Quickstarts
   - Applications
   - Infrastructure
3. Link directly to the runnable `project/` folders inside GitHub example folders.
4. Explain mode support: Standalone, Docker Compose, Revisium Cloud, Kubernetes.
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

Why near Quick Start: users should see concrete examples before deep reference material.

## docs page draft

```md
---
sidebar_position: 3
---

# Examples

Use Revisium examples when you want a copyable project shape instead of only API reference material.

| Example | Use case | Modes |
| --- | --- | --- |
| [Standalone Quickstart](https://github.com/revisium/revisium-examples/tree/master/quickstarts/standalone) | Local development | Standalone |
| [Docker Compose](https://github.com/revisium/revisium-examples/tree/master/quickstarts/docker-compose) | Self-hosted local service | Docker |
| [Revisium Cloud](https://github.com/revisium/revisium-examples/tree/master/quickstarts/cloud) | Managed project, MCP, generated APIs | Cloud |
| [NestJS Dictionary Service](https://github.com/revisium/revisium-examples/tree/master/apps/nestjs-dictionary-service/project) | Reference data backend | Standalone, Docker, Cloud |
| [Next.js Remote Config](https://github.com/revisium/revisium-examples/tree/master/apps/nextjs-remote-config/project) | Runtime web config | Standalone, Docker, Cloud |
| [React Feature Flags](https://github.com/revisium/revisium-examples/tree/master/apps/react-feature-flags/project) | Client-visible flags | Standalone, Docker, Cloud |
| [MCP Knowledge Base](https://github.com/revisium/revisium-examples/tree/master/apps/mcp-knowledge-base/project) | Agent memory and KB access | Cloud, Standalone, Docker |
```

## revisium.io

The landing page content is managed by Revisium itself. Do not add example copy directly to the frontend unless the data model cannot support it.

Current landing content project:

```text
Organization: revisium-io
Project: landing
Branch: master
MCP URI: revisium-io/landing/master
```

Current relevant tables:

| Table | Use |
| --- | --- |
| `main` | root landing page content and section composition |
| `feature` | feature cards |
| `use-case` | use-case cards |
| `code-step` | code walkthrough cards |

Recommended first change:

1. Add an "Examples" link to the landing header/footer through the `main` row if the schema supports it.
2. Add a `use-case` row for "Examples" only if examples deserve a card in the existing use-case section.
3. Later, add a dedicated `example` table that mirrors `examples.json` if the landing page should render example cards dynamically.

Suggested landing copy:

```text
Examples
Copyable projects for NestJS, Next.js, React, MCP knowledge bases, Docker, Kubernetes, and Revisium Cloud.
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

1. Publish the examples repo skeleton.
2. Add docs page linking to GitHub folders.
3. Add `revisium.io` header/footer or CTA link through the landing content project.
4. Convert first two examples from README stubs to runnable apps.
5. Add screenshots and short videos after examples are runnable.
