import assert from "node:assert/strict";
import test from "node:test";
import {
  connectionFromEnv,
  ensureRows,
  ensureTables,
  hydrateSchemaDefaults,
  parseConnectionTarget,
  parseRevisiumUrl,
} from "../scripts/bootstrap-example.mjs";

test("parseRevisiumUrl follows revisium-cli localhost protocol detection", () => {
  assert.deepEqual(parseRevisiumUrl("revisium://admin:secret@localhost:9222/admin/dictionary/master"), {
    baseUrl: "http://localhost:9222",
    organizationId: "admin",
    projectName: "dictionary",
    branchName: "master",
    revisionName: undefined,
    username: "admin",
    password: "secret",
    token: undefined,
    apiKey: undefined,
  });
});

test("parseRevisiumUrl carries remote API key and revision from URL", () => {
  assert.deepEqual(parseRevisiumUrl("revisium://revisium.example.com/my-org/dictionary/master:head?apikey=rev_xxx"), {
    baseUrl: "https://revisium.example.com",
    organizationId: "my-org",
    projectName: "dictionary",
    branchName: "master",
    revisionName: "head",
    username: undefined,
    password: undefined,
    token: undefined,
    apiKey: "rev_xxx",
  });
});

test("parseRevisiumUrl supports explicit protocol override and token auth", () => {
  assert.deepEqual(parseRevisiumUrl("revisium+http://internal-revisium:8080/org/proj/main?token=jwt-token"), {
    baseUrl: "http://internal-revisium:8080",
    organizationId: "org",
    projectName: "proj",
    branchName: "main",
    revisionName: undefined,
    username: undefined,
    password: undefined,
    token: "jwt-token",
    apiKey: undefined,
  });
});

test("parseConnectionTarget preserves legacy HTTP base URL targets", () => {
  assert.deepEqual(parseConnectionTarget("http://localhost:9222"), {
    baseUrl: "http://localhost:9222",
  });
});

test("connectionFromEnv defaults local standalone auth to admin credentials", () => {
  const previous = {
    REVISIUM_API_KEY: process.env.REVISIUM_API_KEY,
    REVISIUM_PASSWORD: process.env.REVISIUM_PASSWORD,
    REVISIUM_TOKEN: process.env.REVISIUM_TOKEN,
    REVISIUM_URL: process.env.REVISIUM_URL,
    REVISIUM_USERNAME: process.env.REVISIUM_USERNAME,
  };

  delete process.env.REVISIUM_API_KEY;
  delete process.env.REVISIUM_PASSWORD;
  delete process.env.REVISIUM_TOKEN;
  delete process.env.REVISIUM_URL;
  delete process.env.REVISIUM_USERNAME;

  try {
    assert.deepEqual(
      connectionFromEnv({
        defaultUrl: "revisium://localhost:9222/admin/frontend-config/master",
      }),
      {
        baseUrl: "http://localhost:9222",
        organizationId: "admin",
        projectName: "frontend-config",
        branchName: "master",
        revisionName: "draft",
        username: "admin",
        password: "admin",
        token: "",
        apiKey: "",
      },
    );
  } finally {
    restoreEnv(previous);
  }
});

test("hydrateSchemaDefaults fills computed defaults in nested arrays and objects", () => {
  assert.deepEqual(
    hydrateSchemaDefaults(
      {
        type: "object",
        properties: {
          title: { type: "string", default: "" },
          score: { type: "number", default: 0, readOnly: true, "x-formula": { version: 1, expression: "count(items)" } },
          meta: {
            type: "object",
            required: [],
            properties: {
              label: { type: "string", default: "draft" },
            },
          },
          items: {
            type: "array",
            items: {
              type: "object",
              required: [],
              properties: {
                name: { type: "string", default: "" },
                position: { type: "number", default: 0, readOnly: true, "x-formula": { version: 1, expression: "#index + 1" } },
              },
            },
          },
        },
      },
      { title: "Example", meta: {}, items: [{ name: "one" }] },
    ),
    {
      title: "Example",
      score: 0,
      meta: { label: "draft" },
      items: [{ name: "one", position: 0 }],
    },
  );
});

test("ensureTables treats create conflicts as existing tables", async () => {
  const calls = [];

  await ensureTables(
    {
      async getTables() {
        return { edges: [] };
      },
      async createTable(id) {
        calls.push(id);
        const error = new Error("Table already exists");
        error.status = 409;
        throw error;
      },
    },
    [{ id: "FeatureFlag", schema: { type: "object", properties: {}, required: [] } }],
  );

  assert.deepEqual(calls, ["FeatureFlag"]);
});

test("ensureRows treats create conflicts as existing rows", async () => {
  const calls = [];

  await ensureRows(
    {
      async getRows() {
        return { edges: [] };
      },
      async createRow(tableId, rowId) {
        calls.push(`${tableId}/${rowId}`);
        const error = new Error("Row conflict");
        error.status = 409;
        throw error;
      },
    },
    [{ tableId: "FeatureFlag", rowId: "checkout-v2", data: {} }],
    [{ id: "FeatureFlag", schema: { type: "object", properties: {}, required: [] } }],
  );

  assert.deepEqual(calls, ["FeatureFlag/checkout-v2"]);
});

function restoreEnv(previous) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
