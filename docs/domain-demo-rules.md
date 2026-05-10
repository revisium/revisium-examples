# Domain Demo Rules

Application examples should be real domain demos, not isolated API snippets.
Each example should be easy to run locally with Revisium Standalone.

## Domain Naming

Use one clear business domain per application example.

| Example | Domain | Project |
| --- | --- | --- |
| NestJS Dictionary Service | Reference data and FAQ dictionary | `dictionary` |
| Next.js Remote Config | Website runtime config and content | `web-config` |
| React Feature Flags | Client-visible rollout config | `frontend-config` |
| MCP Knowledge Base | Agent memory and structured knowledge | `knowledge-base` |

Use `http://localhost:9222` for examples in this repo.

## Status Values

| Status | Meaning |
| --- | --- |
| `bootstrap` | Example has documented bootstrap inputs and is ready for local seed-data creation |
| `reference` | Example documents a shape but does not create app data |
| `researched` | Example is based on an existing Revisium project shape and may mirror its naming |

## Implementation Depth

Keep application examples in this repository small. They should show the
Revisium schema, seed data, environment contract, and compact app code needed to
understand the integration.

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

## Table Design Rules

- Prefer realistic domain names over generic `DemoTable`.
- Use plural-free table names when they represent row types, for example `FeatureFlag`, `FaqItem`, `Asset`.
- Examples that intentionally mirror an existing project may keep that project's table naming, for example lowercase plural KB tables.
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
