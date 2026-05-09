import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const fileSchemaRef = "urn:jsonschema:io:revisium:file-schema:1.0.0";
const manifest = JSON.parse(readFileSync(join(root, "examples.json"), "utf8"));

const requiredFeatures = [
  "scalarForeignKey",
  "nestedForeignKey",
  "arrayPrimitiveForeignKey",
  "arrayObjectForeignKey",
  "arrayPrimitives",
  "arrayObjects",
  "fileField",
  "nestedFile",
  "fileArray",
  "nestedFileArray",
  "computedScalar",
  "computedNested",
  "computedArrayIndex",
  "computedAggregate",
];

function readBootstrapConfig(example) {
  return JSON.parse(readFileSync(join(root, example.path, "bootstrap.config.json"), "utf8"));
}

function hasObjectForeignKey(schema) {
  return Object.values(schema.properties ?? {}).some((property) => Boolean(property.foreignKey));
}

function collectSchemaFeatures(config) {
  const features = Object.fromEntries(requiredFeatures.map((feature) => [feature, false]));

  function visit(schema, path = [], inArray = false) {
    if (!schema || typeof schema !== "object") {
      return;
    }

    const depth = path.length;
    const formula = schema["x-formula"];
    if (formula) {
      if (depth === 1) {
        features.computedScalar = true;
      }
      if (depth > 1) {
        features.computedNested = true;
      }

      const expression = String(formula.expression ?? "");
      if (/\[[0-9]+\]/.test(expression)) {
        features.computedArrayIndex = true;
      }
      if (/\b(count|sum|avg|min|max)\s*\(/.test(expression)) {
        features.computedAggregate = true;
      }
    }

    if (schema.foreignKey && !inArray) {
      if (depth === 1) {
        features.scalarForeignKey = true;
      }
      if (depth > 1) {
        features.nestedForeignKey = true;
      }
    }

    if (schema.$ref === fileSchemaRef) {
      if (depth === 1) {
        features.fileField = true;
      }
      if (depth > 1 && !inArray) {
        features.nestedFile = true;
      }
    }

    if (schema.type === "array") {
      if (schema.items?.$ref === fileSchemaRef) {
        if (depth === 1) {
          features.fileArray = true;
        }
        if (depth > 1) {
          features.nestedFileArray = true;
        }
      }

      if (schema.items?.type === "object") {
        features.arrayObjects = true;
        if (hasObjectForeignKey(schema.items)) {
          features.arrayObjectForeignKey = true;
        }
      } else if (schema.items?.type) {
        features.arrayPrimitives = true;
        if (schema.items.foreignKey) {
          features.arrayPrimitiveForeignKey = true;
        }
      }
    }

    for (const [propertyName, propertySchema] of Object.entries(schema.properties ?? {})) {
      visit(propertySchema, [...path, propertyName], false);
    }

    if (schema.items) {
      visit(schema.items, [...path, "*"], true);
    }
  }

  for (const table of config.tables) {
    visit(table.schema);
  }

  return features;
}

function collectForeignKeys(schema, foreignKeys = []) {
  if (!schema || typeof schema !== "object") {
    return foreignKeys;
  }

  if (schema.foreignKey) {
    foreignKeys.push(schema.foreignKey);
  }

  for (const propertySchema of Object.values(schema.properties ?? {})) {
    collectForeignKeys(propertySchema, foreignKeys);
  }

  if (schema.items) {
    collectForeignKeys(schema.items, foreignKeys);
  }

  return foreignKeys;
}

function validateRequiredData(schema, data, path) {
  for (const propertyName of schema.required ?? []) {
    assert.ok(Object.hasOwn(data, propertyName), `${path}.${propertyName} is required`);
  }

  for (const [propertyName, propertySchema] of Object.entries(schema.properties ?? {})) {
    if (!Object.hasOwn(data, propertyName)) {
      continue;
    }

    const value = data[propertyName];
    const propertyPath = `${path}.${propertyName}`;
    if (propertySchema.type === "object") {
      validateRequiredData(propertySchema, value, propertyPath);
    }

    if (propertySchema.type === "array" && propertySchema.items?.type === "object") {
      for (const [index, item] of value.entries()) {
        validateRequiredData(propertySchema.items, item, `${propertyPath}[${index}]`);
      }
    }
  }
}

function collectSchemaPaths(config) {
  const paths = new Set();

  function visit(schema, path) {
    if (!schema || typeof schema !== "object") {
      return;
    }

    paths.add(path);

    if (schema.type === "array") {
      const arrayPath = `${path}[]`;
      paths.add(arrayPath);

      for (const [propertyName, propertySchema] of Object.entries(schema.items?.properties ?? {})) {
        visit(propertySchema, `${arrayPath}.${propertyName}`);
      }
    }

    for (const [propertyName, propertySchema] of Object.entries(schema.properties ?? {})) {
      visit(propertySchema, path ? `${path}.${propertyName}` : propertyName);
    }
  }

  for (const table of config.tables) {
    visit(table.schema, table.id);
  }

  return paths;
}

function readCapabilityFieldRefs(example) {
  const readme = readFileSync(join(root, example.path, "README.md"), "utf8");
  const sectionStart = readme.indexOf("## Capability Coverage");
  assert.notEqual(sectionStart, -1, `${example.id} README must have Capability Coverage`);

  const bodyStart = readme.indexOf("\n", sectionStart) + 1;
  const nextSectionStart = readme.indexOf("\n## ", bodyStart);
  const section = readme.slice(bodyStart, nextSectionStart === -1 ? undefined : nextSectionStart);
  const fieldRefs = [];

  for (const line of section.split(/\r?\n/)) {
    if (!line.startsWith("|") || /^\|\s*-+/.test(line) || /\|\s*Capability\s*\|/.test(line)) {
      continue;
    }

    const cells = line.split("|").map((cell) => cell.trim());
    const coveredBy = cells[2] ?? "";
    const matches = coveredBy.matchAll(/`([^`]+)`/g);

    for (const match of matches) {
      if (match[1].includes(".")) {
        fieldRefs.push(match[1]);
      }
    }
  }

  return fieldRefs;
}

test("application bootstrap configs define complete Revisium demo capabilities", () => {
  const applicationExamples = manifest.examples.filter((example) => example.category === "application");

  for (const example of applicationExamples) {
    const config = readBootstrapConfig(example);
    const features = collectSchemaFeatures(config);

    for (const feature of requiredFeatures) {
      assert.equal(features[feature], true, `${example.id} should cover ${feature}`);
    }
  }
});

test("application bootstrap configs have valid table, row, and endpoint references", () => {
  const applicationExamples = manifest.examples.filter((example) => example.category === "application");

  for (const example of applicationExamples) {
    const config = readBootstrapConfig(example);
    const tableIds = new Set(config.tables.map((table) => table.id));

    assert.match(config.defaultUrl, /^revisium:\/\//, `${example.id} must set a revisium:// defaultUrl`);
    assert.ok(!Object.hasOwn(config, "defaultBaseUrl"), `${example.id} should not use defaultBaseUrl`);
    assert.ok(config.projectName, `${example.id} must set projectName`);
    assert.ok(config.branchName, `${example.id} must set branchName`);
    assert.ok(config.commitMessage, `${example.id} must set commitMessage`);
    assert.ok(config.endpoints.includes("REST_API"), `${example.id} must enable REST_API`);
    assert.ok(config.endpoints.includes("GRAPHQL"), `${example.id} must enable GRAPHQL`);
    assert.ok(config.tables.length >= 3, `${example.id} must define multiple tables`);
    assert.ok(config.rows.length >= 1, `${example.id} must define seed rows`);

    for (const table of config.tables) {
      assert.equal(table.schema.type, "object", `${example.id}/${table.id} schema must be an object`);

      for (const foreignKey of collectForeignKeys(table.schema)) {
        assert.ok(tableIds.has(foreignKey), `${example.id}/${table.id} foreignKey ${foreignKey} must target a table`);
      }
    }

    for (const row of config.rows) {
      const table = config.tables.find((candidate) => candidate.id === row.tableId);
      assert.ok(table, `${example.id}/${row.rowId} must reference an existing table`);
      validateRequiredData(table.schema, row.data, `${example.id}/${row.tableId}/${row.rowId}`);
    }
  }
});

test("application README capability field references exist in bootstrap configs", () => {
  const applicationExamples = manifest.examples.filter((example) => example.category === "application");

  for (const example of applicationExamples) {
    const config = readBootstrapConfig(example);
    const schemaPaths = collectSchemaPaths(config);

    for (const fieldRef of readCapabilityFieldRefs(example)) {
      assert.ok(schemaPaths.has(fieldRef), `${example.id} README references missing schema path ${fieldRef}`);
    }
  }
});
