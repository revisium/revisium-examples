# Domain Demo Rules

Application examples should be real domain demos, not isolated API snippets. Each domain should show enough Revisium capability that a reader understands what the platform can model.

## Domain Naming

Use one clear business domain per application example.

| Example | Domain | Project |
| --- | --- | --- |
| NestJS Dictionary Service | Reference data and FAQ dictionary | `dictionary` |
| Next.js Remote Config | Website runtime config and content | `web-config` |
| React Feature Flags | Client-visible rollout config | `frontend-config` |
| MCP Knowledge Base | Agent memory and structured knowledge | `knowledge-base` |

Use safe documented hosts:

| Mode | Host |
| --- | --- |
| Standalone | `http://localhost:9222` |
| Docker Compose | `http://localhost:8080` |
| Revisium Cloud | `https://cloud.revisium.io` |
| Self-hosted docs | `https://cloud.example.com`, `https://cdn.example.com` |

## Status Values

| Status | Meaning |
| --- | --- |
| `bootstrap` | Example has documented bootstrap inputs and is ready for local seed-data creation |
| `reference` | Example documents an integration or deployment shape but does not create app data |
| `researched` | Example is based on a live or existing Revisium project shape and may mirror its naming |

## Required Capability Coverage

Each application example README must include `## Capability Coverage` with this matrix.

| Capability | Required demo shape |
| --- | --- |
| Tables | At least 3 domain tables with clear ownership and purpose |
| Scalar FK | Top-level string field with `foreignKey` to another table |
| Nested FK | FK inside a nested object |
| Array primitive FK | Array of strings where each item references another table |
| Array object FK | Array of objects containing an FK field |
| Array primitives | Non-FK primitive array, such as tags, aliases, segments |
| Array objects | Object array, such as variants, rules, steps, or results |
| File field | Top-level file field using Revisium file schema |
| Nested file | File field inside a nested object |
| File array | Array of file objects or attachment objects |
| Nested file array | File array under a nested object or object array |
| Computed scalar | Simple computed field from sibling fields |
| Computed nested | Computed field using nested object fields |
| Computed array index | Computed field using an indexed array element |
| Computed aggregate | Computed field that aggregates array values, such as sum |
| Generated API | Read path through generated REST or GraphQL |
| MCP | At least one read or search path through MCP |

If a capability is intentionally out of scope for an example, mark it as `Not covered` and explain where it is covered instead. Public-marketing-ready examples should avoid `Not covered` entries.

## Table Design Rules

- Prefer realistic domain names over generic `DemoTable`.
- Use plural-free table names when they represent row types, for example `FeatureFlag`, `FaqItem`, `Asset`.
- Examples that intentionally mirror a live project may keep that project's table naming, for example lowercase plural KB tables.
- Keep FK fields explicit: `categoryId`, `ownerId`, `productId`.
- Use nested objects only where the domain naturally has structure.
- Use arrays to demonstrate both data modeling and generated API shape.
- Include at least one markdown field with `contentMediaType: "text/markdown"` when content is part of the domain.
- Do not include real secrets, private customer names, or production-only endpoints.

## Example Schema Fragments

Scalar FK:

```json
{
  "categoryId": {
    "type": "string",
    "default": "",
    "foreignKey": "FaqCategory"
  }
}
```

Array primitive FK:

```json
{
  "relatedArticleIds": {
    "type": "array",
    "items": {
      "type": "string",
      "default": "",
      "foreignKey": "Article"
    }
  }
}
```

Array object FK:

```json
{
  "items": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "productId": {
          "type": "string",
          "default": "",
          "foreignKey": "Product"
        },
        "quantity": { "type": "number", "default": 1 }
      },
      "required": ["productId", "quantity"],
      "additionalProperties": false
    }
  }
}
```

File field:

```json
{
  "heroImage": {
    "$ref": "urn:jsonschema:io:revisium:file-schema:1.0.0"
  }
}
```

Computed fields should use the current Revisium computed-field syntax from the docs and should cover simple scalar formulas, nested paths, array indexes, and aggregate-style calculations where the plugin supports them.
