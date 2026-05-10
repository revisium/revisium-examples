import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hydrateSchemaDefaults } from "./bootstrap-example.mjs";

export function runCliBootstrap(configPath, context) {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const preparedConfigPath = prepareCliConfigPath(configPath);

  try {
    execFileSync(
      executable,
      ["revisium", "example", "bootstrap", "--config", preparedConfigPath.file, "--context", context, "--commit"],
      {
        stdio: "inherit",
      },
    );
    ensureHeadEndpoints(executable, preparedConfigPath.config.endpoints ?? [], `${context}-head`);
  } finally {
    rmSync(preparedConfigPath.dir, { recursive: true, force: true });
  }
}

function prepareCliConfigPath(configPath) {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const preparedConfig = prepareCliBootstrapConfig(config);
  const dir = mkdtempSync(join(tmpdir(), "revisium-example-"));
  const file = join(dir, "bootstrap.config.json");

  writeFileSync(file, `${JSON.stringify(preparedConfig, null, 2)}\n`);

  return { config: preparedConfig, dir, file };
}

function ensureHeadEndpoints(executable, endpointTypes, context) {
  for (const endpointType of endpointTypes) {
    execFileSync(executable, ["revisium", "endpoint", "ensure", "--type", endpointType, "--context", context], {
      stdio: "inherit",
    });
  }
}

export function prepareCliBootstrapConfig(config) {
  const schemasByTable = new Map((config.tables ?? []).map((table) => [table.id, table.schema]));
  const hydratedRows = (config.rows ?? []).map((row) => ({
    ...row,
    data: prepareRowData(schemasByTable.get(row.tableId), row.data),
  }));

  return { ...config, rows: hydratedRows };
}

function prepareRowData(schema, data) {
  const hydrated = hydrateSchemaDefaults(schema, data);
  applyComputedFields(schema, hydrated, hydrated);

  return hydrated;
}

function applyComputedFields(schema, data, rootData, itemIndex) {
  if (!schema || typeof schema !== "object" || data === null || data === undefined) {
    return;
  }

  if (schema.type === "array" && Array.isArray(data)) {
    data.forEach((item, index) => applyComputedFields(schema.items, item, rootData, index));
    return;
  }

  if (schema.type !== "object" || !schema.properties || typeof data !== "object" || Array.isArray(data)) {
    return;
  }

  for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
    if (propertySchema["x-formula"]?.expression) {
      data[propertyName] = evaluateFormula(propertySchema["x-formula"].expression, data, rootData, itemIndex);
    } else {
      applyComputedFields(propertySchema, data[propertyName], rootData, itemIndex);
    }
  }
}

function evaluateFormula(expression, currentData, rootData, itemIndex) {
  const trimmed = expression.trim();

  if (trimmed.includes(" && ")) {
    return trimmed.split(" && ").every((part) => Boolean(evaluateFormula(part, currentData, rootData, itemIndex)));
  }

  if (trimmed.includes(" >= ")) {
    const [left, right] = trimmed.split(" >= ");
    return Number(evaluateFormula(left, currentData, rootData, itemIndex)) >= Number(evaluateFormula(right, currentData, rootData, itemIndex));
  }

  if (trimmed.includes(" + ")) {
    const values = trimmed.split(" + ").map((part) => evaluateFormula(part, currentData, rootData, itemIndex));
    return values.some((value) => typeof value === "string") ? values.join("") : values.reduce((sum, value) => sum + Number(value), 0);
  }

  if (trimmed.includes(" * ")) {
    const [left, right] = trimmed.split(" * ");
    return Number(evaluateFormula(left, currentData, rootData, itemIndex)) * Number(evaluateFormula(right, currentData, rootData, itemIndex));
  }

  const functionCall = trimmed.match(/^(count|sum)\((.*)\)$/);
  if (functionCall) {
    const values = readPath(functionCall[2], currentData, rootData);
    const list = Array.isArray(values) ? values : values === undefined ? [] : [values];
    return functionCall[1] === "count" ? list.length : list.reduce((sum, value) => sum + Number(value ?? 0), 0);
  }

  if (trimmed === "#index") {
    return itemIndex ?? 0;
  }

  if (/^".*"$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return readPath(trimmed, currentData, rootData);
}

function readPath(path, currentData, rootData) {
  const isRootPath = path.startsWith("/");
  const normalizedPath = isRootPath ? path.slice(1) : path;
  const segments = normalizedPath.split(".").filter(Boolean);

  return readSegments(isRootPath ? rootData : currentData, segments);
}

function readSegments(value, segments) {
  if (segments.length === 0) {
    return value;
  }

  const [segment, ...rest] = segments;
  const segmentMatch = segment.match(/^([^[]+)(?:\[(\*|\d+)])?$/);
  if (!segmentMatch) {
    return undefined;
  }

  const [, key, index] = segmentMatch;
  const nextValue = value?.[key];

  if (index === "*") {
    return Array.isArray(nextValue) ? nextValue.flatMap((item) => toArray(readSegments(item, rest))) : [];
  }

  if (index !== undefined) {
    return readSegments(Array.isArray(nextValue) ? nextValue[Number(index)] : undefined, rest);
  }

  return readSegments(nextValue, rest);
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined ? [] : [value];
}
