# Examples Marketing Strategy

Examples should become a practical acquisition channel, not only developer support material.

## Positioning

Revisium examples should communicate:

- "Use Revisium beside your database for structured content, reference data, and config."
- "Start locally with standalone, then point the same code at Cloud or self-hosted."
- "Agents can manage and inspect the same structured data through MCP."

The comparison point is not only a CMS. It is also Prisma-style developer experience for non-transactional data: schemas, migrations, generated APIs, and copyable examples.

## Audience Segments

| Segment | Example to show first | Message |
| --- | --- | --- |
| Backend developer | NestJS Dictionary Service | Keep reference data out of your business DB, with typed clients |
| Frontend developer | React Feature Flags | Change safe public flags without redeploying |
| Full-stack team | Next.js Remote Config | Use draft/head for preview and production content |
| AI/product team | MCP Knowledge Base | Give agents structured, versioned data with review |
| DevOps/SRE | Docker Compose and Kubernetes | Run the same service locally or self-hosted |

## Funnel

1. `revisium.io` shows the problem and the category: structured data with versioning, generated APIs, and MCP.
2. `docs.revisium.io/quick-start` gets the first project created.
3. `docs.revisium.io/examples` routes by stack and use case.
4. GitHub example README gives copyable setup.
5. Cloud CTA appears where the user reaches "production/staging" or "managed" steps.

## Content Plan

### Phase 1: Catalog

- Root examples README
- `examples.json`
- README template
- standalone, Docker, Cloud quickstarts
- README stubs for NestJS, Next.js, React, MCP KB

### Phase 2: First Runnable Apps

Build these first:

1. `nestjs-dictionary-service`
   - generated OpenAPI client
   - FAQ/category seed data
   - standalone and Cloud env files
   - one smoke test
2. `nextjs-remote-config`
   - App Router
   - `draft` preview and `head` production reads
   - example flags and page copy
3. `mcp-knowledge-base`
   - local seed script for `facts`, `decisions`, `tasks`
   - MCP prompt examples
   - Cloud read-only walkthrough

### Phase 3: Assets

- screenshots from Admin UI for each app
- 30-60 second short demo per top example
- one diagram per use case, reused in docs and README files

## Distribution

| Channel | Content |
| --- | --- |
| `revisium.io` | "Examples" CTA and selected cards |
| `docs.revisium.io` | Examples index and links from related use-case pages |
| GitHub | `revisium-examples` README and topic tags |
| Blog/posts | "Revisium as a dictionary service", "Remote config without redeploys", "MCP knowledge base" |
| Release notes | Add a small "New examples" block whenever an example becomes runnable |

## Example Quality Bar

An example is public-marketing-ready only when it has:

- one command or clearly bounded setup
- `.env.example`
- no hidden credentials
- standalone and Cloud notes
- screenshots or terminal output
- one verification command
- docs links
- CI check or smoke test

Compact examples are useful for planning and onboarding. Keep this repository focused on bootstrap configs and developer context; publish full runnable framework apps as separate project repositories when a workflow needs more code.

## Reference Patterns

Observed useful patterns from other ecosystems:

- Prisma examples group projects by framework/use case and make each example self-contained with its own README.
- Next.js documents project structure and supports creating apps from public examples.
- NestJS keeps many samples near the core framework so users can inspect complete patterns.

Revisium should copy the self-contained README habit, but add a mode matrix because Revisium can run as standalone, Docker, Cloud, or Kubernetes.
